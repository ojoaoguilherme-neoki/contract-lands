import { ethers } from "hardhat";

import * as env from "dotenv";
import { parseEther } from "ethers/lib/utils";
const URI = "https://landspanel.neoki.io/Lands/LandDetails";
env.config();

async function main() {
  const land = await ethers.getContractAt(
    "NeokiLands",
    "0x928442009e71Cede468f85Da97621eecB9E20C08"
  );

  const update = land.updateURI(URI);
}
// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
