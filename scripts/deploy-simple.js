const hre = require("hardhat");
require('dotenv').config();

async function main() {
    console.log("Simple deployment attempt...\n");

    const LIBRARY_ADDRESS = "0x9102Be4967859b4b01d46DEc95A55d2746C1D13C";
    const HYPERLEND_POOL_ADDRESS = process.env.HYPERLEND_POOL;
    const DATA_PROVIDER_ADDRESS = process.env.HYPERLEND_DATA_PROVIDER;
    const WHYPE_TOKEN_ADDRESS = process.env.WHYPE_TOKEN;

    console.log("Library:", LIBRARY_ADDRESS);
    console.log("Pool:", HYPERLEND_POOL_ADDRESS);
    console.log("Data Provider:", DATA_PROVIDER_ADDRESS);
    console.log("Token:", WHYPE_TOKEN_ADDRESS);

    const [deployer] = await hre.ethers.getSigners();
    console.log("Deployer:", deployer.address);

    try {
        const NoLossLotteryV2Slim = await hre.ethers.getContractFactory("NoLossLotteryV2Slim", {
            libraries: {
                LotteryViews: LIBRARY_ADDRESS
            }
        });
        
        console.log("Deploying with fixed 3M gas limit...");
        
        const lotteryV2 = await NoLossLotteryV2Slim.deploy(
            HYPERLEND_POOL_ADDRESS,
            DATA_PROVIDER_ADDRESS,
            WHYPE_TOKEN_ADDRESS,
            {
                gasLimit: 3000000, // Fixed 3M gas
            }
        );
        
        console.log("Waiting for deployment...");
        await lotteryV2.waitForDeployment();
        
        console.log("✅ SUCCESS! Contract deployed to:", lotteryV2.target);
        
        // Test a simple call
        const ticketUnit = await lotteryV2.TICKET_UNIT();
        console.log("TICKET_UNIT:", ticketUnit.toString());

        console.log("\n🎉 FINAL ADDRESSES:");
        console.log("NoLossLotteryV2Slim:", lotteryV2.target);
        console.log("LotteryViews Library:", LIBRARY_ADDRESS);
        
        console.log("\n🔗 Explorer Links:");
        console.log(`https://hyperevmscan.io/address/${lotteryV2.target}`);
        console.log(`https://hyperevmscan.io/address/${LIBRARY_ADDRESS}`);
        
    } catch (error) {
        console.error("Error:", error.message);
        console.error("Full error:", error);
    }
}

main().catch(console.error);