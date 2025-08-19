const hre = require("hardhat");
require('dotenv').config();

async function main() {
    console.log("Testing library deployment on HyperEVM mainnet...\n");

    const [deployer] = await hre.ethers.getSigners();
    console.log("Deployer:", deployer.address);
    
    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log("Balance:", hre.ethers.formatEther(balance), "HYPE");

    // First, let's try to deploy just the library with no gas limit to see what happens
    console.log("\nStep 1: Deploying LotteryViews library (no gas limit specified)...");
    
    try {
        const LotteryViews = await hre.ethers.getContractFactory("LotteryViews");
        
        // Let's estimate gas first
        const deployTx = await LotteryViews.getDeployTransaction();
        const gasEstimate = await hre.ethers.provider.estimateGas(deployTx);
        console.log("Gas estimate for library:", gasEstimate.toString());
        
        // Try to deploy with estimated gas + 20% buffer
        const gasWithBuffer = (gasEstimate * 120n) / 100n;
        console.log("Gas with buffer:", gasWithBuffer.toString());
        
        const library = await LotteryViews.deploy({
            gasLimit: gasWithBuffer
        });
        
        await library.waitForDeployment();
        console.log("✅ Library deployed to:", library.target);
        
    } catch (error) {
        console.error("Library deployment failed:", error.message);
        
        // Let's try with a mock ERC20 to see if it's a general issue
        console.log("\nStep 2: Testing with MockERC20 (smaller contract)...");
        try {
            const MockERC20 = await hre.ethers.getContractFactory("MockERC20");
            const mockEstimate = await MockERC20.estimateDeployGas("Test", "TEST");
            console.log("MockERC20 gas estimate:", mockEstimate.toString());
            
            const mockToken = await MockERC20.deploy("Test", "TEST", {
                gasLimit: (mockEstimate * 120n) / 100n
            });
            
            await mockToken.waitForDeployment();
            console.log("✅ MockERC20 deployed to:", mockToken.target);
            
        } catch (mockError) {
            console.error("MockERC20 deployment also failed:", mockError.message);
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });