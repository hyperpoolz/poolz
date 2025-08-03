const hre = require("hardhat");

// HyperLend contract addresses (mainnet)
const HYPERLEND_POOL = "0x00A89d7a5A02160f20150EbEA7a2b5E4879A1A8b";
const HYPERLEND_DATA_PROVIDER = "0x5481bf8d3946E6A3168640c1D7523eB59F055a29";
const WHYPE_TOKEN = "0x5555555555555555555555555555555555555555";

async function main() {
  console.log("🚀 Deploying NoLossLottery to", hre.network.name);
  console.log("📈 Using HyperLend Pool:", HYPERLEND_POOL);
  console.log("📊 Using Data Provider:", HYPERLEND_DATA_PROVIDER);
  console.log("🪙 Using wHYPE Token:", WHYPE_TOKEN);

  // Get the deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("🔑 Deploying with account:", deployer.address);

  // Check deployer balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "ETH");

  // Deploy the contract
  const NoLossLottery = await hre.ethers.getContractFactory("NoLossLottery");
  
  console.log("⏳ Deploying contract...");
  const lottery = await NoLossLottery.deploy(
    HYPERLEND_POOL,
    HYPERLEND_DATA_PROVIDER,
    WHYPE_TOKEN
  );

  await lottery.waitForDeployment();

  console.log("✅ NoLossLottery deployed to:", await lottery.getAddress());
  console.log("📋 Transaction hash:", lottery.deploymentTransaction().hash);

  // Verify deployment by calling a view function
  try {
    const totalDeposits = await lottery.totalDeposits();
    const participantCount = await lottery.getParticipantCount();
    const currentRound = await lottery.currentRound();
    
    console.log("\n📊 Contract State:");
    console.log("Total Deposits:", hre.ethers.formatEther(totalDeposits), "wHYPE");
    console.log("Participants:", participantCount.toString());
    console.log("Current Round:", currentRound.toString());
    
    // Test HyperLend integration
    const accruedYield = await lottery.getAccruedYield();
    console.log("Accrued Yield:", hre.ethers.formatEther(accruedYield), "wHYPE");
    
    console.log("\n🎯 Next Steps:");
    console.log("1. Fund this contract with wHYPE for testing");
    console.log("2. Call deposit() to test HyperLend integration");
    console.log("3. Monitor yield accrual over time");
    
  } catch (error) {
    console.log("⚠️  Could not verify contract state:", error.message);
  }

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    contractAddress: await lottery.getAddress(),
    deployerAddress: deployer.address,
    transactionHash: lottery.deploymentTransaction().hash,
    blockNumber: lottery.deploymentTransaction().blockNumber,
    timestamp: new Date().toISOString(),
    hyperLendPool: HYPERLEND_POOL,
    dataProvider: HYPERLEND_DATA_PROVIDER,
    depositToken: WHYPE_TOKEN
  };

  console.log("\n💾 Deployment Summary:");
  console.log(JSON.stringify(deploymentInfo, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });