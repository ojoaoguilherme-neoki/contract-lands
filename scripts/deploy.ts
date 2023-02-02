import { ethers } from "hardhat";
import { COMPANY_RESERVES, NIKO_TOKEN_ADDRESS } from "./constant/Contracts";
import * as env from "dotenv";
env.config();
async function main() {
  console.log(`Deploying Lands...`);
  const LAND = await ethers.getContractFactory("NeokiLands");
  const land = await LAND.deploy([]);
  await land.deployed();
  console.log(`Lands deployed to ${land.address}`);
  console.log(`-----------------------`);
  console.log(`Deploying Land Sell contract...`);
  const LandSell = await ethers.getContractFactory("LandSell");
  const landSell = await LandSell.deploy(
    NIKO_TOKEN_ADDRESS,
    land.address,
    COMPANY_RESERVES
  );
  await landSell.deployed();
  console.log(`Land Sell contract deployed to ${landSell.address}`);
  console.log(`-----------------------`);
  console.log(`Adding selling contract as minter on LANDs contract`);
  const setMinter = await land.addAccountToMinter(landSell.address);
  await setMinter.wait();

  console.log(`Set minter on hash ${setMinter.hash}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
