import { ethers, run } from "hardhat";
import { FOUNDATION_WALLET, NIKO_TOKEN_ADDRESS } from "./constant/Contracts";
import * as env from "dotenv";
import { parseEther } from "ethers/lib/utils";
env.config();
async function main() {
  console.log(`Deploying Lands...`);
  const LAND = await ethers.getContractFactory("NeokiLands");
  const land = await LAND.deploy(
    "ipfs://QmPRfZoW193VRSgB6BhcbjdjtDoqHEuz9GVw2iD8Lyv9Km"
  );
  await land.deployed();
  console.log(`Lands deployed to ${land.address}`);
  console.log("Waiting 20s");
  await wait(20 * 1000); // waiting 20s to be able to verify the contract
  await run("verify:verify", {
    address: land.address,
    constructorArguments: [
      "ipfs://QmPRfZoW193VRSgB6BhcbjdjtDoqHEuz9GVw2iD8Lyv9Km",
    ],
  });
  console.log("Lands contract verified");

  console.log(`-----------------------`);
  console.log(`Deploying Land Sell contract...`);
  const LandSell = await ethers.getContractFactory("LandSell");
  const landSell = await LandSell.deploy(NIKO_TOKEN_ADDRESS, land.address, FOUNDATION_WALLET);
  await landSell.deployed();
  console.log(`Land Sell contract deployed to ${landSell.address}`);

  console.log("Waiting 20s");
  await wait(20 * 1000); // waiting 20s to be able to verify the contract
  await run("verify:verify", {
    address: landSell.address,
    constructorArguments: [NIKO_TOKEN_ADDRESS, land.address],
  });
  console.log("Land Sell contract verified");
  console.log(`-----------------------`);

  console.log(`Minting lands to sell`);
  const tx = await land.mintBatch(
    25,
    "0x85b4f58Ec2fDFc73b590422780F605be20ca6C02"
  );
  await tx.wait();
  console.log(`Minted: hash => ${tx.hash}`);
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
function wait(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
