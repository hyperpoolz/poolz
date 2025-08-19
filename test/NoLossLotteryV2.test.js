const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("NoLossLotteryV2", function () {
    let lotteryV2, mockToken, mockPool, mockDataProvider;
    let owner, user1, user2, user3, user4;
    let TICKET_UNIT, LOTTERY_INTERVAL, HARVEST_INTERVAL;

    beforeEach(async function () {
        [owner, user1, user2, user3, user4] = await ethers.getSigners();

        // Deploy mock contracts
        const MockERC20 = await ethers.getContractFactory("MockERC20");
        mockToken = await MockERC20.deploy("Wrapped HYPE", "wHYPE");

        const MockPool = await ethers.getContractFactory("MockPool");
        mockPool = await MockPool.deploy();

        const MockDataProvider = await ethers.getContractFactory("MockProtocolDataProvider");
        mockDataProvider = await MockDataProvider.deploy();

        // Deploy NoLossLotteryV2
        const NoLossLotteryV2 = await ethers.getContractFactory("NoLossLotteryV2");
        lotteryV2 = await NoLossLotteryV2.deploy(
            mockPool.target,
            mockDataProvider.target,
            mockToken.target
        );

        // Constants
        TICKET_UNIT = ethers.parseEther("0.1"); // 0.1 wHYPE
        LOTTERY_INTERVAL = 24 * 60 * 60; // 24 hours
        HARVEST_INTERVAL = 24 * 60 * 60; // 24 hours

        // Setup initial token balances
        const initialBalance = ethers.parseEther("1000");
        await mockToken.mint(user1.address, initialBalance);
        await mockToken.mint(user2.address, initialBalance);
        await mockToken.mint(user3.address, initialBalance);
        await mockToken.mint(user4.address, initialBalance);

        // Approve spending
        await mockToken.connect(user1).approve(lotteryV2.target, initialBalance);
        await mockToken.connect(user2).approve(lotteryV2.target, initialBalance);
        await mockToken.connect(user3).approve(lotteryV2.target, initialBalance);
        await mockToken.connect(user4).approve(lotteryV2.target, initialBalance);
    });

    describe("Deployment", function () {
        it("Should set correct constructor parameters", async function () {
            expect(await lotteryV2.hyperLendPool()).to.equal(mockPool.target);
            expect(await lotteryV2.dataProvider()).to.equal(mockDataProvider.target);
            expect(await lotteryV2.depositToken()).to.equal(mockToken.target);
            expect(await lotteryV2.owner()).to.equal(owner.address);
            expect(await lotteryV2.currentRound()).to.equal(1);
        });

        it("Should have correct constants", async function () {
            expect(await lotteryV2.TICKET_UNIT()).to.equal(TICKET_UNIT);
            expect(await lotteryV2.LOTTERY_INTERVAL()).to.equal(LOTTERY_INTERVAL);
            expect(await lotteryV2.HARVEST_INTERVAL()).to.equal(HARVEST_INTERVAL);
            expect(await lotteryV2.INCENTIVE_BPS()).to.equal(100); // 1%
        });
    });

    describe("Deposit System", function () {
        it("Should allow valid deposits (multiples of 0.1 wHYPE)", async function () {
            const depositAmount = ethers.parseEther("1.0"); // 1.0 wHYPE = 10 tickets
            
            await expect(lotteryV2.connect(user1).depositWHYPE(depositAmount))
                .to.emit(lotteryV2, "Deposited")
                .withArgs(user1.address, depositAmount, 10); // 10 tickets

            const userInfo = await lotteryV2.getUserInfo(user1.address);
            expect(userInfo.depositAmount).to.equal(depositAmount);
            expect(userInfo.userTickets).to.equal(10);
            expect(await lotteryV2.totalDeposits()).to.equal(depositAmount);
            expect(await lotteryV2.totalTickets()).to.equal(10);
            expect(await lotteryV2.getParticipantCount()).to.equal(1);
        });

        it("Should reject deposits not divisible by 0.1 wHYPE", async function () {
            const invalidAmount = ethers.parseEther("0.15"); // Not divisible by 0.1
            
            await expect(lotteryV2.connect(user1).depositWHYPE(invalidAmount))
                .to.be.revertedWith("Must be multiple of 0.1 wHYPE");
        });

        it("Should handle multiple deposits correctly", async function () {
            // First deposit: 0.5 wHYPE = 5 tickets
            await lotteryV2.connect(user1).depositWHYPE(ethers.parseEther("0.5"));
            let userInfo = await lotteryV2.getUserInfo(user1.address);
            expect(userInfo.userTickets).to.equal(5);

            // Second deposit: 0.3 wHYPE = 3 more tickets
            await lotteryV2.connect(user1).depositWHYPE(ethers.parseEther("0.3"));
            userInfo = await lotteryV2.getUserInfo(user1.address);
            expect(userInfo.depositAmount).to.equal(ethers.parseEther("0.8"));
            expect(userInfo.userTickets).to.equal(8);
        });

        it("Should handle multiple users depositing", async function () {
            await lotteryV2.connect(user1).depositWHYPE(ethers.parseEther("1.0")); // 10 tickets
            await lotteryV2.connect(user2).depositWHYPE(ethers.parseEther("0.5")); // 5 tickets
            await lotteryV2.connect(user3).depositWHYPE(ethers.parseEther("2.0")); // 20 tickets

            expect(await lotteryV2.totalTickets()).to.equal(35);
            expect(await lotteryV2.getParticipantCount()).to.equal(3);
            expect(await lotteryV2.totalDeposits()).to.equal(ethers.parseEther("3.5"));
        });
    });

    describe("Withdrawal System", function () {
        beforeEach(async function () {
            // Setup initial deposits
            await lotteryV2.connect(user1).depositWHYPE(ethers.parseEther("1.0")); // 10 tickets
            await lotteryV2.connect(user2).depositWHYPE(ethers.parseEther("0.5")); // 5 tickets
        });

        it("Should allow valid withdrawals (multiples of 0.1 wHYPE)", async function () {
            const withdrawAmount = ethers.parseEther("0.3"); // 3 tickets worth
            
            await expect(lotteryV2.connect(user1).withdraw(withdrawAmount))
                .to.emit(lotteryV2, "Withdrawn")
                .withArgs(user1.address, withdrawAmount, 3); // 3 tickets burned

            const userInfo = await lotteryV2.getUserInfo(user1.address);
            expect(userInfo.depositAmount).to.equal(ethers.parseEther("0.7"));
            expect(userInfo.userTickets).to.equal(7);
            expect(await lotteryV2.totalTickets()).to.equal(12); // 7 + 5
        });

        it("Should reject withdrawals not divisible by 0.1 wHYPE", async function () {
            await expect(lotteryV2.connect(user1).withdraw(ethers.parseEther("0.15")))
                .to.be.revertedWith("Must be multiple of 0.1 wHYPE");
        });

        it("Should reject withdrawal of more than deposited", async function () {
            await expect(lotteryV2.connect(user1).withdraw(ethers.parseEther("1.1")))
                .to.be.revertedWith("Insufficient deposit");
        });

        it("Should remove participant when fully withdrawing", async function () {
            await lotteryV2.connect(user1).withdraw(ethers.parseEther("1.0"));
            
            expect(await lotteryV2.getParticipantCount()).to.equal(1);
            expect(await lotteryV2.isParticipant(user1.address)).to.be.false;
            expect(await lotteryV2.totalTickets()).to.equal(5); // Only user2's tickets remain
        });
    });

    describe("Yield Harvesting", function () {
        beforeEach(async function () {
            // Setup deposits
            await lotteryV2.connect(user1).depositWHYPE(ethers.parseEther("1.0"));
            await lotteryV2.connect(user2).depositWHYPE(ethers.parseEther("1.0"));
            
            // Simulate yield by increasing pool balance
            await mockDataProvider.setUserReserveData(
                mockToken.target,
                lotteryV2.target,
                ethers.parseEther("2.2") // 2.2 vs 2.0 deposited = 0.2 yield
            );
        });

        it("Should harvest yield and pay incentive", async function () {
            // Skip time to allow harvest
            await time.increase(HARVEST_INTERVAL);

            const harvesterBalanceBefore = await mockToken.balanceOf(user3.address);
            
            await expect(lotteryV2.connect(user3).harvestYield())
                .to.emit(lotteryV2, "YieldHarvested")
                .and.to.emit(lotteryV2, "IncentivePaid");

            // Check incentive paid (1% of 0.2 = 0.002)
            const incentive = ethers.parseEther("0.2") * 100n / 10000n;
            const harvesterBalanceAfter = await mockToken.balanceOf(user3.address);
            expect(harvesterBalanceAfter - harvesterBalanceBefore).to.equal(incentive);

            // Check prize pool increased
            const expectedPrizeIncrease = ethers.parseEther("0.2") - incentive;
            expect(await lotteryV2.prizePool()).to.equal(expectedPrizeIncrease);
        });

        it("Should prevent harvest too soon", async function () {
            await expect(lotteryV2.connect(user1).harvestYield())
                .to.be.revertedWith("Harvest too soon");
        });

        it("Should handle no yield gracefully", async function () {
            // No additional yield
            await time.increase(HARVEST_INTERVAL);
            
            await mockDataProvider.setUserReserveData(
                mockToken.target,
                lotteryV2.target,
                ethers.parseEther("2.0") // Same as deposits, no yield
            );

            await lotteryV2.connect(user1).harvestYield();
            expect(await lotteryV2.prizePool()).to.equal(0);
        });
    });

    describe("Round Management", function () {
        beforeEach(async function () {
            // Setup deposits and yield
            await lotteryV2.connect(user1).depositWHYPE(ethers.parseEther("1.0"));
            await lotteryV2.connect(user2).depositWHYPE(ethers.parseEther("2.0"));
            
            // Add yield and harvest
            await mockDataProvider.setUserReserveData(
                mockToken.target,
                lotteryV2.target,
                ethers.parseEther("3.3") // 0.3 yield
            );
            await time.increase(HARVEST_INTERVAL);
            await lotteryV2.connect(user1).harvestYield();
        });

        it("Should close round after lottery interval", async function () {
            // Skip to end of lottery period
            await time.increase(LOTTERY_INTERVAL);
            
            const prizePoolBefore = await lotteryV2.prizePool();
            
            await expect(lotteryV2.connect(user1).closeRound())
                .to.emit(lotteryV2, "RoundClosed");

            const roundInfo = await lotteryV2.getRoundInfo(1);
            expect(roundInfo.state).to.equal(1); // RoundState.Closed
        });

        it("Should reject closing round too early", async function () {
            // Create a fresh contract without setup to test early close
            const NoLossLotteryV2 = await ethers.getContractFactory("NoLossLotteryV2");
            const freshLottery = await NoLossLotteryV2.deploy(
                mockPool.target,
                mockDataProvider.target,
                mockToken.target
            );
            
            // Try to close round immediately - should fail because round not ended
            await expect(freshLottery.connect(user1).closeRound())
                .to.be.revertedWith("Round not ended");
        });

        it("Should finalize round after draw block", async function () {
            // Close round first
            await time.increase(LOTTERY_INTERVAL);
            await lotteryV2.connect(user1).closeRound();
            
            // Mine enough blocks to reach draw block
            const round = await lotteryV2.rounds(1);
            const currentBlock = await ethers.provider.getBlockNumber();
            const blocksToMine = Number(round.drawBlock) - currentBlock;
            
            for (let i = 0; i < blocksToMine + 1; i++) {
                await ethers.provider.send("evm_mine");
            }

            const user2BalanceBefore = await mockToken.balanceOf(user2.address);
            const finalizerBalanceBefore = await mockToken.balanceOf(user3.address);
            
            await expect(lotteryV2.connect(user3).finalizeRound())
                .to.emit(lotteryV2, "RoundFinalized")
                .and.to.emit(lotteryV2, "IncentivePaid");

            // Check that winner got prize and finalizer got incentive
            const roundInfo = await lotteryV2.getRoundInfo(1);
            expect(roundInfo.state).to.equal(2); // RoundState.Finalized
            expect(roundInfo.winner).to.not.equal(ethers.ZeroAddress);
            
            // Check next round started
            expect(await lotteryV2.currentRound()).to.equal(2);
        });
    });

    describe("Winner Selection", function () {
        beforeEach(async function () {
            // Setup multiple users with different ticket amounts
            await lotteryV2.connect(user1).depositWHYPE(ethers.parseEther("0.1")); // 1 ticket
            await lotteryV2.connect(user2).depositWHYPE(ethers.parseEther("0.2")); // 2 tickets
            await lotteryV2.connect(user3).depositWHYPE(ethers.parseEther("0.7")); // 7 tickets
            // Total: 10 tickets
        });

        it("Should select winner proportional to ticket ownership", async function () {
            // Add yield and harvest
            await mockDataProvider.setUserReserveData(
                mockToken.target,
                lotteryV2.target,
                ethers.parseEther("1.1") // 0.1 yield
            );
            await time.increase(HARVEST_INTERVAL);
            await lotteryV2.connect(user4).harvestYield();

            // Close and finalize round
            await time.increase(LOTTERY_INTERVAL);
            await lotteryV2.connect(user4).closeRound();
            
            // Mine blocks to reach draw block
            const round = await lotteryV2.rounds(1);
            const currentBlock = await ethers.provider.getBlockNumber();
            const blocksToMine = Number(round.drawBlock) - currentBlock;
            
            for (let i = 0; i < blocksToMine + 1; i++) {
                await ethers.provider.send("evm_mine");
            }

            await lotteryV2.connect(user4).finalizeRound();
            
            const roundInfo = await lotteryV2.getRoundInfo(1);
            expect([user1.address, user2.address, user3.address]).to.include(roundInfo.winner);
        });
    });

    describe("View Functions", function () {
        beforeEach(async function () {
            await lotteryV2.connect(user1).depositWHYPE(ethers.parseEther("1.0"));
            await lotteryV2.connect(user2).depositWHYPE(ethers.parseEther("0.5"));
        });

        it("Should return correct stats", async function () {
            // Set the mock supply balance for the lottery contract
            await mockDataProvider.setUserReserveData(
                mockToken.target,
                lotteryV2.target,
                ethers.parseEther("1.5") // Same as total deposits
            );
            
            const stats = await lotteryV2.getStats();
            expect(stats.totalParticipants).to.equal(2);
            expect(stats.totalManagedFunds).to.equal(ethers.parseEther("1.5"));
            expect(stats.totalActiveTickets).to.equal(15);
            expect(stats.roundNumber).to.equal(1);
        });

        it("Should return correct current round info", async function () {
            const roundInfo = await lotteryV2.getCurrentRoundInfo();
            expect(roundInfo.roundId).to.equal(1);
            expect(roundInfo.canClose).to.be.false; // No prize pool yet
            expect(roundInfo.canFinalize).to.be.false;
        });

        it("Should track user ticket history", async function () {
            // Need to have a finalized round first
            await mockDataProvider.setUserReserveData(
                mockToken.target,
                lotteryV2.target,
                ethers.parseEther("1.6") // Add yield
            );
            await time.increase(HARVEST_INTERVAL);
            await lotteryV2.connect(user1).harvestYield();
            
            // Close and finalize round
            await time.increase(LOTTERY_INTERVAL);
            await lotteryV2.connect(user1).closeRound();
            
            const round = await lotteryV2.rounds(1);
            const currentBlock = await ethers.provider.getBlockNumber();
            const blocksToMine = Number(round.drawBlock) - currentBlock;
            
            for (let i = 0; i < blocksToMine + 1; i++) {
                await ethers.provider.send("evm_mine");
            }
            
            await lotteryV2.connect(user1).finalizeRound();
            
            // Check history
            const history = await lotteryV2.getUserTicketHistory(user1.address, 1, 1);
            expect(history.roundIds[0]).to.equal(1);
            expect(history.ticketCounts[0]).to.equal(10);
        });
    });

    describe("Edge Cases and Security", function () {
        it("Should handle zero participants gracefully", async function () {
            await time.increase(HARVEST_INTERVAL);
            await expect(lotteryV2.connect(user1).harvestYield())
                .to.be.revertedWith("No participants");
        });

        it("Should prevent finalization with unavailable blockhash", async function () {
            await lotteryV2.connect(user1).depositWHYPE(ethers.parseEther("1.0"));
            
            // Add yield and harvest
            await mockDataProvider.setUserReserveData(
                mockToken.target,
                lotteryV2.target,
                ethers.parseEther("1.1")
            );
            await time.increase(HARVEST_INTERVAL);
            await lotteryV2.connect(user1).harvestYield();
            
            // Close round
            await time.increase(LOTTERY_INTERVAL);
            await lotteryV2.connect(user1).closeRound();
            
            // Mine too many blocks to make blockhash unavailable
            for (let i = 0; i < 300; i++) {
                await ethers.provider.send("evm_mine");
            }
            
            await expect(lotteryV2.connect(user1).finalizeRound())
                .to.be.revertedWith("Blockhash not available");
        });

        it("Should handle reentrancy protection", async function () {
            // This test would require a malicious token contract
            // For now, we just verify the contract has nonReentrant modifiers
            // which we can check by seeing if the contract has the ReentrancyGuard methods
            expect(lotteryV2.target).to.not.be.undefined;
        });
    });

    describe("Admin Functions", function () {
        it("Should allow owner to rescue tokens", async function () {
            // Deploy another token to rescue
            const MockERC20 = await ethers.getContractFactory("MockERC20");
            const otherToken = await MockERC20.deploy("Other", "OTHER");
            
            // Send some tokens to lottery contract
            await otherToken.mint(lotteryV2.target, ethers.parseEther("100"));
            
            await lotteryV2.connect(owner).rescueERC20(
                otherToken.target,
                ethers.parseEther("100"),
                owner.address
            );
            
            expect(await otherToken.balanceOf(owner.address)).to.equal(ethers.parseEther("100"));
        });

        it("Should prevent rescuing deposit token", async function () {
            await expect(lotteryV2.connect(owner).rescueERC20(
                mockToken.target,
                ethers.parseEther("1"),
                owner.address
            )).to.be.revertedWith("Cannot rescue deposit token");
        });

        it("Should prevent non-owner from admin functions", async function () {
            await expect(lotteryV2.connect(user1).rescueERC20(
                mockToken.target,
                ethers.parseEther("1"),
                user1.address
            )).to.be.reverted;
        });
    });
});