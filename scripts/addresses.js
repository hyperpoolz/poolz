require('dotenv').config();

// Centralized address book for deployments per network
// Prefer environment variables; fall back to placeholders where appropriate

const addresses = {
  hyperevm_testnet: {
    hyperLendPool: process.env.HL_POOL_TESTNET || '0x00A89d7a5A02160f20150EbEA7a2b5E4879A1A8b',
    dataProvider: process.env.HL_DATA_PROVIDER_TESTNET || '0x5481bf8d3946E6A3168640c1D7523eB59F055a29',
    wHYPE: process.env.WHYPE_TESTNET || '0x5555555555555555555555555555555555555555',
  },
  hyperevm_mainnet: {
    hyperLendPool: process.env.HL_POOL_MAINNET || '0x00A89d7a5A02160f20150EbEA7a2b5E4879A1A8b',
    dataProvider: process.env.HL_DATA_PROVIDER_MAINNET || '0x5481bf8d3946E6A3168640c1D7523eB59F055a29',
    wHYPE: process.env.WHYPE_MAINNET || '0x5555555555555555555555555555555555555555',
  },
};

module.exports = addresses;


