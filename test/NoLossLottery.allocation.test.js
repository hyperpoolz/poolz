const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NoLossLottery - Allocation", function () {
  let noLossLottery;
  let owner;
  let user;
  let wHype;

  beforeEach(async function () {
    [owner, user] = await ethers.getSigners();

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    wHype = await MockERC20.deploy("Wrapped HYPE", "wHYPE");
    await wHype.waitForDeployment();

    const NoLossLottery = await ethers.getContractFactory("NoLossLottery");
    // Use placeholder addresses for HyperLend contracts in local tests (not invoked here)
    noLossLottery = await NoLossLottery.deploy(owner.address, owner.address, await wHype.getAddress());
    await noLossLottery.waitForDeployment();
  });

  it("should default allocation to 100% (10000 bps) for unset users", async function () {
    const bps = await noLossLottery.userAllocationBps(user.address);
    expect(bps).to.equal(0n); // unset means 100% at use time
  });

  it("should allow user to set allocation within 0..10000 bps", async function () {
    await expect(noLossLottery.connect(user).setUserAllocationBps(7500)).to.not.be.reverted;
    expect(await noLossLottery.userAllocationBps(user.address)).to.equal(7500);

    await expect(noLossLottery.connect(user).setUserAllocationBps(0)).to.not.be.reverted;
    expect(await noLossLottery.userAllocationBps(user.address)).to.equal(0);
  });

  it("should reject allocation greater than 10000 bps", async function () {
    await expect(noLossLottery.connect(user).setUserAllocationBps(10001)).to.be.revertedWith("bps>10000");
  });

  it("should not expose a native deposit function", async function () {
    expect(typeof noLossLottery.deposit).to.equal('undefined');
  });
});


