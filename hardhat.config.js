require("@nomicfoundation/hardhat-toolbox");
require('dotenv').config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    hyperevm_testnet: {
      url: "https://rpc.hyperliquid-testnet.xyz/evm",
      chainId: 998,
      accounts: (process.env.PRIVATE_KEY || process.env.TESTNET_PRIVATE_KEY) ? [process.env.PRIVATE_KEY || process.env.TESTNET_PRIVATE_KEY] : [],
    },
    hyperevm_mainnet: {
      url: "https://hyperliquid.drpc.org",
      chainId: 999,
      accounts: (process.env.PRIVATE_KEY || process.env.MAINNET_PRIVATE_KEY) ? [process.env.PRIVATE_KEY || process.env.MAINNET_PRIVATE_KEY] : [],
    },
  },
  etherscan: {
    // Add HyperEVM explorer configuration if available
    customChains: [
      {
        network: "hyperevm_testnet",
        chainId: 998,
        urls: {
          apiURL: "https://api.hyperliquid-testnet.xyz/evm",
          browserURL: "https://hyperliquid-testnet.xyz"
        }
      },
      {
        network: "hyperevm_mainnet",
        chainId: 999,
        urls: {
          apiURL: "https://api.hyperliquid.xyz/evm",
          browserURL: "https://hyperliquid.xyz"
        }
      }
    ]
  },
};