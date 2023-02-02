import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { parseEther } from "ethers/lib/utils";
import { ethers } from "hardhat";
import { describe, it } from "mocha";
import moment from "moment";

describe("TESTING NEOKI RENTABLE LANDS AND SELL CONTRACT", function () {
  async function deployContractFixture() {
    const [deployer, bob, alice] = await ethers.getSigners();
    const Lands = await ethers.getContractFactory("NeokiLands");
    const lands = await Lands.deploy(
      "Neoki LANDS",
      "LANDS",
      "https://api.neoki.io/LANDS"
    );

    const minter = await lands.MINTER_ROLE();
    const setMinter = await lands
      .connect(deployer)
      .grantRole(minter, bob.address);

    return { lands, bob, alice, deployer };
  }

  async function deployLendNftFixture() {
    const { lands, bob, alice, deployer } = await loadFixture(
      deployContractFixture
    );
    const mintToBob = await lands.connect(deployer).mint(bob.address);
    await mintToBob.wait();
    return { lands, bob, alice };
  }

  it("Should name as `Neoki LANDS`", async function () {
    const { lands } = await loadFixture(deployContractFixture);
    expect(await lands.name()).to.equal("Neoki LANDS");
  });
  it("Should symbol as `LANDS`", async function () {
    const { lands } = await loadFixture(deployContractFixture);
    expect(await lands.symbol()).to.equal("LANDS");
  });
  it("Should have 423801 maximum LANDS to mint", async function () {
    const { lands } = await loadFixture(deployContractFixture);
    expect((await lands.maxLands()).toNumber()).to.equal(423801);
  });
  // it("Should fail to mint after maximum LANDS achieved", async function () {
  //   const { lands, bob } = await loadFixture(deployContractFixture);
  //   const max = await lands.maxLands();
  //   for (let index = 0; index <= max.toNumber(); index++) {
  //     lands.mint(bob.address);
  //   }
  //   await expect(lands.mint(bob.address)).to.revertedWith(
  //     "NeokiLands: Max amount of LANDs achieved"
  //   );
  // });
  it("Should have baseURI as `https://api.neoki.io/LANDS`", async function () {
    const { lands, deployer } = await loadFixture(deployContractFixture);
    const mint = await lands.connect(deployer).mint(deployer.address);
    expect(await lands.tokenURI(1)).to.equal(
      "https://api.neoki.io/LANDS/1.json"
    );
  });

  describe("TESTING ROLE ACCESS CONTROL FEATURES", function () {
    it("Deployer should have DEFAULT_ADMIN_ROLE", async function () {
      const { lands, deployer } = await loadFixture(deployContractFixture);
      const DEFAULT_ADMIN_ROLE = await lands.DEFAULT_ADMIN_ROLE();
      expect(await lands.hasRole(DEFAULT_ADMIN_ROLE, deployer.address)).to.be
        .true;
    });
    it("Deployer should have MINTER_ROLE", async function () {
      const { lands, deployer } = await loadFixture(deployContractFixture);
      const MINTER_ROLE = await lands.MINTER_ROLE();
      expect(await lands.hasRole(MINTER_ROLE, deployer.address)).to.be.true;
    });
    it("Deployer should grant MINTER_ROLE", async function () {
      const { lands, deployer, alice } = await loadFixture(
        deployContractFixture
      );
      const MINTER_ROLE = await lands.MINTER_ROLE();
      expect(await lands.hasRole(MINTER_ROLE, alice.address)).to.be.false;
      const grant = await lands
        .connect(deployer)
        .grantRole(MINTER_ROLE, alice.address);

      expect(await lands.hasRole(MINTER_ROLE, alice.address)).to.be.true;
    });
    it("Deployer should revoke MINTER_ROLE", async function () {
      const { lands, deployer, alice } = await loadFixture(
        deployContractFixture
      );
      const MINTER_ROLE = await lands.MINTER_ROLE();
      expect(await lands.hasRole(MINTER_ROLE, alice.address)).to.be.false;
      const grant = await lands
        .connect(deployer)
        .grantRole(MINTER_ROLE, alice.address);

      expect(await lands.hasRole(MINTER_ROLE, alice.address)).to.be.true;

      const revoke = await lands
        .connect(deployer)
        .revokeRole(MINTER_ROLE, alice.address);
      expect(await lands.hasRole(MINTER_ROLE, alice.address)).to.be.false;
    });
    it("Deployer should grant URI_UPDATER", async function () {
      const { lands, deployer, bob } = await loadFixture(deployContractFixture);
      const URI_UPDATER = await lands.URI_UPDATER();
      expect(await lands.hasRole(URI_UPDATER, bob.address)).to.be.false;
      const grant = await lands
        .connect(deployer)
        .grantRole(URI_UPDATER, bob.address);

      expect(await lands.hasRole(URI_UPDATER, bob.address)).to.be.true;
    });
    it("Deployer should revoke URI_UPDATER", async function () {
      const { lands, deployer, bob } = await loadFixture(deployContractFixture);
      const URI_UPDATER = await lands.URI_UPDATER();
      expect(await lands.hasRole(URI_UPDATER, bob.address)).to.be.false;
      const grant = await lands
        .connect(deployer)
        .grantRole(URI_UPDATER, bob.address);

      expect(await lands.hasRole(URI_UPDATER, bob.address)).to.be.true;

      const revoke = await lands
        .connect(deployer)
        .revokeRole(URI_UPDATER, bob.address);
      expect(await lands.hasRole(URI_UPDATER, bob.address)).to.be.false;
    });
  });

  describe("TESTING RENTABLE FEATURES", function () {
    it("Bob should have 1 LAND", async function () {
      const { deployer, bob, lands } = await loadFixture(deployContractFixture);
      const mint = await lands.connect(deployer).mint(bob.address);
      await mint.wait();
      expect(await lands.balanceOf(bob.address)).to.equal(1);
    });

    it("Bob should be able to rent alice his LAND", async function () {
      const { lands, bob, alice } = await loadFixture(deployLendNftFixture);
      const AN_HOUR = moment().hours(1).valueOf();
      const lendTx = await lands
        .connect(bob)
        .setUser(1, alice.address, AN_HOUR);
      await lendTx.wait();
      expect(await lands.userOf(1)).to.equal(alice.address);
    });
    it("Alice's LAND rights should expire after a period of time", async function () {
      const { lands, bob, alice } = await loadFixture(deployLendNftFixture);
      const AN_HOUR = moment().hours(1).valueOf();
      const lendTx = await lands
        .connect(bob)
        .setUser(1, alice.address, AN_HOUR);
      const AN_HOUR_HALF = moment().hours(1.5).valueOf();
      await time.increaseTo(AN_HOUR_HALF);
      await lendTx.wait();

      expect(await lands.userExpires(1)).to.be.lessThan(moment().valueOf());
    });
  });

  async function deploySellingFixture() {
    const [deployer, buyer, seller, wallet1, wallet2, wallet3, treasury] =
      await ethers.getSigners();
    const Lands = await ethers.getContractFactory("NeokiLands");
    const SellContract = await ethers.getContractFactory("LandSell");
    const NKO = await ethers.getContractFactory("NikoToken");
    const niko = await NKO.deploy(deployer.address);
    const lands = await Lands.deploy(
      "Neoki LANDS",
      "LANDS",
      "https://api.neoki.io/LANDS"
    );
    const landSell = await SellContract.deploy(
      niko.address,
      lands.address,
      treasury.address
    );

    const transfer = await niko
      .connect(deployer)
      .transfer(buyer.address, parseEther("10000"));

    const minter = await lands.connect(deployer).MINTER_ROLE();
    const setSellContractMinter = await lands
      .connect(deployer)
      .grantRole(minter, landSell.address);

    const mint100lands = await landSell.connect(deployer).mintLands(100);

    const definePrice = await landSell
      .connect(deployer)
      .definePricePerRange(1, 100, parseEther("1000"));

    const approveBuyerNiko = await niko
      .connect(buyer)
      .approve(landSell.address, parseEther("10000"));

    return {
      deployer,
      buyer,
      seller,
      wallet1,
      wallet2,
      wallet3,
      treasury,
      lands,
      landSell,
      niko,
    };
  }
  async function deployUserListingFixture() {
    const {
      buyer,
      deployer,
      landSell,
      lands,
      niko,
      seller,
      treasury,
      wallet1,
      wallet2,
      wallet3,
    } = await loadFixture(deploySellingFixture);

    const buyLand = await landSell.connect(buyer).buyLand([50, 60]);
    const approveLand = await lands
      .connect(buyer)
      .setApprovalForAll(landSell.address, true);

    const listLands = await landSell
      .connect(buyer)
      .listLand(50, parseEther("800"));

    const listLands2 = await landSell
      .connect(buyer)
      .listLand(60, parseEther("800"));

    const transfer = await niko
      .connect(deployer)
      .transfer(wallet1.address, parseEther("10000"));

    const transfer2 = await niko
      .connect(deployer)
      .transfer(wallet2.address, parseEther("10000"));

    const approve = await niko
      .connect(wallet1)
      .approve(landSell.address, parseEther("10000"));
    const approve2 = await niko
      .connect(wallet2)
      .approve(landSell.address, parseEther("10000"));

    return {
      buyer,
      deployer,
      landSell,
      lands,
      niko,
      seller,
      treasury,
      wallet1,
      wallet2,
      wallet3,
    };
  }

  describe("TESTING SELLING LANDS", function () {
    describe("TESTING NEOKI SELLING LANDS", function () {
      console.log(
        "INFO: Calling `TESTING NEOKI SELLING LANDS` first method takes a bit of time to mint the tokens depending on amount "
      );
      it("Should have 100 LANDS minted to sell", async function () {
        const { landSell, lands } = await loadFixture(deploySellingFixture);
        expect(await lands.totalSupply()).to.eq(100);
        expect(await landSell.getPricePerRange(1, 100)).to.lengthOf(100);
      });
      it("Should have treasury as owner of minted LANDS", async function () {
        const { landSell, treasury } = await loadFixture(deploySellingFixture);
        const land = await landSell.landMap(78);
        expect(land.owner).to.equal(treasury.address);
      });
      it("Should have price of 1000 NKO per LAND", async function () {
        const { landSell } = await loadFixture(deploySellingFixture);
        const land = await landSell.landMap(55);
        expect(land.price).to.equal(parseEther("1000"));
      });
      it("Buyer should have enough Niko Token BALANCE to buy LANDS", async function () {
        const { niko, buyer } = await loadFixture(deploySellingFixture);
        expect(await niko.balanceOf(buyer.address)).to.equal(
          parseEther("10000")
        );
      });
      it("Buyer should have enough Niko Tokens ALLOWANCE to buy LANDS", async function () {
        const { niko, buyer, landSell } = await loadFixture(
          deploySellingFixture
        );
        expect(await niko.allowance(buyer.address, landSell.address)).to.equal(
          parseEther("10000")
        );
      });
      it("Buyer should have enough MATIC to pay for gas", async function () {
        const { buyer } = await loadFixture(deploySellingFixture);
        expect(await buyer.getBalance()).to.greaterThan(parseEther("2"));
      });
      it("Should subtract NKO balance from buyer and increase NKO balance to treasury", async function () {
        const { landSell, buyer, niko, treasury } = await loadFixture(
          deploySellingFixture
        );
        await expect(
          landSell.connect(buyer).buyLand([1, 2, 3])
        ).to.changeTokenBalances(
          niko,
          [buyer, treasury],
          [parseEther("-3000"), parseEther("3000")]
        );
      });
      it("Should subtract LAND balance from Sell Contract and increase LAND balance to buyer", async function () {
        const { landSell, buyer, lands } = await loadFixture(
          deploySellingFixture
        );
        await expect(
          landSell.connect(buyer).buyLand([1, 2, 3])
        ).to.changeTokenBalances(lands, [landSell, buyer], [-3, 3]);
      });
      it("Should fail to sell LANDS if LAND is not for sell with correct error message", async function () {
        const { landSell, buyer, deployer } = await loadFixture(
          deploySellingFixture
        );
        const setLand = await landSell
          .connect(deployer)
          .adminSetLandForSell([false], [2]);

        await expect(landSell.connect(buyer).buyLand([2])).to.revertedWith(
          "LAND not for sell"
        );
      });
    });
    describe("TESTING USER SELLING LANDS", function () {
      it("Should correctly set user data to sell correctly", async function () {
        const { landSell, buyer } = await loadFixture(deployUserListingFixture);
        const land = await landSell.landMap(50);
        expect(land.owner).to.equal(buyer.address);
        expect(land.tokenId).to.equal(50);
        expect(land.price).to.equal(parseEther("800"));
        expect(land.sellable).to.be.true;
      });
      it("Should subtract NKO balance from buyer and increase to seller", async function () {
        const { landSell, buyer, wallet1, niko } = await loadFixture(
          deployUserListingFixture
        );
        await expect(
          landSell.connect(wallet1).buyLand([50])
        ).to.changeTokenBalances(
          niko,
          [wallet1, buyer],
          [parseEther("-800"), parseEther("800")]
        );
      });
      it("Should subtract LAND balance from Sell Contract and increase to buyer", async function () {
        const { landSell, lands, wallet1 } = await loadFixture(
          deployUserListingFixture
        );
        await expect(
          landSell.connect(wallet1).buyLand([50])
        ).to.changeTokenBalances(lands, [landSell, wallet1], [-1, 1]);
      });
      it("Should fail to list LAND if caller doesnt own LAND with correct error message", async function () {
        const { landSell, lands, wallet1, wallet2 } = await loadFixture(
          deployUserListingFixture
        );

        const buyLand = await landSell.connect(wallet1).buyLand([50]);
        const transfer = await lands
          .connect(wallet1)
          .transferFrom(wallet1.address, wallet2.address, 50);

        await expect(
          landSell.connect(wallet1).listLand(50, parseEther("1000"))
        ).to.rejectedWith("Caller does not own LAND");
      });
      it("Should fail in trying to override or list a LAND where the map position is already taken", async function () {
        const { landSell, lands, wallet1 } = await loadFixture(
          deployUserListingFixture
        );
        await expect(
          landSell.connect(wallet1).listLand(50, parseEther("1000"))
        ).to.rejectedWith("Cannot override existing LAND listed");
      });
    });
  });
});
