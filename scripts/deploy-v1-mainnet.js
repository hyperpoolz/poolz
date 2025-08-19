const hre = require("hardhat");
require('dotenv').config();

async function main() {
    console.log("Deploying NoLossLottery (V1) to HyperEVM Mainnet...\n");

    // Check if we're on mainnet
    const network = hre.network.name;
    if (network !== 'hyperevm_mainnet') {
        console.error("This script is for mainnet deployment only!");
        console.log("Current network:", network);
        console.log("Use: npx hardhat run scripts/deploy-v1-mainnet.js --network hyperevm_mainnet");
        process.exit(1);
    }

    // HyperLend contract addresses from previous deployment
    const HYPERLEND_POOL_ADDRESS = "0x00A89d7a5A02160f20150EbEA7a2b5E4879A1A8b";
    const DATA_PROVIDER_ADDRESS = "0x5481bf8d3946E6A3168640c1D7523eB59F055a29";
    const WHYPE_TOKEN_ADDRESS = "0x5555555555555555555555555555555555555555";

    console.log("Using HyperLend contract addresses:");
    console.log("- HyperLend Pool:", HYPERLEND_POOL_ADDRESS);
    console.log("- Data Provider:", DATA_PROVIDER_ADDRESS);
    console.log("- wHYPE Token:", WHYPE_TOKEN_ADDRESS);

    // Deploy NoLossLottery (smaller, optimized version)
    console.log("\nDeploying NoLossLottery (V1 - optimized size)...");
    const NoLossLottery = await hre.ethers.getContractFactory("NoLossLottery");
    
    try {
        const lottery = await NoLossLottery.deploy(
            HYPERLEND_POOL_ADDRESS,
            DATA_PROVIDER_ADDRESS,
            WHYPE_TOKEN_ADDRESS,
            {
                gasLimit: 2500000, // Limit gas to avoid block limit
            }
        );
        
        console.log("Waiting for deployment...");
        await lottery.waitForDeployment();
        console.log("✅ NoLossLottery deployed to:", lottery.target);

        // Get network info
        const chainId = (await hre.ethers.provider.getNetwork()).chainId;
        const [deployer] = await hre.ethers.getSigners();
        
        console.log("\n=== DEPLOYMENT COMPLETE ===");
        console.log("Network:", network);
        console.log("Chain ID:", chainId.toString());
        console.log("Deployer:", deployer.address);
        console.log("\nContract Addresses:");
        console.log("- NoLossLottery:", lottery.target);
        console.log("- HyperLend Pool:", HYPERLEND_POOL_ADDRESS);
        console.log("- Data Provider:", DATA_PROVIDER_ADDRESS);
        console.log("- wHYPE Token:", WHYPE_TOKEN_ADDRESS);

        // Contract configuration
        console.log("\nContract Configuration:");
        console.log("- TICKET_UNIT:", (await lottery.TICKET_UNIT()).toString(), "wei (0.01 wHYPE)");
        console.log("- LOTTERY_INTERVAL:", (await lottery.LOTTERY_INTERVAL()).toString(), "seconds (24 hours)");

        // Save addresses to file
        const deploymentInfo = {
            network: network,
            chainId: chainId.toString(),
            timestamp: new Date().toISOString(),
            deployer: deployer.address,
            contracts: {
                NoLossLottery: lottery.target,
                HyperLendPool: HYPERLEND_POOL_ADDRESS,
                DataProvider: DATA_PROVIDER_ADDRESS,
                wHYPEToken: WHYPE_TOKEN_ADDRESS
            },
            configuration: {
                TICKET_UNIT: (await lottery.TICKET_UNIT()).toString(),
                LOTTERY_INTERVAL: (await lottery.LOTTERY_INTERVAL()).toString()
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
        
        const filename = `${network}_v1_${Date.now()}.json`;
        const filepath = path.join(deploymentsDir, filename);
        
        fs.writeFileSync(filepath, JSON.stringify(deploymentInfo, null, 2));
        console.log(`\nDeployment info saved to: ${filepath}`);

        // Verification instructions
        console.log("\n=== VERIFICATION INSTRUCTIONS ===");
        console.log("To verify the contract on HyperEVM Explorer, run:");
        console.log(`npx hardhat verify --network ${network} ${lottery.target} "${HYPERLEND_POOL_ADDRESS}" "${DATA_PROVIDER_ADDRESS}" "${WHYPE_TOKEN_ADDRESS}"`);
        
        // Explorer links
        console.log("\n=== EXPLORER LINKS ===");
        console.log("NoLossLottery:", `https://hyperevmscan.io/address/${lottery.target}`);

        console.log("\n🎉 SUCCESS: NoLossLottery (V1) deployed to HyperEVM Mainnet!");
        
    } catch (error) {
        console.error("Deployment failed:", error.message);
        console.error("Error code:", error.code);
        
        if (error.message.includes('gas')) {
            console.log("\n💡 Suggestion: The contract might be too large for the block gas limit.");
            console.log("Consider using the original minimalist version or increase optimization runs.");
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