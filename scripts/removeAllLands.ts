import { ethers } from "hardhat";
import { NIKO_TOKEN_ADDRESS } from "./constant/Contracts";
import * as env from "dotenv";
import { parseEther } from "ethers/lib/utils";
env.config();
async function main() {
  console.log(`Getting Lands...`);
  const land = await ethers.getContractAt(
    "NeokiLands",
    "0x43f6E0146b054B098DA428ce86C8caE7F56Ff5aB"
  );
  console.log(`Lands contract: ${land.address}`);
  console.log(`-----------------------`);

  const landSell = await ethers.getContractAt(
    "LandSellV2",
    "0x225890fc3699ebf6390ece8c06c4e88e9542e3eb"
  );
  console.log(`Land Sell contract: ${landSell.address}`);
  console.log(`-----------------------`);
  for (let i = 0; i < 25; i++) {
    const tx = await landSell.removeLand(i + 1);
    await tx.wait();
  }
  console.log("Removed 25 lands to sell");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
