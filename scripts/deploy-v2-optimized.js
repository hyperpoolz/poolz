const hre = require("hardhat");
require('dotenv').config();

async function main() {
    console.log("Deploying Optimized NoLossLotteryV2 to HyperEVM Mainnet...\n");

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
        // Step 1: Deploy LotteryViewsV2 library
        console.log("\nStep 1: Deploying LotteryViewsV2 library...");
        const LotteryViewsV2 = await hre.ethers.getContractFactory("LotteryViewsV2");
        const lotteryViews = await LotteryViewsV2.deploy({ gasLimit: 10000000 });
        await lotteryViews.waitForDeployment();
        console.log("✅ LotteryViewsV2 deployed:", lotteryViews.target);

        // Step 2: Deploy optimized contract with libraries
        console.log("\nStep 2: Deploying NoLossLotteryV2Optimized...");
        const NoLotteryOptimized = await hre.ethers.getContractFactory("NoLossLotteryV2Optimized", {
            libraries: {
                LotteryViewsV2: lotteryViews.target
            }
        });
        
        const lottery = await NoLotteryOptimized.deploy(
            HYPERLEND_POOL_ADDRESS,
            DATA_PROVIDER_ADDRESS,
            WHYPE_TOKEN_ADDRESS,
            { gasLimit: 15000000 } // Use big blocks
        );
        
        await lottery.waitForDeployment();
        console.log("✅ NoLossLotteryV2Optimized deployed:", lottery.target);

        // Verify deployment worked
        console.log("\n=== DEPLOYMENT SUCCESS ===");
        console.log("NoLossLotteryV2Optimized:", lottery.target);
        console.log("LotteryViewsV2 Library:", lotteryViews.target);
        
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
                NoLossLotteryV2Optimized: lottery.target,
                LotteryViewsV2Library: lotteryViews.target,
                HyperLendPool: HYPERLEND_POOL_ADDRESS,
                DataProvider: DATA_PROVIDER_ADDRESS,
                wHYPEToken: WHYPE_TOKEN_ADDRESS
            },
            optimizations: [
                "Custom errors instead of require strings",
                "Complex view functions moved to library",
                "Simplified internal functions",
                "Removed redundant validations",
                "Library pattern for gas optimization"
            ]
        };

        const fs = require('fs');
        const path = require('path');
        const deploymentsDir = path.join(__dirname, '..', 'deployments');
        if (!fs.existsSync(deploymentsDir)) {
            fs.mkdirSync(deploymentsDir, { recursive: true });
        }
        
        const filename = `hyperevm_mainnet_v2_optimized_${Date.now()}.json`;
        const filepath = path.join(deploymentsDir, filename);
        fs.writeFileSync(filepath, JSON.stringify(deploymentInfo, null, 2));
        console.log(`\n💾 Deployment saved: ${filename}`);

        console.log("\n🔍 Explorer Links:");
        console.log("Contract:", `https://hyperevmscan.io/address/${lottery.target}`);
        console.log("Library:", `https://hyperevmscan.io/address/${lotteryViews.target}`);

        console.log("\n🎉 OPTIMIZED DEPLOYMENT SUCCESSFUL!");
        console.log("✅ Used custom errors for smaller bytecode");
        console.log("✅ Moved complex functions to library");
        console.log("✅ Deployed with big blocks (15M gas limit)");

    } catch (error) {
        console.error("\n❌ DEPLOYMENT FAILED:", error.message);
        if (error.message.includes("exceeds block gas limit")) {
            console.log("\n💡 Contract still too large. Consider:");
            console.log("- Further function removal");
            console.log("- More aggressive library splitting");
            console.log("- Diamond proxy pattern");
        }
        throw error;
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });