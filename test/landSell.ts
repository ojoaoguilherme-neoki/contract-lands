import {
  loadFixture,
  time,
} from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { BigNumber } from "ethers";
import { parseEther } from "ethers/lib/utils";
import { ethers } from "hardhat";
import { describe, it } from "mocha";
import moment from "moment";

async function deployContracts() {
  const [admin, bob, alice, foundation] = await ethers.getSigners();

  const Lands = await ethers.getContractFactory("NeokiLands");
  const lands = await Lands.deploy("https://api.neoki.io/LANDS");

  const Token = await ethers.getContractFactory("NikoToken");
  const token = await Token.deploy(admin.address);

  await lands.deployed();
  await token.deployed();

  const LandSell = await ethers.getContractFactory("LandSell");
  const sell = await LandSell.deploy(
    token.address,
    lands.address,
    foundation.address
  );
  await lands.connect(admin).mintBatch(300, admin.address);
  return {
    lands,
    bob,
    alice,
    admin,
    sell,
    token,
  };
}

async function deployRentingFixture() {
  const [admin, bob, alice, foundation] = await ethers.getSigners();

  const Lands = await ethers.getContractFactory("NeokiLands");
  const lands = await Lands.deploy("https://api.neoki.io/LANDS");

  const Token = await ethers.getContractFactory("NikoToken");
  const token = await Token.deploy(admin.address);

  await lands.deployed();
  await token.deployed();

  const LandSell = await ethers.getContractFactory("LandSell");
  const sell = await LandSell.deploy(
    token.address,
    lands.address,
    foundation.address
  );
  await lands.connect(admin).mintBatch(2, bob.address);
  return {
    lands,
    bob,
    alice,
    admin,
    sell,
    token,
  };
}

async function deploySellingFixture() {
  const [admin, bob, alice, foundation] = await ethers.getSigners();

  const Lands = await ethers.getContractFactory("NeokiLands");
  const lands = await Lands.deploy("https://api.neoki.io/LANDS");

  const Token = await ethers.getContractFactory("NikoToken");
  const LandSell = await ethers.getContractFactory("LandSell");
  const token = await Token.deploy(admin.address);
  const sell = await LandSell.deploy(
    token.address,
    lands.address,
    foundation.address
  );

  await lands.deployed();
  await token.deployed();
  await sell.deployed();

  await lands.addNeokiApp(sell.address);

  await lands.connect(admin).mint(bob.address);

  return {
    admin,
    alice,
    bob,
    lands,
    sell,
    token,
  };
}

