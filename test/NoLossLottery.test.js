const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NoLossLottery", function () {
  let noLossLottery;
  let owner;
  let user1;
  let user2;
  
  // Mock contract addresses (using actual HyperLend addresses)
  const HYPERLEND_POOL = "0x00A89d7a5A02160f20150EbEA7a2b5E4879A1A8b";
  const HYPERLEND_DATA_PROVIDER = "0x5481bf8d3946E6A3168640c1D7523eB59F055a29";
  const WHYPE_TOKEN = "0x5555555555555555555555555555555555555555";

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    const NoLossLottery = await ethers.getContractFactory("NoLossLottery");
    noLossLottery = await NoLossLottery.deploy(
      HYPERLEND_POOL,
      HYPERLEND_DATA_PROVIDER,
      WHYPE_TOKEN
    );

    await noLossLottery.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should deploy with correct initial state", async function () {
      expect(await noLossLottery.totalDeposits()).to.equal(0);
      expect(await noLossLottery.prizePool()).to.equal(0);
      expect(await noLossLottery.currentRound()).to.equal(1);
      expect(await noLossLottery.getParticipantCount()).to.equal(0);
    });

    it("Should set the correct owner", async function () {
      expect(await noLossLottery.owner()).to.equal(owner.address);
    });

    it("Should have correct contract addresses", async function () {
      expect(await noLossLottery.hyperLendPool()).to.equal(HYPERLEND_POOL);
      expect(await noLossLottery.dataProvider()).to.equal(HYPERLEND_DATA_PROVIDER);
      expect(await noLossLottery.depositToken()).to.equal(WHYPE_TOKEN);
    });
  });

  describe("View Functions", function () {
    it("Should return zero for getCurrentSupplyBalance initially", async function () {
      // This will revert on local network since HyperLend contracts don't exist
      await expect(noLossLottery.getCurrentSupplyBalance()).to.be.reverted;
    });

    it("Should return correct time to next lottery", async function () {
      const timeToNext = await noLossLottery.getTimeToNextLottery();
      expect(timeToNext).to.be.gt(0); // Should be positive initially
    });

    it("Should not be ready for lottery initially", async function () {
      expect(await noLossLottery.isLotteryReady()).to.equal(false);
    });
  });

  describe("Placeholder Functions", function () {
    it("Should revert on deposit() - not implemented", async function () {
      await expect(noLossLottery.deposit(ethers.parseEther("100")))
        .to.be.revertedWith("Not implemented yet - Session 2");
    });

    it("Should revert on withdraw() - not implemented", async function () {
      await expect(noLossLottery.withdraw(ethers.parseEther("50")))
        .to.be.revertedWith("Not implemented yet - Session 2");
    });

    it("Should revert on harvestYield() - not implemented", async function () {
      await expect(noLossLottery.harvestYield())
        .to.be.revertedWith("Not implemented yet - Session 3");
    });

    it("Should revert on executeLottery() - not implemented", async function () {
      await expect(noLossLottery.executeLottery())
        .to.be.revertedWith("Not implemented yet - Session 4");
    });
  });

  describe("Emergency Functions", function () {
    it("Should allow owner to pause and unpause", async function () {
      await noLossLottery.pause();
      expect(await noLossLottery.paused()).to.equal(true);

      await noLossLottery.unpause();
      expect(await noLossLottery.paused()).to.equal(false);
    });

    it("Should not allow non-owner to pause", async function () {
      await expect(noLossLottery.connect(user1).pause())
        .to.be.revertedWithCustomError(noLossLottery, "OwnableUnauthorizedAccount");
    });
  });
});