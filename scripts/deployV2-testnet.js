const hre = require("hardhat");
require('dotenv').config();

async function main() {
    console.log("Deploying NoLossLotteryV2 to HyperEVM Testnet...\n");

    // Check if we're on testnet
    const network = hre.network.name;
    if (network !== 'hyperevm_testnet') {
        console.error("This script is for testnet deployment only!");
        console.log("Current network:", network);
        console.log("Use: npx hardhat run scripts/deployV2-testnet.js --network hyperevm_testnet");
        process.exit(1);
    }

    // For testnet, we'll still use mock contracts since we don't have real HyperLend addresses
    // In production, update these with real contract addresses:
    console.log("Deploying mock contracts for testnet...");
    
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

    // Deploy NoLossLotteryV2 
    console.log("\nDeploying NoLossLotteryV2...");
    const NoLossLotteryV2 = await hre.ethers.getContractFactory("NoLossLotteryV2");
    const lotteryV2 = await NoLossLotteryV2.deploy(
        mockPool.target,
        mockDataProvider.target,
        mockToken.target
    );
    
    await lotteryV2.waitForDeployment();
    console.log("NoLossLotteryV2 deployed to:", lotteryV2.target);

    // Get network info
    const chainId = (await hre.ethers.provider.getNetwork()).chainId;
    console.log("\n=== DEPLOYMENT COMPLETE ===");
    console.log("Network:", network);
    console.log("Chain ID:", chainId.toString());
    console.log("\nContract Addresses:");
    console.log("- NoLossLotteryV2:", lotteryV2.target);
    console.log("- MockERC20 (wHYPE):", mockToken.target);
    console.log("- MockPool:", mockPool.target);
    console.log("- MockDataProvider:", mockDataProvider.target);

    // Contract configuration
    console.log("\nContract Configuration:");
    console.log("- TICKET_UNIT:", (await lotteryV2.TICKET_UNIT()).toString(), "wei (0.1 wHYPE)");
    console.log("- LOTTERY_INTERVAL:", (await lotteryV2.LOTTERY_INTERVAL()).toString(), "seconds (24 hours)");
    console.log("- HARVEST_INTERVAL:", (await lotteryV2.HARVEST_INTERVAL()).toString(), "seconds (24 hours)");
    console.log("- INCENTIVE_BPS:", (await lotteryV2.INCENTIVE_BPS()).toString(), "(1%)");

    // Save addresses to file
    const deploymentInfo = {
        network: network,
        chainId: chainId.toString(),
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
        },
        explorer: {
            url: "https://testnet.hyperevmscan.io",
            apiUrl: "https://api-testnet.hyperevmscan.io/api"
        }
    };

    // Write deployment info to file
    const fs = require('fs');
    const path = require('path');
    
    const deploymentsDir = path.join(__dirname, '..', 'deployments');
    if (!fs.existsSync(deploymentsDir)) {
        fs.mkdirSync(deploymentsDir, { recursive: true });
    }
    
    const filename = `${network}_v2_${Date.now()}.json`;
    const filepath = path.join(deploymentsDir, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(deploymentInfo, null, 2));
    console.log(`\nDeployment info saved to: ${filepath}`);

    // Verification instructions
    console.log("\n=== VERIFICATION INSTRUCTIONS ===");
    console.log("To verify the contracts on HyperEVM Testnet Explorer, run:");
    console.log(`npx hardhat verify --network ${network} ${lotteryV2.target} ${mockPool.target} ${mockDataProvider.target} ${mockToken.target}`);
    
    // Explorer links
    console.log("\n=== EXPLORER LINKS ===");
    console.log("NoLossLotteryV2:", `https://testnet.hyperevmscan.io/address/${lotteryV2.target}`);
    console.log("MockERC20:", `https://testnet.hyperevmscan.io/address/${mockToken.target}`);
    console.log("MockPool:", `https://testnet.hyperevmscan.io/address/${mockPool.target}`);
    console.log("MockDataProvider:", `https://testnet.hyperevmscan.io/address/${mockDataProvider.target}`);

    console.log("\n=== SUCCESS ===");
    console.log("✅ NoLossLotteryV2 deployed successfully to HyperEVM Testnet!");
    console.log("✅ All fixes implemented:");
    console.log("   - Fixed ticketing system (0.1 wHYPE = 1 ticket)");
    console.log("   - Secure two-phase randomness (no VRF dependency)");
    console.log("   - Gas-optimized for scale (O(1) operations)");
    console.log("   - Incentivized harvest/draw (1% reward)");
    console.log("   - 24-hour intervals enforced");
    console.log("   - Comprehensive view functions");
    console.log("   - Reentrancy protection");
    console.log("   - Admin rescue functions");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });