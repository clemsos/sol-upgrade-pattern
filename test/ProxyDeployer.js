const { expect, assert } = require("chai");
const { ethers, upgrades } = require("hardhat");
const { boxWorks, updatedBoxWorks } = require("./helpers");

describe("ProxyDeployer", function () {
  let deployer
  let Deployer
  let box
  let Box
  let BoxV2
  let boxV2
  let creator
  let randomAddress

  beforeEach(async () => {

    ;[, creator] = await ethers.getSigners()
    const { address } = await ethers.Wallet.createRandom()
    randomAddress = address

    // deploy impls
    Box = await ethers.getContractFactory("Box");
    box = await Box.deploy();
    await box.deployed();
    
    BoxV2 = await ethers.getContractFactory("BoxV2");
    boxV2 = await BoxV2.deploy();
    await boxV2.deployed();
    
    // deploy main contract
    Deployer = await ethers.getContractFactory("ProxyDeployer");
    deployer = await upgrades.deployProxy(Deployer)
    await deployer.deployed();

    const tx = await deployer.addImpl(box.address, 1)
    await tx.wait()
  })

  describe('Versions/implementations', () => {
    it("Should forbid non-admin to add impl", async function () {
      const [, , signer] = await ethers.getSigners()
      await expect(
        deployer.connect(signer).addImpl(box.address, 3)
      ).to.be.revertedWith("caller does not have deployer rights");

    })

    it("Should store latest version properly", async function () {

      // make sure everything is stored properly
      expect(await deployer.latestVersion()).to.equals(1)

      const tx = await deployer.addImpl(boxV2.address, 2)
      await tx.wait()
      expect(await deployer.latestVersion()).to.equals(2)

      // jump versions
      const tx2 = await deployer.addImpl(randomAddress, 532)
      await tx2.wait()
      expect(await deployer.latestVersion()).to.equals(532)
    })

    it("Should forbid same address / version to be reused", async function () {

      await expect(
        deployer.addImpl(box.address, 3)
      ).to.be.revertedWith("address already used by another version");

      await expect(
        deployer.addImpl(boxV2.address, 1)
      ).to.be.revertedWith("version already assigned");
    })

    it("Should store impls properly", async function () {

      expect(await deployer.impls(1)).to.equals(box.address)
      expect(await deployer.versions(box.address)).to.equals(1)

      // make sure everything is stored properly
      const tx2 = await deployer.addImpl(boxV2.address, 2)
      await tx2.wait()
      expect(await deployer.impls(2)).to.equals(boxV2.address)
      expect(await deployer.versions(boxV2.address)).to.equals(2)

      // add a random template
      const tx = await deployer.addImpl(randomAddress, 3)
      const { events } = await tx.wait()
      const evt = events.find((v) => v.event === 'BoxTemplateAdded')
      const { impl } = evt.args
      expect(impl).to.equals(randomAddress)
      expect(await deployer.impls(3)).to.equals(randomAddress)
      expect(await deployer.versions(randomAddress)).to.equals(3)

    })
  })

  describe('ProxyAdmin deployment', () => {
    it("should set main contract as ProxyAdmin owner", async function () {
      // instantiate proxyAdmin
      const proxyAdminAddress = await deployer.proxyAdminAddress()
      const proxyAdmin = await ethers.getContractAt('BoxProxyAdmin', proxyAdminAddress);

      // deploy proxied box
      const tx = await deployer.deployBoxWithProxy(creator.address)
      const { events } = await tx.wait()

      const evt = events.find((v) => v.event === 'BoxCreated')
      const { newBoxAddress } = evt.args

      expect(
        await proxyAdmin.getProxyAdmin(newBoxAddress)
      ).to.equals(proxyAdminAddress)

      expect(
        await proxyAdmin.owner()
      ).to.equals(deployer.address)
    });
  })

  describe('Deployment/Upgrades', () => {
    it("Should deploy a Box contract properly", async function () {
      const tx = await deployer.deployBoxWithProxy(creator.address)
      await boxWorks(tx)
    });

    it("Should allow multiple boxes to be deployed", async function () {
      const [, creator, creator2, creator3] = await ethers.getSigners()
      // create first
      const initTx = await deployer.deployBoxWithProxy(creator.address)
      const box1 = await boxWorks(initTx)
      // create 2nd
      const initTx2 = await deployer.connect(creator2).deployBoxWithProxy(creator2.address)
      const box2 = await boxWorks(initTx2, creator2)
      // add impl
      const txImpl = await deployer.addImpl(boxV2.address, 2)
      await txImpl.wait()
      // upgrade first
      const tx = await deployer.connect(creator).upgradeBox(box1.address, 2)
      await updatedBoxWorks(tx)
      // upgrade second
      const tx2 = await deployer.connect(creator2).upgradeBox(box2.address, 2)
      await updatedBoxWorks(tx2, creator2)
      // create 3rd
      const initTx3 = await deployer.connect(creator3).deployBoxWithProxy(creator3.address)
      const box3 = await boxWorks(initTx3, creator3)
      // add another impl
      const boxV3 = await BoxV2.deploy();
      await boxV3.deployed();
      const txImpl2 = await deployer.addImpl(boxV3.address, 3)
      await txImpl2.wait()
      // upgrade 3
      const tx3 = await deployer.connect(creator3).upgradeBox(box3.address, 3)
      await updatedBoxWorks(tx3, creator3)
    });

    it("Should forbid to deploy without proxy", async function () {
      await expect(
        deployer.upgradeBox(ethers.constants.AddressZero, 2)
      ).to.be.revertedWith("proxy can not be 0x");
    });

    it("Should forbid bump more than 1 version", async function () {
      const tx = await deployer.deployBoxWithProxy(creator.address)
      const proxy = await boxWorks(tx)

      const txImpl = await deployer.addImpl(boxV2.address, 3)
      await txImpl.wait()

      await expect(
        deployer.connect(creator).upgradeBox(proxy.address, 3)
      ).to.be.revertedWith("version error: make sure version increments only 1");
    });
  })

  describe('Managers rights', () => {
    it("Should set box managers correctly", async function () {
      const tx = await deployer.deployBoxWithProxy(creator.address)
      const { events } = await tx.wait()

      const evt = events.find((v) => v.event === 'BoxCreated')
      const { newBoxAddress } = evt.args
      const newBox = await ethers.getContractAt("IBox", newBoxAddress)

      expect(await newBox.isBoxManager(creator.address)).to.be.true
    });

    it("Should forbid non-managers to upgrade", async function () {
      const [, , signer] = await ethers.getSigners()
      const tx = await deployer.deployBoxWithProxy(creator.address)
      const proxy = await boxWorks(tx)
      await expect(
        deployer.connect(signer).upgradeBox(proxy.address, 2)
      ).to.be.revertedWith("you are not a proxy manager");
    });

    it("Should allow managers to upgrade", async function () {
      const initTx = await deployer.deployBoxWithProxy(creator.address)
      const proxy = await boxWorks(initTx)
      const txImpl = await deployer.addImpl(boxV2.address, 2)
      await txImpl.wait()
      const tx = await deployer.connect(creator).upgradeBox(proxy.address, 2)
      await updatedBoxWorks(tx)
    });
  })
  
  it("Should continue to work after deployer was upgraded", async function () {

    const initTx = await deployer.deployBoxWithProxy(creator.address)
    const box1 = await boxWorks(initTx)

    // make deployer upgrade
    const ProxyDeployerV2 = await ethers.getContractFactory('ProxyDeployerV2')
    deployerV2 = await upgrades.upgradeProxy(deployer.address, ProxyDeployerV2)

    // make sure upgrade was successful
    expect(await deployerV2.sayHello()).to.equals('hello world')

    // test again
    await boxWorks(initTx)

    // make a box upgrade
    const txImpl = await deployerV2.addImpl(boxV2.address, 2)
    await txImpl.wait()
    const tx = await deployerV2.connect(creator).upgradeBox(box1.address, 2)
    await updatedBoxWorks(tx)
  });

})
