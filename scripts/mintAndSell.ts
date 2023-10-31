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
  console.log(land);
  const tx = await land.mintBatch(
    183,
    "0x85b4f58Ec2fDFc73b590422780F605be20ca6C02"
  );
  await tx.wait();
  console.log(`Minted: hash => ${tx.hash}`);
  // console.log("Approving nft for sell...");
  // const tx2 = await land.setApprovalForAll(landSell.address, true);
  // await tx2.wait();
  const batch = [];
  for (let i = 25; i < 183; i++) {
    batch.push({
      owner: "0x85b4f58Ec2fDFc73b590422780F605be20ca6C02",
      price: parseEther("2000"),
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
