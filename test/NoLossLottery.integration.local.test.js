const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NoLossLottery - Local Integration", function () {
  let owner, user1, user2;
  let wHype, pool, dataProvider, lottery;

  beforeEach(async () => {
    [owner, user1, user2] = await ethers.getSigners();

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    wHype = await MockERC20.deploy("Wrapped HYPE", "wHYPE");
    await wHype.waitForDeployment();

    const MockPool = await ethers.getContractFactory("MockPool");
    pool = await MockPool.deploy();
    await pool.waitForDeployment();

    const MockProtocolDataProvider = await ethers.getContractFactory("MockProtocolDataProvider");
    dataProvider = await MockProtocolDataProvider.deploy();
    await dataProvider.waitForDeployment();

    const NoLossLottery = await ethers.getContractFactory("NoLossLottery");
    lottery = await NoLossLottery.deploy(
      await pool.getAddress(),
      await dataProvider.getAddress(),
      await wHype.getAddress()
    );
    await lottery.waitForDeployment();

    // Mint wHYPE to users
    await (await wHype.mint(user1.address, ethers.parseEther("100"))).wait();
    await (await wHype.mint(user2.address, ethers.parseEther("200"))).wait();
  });

  it("end-to-end: deposit, harvest, set allocation, execute lottery, withdraw", async () => {
    // user1 deposit 10, user2 deposit 20
    await (await wHype.connect(user1).approve(await lottery.getAddress(), ethers.parseEther("10"))).wait();
    await (await lottery.connect(user1).depositWHYPE(ethers.parseEther("10"))).wait();
    await (await wHype.connect(user2).approve(await lottery.getAddress(), ethers.parseEther("20"))).wait();
    await (await lottery.connect(user2).depositWHYPE(ethers.parseEther("20"))).wait();

    expect(await lottery.totalDeposits()).to.equal(ethers.parseEther("30"));
    expect(await lottery.getParticipantCount()).to.equal(2n);

    // Simulate HyperLend accrual: set hToken balance > totalDeposits
    const supplyBal = ethers.parseEther("30.3");
    await (await dataProvider.setUserReserveBalance(await wHype.getAddress(), await lottery.getAddress(), supplyBal)).wait();

    // user1 sets 50% allocation
    await (await lottery.connect(user1).setUserAllocationBps(5000)).wait();

    // Harvest
    await (await lottery.harvestYield()).wait();
    // Lottery portion: gross 0.3 => user1 gets 0.1 * 50% = 0.05; user2 gets 0.2 * 100% = 0.2 => total 0.25
    expect(await lottery.prizePool()).to.equal(ethers.parseEther("0.25"));
    // Tickets should be > 0
    expect(await lottery.getTotalTickets()).to.be.greaterThan(0n);

    // Execute lottery: fast-forward chain time by 1 day and mine a block
    await ethers.provider.send('evm_increaseTime', [24 * 60 * 60]);
    await ethers.provider.send('evm_mine');
    await (await lottery.executeLottery()).wait();

    // Winner recorded
    const round = await lottery.currentRound();
    expect(round).to.equal(2n);

    // Withdraw a portion
    const user1DepositBefore = (await lottery.getUserInfo(user1.address))[0];
    await (await lottery.connect(user1).withdraw(ethers.parseEther("1"))).wait();
    const user1DepositAfter = (await lottery.getUserInfo(user1.address))[0];
    expect(user1DepositAfter).to.equal(user1DepositBefore - ethers.parseEther("1"));
  });
});


