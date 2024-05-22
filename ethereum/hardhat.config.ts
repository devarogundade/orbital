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
    avalanche: {
      url: `https://api.avax-test.network/ext/bc/C/rpc`,
      chainId: 43113,
      accounts: {
        mnemonic: MNEMONIC,
        initialIndex: 0,
      },
    },
  },
  etherscan: {
    apiKey: {
      avalanche: SCAN_API_KEY,
    },
    customChains: [
      {
        network: 'avalanche',
        chainId: 43113,
        urls: {
          apiURL: 'https://api.routescan.io/v2/network/testnet/evm/43113/etherscan/api',
          browserURL: 'https://testnet.snowtrace.io/',
        },
      },
    ],
  },
};