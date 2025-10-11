require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

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
    u2u_testnet: {
      url: process.env.RPC_URL || "https://rpc-nebulas-testnet.u2u.xyz",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 2484, // U2U Testnet Chain ID
      gasPrice: "auto",
    },
    u2u_mainnet: {
      url: "https://rpc-mainnet.u2u.xyz", // U2U Mainnet RPC (Verified)
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 39, // 0x27 in hex - U2U Mainnet Chain ID (Verified)
      gasPrice: "auto",
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};
