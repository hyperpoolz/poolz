const hre = require("hardhat");
require('dotenv').config();

async function main() {
    console.log("Deploying NoLossLotteryV2Minimal to HyperEVM Mainnet...\n");

    const network = hre.network.name;
    if (network !== 'hyperevm_mainnet') {
        console.error("This script is for mainnet deployment only!");
        console.log("Current network:", network);
        console.log("Use: npx hardhat run scripts/deploy-v2-minimal.js --network hyperevm_mainnet");
        process.exit(1);
    }

    // HyperLend contract addresses
    const HYPERLEND_POOL_ADDRESS = "0x00A89d7a5A02160f20150EbEA7a2b5E4879A1A8b";
    const DATA_PROVIDER_ADDRESS = "0x5481bf8d3946E6A3168640c1D7523eB59F055a29";
    const WHYPE_TOKEN_ADDRESS = "0x5555555555555555555555555555555555555555";

    console.log("Using HyperLend contract addresses:");
    console.log("- HyperLend Pool:", HYPERLEND_POOL_ADDRESS);
    console.log("- Data Provider:", DATA_PROVIDER_ADDRESS);
    console.log("- wHYPE Token:", WHYPE_TOKEN_ADDRESS);

    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying from:", deployer.address);
    
    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log("Balance:", hre.ethers.formatEther(balance), "HYPE");

    try {
        console.log("\n🚀 Deploying NoLossLotteryV2Minimal...");
        const NoLossLotteryV2Minimal = await hre.ethers.getContractFactory("NoLossLotteryV2Minimal");
        
        // Estimate gas first
        console.log("Estimating gas...");
        const deployData = NoLossLotteryV2Minimal.interface.encodeDeploy([
            HYPERLEND_POOL_ADDRESS,
            DATA_PROVIDER_ADDRESS,
            WHYPE_TOKEN_ADDRESS
        ]);
        
        const gasEstimate = await hre.ethers.provider.estimateGas({
            data: NoLossLotteryV2Minimal.bytecode + deployData.slice(2)
        });
        
        console.log("Gas estimate:", gasEstimate.toString());
        
        // Try deployment with estimated gas + buffer
        const gasWithBuffer = (gasEstimate * 120n) / 100n;
        console.log("Gas with 20% buffer:", gasWithBuffer.toString());
        
        const lottery = await NoLossLotteryV2Minimal.deploy(
            HYPERLEND_POOL_ADDRESS,
            DATA_PROVIDER_ADDRESS,
            WHYPE_TOKEN_ADDRESS,
            {
                gasLimit: gasWithBuffer
            }
        );
        
        console.log("Waiting for deployment...");
        await lottery.waitForDeployment();
        
        console.log("✅ NoLossLotteryV2Minimal deployed to:", lottery.target);

        // Test basic functionality
        console.log("\n🔍 Testing contract functionality...");
        try {
            const ticketUnit = await lottery.TICKET_UNIT();
            const lotteryInterval = await lottery.LOTTERY_INTERVAL();
            const currentRound = await lottery.currentRound();
            const owner = await lottery.owner();
            
            console.log("✅ Contract is responsive:");
            console.log("- TICKET_UNIT:", ticketUnit.toString(), "wei (0.1 wHYPE)");
            console.log("- LOTTERY_INTERVAL:", lotteryInterval.toString(), "seconds (24h)");
            console.log("- Current Round:", currentRound.toString());
            console.log("- Owner:", owner);
            
        } catch (testError) {
            console.warn("⚠️  Contract deployed but test calls failed:", testError.message);
        }

        // Save deployment info
        const chainId = (await hre.ethers.provider.getNetwork()).chainId;
        const deploymentInfo = {
            network: network,
            chainId: chainId.toString(),
            timestamp: new Date().toISOString(),
            deployer: deployer.address,
            transactionHash: lottery.deploymentTransaction()?.hash,
            gasUsed: gasEstimate.toString(),
            contracts: {
                NoLossLotteryV2Minimal: lottery.target,
                HyperLendPool: HYPERLEND_POOL_ADDRESS,
                DataProvider: DATA_PROVIDER_ADDRESS,
                wHYPEToken: WHYPE_TOKEN_ADDRESS
            },
            features: [
                "Fixed ticketing system (0.1 wHYPE = 1 ticket)",
                "Two-phase secure randomness (no VRF required)",
                "24-hour lottery intervals",
                "Reentrancy protection",
                "Minimal gas-optimized version"
            ]
        };

        // Save to file
        const fs = require('fs');
        const path = require('path');
        const deploymentsDir = path.join(__dirname, '..', 'deployments');
        if (!fs.existsSync(deploymentsDir)) {
            fs.mkdirSync(deploymentsDir, { recursive: true });
        }
        
        const filename = `hyperevm_mainnet_v2_minimal_${Date.now()}.json`;
        const filepath = path.join(deploymentsDir, filename);
        fs.writeFileSync(filepath, JSON.stringify(deploymentInfo, null, 2));
        console.log(`\n💾 Deployment info saved to: ${filename}`);

        // Explorer links
        console.log("\n🔍 EXPLORER LINKS:");
        console.log("Contract:", `https://hyperevmscan.io/address/${lottery.target}`);
        if (lottery.deploymentTransaction()?.hash) {
            console.log("Transaction:", `https://hyperevmscan.io/tx/${lottery.deploymentTransaction()?.hash}`);
        }

        // Verification instructions
        console.log("\n📋 VERIFICATION COMMAND:");
        console.log(`npx hardhat verify --network hyperevm_mainnet ${lottery.target} "${HYPERLEND_POOL_ADDRESS}" "${DATA_PROVIDER_ADDRESS}" "${WHYPE_TOKEN_ADDRESS}"`);

        console.log("\n🎉 SUCCESS: NoLossLotteryV2Minimal deployed to HyperEVM Mainnet!");
        console.log("✅ Core V2 features: Fixed ticketing & secure randomness");
        console.log("✅ Minimal size for successful deployment");
        
    } catch (error) {
        console.error("\n❌ DEPLOYMENT FAILED:", error.message);
        console.error("Error code:", error.code);
        console.error("Error reason:", error.reason);
        
        if (error.message.includes("exceeds block gas limit") || error.message.includes("gas")) {
            console.log("\n💡 Gas limit exceeded. The contract is still too large.");
            console.log("Consider further optimizations or use proxy pattern.");
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