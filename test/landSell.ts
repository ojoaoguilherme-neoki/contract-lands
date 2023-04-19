import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { parseEther } from "ethers/lib/utils";
import { ethers } from "hardhat";
import { describe, it } from "mocha";
import moment from "moment";

describe("TESTING NEOKI RENTABLE LANDS AND SELL CONTRACT", function () {
  async function deployContracts() {
    const [admin, bob, alice] = await ethers.getSigners();

    const Lands = await ethers.getContractFactory("NeokiLands");
    const lands = await Lands.deploy("https://api.neoki.io/LANDS");

    const Token = await ethers.getContractFactory("NikoToken");
    const token = await Token.deploy(admin.address);

    await lands.deployed();
    await token.deployed();

    const LandSell = await ethers.getContractFactory("LandSell");
    const sell = await LandSell.deploy(token.address, lands.address);
    await lands.connect(admin).mintBatch(300, admin.address);
    return { lands, bob, alice, admin, sell, token };
  }

  it("Should name as `Neoki LANDS`", async function () {
    const { lands } = await loadFixture(deployContracts);
    expect(await lands.name()).to.equal("Neoki LANDS");
  });
  it("Should symbol as `LANDS`", async function () {
    const { lands } = await loadFixture(deployContracts);
    expect(await lands.symbol()).to.equal("LANDS");
  });
  it("Should have 423801 maximum LANDS to mint", async function () {
    const { lands } = await loadFixture(deployContracts);
    expect((await lands.maxLands()).toNumber()).to.equal(423801);
  });
  // it("Should fail to mint after maximum LANDS achieved", async function () {
  //   const { lands, bob } = await loadFixture(deployContracts);
  //   const max = await lands.maxLands();
  //   for (let index = 0; index <= max.toNumber(); index++) {
  //     lands.mint(bob.address);
  //   }
  //   await expect(lands.mint(bob.address)).to.revertedWith(
  //     "NeokiLands: Max amount of LANDs achieved"
  //   );
  // });
  it("Should have baseURI as `https://api.neoki.io/LANDS`", async function () {
    const { lands, admin } = await loadFixture(deployContracts);
    const mint = await lands.connect(admin).mint(admin.address);
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

  describe("TESTING ROLE ACCESS CONTROL FEATURES", function () {
    it("admin should have DEFAULT_ADMIN_ROLE", async function () {
      const { lands, admin } = await loadFixture(deployContracts);
      const DEFAULT_ADMIN_ROLE = await lands.DEFAULT_ADMIN_ROLE();
      expect(await lands.hasRole(DEFAULT_ADMIN_ROLE, admin.address)).to.be.true;
    });
    it("admin should have MINTER_ROLE", async function () {
      const { lands, admin } = await loadFixture(deployContracts);
      const MINTER_ROLE = await lands.MINTER_ROLE();
      expect(await lands.hasRole(MINTER_ROLE, admin.address)).to.be.true;
    });
    it("admin should grant MINTER_ROLE", async function () {
      const { lands, admin, alice } = await loadFixture(deployContracts);
      const MINTER_ROLE = await lands.MINTER_ROLE();
      expect(await lands.hasRole(MINTER_ROLE, alice.address)).to.be.false;
      const grant = await lands
        .connect(admin)
        .grantRole(MINTER_ROLE, alice.address);

      expect(await lands.hasRole(MINTER_ROLE, alice.address)).to.be.true;
    });
    it("admin should revoke MINTER_ROLE", async function () {
      const { lands, admin, alice } = await loadFixture(deployContracts);
      const MINTER_ROLE = await lands.MINTER_ROLE();
      expect(await lands.hasRole(MINTER_ROLE, alice.address)).to.be.false;
      const grant = await lands
        .connect(admin)
        .grantRole(MINTER_ROLE, alice.address);

      expect(await lands.hasRole(MINTER_ROLE, alice.address)).to.be.true;

      const revoke = await lands
        .connect(admin)
        .revokeRole(MINTER_ROLE, alice.address);
      expect(await lands.hasRole(MINTER_ROLE, alice.address)).to.be.false;
    });
    it("admin should grant URI_UPDATER", async function () {
      const { lands, admin, bob } = await loadFixture(deployContracts);
      const URI_UPDATER = await lands.URI_UPDATER();
      expect(await lands.hasRole(URI_UPDATER, bob.address)).to.be.false;
      const grant = await lands
        .connect(admin)
        .grantRole(URI_UPDATER, bob.address);

      expect(await lands.hasRole(URI_UPDATER, bob.address)).to.be.true;
    });
    it("admin should revoke URI_UPDATER", async function () {
      const { lands, admin, bob } = await loadFixture(deployContracts);
      const URI_UPDATER = await lands.URI_UPDATER();
      expect(await lands.hasRole(URI_UPDATER, bob.address)).to.be.false;
      const grant = await lands
        .connect(admin)
        .grantRole(URI_UPDATER, bob.address);

      expect(await lands.hasRole(URI_UPDATER, bob.address)).to.be.true;

      const revoke = await lands
        .connect(admin)
        .revokeRole(URI_UPDATER, bob.address);
      expect(await lands.hasRole(URI_UPDATER, bob.address)).to.be.false;
    });
  });

  describe("TESTING RENTABLE FEATURES", function () {
    it("Bob should have 1 LAND", async function () {
      const { admin, bob, lands } = await loadFixture(deployContracts);
      const mint = await lands.connect(admin).mint(bob.address);
      await mint.wait();
      expect(await lands.balanceOf(bob.address)).to.equal(1);
    });

    // it("Bob should be able to rent alice his LAND", async function () {
    //   const { lands, bob, alice } = await loadFixture(deployLendNftFixture);
    //   const AN_HOUR = moment().hours(1).valueOf();
    //   const lendTx = await lands
    //     .connect(bob)
    //     .setUser(1, alice.address, AN_HOUR);
    //   await lendTx.wait();
    //   expect(await lands.userOf(1)).to.equal(alice.address);
    // });
    // it("Alice's LAND rights should expire after a period of time", async function () {
    //   const { lands, bob, alice } = await loadFixture(deployLendNftFixture);
    //   const AN_HOUR = moment().hours(1).valueOf();
    //   const lendTx = await lands
    //     .connect(bob)
    //     .setUser(1, alice.address, AN_HOUR);
    //   const AN_HOUR_HALF = moment().hours(1.5).valueOf();
    //   await time.increaseTo(AN_HOUR_HALF);
    //   await lendTx.wait();

    //   expect(await lands.userExpires(1)).to.be.lessThan(moment().valueOf());
    // });
  });

  async function deploySellingFixture() {
    const { admin, alice, bob, lands, sell, token } = await loadFixture(
      deployContracts
    );

    const mint = await lands.connect(admin).mintBatch(100, admin.address);
    await mint.wait();

    await lands.connect(admin).setApprovalForAll(sell.address, true);
    await token.connect(admin).transfer(alice.address, parseEther("1000"));
    await token.connect(admin).transfer(bob.address, parseEther("1000"));
    return {
      admin,
      alice,
      bob,
      lands,
      sell,
      token,
    };
  }

  // TESTING LISTING LANDS
  describe("TESTING LISTING LANDS", function () {
    it("Should be able to list token to Land Sell contract", async function () {
      const { admin, lands, sell } = await loadFixture(deploySellingFixture);
      await expect(
        sell.connect(admin).sellLand({
          owner: admin.address,
          price: parseEther("100"),
          tokenId: "1",
        })
      ).to.changeTokenBalances(lands, [admin, sell], [-1, 1]);
    });

    // it("Should be able to list batch of LANDs", async function () {
    //   const { admin, lands, sell } = await loadFixture(deploySellingFixture);
    //   const batch = [];
    //   for (let i = 0; i < 100; i++) {
    //     batch.push({
    //       owner: admin.address,
    //       price: parseEther("100"),
    //       tokenId: i + 1,
    //     });
    //   }
    //   expect(batch.length).to.equal(100);
    //   await expect(
    //     sell.connect(admin).sellBatchLands(batch)
    //   ).to.changeTokenBalances(lands, [admin, sell], [-100, 100]);
    // });
  });

  async function deployBuyingFixture() {
    const { admin, alice, bob, lands, sell, token } = await loadFixture(
      deployContracts
    );

    const mint = await lands.connect(admin).mintBatch(100, admin.address);
    await mint.wait();

    await lands.connect(admin).setApprovalForAll(sell.address, true);

    const batch = [];
    for (let i = 0; i < 100; i++) {
      batch.push({
        owner: admin.address,
        price: parseEther("100"),
        tokenId: i + 1,
      });
    }

    await sell.connect(admin).sellBatchLands(batch);

    await token.connect(admin).transfer(alice.address, parseEther("1000"));
    await token.connect(admin).transfer(bob.address, parseEther("1000"));

    await token.connect(admin).transfer(alice.address, parseEther("10000"));
    await token.connect(admin).transfer(bob.address, parseEther("10000"));

    const tx = await token
      .connect(alice)
      .approve(sell.address, parseEther("1000"));
    await tx.wait();
    const tx2 = await token
      .connect(bob)
      .approve(sell.address, parseEther("1000"));
    await tx2.wait();

    return {
      admin,
      alice,
      bob,
      lands,
      sell,
      token,
    };
  }
  // TESTING BUYING LANDS
  describe("TESTING BUYING LANDS", function () {
    it("Buying one LAND should decrease SELL CONTRACT the land balance and increase Buyer LAND balance", async function () {
      const { bob, sell, lands } = await loadFixture(deployBuyingFixture);
      await expect(sell.connect(bob).buyLand(1)).to.changeTokenBalances(
        lands,
        [sell, bob],
        [-1, 1]
      );
    });

    it("Buying one LAND should decrease Niko Token balance and increase Seller balance", async function () {
      const { bob, sell, token, admin } = await loadFixture(
        deployBuyingFixture
      );
      await expect(sell.connect(bob).buyLand(1)).to.changeTokenBalances(
        token,
        [bob, admin],
        [parseEther("-100"), parseEther("100")]
      );
    });

    // it("Buying one LAND should decrease Niko Token balance and increase Seller balance", async function () {
    //   const { bob, sell, token, admin } = await loadFixture(
    //     deployBuyingFixture
    //   );
    //   const buy = await sell.connect(bob).buyLand(1);
    //   await buy.wait();
    //   const getAll = await sell.getAllSellingLands();
    //   console.log(getAll);
    // });
    // describe("TESTING USER SELLING LANDS", function () {
    //   it("Should correctly set user data to sell correctly", async function () {
    //     const { landSell, buyer } = await loadFixture(deployUserListingFixture);
    //     const land = await landSell.landMap(50);
    //     expect(land.owner).to.equal(buyer.address);
    //     expect(land.tokenId).to.equal(50);
    //     expect(land.price).to.equal(parseEther("800"));
    //     expect(land.sellable).to.be.true;
    //   });
    //   it("Should subtract NKO balance from buyer and increase to seller", async function () {
    //     const { landSell, buyer, wallet1, niko } = await loadFixture(
    //       deployUserListingFixture
    //     );
    //     await expect(
    //       landSell.connect(wallet1).buyLand([50])
    //     ).to.changeTokenBalances(
    //       niko,
    //       [wallet1, buyer],
    //       [parseEther("-800"), parseEther("800")]
    //     );
    //   });
    //   it("Should subtract LAND balance from Sell Contract and increase to buyer", async function () {
    //     const { landSell, lands, wallet1 } = await loadFixture(
    //       deployUserListingFixture
    //     );
    //     await expect(
    //       landSell.connect(wallet1).buyLand([50])
    //     ).to.changeTokenBalances(lands, [landSell, wallet1], [-1, 1]);
    //   });
    //   it("Should fail to list LAND if caller doesnt own LAND with correct error message", async function () {
    //     const { landSell, lands, wallet1, wallet2 } = await loadFixture(
    //       deployUserListingFixture
    //     );
    //     const buyLand = await landSell.connect(wallet1).buyLand([50]);
    //     const transfer = await lands
    //       .connect(wallet1)
    //       .transferFrom(wallet1.address, wallet2.address, 50);
    //     await expect(
    //       landSell.connect(wallet1).listLand(50, parseEther("1000"))
    //     ).to.rejectedWith("Caller does not own LAND");
    //   });
    //   it("Should fail in trying to override or list a LAND where the map position is already taken", async function () {
    //     const { landSell, lands, wallet1 } = await loadFixture(
    //       deployUserListingFixture
    //     );
    //     await expect(
    //       landSell.connect(wallet1).listLand(50, parseEther("1000"))
    //     ).to.rejectedWith("Cannot override existing LAND listed");
    //   });
    // });
  });
});
