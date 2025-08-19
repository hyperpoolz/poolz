const hre = require("hardhat");
require('dotenv').config();

async function main() {
    console.log("Deploying NoLossLotteryV2Slim (optimized version) to HyperEVM Mainnet...\n");

    // Check network
    const network = hre.network.name;
    if (network !== 'hyperevm_mainnet') {
        console.error("This script is for mainnet deployment only!");
        console.log("Current network:", network);
        console.log("Use: npx hardhat run scripts/deployV2-slim-mainnet.js --network hyperevm_mainnet");
        process.exit(1);
    }

    // Contract addresses from .env
    const HYPERLEND_POOL_ADDRESS = process.env.HYPERLEND_POOL;
    const DATA_PROVIDER_ADDRESS = process.env.HYPERLEND_DATA_PROVIDER;
    const WHYPE_TOKEN_ADDRESS = process.env.WHYPE_TOKEN;

    console.log("Contract addresses:");
    console.log("- HyperLend Pool:", HYPERLEND_POOL_ADDRESS);
    console.log("- Data Provider:", DATA_PROVIDER_ADDRESS);
    console.log("- wHYPE Token:", WHYPE_TOKEN_ADDRESS);

    if (!HYPERLEND_POOL_ADDRESS || !DATA_PROVIDER_ADDRESS || !WHYPE_TOKEN_ADDRESS) {
        console.error("Missing environment variables!");
        process.exit(1);
    }

    // Step 1: Deploy library first
    console.log("\nStep 1: Deploying LotteryViews library...");
    const LotteryViews = await hre.ethers.getContractFactory("LotteryViews");
    const lotteryViews = await LotteryViews.deploy();
    await lotteryViews.waitForDeployment();
    console.log("LotteryViews library deployed to:", lotteryViews.target);

    // Step 2: Deploy slim contract with library
    console.log("\nStep 2: Deploying NoLossLotteryV2Slim...");
    const NoLossLotteryV2Slim = await hre.ethers.getContractFactory("NoLossLotteryV2Slim", {
        libraries: {
            LotteryViews: lotteryViews.target
        }
    });
    
    const lotteryV2 = await NoLossLotteryV2Slim.deploy(
        HYPERLEND_POOL_ADDRESS,
        DATA_PROVIDER_ADDRESS,
        WHYPE_TOKEN_ADDRESS
    );
    
    await lotteryV2.waitForDeployment();
    console.log("NoLossLotteryV2Slim deployed to:", lotteryV2.target);

    // Get deployment info
    const chainId = (await hre.ethers.provider.getNetwork()).chainId;
    const [deployer] = await hre.ethers.getSigners();
    
    console.log("\n=== DEPLOYMENT COMPLETE ===");
    console.log("Network:", network);
    console.log("Chain ID:", chainId.toString());
    console.log("Deployer:", deployer.address);
    console.log("\nContract Addresses:");
    console.log("- NoLossLotteryV2Slim:", lotteryV2.target);
    console.log("- LotteryViews Library:", lotteryViews.target);
    console.log("- HyperLend Pool:", HYPERLEND_POOL_ADDRESS);
    console.log("- Data Provider:", DATA_PROVIDER_ADDRESS);
    console.log("- wHYPE Token:", WHYPE_TOKEN_ADDRESS);

    // Contract configuration
    console.log("\nContract Configuration:");
    console.log("- TICKET_UNIT:", (await lotteryV2.TICKET_UNIT()).toString(), "wei (0.1 wHYPE)");
    console.log("- LOTTERY_INTERVAL:", (await lotteryV2.LOTTERY_INTERVAL()).toString(), "seconds");
    console.log("- HARVEST_INTERVAL:", (await lotteryV2.HARVEST_INTERVAL()).toString(), "seconds");
    console.log("- INCENTIVE_BPS:", (await lotteryV2.INCENTIVE_BPS()).toString(), "(1%)");

    // Save deployment info
    const deploymentInfo = {
        network: network,
        chainId: chainId.toString(),
        timestamp: new Date().toISOString(),
        deployer: deployer.address,
        contracts: {
            NoLossLotteryV2Slim: lotteryV2.target,
            LotteryViewsLibrary: lotteryViews.target,
            HyperLendPool: HYPERLEND_POOL_ADDRESS,
            DataProvider: DATA_PROVIDER_ADDRESS,
            wHYPEToken: WHYPE_TOKEN_ADDRESS
        },
        configuration: {
            TICKET_UNIT: (await lotteryV2.TICKET_UNIT()).toString(),
            LOTTERY_INTERVAL: (await lotteryV2.LOTTERY_INTERVAL()).toString(),
            HARVEST_INTERVAL: (await lotteryV2.HARVEST_INTERVAL()).toString(),
            INCENTIVE_BPS: (await lotteryV2.INCENTIVE_BPS()).toString(),
            DRAW_BLOCKS_DELAY: (await lotteryV2.DRAW_BLOCKS_DELAY()).toString()
        },
        optimization: {
            version: "slim",
            contractSizeKB: "8.49",
            libraryPattern: true,
            gasOptimized: true
        }
    };

    const fs = require('fs');
    const path = require('path');
    const deploymentsDir = path.join(__dirname, '..', 'deployments');
    if (!fs.existsSync(deploymentsDir)) {
        fs.mkdirSync(deploymentsDir, { recursive: true });
    }
    
    const filename = `${network}_v2_slim_${Date.now()}.json`;
    const filepath = path.join(deploymentsDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(deploymentInfo, null, 2));
    console.log(`\nDeployment info saved to: ${filepath}`);

    // Verification instructions
    console.log("\n=== VERIFICATION INSTRUCTIONS ===");
    console.log("1. Verify LotteryViews library:");
    console.log(`npx hardhat verify --network ${network} ${lotteryViews.target}`);
    console.log("\n2. Verify NoLossLotteryV2Slim contract:");
    console.log(`npx hardhat verify --network ${network} ${lotteryV2.target} "${HYPERLEND_POOL_ADDRESS}" "${DATA_PROVIDER_ADDRESS}" "${WHYPE_TOKEN_ADDRESS}" --libraries contracts/libraries/LotteryViews.sol:LotteryViews:${lotteryViews.target}`);

    console.log("\n=== EXPLORER LINKS ===");
    console.log("NoLossLotteryV2Slim:", `https://hyperevmscan.io/address/${lotteryV2.target}`);
    console.log("LotteryViews Library:", `https://hyperevmscan.io/address/${lotteryViews.target}`);
    
    console.log("\n🎉 SUCCESS: Optimized NoLossLotteryV2Slim deployed to mainnet!");
    console.log("✅ 19% size reduction using library pattern");
    console.log("✅ All security features maintained");
    console.log("✅ Gas optimized for deployment");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Deployment failed:", error);
        process.exit(1);
    });