async function deployBuyingFixture() {
  const [admin, bob, alice, foundation] = await ethers.getSigners();

  const Lands = await ethers.getContractFactory("NeokiLands");
  const lands = await Lands.deploy("https://api.neoki.io/LANDS");

  const Token = await ethers.getContractFactory("NikoToken");
  const LandSell = await ethers.getContractFactory("LandSell");
  const token = await Token.deploy(admin.address);
  const sell = await LandSell.deploy(
    token.address,
    lands.address,
    foundation.address
  );

  await lands.deployed();
  await token.deployed();
  await sell.deployed();

  await lands.addNeokiApp(sell.address);

  await lands.connect(admin).mintBatch(100, admin.address);

  const batch = [];
  for (let i = 0; i < 100; i++) {
    batch.push({
      owner: admin.address,
      price: parseEther("100"),
      tokenId: i + 1,
    });
  }

  await sell.connect(admin).sellBatchLands(batch);

  await token
    .connect(admin)
    .transfer(alice.address, parseEther("1000"));
  await token
    .connect(admin)
    .transfer(bob.address, parseEther("1000"));

  await token.connect(bob).approve(sell.address, parseEther("1000"));
  await token
    .connect(alice)
    .approve(sell.address, parseEther("1000"));

  return {
    admin,
    alice,
    bob,
    lands,
    sell,
    token,
    foundation,
  };
}
describe("Neoki Land Sale and LAND contract", function () {
  // DONE
  describe("LAND metadata", function () {
    it("Should name Neoki LANDS", async function () {
      const { lands } = await loadFixture(deployContracts);
      expect(await lands.name()).to.equal("Neoki LANDS");
    });

    it("Should symbol as LANDS", async function () {
      const { lands } = await loadFixture(deployContracts);
      expect(await lands.symbol()).to.equal("LANDS");
    });

    it("Should have 423801 maximum LANDS to mint", async function () {
      const { lands } = await loadFixture(deployContracts);
      expect((await lands.maxLands()).toNumber()).to.equal(423801);
    });

    it("Should have baseURI as https://api.neoki.io/LANDS", async function () {
      const { lands, admin } = await loadFixture(deployContracts);
      await lands.connect(admin).mint(admin.address);
      expect(await lands.tokenURI(1)).to.equal(
        "https://api.neoki.io/LANDS/1.json"
      );
    });

    it("Should be possible to mint a single LAND", async function () {
      const { lands, admin } = await loadFixture(deployContracts);
      await expect(
        lands.connect(admin).mint(admin.address)
      ).to.changeTokenBalance(lands, admin.address, 1);
    });

    it("Should be possible to mint batch transaction", async function () {
      const { lands, admin } = await loadFixture(deployContracts);
      await expect(
        lands.connect(admin).mintBatch(100, admin.address)
      ).to.changeTokenBalance(lands, admin.address, 100);
    });
  });

  // DONE
  describe("Testing LAND roles access control features", function () {
    it("admin should have DEFAULT_ADMIN_ROLE", async function () {
      const { lands, admin } = await loadFixture(deployContracts);
      const DEFAULT_ADMIN_ROLE = await lands.DEFAULT_ADMIN_ROLE();
      expect(await lands.hasRole(DEFAULT_ADMIN_ROLE, admin.address))
        .to.be.true;
    });

    it("admin should have MINTER_ROLE", async function () {
      const { lands, admin } = await loadFixture(deployContracts);
      const MINTER_ROLE = await lands.MINTER_ROLE();
      expect(await lands.hasRole(MINTER_ROLE, admin.address)).to.be
        .true;
    });

    it("admin should grant MINTER_ROLE", async function () {
      const { lands, admin, alice } = await loadFixture(
        deployContracts
      );
      const MINTER_ROLE = await lands.MINTER_ROLE();
      expect(await lands.hasRole(MINTER_ROLE, alice.address)).to.be
        .false;
      await lands
        .connect(admin)
        .grantRole(MINTER_ROLE, alice.address);

      expect(await lands.hasRole(MINTER_ROLE, alice.address)).to.be
        .true;
    });

    it("admin should revoke MINTER_ROLE", async function () {
      const { lands, admin, alice } = await loadFixture(
        deployContracts
      );
      const MINTER_ROLE = await lands.MINTER_ROLE();
      expect(await lands.hasRole(MINTER_ROLE, alice.address)).to.be
        .false;
      await lands
        .connect(admin)
        .grantRole(MINTER_ROLE, alice.address);

      expect(await lands.hasRole(MINTER_ROLE, alice.address)).to.be
        .true;

      await lands
        .connect(admin)
        .revokeRole(MINTER_ROLE, alice.address);
      expect(await lands.hasRole(MINTER_ROLE, alice.address)).to.be
        .false;
    });

    it("admin should grant URI_UPDATER", async function () {
      const { lands, admin, bob } = await loadFixture(
        deployContracts
      );
      const URI_UPDATER = await lands.URI_UPDATER();
      expect(await lands.hasRole(URI_UPDATER, bob.address)).to.be
        .false;
      await lands.connect(admin).grantRole(URI_UPDATER, bob.address);

      expect(await lands.hasRole(URI_UPDATER, bob.address)).to.be
        .true;
    });

    it("admin should revoke URI_UPDATER", async function () {
      const { lands, admin, bob } = await loadFixture(
        deployContracts
      );
      const URI_UPDATER = await lands.URI_UPDATER();
      expect(await lands.hasRole(URI_UPDATER, bob.address)).to.be
        .false;
      await lands.connect(admin).grantRole(URI_UPDATER, bob.address);

      expect(await lands.hasRole(URI_UPDATER, bob.address)).to.be
        .true;

      await lands.connect(admin).revokeRole(URI_UPDATER, bob.address);
      expect(await lands.hasRole(URI_UPDATER, bob.address)).to.be
        .false;
    });
  });

  // DONE
  describe("Testing LAND rentable features", function () {
    it("Bob should have 1 LAND", async function () {
      const { bob, lands } = await loadFixture(deployRentingFixture);
      expect(await lands.balanceOf(bob.address)).to.equal(2);
    });

    it("Bob should be able to rent alice his LAND", async function () {
      const { lands, bob, alice } = await loadFixture(
        deployRentingFixture
      );
      const ONE_HOUR_LATER = moment().add(1, "hour").valueOf();
      await lands
        .connect(bob)
        .setUser(1, alice.address, ONE_HOUR_LATER);
      expect(await lands.userOf(1)).to.equal(alice.address);
    });

    it("Alice's LAND rights should expire after a one hour", async function () {
      const { lands, bob, alice } = await loadFixture(
        deployRentingFixture
      );
      const ONE_HOUR_LATER = moment().add(1, "hour").valueOf();
      await lands
        .connect(bob)
        .setUser(1, alice.address, ONE_HOUR_LATER);
      await time.increaseTo(moment().add(2, "hours").valueOf());
      expect(await lands.userOf(1)).to.equal(
        "0x0000000000000000000000000000000000000000"
      );
    });
  });

  // DONE
  describe("Testing LAND SALE listings", function () {
    it("Should be able to list token to Land Sell contract without calling approve", async function () {
      const { bob, lands, sell } = await loadFixture(
        deploySellingFixture
      );
      await expect(
        sell.connect(bob).sellLand({
          owner: bob.address,
          price: parseEther("100"),
          tokenId: 1,
        })
      ).to.changeTokenBalances(lands, [bob, sell], [-1, 1]);
    });

    it("Should be able to list one LAND", async function () {
      const { admin, lands, sell } = await loadFixture(
        deploySellingFixture
      );
      const batch = [];
      // Started from 1 beacuse in the fixture tokenId 1 was minted already
      for (let i = 1; i <= 100; i++) {
        batch.push({
          owner: admin.address,
          price: parseEther("100"),
          tokenId: i + 1,
        });
      }
      expect(batch.length).to.equal(100);

      await lands.mint(admin.address);
      await expect(
        sell.connect(admin).sellLand({
          owner: admin.address,
          price: parseEther("100"),
          tokenId: 2,
        })
      ).to.changeTokenBalances(lands, [admin, sell], [-1, 1]);
    });

    it("Should be able to list batch of LANDs", async function () {
      const { admin, lands, sell } = await loadFixture(
        deploySellingFixture
      );
      const batch = [];
      // Started from 1 beacuse in the fixture tokenId 1 was minted already
      for (let i = 1; i <= 100; i++) {
        batch.push({
          owner: admin.address,
          price: parseEther("100"),
          tokenId: i + 1,
        });
      }
      expect(batch.length).to.equal(100);

      await lands.mintBatch(100, admin.address);
      await expect(
        sell.connect(admin).sellBatchLands(batch)
      ).to.changeTokenBalances(lands, [admin, sell], [-100, 100]);
    });
    // TODO improve this test
    it.skip("batched listed data should match contract listed data", async function () {
      const { admin, lands, sell } = await loadFixture(
        deploySellingFixture
      );
      const batch = [];
      // Started from 1 beacuse in the fixture tokenId 1 was minted already
      for (let i = 1; i <= 100; i++) {
        batch.push({
          owner: admin.address,
          price: parseEther("100"),
          tokenId: i + 1,
        });
      }

      await lands.mintBatch(100, admin.address);
      await sell.connect(admin).sellBatchLands(batch);
      const landsForSale = await sell.getAllSellingLands();

      expect(landsForSale).to.deep.include([
        {
          owner: admin.address,
          price: BigNumber.from(parseEther("100")),
        },
      ]);
    });
  });

  // TEST
  describe("Testing LAND SALE buying", function () {
    it("Should have LANDs to sell", async function () {
      const { sell } = await loadFixture(deployBuyingFixture);
      expect((await sell.getAllSellingLands()).length).to.equal(100);
    });
    it("Buying one LAND should decrease SELL CONTRACT's LAND balance and increase buyer LAND balance", async function () {
      const { bob, sell, lands } = await loadFixture(
        deployBuyingFixture
      );
      await expect(
        sell.connect(bob).buyLand(1)
      ).to.changeTokenBalances(lands, [sell, bob], [-1, 1]);
    });
    // TODO add smart contract fee
    it("Buying one LAND should decrease NKO balance and increase seller balance", async function () {
      const { bob, sell, token, admin, foundation } =
        await loadFixture(deployBuyingFixture);
      await expect(
        sell.connect(bob).buyLand(1)
      ).to.changeTokenBalances(
        token,
        [bob, admin, foundation],
        [parseEther("-100"), parseEther("96"), parseEther("4")]
      );
    });
  });
});
