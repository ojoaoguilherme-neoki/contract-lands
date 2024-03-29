import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as env from "dotenv";
env.config();
const config: HardhatUserConfig = {
  solidity: "0.8.19",

  networks: {
    polygonMumbai: {
      url: `${process.env.ALCHEMY_RPC_URL}`,
      accounts: [`${process.env.DEPLOYER_ACCOUNT}`],
    },

    // hardhat: {
    //   gas: "auto",
    // },
  },

  etherscan: {
    apiKey: {
      polygonMumbai: `${process.env.POLYSCAN_API_KEY}`,
    },
  },
};

export default config;
