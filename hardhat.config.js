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
    // Use single API key per new Etherscan plugin guidance; supports custom chains
    apiKey: process.env.ETHERSCAN_API_KEY || process.env.HYPEREVMSCAN_API_KEY || '',
    customChains: [
      {
        network: "hyperevm_testnet",
        chainId: 998,
        urls: {
          apiURL: "https://api-testnet.hyperevmscan.io/api",
          browserURL: "https://testnet.hyperevmscan.io"
        }
      },
      {
        network: "hyperevm_mainnet",
        chainId: 999,
        urls: {
          apiURL: "https://api.hyperevmscan.io/api",
          browserURL: "https://hyperevmscan.io"
        }
      }
    ]
  },
};