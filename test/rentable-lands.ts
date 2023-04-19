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
    const lands = await Lands.deploy("https://api.neoki.io/LANDS");

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
});
