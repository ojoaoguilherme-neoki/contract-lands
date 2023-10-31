import { ethers, run } from "hardhat";
import {
  FOUNDATION_WALLET,
  NIKO_TOKEN_ADDRESS,
} from "./constant/Contracts";
import * as env from "dotenv";
import { parseEther } from "ethers/lib/utils";
const URI = "https://landspanel.neoki.io/Lands/LandDetails";
env.config();
async function main() {
  const land = await ethers.getContractAt(
    "NeokiLands",
    "0x928442009e71Cede468f85Da97621eecB9E20C08"
  );
  const landSell = await ethers.getContractAt(
    "LandSell",
    "0x3Bc7Ff07b1d457cf336A4BDF1e2b1bAa4d95235C"
  );

  // console.log("Approving nft for sell...");
  const isApprovedForAll = await land.isApprovedForAll(
    "0x85b4f58Ec2fDFc73b590422780F605be20ca6C02",
    landSell.address
  );
  if (!isApprovedForAll) {
    console.log("approving land sell");
    const tx2 = await land.setApprovalForAll(landSell.address, true);
    await tx2.wait();
    console.log("approved land sell, hash: ", tx2.hash);
  }
  const batch = [];
  for (let i = 26; i <= 183; i++) {
    batch.push({
      owner: "0x85b4f58Ec2fDFc73b590422780F605be20ca6C02",
      price: parseEther("2000"),
      tokenId: i,
      // isOwner,
    });
  }
  console.log(batch);
  console.log("Listing lands to sale");
  const sell = await landSell.sellBatchLands(batch);
  console.log("wait until the blockchain mines the transaction...");
  await sell.wait();
  console.log("Listed all verse 1 lands to sell");
  console.log("Transaction hash: ", sell.hash);
}
// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
