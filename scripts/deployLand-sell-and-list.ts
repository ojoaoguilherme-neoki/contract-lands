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
  console.log(`Deploying Land Sell contract...`);
  const LandSell = await ethers.getContractFactory("LandSellV2");
  const landSell = await LandSell.deploy(NIKO_TOKEN_ADDRESS, land.address);
  await landSell.deployed();
  console.log(`Land Sell contract deployed to ${landSell.address}`);
  console.log(`-----------------------`);

  console.log("Approving nft for sell...");
  const tx2 = await land.setApprovalForAll(landSell.address, true);
  await tx2.wait();
  const batch = [];
  for (let i = 0; i < 25; i++) {
    batch.push({
      owner: "0x85b4f58Ec2fDFc73b590422780F605be20ca6C02",
      price: parseEther("100"),
      tokenId: i + 1,
    });
  }
  const sell = await landSell.sellBatchLands(batch);
  await sell.wait();
  console.log("Listed 25 lands to sell");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
