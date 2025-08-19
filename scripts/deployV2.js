const hre = require("hardhat");

async function main() {
    console.log("Deploying NoLossLotteryV2 contract...\n");

    // Contract addresses for HyperEVM (you'll need to update these)
    const HYPERLEND_POOL_ADDRESS = "0x1234567890123456789012345678901234567890"; // Update this
    const DATA_PROVIDER_ADDRESS = "0x2345678901234567890123456789012345678901"; // Update this  
    const WHYPE_TOKEN_ADDRESS = "0x3456789012345678901234567890123456789012"; // Update this

    // For now, let's deploy with mock contracts for testing
    console.log("First deploying mock contracts for testing...");
    
    // Deploy mock contracts
    const MockERC20 = await hre.ethers.getContractFactory("MockERC20");
    const mockToken = await MockERC20.deploy("Wrapped HYPE", "wHYPE");
    await mockToken.waitForDeployment();
    console.log("MockERC20 (wHYPE) deployed to:", mockToken.target);

    const MockPool = await hre.ethers.getContractFactory("MockPool");
    const mockPool = await MockPool.deploy();
    await mockPool.waitForDeployment();
    console.log("MockPool deployed to:", mockPool.target);

    const MockDataProvider = await hre.ethers.getContractFactory("MockProtocolDataProvider");
    const mockDataProvider = await MockDataProvider.deploy();
    await mockDataProvider.waitForDeployment();
    console.log("MockProtocolDataProvider deployed to:", mockDataProvider.target);

    // Deploy NoLossLotteryV2 with mock contracts
    console.log("\nDeploying NoLossLotteryV2...");
    const NoLossLotteryV2 = await hre.ethers.getContractFactory("NoLossLotteryV2");
    const lotteryV2 = await NoLossLotteryV2.deploy(
        mockPool.target,
        mockDataProvider.target,
        mockToken.target
    );
    
    await lotteryV2.waitForDeployment();
    console.log("NoLossLotteryV2 deployed to:", lotteryV2.target);

    // Display deployment info
    console.log("\n=== DEPLOYMENT COMPLETE ===");
    console.log("Network:", hre.network.name);
    console.log("Chain ID:", (await hre.ethers.provider.getNetwork()).chainId);
    console.log("\nContract Addresses:");
    console.log("- NoLossLotteryV2:", lotteryV2.target);
    console.log("- MockERC20 (wHYPE):", mockToken.target);
    console.log("- MockPool:", mockPool.target);
    console.log("- MockDataProvider:", mockDataProvider.target);

    // Contract configuration
    console.log("\nContract Configuration:");
    console.log("- TICKET_UNIT:", await lotteryV2.TICKET_UNIT(), "wei (0.1 wHYPE)");
    console.log("- LOTTERY_INTERVAL:", await lotteryV2.LOTTERY_INTERVAL(), "seconds (24 hours)");
    console.log("- HARVEST_INTERVAL:", await lotteryV2.HARVEST_INTERVAL(), "seconds (24 hours)");
    console.log("- INCENTIVE_BPS:", await lotteryV2.INCENTIVE_BPS(), "(1%)");

    // Save addresses to file
    const deploymentInfo = {
        network: hre.network.name,
        chainId: (await hre.ethers.provider.getNetwork()).chainId.toString(),
        timestamp: new Date().toISOString(),
        contracts: {
            NoLossLotteryV2: lotteryV2.target,
            MockERC20: mockToken.target,
            MockPool: mockPool.target,
            MockDataProvider: mockDataProvider.target
        },
        configuration: {
            TICKET_UNIT: (await lotteryV2.TICKET_UNIT()).toString(),
            LOTTERY_INTERVAL: (await lotteryV2.LOTTERY_INTERVAL()).toString(),
            HARVEST_INTERVAL: (await lotteryV2.HARVEST_INTERVAL()).toString(),
            INCENTIVE_BPS: (await lotteryV2.INCENTIVE_BPS()).toString()
        }
    };

    // Write deployment info to file
    const fs = require('fs');
    const path = require('path');
    
    const deploymentsDir = path.join(__dirname, '..', 'deployments');
    if (!fs.existsSync(deploymentsDir)) {
        fs.mkdirSync(deploymentsDir, { recursive: true });
    }
    
    const filename = `${hre.network.name}_v2_${Date.now()}.json`;
    const filepath = path.join(deploymentsDir, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(deploymentInfo, null, 2));
    console.log(`\nDeployment info saved to: ${filepath}`);

    // Verification instructions
    console.log("\n=== VERIFICATION INSTRUCTIONS ===");
    console.log("To verify the contracts on a block explorer, run:");
    console.log(`npx hardhat verify --network ${hre.network.name} ${lotteryV2.target} ${mockPool.target} ${mockDataProvider.target} ${mockToken.target}`);

    console.log("\n=== NEXT STEPS ===");
    console.log("1. For production deployment, update the contract addresses at the top of this script");
    console.log("2. Deploy to HyperEVM mainnet with real HyperLend addresses");
    console.log("3. Verify contracts on the block explorer");
    console.log("4. Update frontend with new contract addresses");
    console.log("5. Test with small amounts before announcing");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });