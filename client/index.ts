import { BigNumber, Contract, providers, Wallet } from "ethers";
import * as env from "dotenv";
import { LAND, LandSellContract } from "../scripts/constant/Contracts";
import { landABI, landSellABI } from "../scripts/constant/ABIs";
import { formatEther, parseEther, parseUnits } from "ethers/lib/utils";
env.config();

const provider = new providers.JsonRpcProvider(process.env.ALCHEMY_RPC_URL);
const wallet = new Wallet(process.env.NIKO_DEPLOYER as string, provider);
const land = new Contract(LAND, landABI, wallet);
const sell = new Contract(LandSellContract, landSellABI, wallet);

async function main() {
  // Define price per range
  try {
    console.log(`Land contract : ${land.address}`);
    console.log(`Land Sell contract : ${sell.address}`);
    const priceRange = await sell
      .connect(wallet)
      .definePricePerRange(`${300}`, `${600}`, parseEther("1000"), {
        gasPrice: parseUnits("30", "gwei"),
      });
    await priceRange.wait();
    console.log(`Price range definition tx`, priceRange);

    const getLands: { tokenId: BigNumber; price: BigNumber }[] =
      await sell.getPricePerRange("1", "600");
    console.log(`range size: ${getLands.length + 1}`);
    getLands.map((element, index) => {
      console.log({
        indexOfLand: index + 1,
        tokenId: element.tokenId.toString() ?? "",
        price: formatEther(element.price.toString()) ?? "",
      });
    });
  } catch (error) {
    console.log(error);
  }
}

main().catch((error) => {
  console.log(error);
});
