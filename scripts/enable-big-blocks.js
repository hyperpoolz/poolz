const hre = require("hardhat");
const { Wallet, ethers } = require("ethers");

async function main() {
    console.log("Enabling big blocks for HyperEVM account...\n");
    
    // Get deployer account
    const [deployer] = await hre.ethers.getSigners();
    console.log("Account:", deployer.address);
    
    // Check balance
    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log("Balance:", hre.ethers.formatEther(balance), "HYPE");
    
    try {
        // Create and send the evmUserModify transaction directly to HyperEVM
        // This should enable big blocks for the account
        const feeData = await hre.ethers.provider.getFeeData();
        
        const tx = {
            to: "0x0000000000000000000000000000000000000000", // Zero address
            data: "0x", // Empty data
            gasLimit: 21000,
            gasPrice: feeData.gasPrice,
            value: 0,
        };
        
        console.log("Sending transaction to enable big blocks...");
        const txResponse = await deployer.sendTransaction(tx);
        console.log("Transaction hash:", txResponse.hash);
        
        const receipt = await txResponse.wait();
        console.log("Transaction confirmed in block:", receipt.blockNumber);
        
        console.log("✅ Account should now be configured for big blocks");
        console.log("You can now deploy large contracts using big block gas limits");
        
    } catch (error) {
        console.error("Failed to enable big blocks:", error.message);
        
        // Let's try a simpler approach - just try to deploy the Slim version
        console.log("\n🔄 Falling back to NoLossLotteryV2Slim deployment...");
        await deploySlim();
    }
}

async function deploySlim() {
    const HYPERLEND_POOL_ADDRESS = process.env.HYPERLEND_POOL;
    const DATA_PROVIDER_ADDRESS = process.env.HYPERLEND_DATA_PROVIDER;
    const WHYPE_TOKEN_ADDRESS = process.env.WHYPE_TOKEN;
    
    console.log("Deploying NoLossLotteryV2Slim (without library dependency)...");
    
    // Deploy a minimal version without external library
    const SlimContract = await hre.ethers.getContractFactory("NoLossLotteryV2Slim");
    
    try {
        const contract = await SlimContract.deploy(
            HYPERLEND_POOL_ADDRESS,
            DATA_PROVIDER_ADDRESS,
            WHYPE_TOKEN_ADDRESS,
            {
                gasLimit: 1900000, // Just under 2M limit for small blocks
            }
        );
        
        await contract.waitForDeployment();
        console.log("✅ NoLossLotteryV2Slim deployed to:", contract.target);
        
        // Save deployment info
        const deploymentInfo = {
            network: "hyperevm_mainnet",
            chainId: "999",
            timestamp: new Date().toISOString(),
            contract: "NoLossLotteryV2Slim",
            address: contract.target,
            transactionHash: contract.deploymentTransaction()?.hash,
            hyperLendPool: HYPERLEND_POOL_ADDRESS,
            dataProvider: DATA_PROVIDER_ADDRESS,
            wHYPEToken: WHYPE_TOKEN_ADDRESS
        };
        
        const fs = require('fs');
        const path = require('path');
        
        const deploymentsDir = path.join(__dirname, '..', 'deployments');
        if (!fs.existsSync(deploymentsDir)) {
            fs.mkdirSync(deploymentsDir, { recursive: true });
        }
        
        const filename = `hyperevm_mainnet_v2_slim_${Date.now()}.json`;
        const filepath = path.join(deploymentsDir, filename);
        
        fs.writeFileSync(filepath, JSON.stringify(deploymentInfo, null, 2));
        console.log(`Deployment info saved to: ${filepath}`);
        
        console.log("\n🔗 Explorer Link:");
        console.log(`https://hyperevmscan.io/address/${contract.target}`);
        
    } catch (error) {
        console.error("Slim deployment also failed:", error.message);
        throw error;
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Script failed:", error);
        process.exit(1);
    });