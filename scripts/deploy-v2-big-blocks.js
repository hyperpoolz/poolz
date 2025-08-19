const hre = require("hardhat");
require('dotenv').config();

async function main() {
    console.log("Deploying NoLossLotteryV2 to HyperEVM Mainnet using Big Blocks...\n");

    // Check if we're on mainnet
    const network = hre.network.name;
    if (network !== 'hyperevm_mainnet') {
        console.error("This script is for mainnet deployment only!");
        console.log("Current network:", network);
        console.log("Use: npx hardhat run scripts/deploy-v2-big-blocks.js --network hyperevm_mainnet");
        process.exit(1);
    }

    // HyperLend contract addresses from .env
    const HYPERLEND_POOL_ADDRESS = process.env.HYPERLEND_POOL;
    const DATA_PROVIDER_ADDRESS = process.env.HYPERLEND_DATA_PROVIDER;
    const WHYPE_TOKEN_ADDRESS = process.env.WHYPE_TOKEN;

    console.log("Using HyperLend contract addresses:");
    console.log("- HyperLend Pool:", HYPERLEND_POOL_ADDRESS);
    console.log("- Data Provider:", DATA_PROVIDER_ADDRESS);
    console.log("- wHYPE Token:", WHYPE_TOKEN_ADDRESS);

    if (!HYPERLEND_POOL_ADDRESS || !DATA_PROVIDER_ADDRESS || !WHYPE_TOKEN_ADDRESS) {
        console.error("Missing required environment variables!");
        console.log("Please set HYPERLEND_POOL, HYPERLEND_DATA_PROVIDER, and WHYPE_TOKEN in .env");
        process.exit(1);
    }

    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying from:", deployer.address);
    
    // Check balance
    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log("Balance:", hre.ethers.formatEther(balance), "HYPE");

    // Get current gas price
    const feeData = await hre.ethers.provider.getFeeData();
    console.log("Network Fee Data:");
    console.log("- gasPrice:", feeData.gasPrice?.toString());
    console.log("- maxFeePerGas:", feeData.maxFeePerGas?.toString());
    console.log("- maxPriorityFeePerGas:", feeData.maxPriorityFeePerGas?.toString());

    // Deploy NoLossLotteryV2 with big block gas configuration
    console.log("\nDeploying NoLossLotteryV2 with big block configuration...");
    const NoLossLotteryV2 = await hre.ethers.getContractFactory("NoLossLotteryV2");
    
    try {
        // Use higher gas limit for big blocks (30M available)
        // On HyperEVM, setting a higher gas price may indicate big block usage
        const bigBlockGasPrice = feeData.gasPrice * BigInt(10); // 10x normal gas price for big blocks
        console.log("Using big block gas price:", bigBlockGasPrice.toString());
        
        const deployTx = await NoLossLotteryV2.deploy(
            HYPERLEND_POOL_ADDRESS,
            DATA_PROVIDER_ADDRESS,
            WHYPE_TOKEN_ADDRESS,
            {
                gasLimit: 25000000, // Use 25M gas (within 30M big block limit)
                gasPrice: bigBlockGasPrice, // Higher gas price for big blocks
            }
        );
        
        console.log("Deployment transaction sent:");
        console.log("- Transaction hash:", deployTx.deploymentTransaction()?.hash);
        console.log("- Waiting for confirmation...");
        
        const lotteryV2 = await deployTx.waitForDeployment();
        console.log("✅ NoLossLotteryV2 deployed to:", lotteryV2.target);

        // Get network info
        const chainId = (await hre.ethers.provider.getNetwork()).chainId;
        
        console.log("\n=== DEPLOYMENT COMPLETE ===");
        console.log("Network:", network);
        console.log("Chain ID:", chainId.toString());
        console.log("Deployer:", deployer.address);
        console.log("Gas used: Check transaction hash for details");
        console.log("\nContract Addresses:");
        console.log("- NoLossLotteryV2:", lotteryV2.target);
        console.log("- HyperLend Pool:", HYPERLEND_POOL_ADDRESS);
        console.log("- Data Provider:", DATA_PROVIDER_ADDRESS);
        console.log("- wHYPE Token:", WHYPE_TOKEN_ADDRESS);

        // Contract configuration
        console.log("\nContract Configuration:");
        const ticketUnit = await lotteryV2.TICKET_UNIT();
        const lotteryInterval = await lotteryV2.LOTTERY_INTERVAL();
        const harvestInterval = await lotteryV2.HARVEST_INTERVAL();
        const incentiveBps = await lotteryV2.INCENTIVE_BPS();
        const drawBlocksDelay = await lotteryV2.DRAW_BLOCKS_DELAY();
        
        console.log("- TICKET_UNIT:", ticketUnit.toString(), "wei (0.1 wHYPE)");
        console.log("- LOTTERY_INTERVAL:", lotteryInterval.toString(), "seconds (24 hours)");
        console.log("- HARVEST_INTERVAL:", harvestInterval.toString(), "seconds (24 hours)");
        console.log("- INCENTIVE_BPS:", incentiveBps.toString(), "(1%)");
        console.log("- DRAW_BLOCKS_DELAY:", drawBlocksDelay.toString(), "blocks");

        // Save addresses to file
        const deploymentInfo = {
            network: network,
            chainId: chainId.toString(),
            timestamp: new Date().toISOString(),
            deployer: deployer.address,
            transactionHash: deployTx.deploymentTransaction()?.hash,
            contracts: {
                NoLossLotteryV2: lotteryV2.target,
                HyperLendPool: HYPERLEND_POOL_ADDRESS,
                DataProvider: DATA_PROVIDER_ADDRESS,
                wHYPEToken: WHYPE_TOKEN_ADDRESS
            },
            configuration: {
                TICKET_UNIT: ticketUnit.toString(),
                LOTTERY_INTERVAL: lotteryInterval.toString(),
                HARVEST_INTERVAL: harvestInterval.toString(),
                INCENTIVE_BPS: incentiveBps.toString(),
                DRAW_BLOCKS_DELAY: drawBlocksDelay.toString()
            },
            explorer: {
                url: "https://hyperevmscan.io",
                apiUrl: "https://api.hyperevmscan.io/api"
            }
        };

        // Write deployment info to file
        const fs = require('fs');
        const path = require('path');
        
        const deploymentsDir = path.join(__dirname, '..', 'deployments');
        if (!fs.existsSync(deploymentsDir)) {
            fs.mkdirSync(deploymentsDir, { recursive: true });
        }
        
        const filename = `${network}_v2_big_blocks_${Date.now()}.json`;
        const filepath = path.join(deploymentsDir, filename);
        
        fs.writeFileSync(filepath, JSON.stringify(deploymentInfo, null, 2));
        console.log(`\nDeployment info saved to: ${filepath}`);

        // Verification instructions
        console.log("\n=== VERIFICATION INSTRUCTIONS ===");
        console.log("To verify the contract on HyperEVM Explorer, run:");
        console.log(`npx hardhat verify --network ${network} ${lotteryV2.target} "${HYPERLEND_POOL_ADDRESS}" "${DATA_PROVIDER_ADDRESS}" "${WHYPE_TOKEN_ADDRESS}"`);
        
        // Explorer links
        console.log("\n=== EXPLORER LINKS ===");
        console.log("NoLossLotteryV2:", `https://hyperevmscan.io/address/${lotteryV2.target}`);
        console.log("Transaction:", `https://hyperevmscan.io/tx/${deployTx.deploymentTransaction()?.hash}`);

        console.log("\n=== USAGE INSTRUCTIONS ===");
        console.log("1. Users deposit wHYPE in multiples of 0.1 (each 0.1 wHYPE = 1 ticket)");
        console.log("2. Call harvestYield() every 24 hours to collect yield for prize pool");
        console.log("3. Call closeRound() after 24 hours to close the current lottery round");
        console.log("4. Wait 5 blocks, then call finalizeRound() to select winner and distribute prizes");
        console.log("5. Harvest and draw callers receive 1% incentive from yield/prizes");

        console.log("\n🎉 SUCCESS: NoLossLotteryV2 deployed to HyperEVM Mainnet using Big Blocks!");
        
    } catch (error) {
        console.error("Deployment failed:", error.message);
        console.error("Error code:", error.code);
        console.error("Error reason:", error.reason);
        
        if (error.message.includes('gas')) {
            console.log("\n💡 Suggestion: Try increasing the gas limit or check if big blocks are enabled.");
        }
        
        throw error;
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Deployment failed:", error);
        process.exit(1);
    });