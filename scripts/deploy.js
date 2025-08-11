const hre = require("hardhat");
const fs = require('fs');
const path = require('path');
const ADDRS = require('./addresses');

async function main() {
  const net = hre.network.name;
  const conf = ADDRS[net];
  if (!conf) throw new Error(`No address config for network: ${net}`);

  console.log("🚀 Deploying NoLossLottery to", net);
  console.log("📈 Using HyperLend Pool:", conf.hyperLendPool);
  console.log("📊 Using Data Provider:", conf.dataProvider);
  console.log("🪙 Using wHYPE Token:", conf.wHYPE);

  // Get the deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("🔑 Deploying with account:", deployer.address);

  // Check deployer balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "ETH");

  // Deploy the contract
  const NoLossLottery = await hre.ethers.getContractFactory("NoLossLottery");
  
  console.log("⏳ Deploying contract...");
  // Clamp gas limit below block gas limit to avoid provider issues
  const latest = await hre.ethers.provider.getBlock('latest');
  const blockGasLimit = latest && latest.gasLimit ? latest.gasLimit : hre.ethers.toBigInt(30_000_000);
  const deployGasLimit = blockGasLimit - hre.ethers.toBigInt(200_000);

  const lottery = await NoLossLottery.deploy(
    conf.hyperLendPool,
    conf.dataProvider,
    conf.wHYPE,
    { gasLimit: deployGasLimit }
  );

  await lottery.waitForDeployment();

  console.log("✅ NoLossLottery deployed to:", await lottery.getAddress());
  console.log("📋 Transaction hash:", lottery.deploymentTransaction().hash);

  // Optional: configure protocol fee
  const feeRecipientEnv = process.env.FEE_RECIPIENT;
  const feeBpsEnv = process.env.FEE_BPS;
  if (feeRecipientEnv) {
    const feeBps = feeBpsEnv ? parseInt(feeBpsEnv, 10) : 100; // default 1%
    console.log(`⚙️  Setting protocol fee: ${feeBps} bps to ${feeRecipientEnv}`);
    const tx = await lottery.setFeeParameters(feeBps, feeRecipientEnv);
    await tx.wait();
    console.log("✅ Fee parameters set.");
  } else {
    console.log("ℹ️  Fee recipient not provided (FEE_RECIPIENT). Skipping fee configuration.");
  }

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
    network: net,
    contractAddress: await lottery.getAddress(),
    deployerAddress: deployer.address,
    transactionHash: lottery.deploymentTransaction().hash,
    blockNumber: lottery.deploymentTransaction().blockNumber,
    timestamp: new Date().toISOString(),
    hyperLendPool: conf.hyperLendPool,
    dataProvider: conf.dataProvider,
    depositToken: conf.wHYPE
  };

  console.log("\n💾 Deployment Summary:");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  // Write per-network deployment artifact
  const outDir = path.join(__dirname, '..', 'deployments');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);
  const outFile = path.join(outDir, `${net}.json`);
  fs.writeFileSync(outFile, JSON.stringify(deploymentInfo, null, 2));
  console.log(`📝 Saved deployment to ${outFile}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });