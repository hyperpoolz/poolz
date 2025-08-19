const hre = require("hardhat");
require('dotenv').config();

async function main() {
    console.log("Deploying NoLossLotteryV2Slim using HyperEVM Big Blocks...\n");

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

    if (!HYPERLEND_POOL_ADDRESS || !DATA_PROVIDER_ADDRESS || !WHYPE_TOKEN_ADDRESS) {
        console.error("Missing environment variables!");
        process.exit(1);
    }

    const [deployer] = await hre.ethers.getSigners();
    console.log("\nDeployer account:", deployer.address);
    
    // Check balance
    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log("Deployer balance:", hre.ethers.formatEther(balance), "HYPE");

    // Get network info
    const network_info = await hre.ethers.provider.getNetwork();
    console.log("Network:", network_info.name, "Chain ID:", network_info.chainId.toString());

    console.log("\n=== HYPEREVM BIG BLOCKS DEPLOYMENT STRATEGY ===");
    console.log("HyperEVM uses dual-block architecture:");
    console.log("- Small blocks: 2M gas limit (1 second)");
    console.log("- Big blocks: 30M gas limit (1 minute)");
    console.log("\nFor contract deployment >2M gas, we need big blocks.");
    console.log("Setting gas limit to 15M to target big blocks...\n");

    try {
        // Step 1: Deploy library with high gas limit to target big blocks
        console.log("Step 1: Deploying LotteryViews library (targeting big blocks)...");
        const LotteryViews = await hre.ethers.getContractFactory("LotteryViews");
        
        const lotteryViews = await LotteryViews.deploy({
            gasLimit: 3000000, // 3M gas to ensure it goes to big blocks
            maxFeePerGas: hre.ethers.parseUnits('50', 'gwei'),
            maxPriorityFeePerGas: hre.ethers.parseUnits('2', 'gwei')
        });
        
        await lotteryViews.waitForDeployment();
        console.log("✅ LotteryViews library deployed to:", lotteryViews.target);

        // Step 2: Deploy main contract with high gas limit
        console.log("\nStep 2: Deploying NoLossLotteryV2Slim (targeting big blocks)...");
        const NoLossLotteryV2Slim = await hre.ethers.getContractFactory("NoLossLotteryV2Slim", {
            libraries: {
                LotteryViews: lotteryViews.target
            }
        });
        
        const lotteryV2 = await NoLossLotteryV2Slim.deploy(
            HYPERLEND_POOL_ADDRESS,
            DATA_PROVIDER_ADDRESS,
            WHYPE_TOKEN_ADDRESS,
            {
                gasLimit: 15000000, // 15M gas to ensure it goes to big blocks (well within 30M limit)
                maxFeePerGas: hre.ethers.parseUnits('50', 'gwei'),
                maxPriorityFeePerGas: hre.ethers.parseUnits('2', 'gwei')
            }
        );
        
        await lotteryV2.waitForDeployment();
        console.log("✅ NoLossLotteryV2Slim deployed to:", lotteryV2.target);

        // Deployment success info
        console.log("\n🎉 DEPLOYMENT SUCCESSFUL!");
        console.log("=================================");
        console.log("NoLossLotteryV2Slim:", lotteryV2.target);
        console.log("LotteryViews Library:", lotteryViews.target);

        // Get contract configuration
        console.log("\nContract Configuration:");
        console.log("- TICKET_UNIT:", (await lotteryV2.TICKET_UNIT()).toString(), "wei (0.1 wHYPE)");
        console.log("- LOTTERY_INTERVAL:", (await lotteryV2.LOTTERY_INTERVAL()).toString(), "seconds (24h)");
        console.log("- HARVEST_INTERVAL:", (await lotteryV2.HARVEST_INTERVAL()).toString(), "seconds (24h)");
        console.log("- INCENTIVE_BPS:", (await lotteryV2.INCENTIVE_BPS()).toString(), "bps (1%)");
        console.log("- Current Round:", (await lotteryV2.currentRound()).toString());

        // Save deployment info
        const deploymentInfo = {
            network: network,
            chainId: network_info.chainId.toString(),
            timestamp: new Date().toISOString(),
            deployer: deployer.address,
            deploymentStrategy: "big-blocks",
            gasStrategy: {
                libraryGasLimit: "3000000",
                contractGasLimit: "15000000",
                maxFeePerGas: "50 gwei",
                maxPriorityFeePerGas: "2 gwei"
            },
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
                INCENTIVE_BPS: (await lotteryV2.INCENTIVE_BPS()).toString()
            }
        };

        // Save to file
        const fs = require('fs');
        const path = require('path');
        const deploymentsDir = path.join(__dirname, '..', 'deployments');
        if (!fs.existsSync(deploymentsDir)) {
            fs.mkdirSync(deploymentsDir, { recursive: true });
        }
        
        const filename = `${network}_v2_slim_bigblocks_${Date.now()}.json`;
        const filepath = path.join(deploymentsDir, filename);
        fs.writeFileSync(filepath, JSON.stringify(deploymentInfo, null, 2));
        console.log(`\n💾 Deployment info saved to: ${filepath}`);

        // Explorer links
        console.log("\n🔍 EXPLORER LINKS:");
        console.log("NoLossLotteryV2Slim:", `https://hyperevmscan.io/address/${lotteryV2.target}`);
        console.log("LotteryViews Library:", `https://hyperevmscan.io/address/${lotteryViews.target}`);

        // Verification commands
        console.log("\n📋 VERIFICATION COMMANDS:");
        console.log("1. Verify library:");
        console.log(`npx hardhat verify --network ${network} ${lotteryViews.target}`);
        console.log("\n2. Verify main contract:");
        console.log(`npx hardhat verify --network ${network} ${lotteryV2.target} "${HYPERLEND_POOL_ADDRESS}" "${DATA_PROVIDER_ADDRESS}" "${WHYPE_TOKEN_ADDRESS}" --libraries contracts/libraries/LotteryViews.sol:LotteryViews:${lotteryViews.target}`);

        console.log("\n🚀 DEPLOYMENT COMPLETE - Ready for use!");

    } catch (error) {
        console.error("\n❌ DEPLOYMENT FAILED:");
        console.error("Error:", error.message);
        
        if (error.message.includes("exceeds block gas limit")) {
            console.log("\n💡 TROUBLESHOOTING:");
            console.log("- The contract is still too large for HyperEVM big blocks");
            console.log("- Try further optimization or split into more libraries");
            console.log("- Current big block limit: 30M gas");
        } else if (error.message.includes("insufficient funds")) {
            console.log("\n💡 TROUBLESHOOTING:");
            console.log("- Deployer account needs more HYPE tokens");
            console.log("- Current balance:", hre.ethers.formatEther(balance), "HYPE");
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