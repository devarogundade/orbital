import { vars } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const MNEMONIC = vars.get("MNEMONIC");
const SCAN_API_KEY = vars.get("SCAN_API_KEY");

module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1000,
      },
      viaIR: true
    },
  },
  networks: {
    baseSepolia: {
      url: `https://base-sepolia-rpc.publicnode.com`,
      chainId: 84532,
      accounts: {
        mnemonic: MNEMONIC,
        initialIndex: 0,
      },
    },
  },
  etherscan: {
    apiKey: {
      baseSepolia: SCAN_API_KEY,
    },
    customChains: [
      {
        network: 'baseSepolia',
        chainId: 84532,
        urls: {
          apiURL: 'https://api-sepolia.basescan.org/api',
          browserURL: 'https://sepolia.basescan.org/',
        },
      },
    ],
  },
};