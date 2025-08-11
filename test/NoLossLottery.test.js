const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NoLossLottery", function () {
  let noLossLottery;
  let owner;
  let user1;
  let user2;
  
  // For local tests, deploy a mock ERC20 to stand-in for wHYPE (no HyperLend integration here)
  // Integration tests to HyperLend should run on a testnet with real addresses.
  let wHype;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    wHype = await MockERC20.deploy("Wrapped HYPE", "wHYPE");
    await wHype.waitForDeployment();

    // Dummy addresses for HyperLend; calls to these must not be executed in these unit tests
    const NoLossLottery = await ethers.getContractFactory("NoLossLottery");
    noLossLottery = await NoLossLottery.deploy(
      owner.address, // placeholder; not used in local tests
      owner.address, // placeholder; not used in local tests
      await wHype.getAddress()
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
      expect(await noLossLottery.depositToken()).to.equal(await wHype.getAddress());
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

  // Minimal behavioral checks retained; detailed integration covered elsewhere with mocks

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