import { ethers } from "hardhat";
import * as env from "dotenv";
env.config();
async function main() {
  const provider = new ethers.providers.JsonRpcProvider(
    process.env.ALCHEMY_RPC_URL
  );
  const wallet = new ethers.Wallet(
    process.env.NIKO_DEPLOYER as string,
    provider
  );
  const balance = await provider.getBalance(wallet.address);
  console.log(balance);
}
main().catch((error) => {
  console.log(error);
});
