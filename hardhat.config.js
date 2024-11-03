require("@nomicfoundation/hardhat-toolbox");
require('dotenv').config();

const account = process.env.DEPLOYER_SIGNER_PRIVATE_KEY;
const endpoint = process.env.INFURA_ENDPOINT;
const etherscanApiKey = process.env.ETHERSCAN_API_KEY;

module.exports = {
  solidity: {
    version: "0.8.27",
    settings: {
      optimizer: {
        enabled: false,
        runs: 200
      }
    }
  },
  networks: {
    sepolia: {
      url:endpoint,
      accounts:[account]
    }
  },
  etherscan: {
    apiKey: {
      sepolia: etherscanApiKey 
    }
  }
};

