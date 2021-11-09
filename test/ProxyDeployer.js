const { expect } = require("chai");
const { ethers } = require("hardhat");


describe("Upgrades", function () {
  let deployer
  let Deployer
  let box
  let Box
  let BoxV2
  let boxV2
  let BoxProxyAdmin
  let proxyAdmin
  let creator


  beforeEach(async () => {

    ;[, creator] = await ethers.getSigners()

    // deploy 
    Deployer = await ethers.getContractFactory("ProxyDeployer");
    deployer = await Deployer.deploy();
    await deployer.deployed();

    // deploy impls
    Box = await ethers.getContractFactory("Box");
    box = await Box.deploy();
    await box.deployed();
    
    BoxV2 = await ethers.getContractFactory("BoxV2");
    boxV2 = await BoxV2.deploy();
    await boxV2.deployed();
    
    // deploy proxy admin
    BoxProxyAdmin = await ethers.getContractFactory("BoxProxyAdmin");
    proxyAdmin = await BoxProxyAdmin.deploy();
    await proxyAdmin.deployed();    
  })

  it("Should deploy a Box contract properly", async function () {
    const tx = await deployer.deployBoxWithProxy(creator.address)
    await boxWorks(tx)
  });

})

/*
describe("ProxyDeployer", async () => {
    let creator
    beforeEach(async () => {
      ;[, creator] = await ethers.getSigners()
      // deploy
      Deployer = await ethers.getContractFactory("ProxyDeployer");
      deployer = await Deployer.deploy();
      await deployer.deployed();

      // deploy template
      Box = await ethers.getContractFactory("Box");
      box = await Box.deploy();
      await box.deployed();
    })
    it("Should deploy a Box contract properly", async function () {
      const tx = await deployer.deployBoxWithProxy(creator.address)
      await boxWorks(tx)
    });
    it("Should fails to upgrade without proxy", async function () {
      await expect(
        deployer.upgradeBox()
      ).to.be.revertedWith("proxy not set");
    });
    it("Should disallow non-managers to upgrade", async function () {
      const [, , signer] = await ethers.getSigners()
      await deployer.deployBoxWithProxy(creator.address)
      await expect(
        deployer.connect(signer).upgradeBox()
      ).to.be.revertedWith("you are not a BoxProxy manager");
    });
    it("Should allow managers to upgrade", async function () {
      const initTx = await deployer.deployBoxWithProxy(creator.address)
      await boxWorks(initTx)
      const tx = await deployer.connect(creator).upgradeBox()
      await updatedBoxWorks(tx)
    });
  })
  */