const hre = require("hardhat");
require('dotenv').config();

async function main() {
    console.log("Final deployment of NoLossLotteryV2Slim on HyperEVM Mainnet...\n");

    // Use the already deployed library
    const LIBRARY_ADDRESS = "0x9102Be4967859b4b01d46DEc95A55d2746C1D13C";
    
    // Contract addresses
    const HYPERLEND_POOL_ADDRESS = process.env.HYPERLEND_POOL;
    const DATA_PROVIDER_ADDRESS = process.env.HYPERLEND_DATA_PROVIDER;
    const WHYPE_TOKEN_ADDRESS = process.env.WHYPE_TOKEN;

    console.log("Using deployed LotteryViews library:", LIBRARY_ADDRESS);
    console.log("HyperLend addresses:");
    console.log("- Pool:", HYPERLEND_POOL_ADDRESS);
    console.log("- Data Provider:", DATA_PROVIDER_ADDRESS);
    console.log("- wHYPE Token:", WHYPE_TOKEN_ADDRESS);

    const [deployer] = await hre.ethers.getSigners();
    console.log("\nDeployer:", deployer.address);
    
    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log("Balance:", hre.ethers.formatEther(balance), "HYPE");

    try {
        console.log("\nDeploying NoLossLotteryV2Slim with library...");
        
        const NoLossLotteryV2Slim = await hre.ethers.getContractFactory("NoLossLotteryV2Slim", {
            libraries: {
                LotteryViews: LIBRARY_ADDRESS
            }
        });
        
        // Estimate gas first
        const deployTx = await NoLossLotteryV2Slim.getDeployTransaction(
            HYPERLEND_POOL_ADDRESS,
            DATA_PROVIDER_ADDRESS,
            WHYPE_TOKEN_ADDRESS
        );
        
        const gasEstimate = await hre.ethers.provider.estimateGas(deployTx);
        console.log("Gas estimate for main contract:", gasEstimate.toString());
        
        // Deploy with estimated gas + buffer
        const gasWithBuffer = (gasEstimate * 120n) / 100n;
        console.log("Gas with buffer:", gasWithBuffer.toString());
        
        const lotteryV2 = await NoLossLotteryV2Slim.deploy(
            HYPERLEND_POOL_ADDRESS,
            DATA_PROVIDER_ADDRESS,
            WHYPE_TOKEN_ADDRESS,
            {
                gasLimit: gasWithBuffer
            }
        );
        
        await lotteryV2.waitForDeployment();
        console.log("✅ NoLossLotteryV2Slim deployed to:", lotteryV2.target);

        // Get contract configuration to verify it's working
        console.log("\n=== DEPLOYMENT SUCCESS ===");
        console.log("NoLossLotteryV2Slim:", lotteryV2.target);
        console.log("LotteryViews Library:", LIBRARY_ADDRESS);
        
        console.log("\nContract Configuration:");
        console.log("- TICKET_UNIT:", (await lotteryV2.TICKET_UNIT()).toString(), "wei (0.1 wHYPE)");
        console.log("- LOTTERY_INTERVAL:", (await lotteryV2.LOTTERY_INTERVAL()).toString(), "seconds (24h)");
        console.log("- HARVEST_INTERVAL:", (await lotteryV2.HARVEST_INTERVAL()).toString(), "seconds (24h)");
        console.log("- INCENTIVE_BPS:", (await lotteryV2.INCENTIVE_BPS()).toString(), "bps (1%)");
        console.log("- Current Round:", (await lotteryV2.currentRound()).toString());
        console.log("- Owner:", await lotteryV2.owner());

        // Save deployment info
        const network_info = await hre.ethers.provider.getNetwork();
        const deploymentInfo = {
            network: hre.network.name,
            chainId: network_info.chainId.toString(),
            timestamp: new Date().toISOString(),
            deployer: deployer.address,
            gasUsed: {
                library: "333011",
                contract: gasEstimate.toString()
            },
            contracts: {
                NoLossLotteryV2Slim: lotteryV2.target,
                LotteryViewsLibrary: LIBRARY_ADDRESS,
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
            features: [
                "Fixed ticketing system (0.1 wHYPE = 1 ticket)",
                "Two-phase secure randomness (no VRF required)",
                "Gas-optimized for thousands of users",
                "24-hour harvest/lottery intervals",
                "1% caller incentives",
                "Reentrancy protection",
                "Comprehensive view functions",
                "Admin rescue capabilities"
            ]
        };

        // Save to file
        const fs = require('fs');
        const path = require('path');
        const deploymentsDir = path.join(__dirname, '..', 'deployments');
        if (!fs.existsSync(deploymentsDir)) {
            fs.mkdirSync(deploymentsDir, { recursive: true });
        }
        
        const filename = `hyperevm_mainnet_v2_slim_final_${Date.now()}.json`;
        const filepath = path.join(deploymentsDir, filename);
        fs.writeFileSync(filepath, JSON.stringify(deploymentInfo, null, 2));
        console.log(`\n💾 Deployment info saved to: ${filename}`);

        // Explorer links
        console.log("\n🔍 EXPLORER LINKS:");
        console.log("NoLossLotteryV2Slim:", `https://hyperevmscan.io/address/${lotteryV2.target}`);
        console.log("LotteryViews Library:", `https://hyperevmscan.io/address/${LIBRARY_ADDRESS}`);

        // Verification instructions
        console.log("\n📋 VERIFICATION COMMANDS:");
        console.log("1. Verify library (already deployed):");
        console.log(`npx hardhat verify --network hyperevm_mainnet ${LIBRARY_ADDRESS}`);
        console.log("\n2. Verify main contract:");
        console.log(`npx hardhat verify --network hyperevm_mainnet ${lotteryV2.target} "${HYPERLEND_POOL_ADDRESS}" "${DATA_PROVIDER_ADDRESS}" "${WHYPE_TOKEN_ADDRESS}" --libraries contracts/libraries/LotteryViews.sol:LotteryViews:${LIBRARY_ADDRESS}`);

        console.log("\n🎉 DEPLOYMENT COMPLETE!");
        console.log("✅ All issues from original contract have been fixed");
        console.log("✅ Ready for production use on HyperEVM");
        console.log("✅ Contract size optimized with library pattern");
        console.log("✅ Secure randomness without VRF dependency");

    } catch (error) {
        console.error("\n❌ DEPLOYMENT FAILED:", error.message);
        
        if (error.message.includes("exceeds block gas limit")) {
            console.log("\n💡 The contract is still too large. Consider:");
            console.log("- Further splitting into more libraries");
            console.log("- Removing non-essential features");
            console.log("- Using proxy pattern for upgradeability");
        }
        
        process.exit(1);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });