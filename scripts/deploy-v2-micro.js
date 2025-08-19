const hre = require("hardhat");
require('dotenv').config();

async function main() {
    console.log("Deploying Micro NoLossLotteryV2 to HyperEVM Mainnet...\n");

    const network = hre.network.name;
    if (network !== 'hyperevm_mainnet') {
        console.error("This script is for mainnet deployment only!");
        process.exit(1);
    }

    const HYPERLEND_POOL_ADDRESS = process.env.HYPERLEND_POOL;
    const DATA_PROVIDER_ADDRESS = process.env.HYPERLEND_DATA_PROVIDER;
    const WHYPE_TOKEN_ADDRESS = process.env.WHYPE_TOKEN;

    console.log("Contract addresses:");
    console.log("- HyperLend Pool:", HYPERLEND_POOL_ADDRESS);
    console.log("- Data Provider:", DATA_PROVIDER_ADDRESS);
    console.log("- wHYPE Token:", WHYPE_TOKEN_ADDRESS);

    const [deployer] = await hre.ethers.getSigners();
    console.log("Deployer:", deployer.address);
    
    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log("Balance:", hre.ethers.formatEther(balance), "HYPE");

    try {
        console.log("\nDeploying NoLossLotteryV2Micro (minimal features)...");
        const NoLotteryMicro = await hre.ethers.getContractFactory("NoLossLotteryV2Micro");
        
        // Try without specifying gas limit to see what happens
        const lottery = await NoLotteryMicro.deploy(
            HYPERLEND_POOL_ADDRESS,
            DATA_PROVIDER_ADDRESS,
            WHYPE_TOKEN_ADDRESS
        );
        
        await lottery.waitForDeployment();
        console.log("✅ NoLossLotteryV2Micro deployed:", lottery.target);

        // Verify deployment worked
        console.log("\n=== DEPLOYMENT SUCCESS ===");
        console.log("NoLossLotteryV2Micro:", lottery.target);
        
        console.log("\nContract Configuration:");
        console.log("- TICKET_UNIT:", (await lottery.TICKET_UNIT()).toString(), "wei (0.1 wHYPE)");
        console.log("- LOTTERY_INTERVAL:", (await lottery.LOTTERY_INTERVAL()).toString(), "seconds");
        console.log("- Current Round:", (await lottery.currentRound()).toString());
        console.log("- Owner:", await lottery.owner());

        // Save deployment info
        const chainId = (await hre.ethers.provider.getNetwork()).chainId;
        const deploymentInfo = {
            network: network,
            chainId: chainId.toString(),
            timestamp: new Date().toISOString(),
            deployer: deployer.address,
            contracts: {
                NoLossLotteryV2Micro: lottery.target,
                HyperLendPool: HYPERLEND_POOL_ADDRESS,
                DataProvider: DATA_PROVIDER_ADDRESS,
                wHYPEToken: WHYPE_TOKEN_ADDRESS
            },
            features: [
                "Essential deposit/withdraw functions",
                "Basic lottery execution",
                "Minimal view functions",
                "Custom errors for smaller bytecode",
                "No complex analytics",
                "Optimized for deployment size"
            ]
        };

        const fs = require('fs');
        const path = require('path');
        const deploymentsDir = path.join(__dirname, '..', 'deployments');
        if (!fs.existsSync(deploymentsDir)) {
            fs.mkdirSync(deploymentsDir, { recursive: true });
        }
        
        const filename = `hyperevm_mainnet_v2_micro_${Date.now()}.json`;
        const filepath = path.join(deploymentsDir, filename);
        fs.writeFileSync(filepath, JSON.stringify(deploymentInfo, null, 2));
        console.log(`\n💾 Deployment saved: ${filename}`);

        console.log("\n🔍 Explorer Link:");
        console.log("Contract:", `https://hyperevmscan.io/address/${lottery.target}`);

        console.log("\n🎉 MICRO DEPLOYMENT SUCCESSFUL!");
        console.log("✅ Removed all complex view functions");
        console.log("✅ Inline custom errors");
        console.log("✅ Simplified struct definitions");
        console.log("✅ Essential lottery functionality only");

    } catch (error) {
        console.error("\n❌ DEPLOYMENT FAILED:", error.message);
        throw error;
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });