const { expect, assert } = require("chai");
const { ethers } = require("hardhat");
const { boxWorks, updatedBoxWorks } = require("./helpers");

describe("ProxyDeployer", function () {
  let deployer
  let Deployer
  let box
  let Box
  let BoxV2
  let boxV2
  let creator

  beforeEach(async () => {

    ;[, creator] = await ethers.getSigners()

    // deploy impls
    Box = await ethers.getContractFactory("Box");
    box = await Box.deploy();
    await box.deployed();
    
    BoxV2 = await ethers.getContractFactory("BoxV2");
    boxV2 = await BoxV2.deploy();
    await boxV2.deployed();
    
    // deploy main contract
    Deployer = await ethers.getContractFactory("ProxyDeployer");
    deployer = await Deployer.deploy();
    await deployer.deployed();

    const tx = await deployer.addImpl(box.address, 1)
    await tx.wait()
    const tx2 = await deployer.addImpl(boxV2.address, 2)
    await tx2.wait()
  })

  it("Should store impls properly", async function () {

    // make sure everything is stored properly
    expect(await deployer.impls(1)).to.equals(box.address)
    expect(await deployer.impls(2)).to.equals(boxV2.address)
    expect(await deployer.versions(box.address)).to.equals(1)
    expect(await deployer.versions(boxV2.address)).to.equals(2)

    // add a random template
    const { address } = await ethers.Wallet.createRandom()
    const tx = await deployer.addImpl(address, 3)
    const { events } = await tx.wait()
    const evt = events.find((v) => v.event === 'BoxTemplateAdded')
    const { impl } = evt.args
    expect(impl).to.equals(address)
    expect(await deployer.impls(3)).to.equals(address)
    expect(await deployer.versions(address)).to.equals(3)
    
  })

  it("Should deploy a Box contract properly", async function () {
    const tx = await deployer.deployBoxWithProxy(creator.address, 1)
    await boxWorks(tx)
  });
  
  it("Should set box managers correctly", async function () {
    const tx = await deployer.deployBoxWithProxy(creator.address, 1)
    const { events } = await tx.wait()

    const evt = events.find((v) => v.event === 'BoxCreated')
    const { newBoxAddress } = evt.args
    const newBox = await ethers.getContractAt("IBox", newBoxAddress)

    expect(await newBox.isBoxManager(creator.address)).to.be.true
  });

  it("Should fails to upgrade without proxy", async function () {
    await expect(
      deployer.upgradeBox(ethers.constants.AddressZero, 2)
    ).to.be.revertedWith("proxy can not be 0x");
  });

  it("Should disallow non-managers to upgrade", async function () {
    const [, , signer] = await ethers.getSigners()
    const tx = await deployer.deployBoxWithProxy(creator.address, 1)
    const proxy = await boxWorks(tx)
    await expect(
      deployer.connect(signer).upgradeBox(proxy.address, 2)
    ).to.be.revertedWith("you are not a proxy manager");
  });
  
  it("should set main contract as ProxyAdmin owner", async function () {
    // instantiate proxyAdmin
    const proxyAdminAddress = await deployer.proxyAdminAddress()
    const proxyAdmin = await ethers.getContractAt('BoxProxyAdmin', proxyAdminAddress);

    // deploy proxied box
    const tx = await deployer.deployBoxWithProxy(creator.address, 1)
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

  it("Should allow managers to upgrade", async function () {
    const initTx = await deployer.deployBoxWithProxy(creator.address, 1)
    const proxy = await boxWorks(initTx)
    const tx = await deployer.connect(creator).upgradeBox(proxy.address, 2)
    await updatedBoxWorks(tx)
  });
  
  it("Should allow multiple boxes to be deployed", async function () {
    const [, creator, creator2, creator3] = await ethers.getSigners()

    // first
    const initTx = await deployer.deployBoxWithProxy(creator.address, 1)
    const box1 = await boxWorks(initTx)
    const tx = await deployer.connect(creator).upgradeBox(box1.address, 2)
    await updatedBoxWorks(tx)
    
    // 2nd
    const initTx2 = await deployer.connect(creator2).deployBoxWithProxy(creator2.address, 1)
    const box2 = await boxWorks(initTx2, creator2)
    const tx2 = await deployer.connect(creator2).upgradeBox(box2.address, 2)
    await updatedBoxWorks(tx2, creator2)
    
    // 3rd
    const initTx3 = await deployer.connect(creator3).deployBoxWithProxy(creator3.address, 1)
    const box3 = await boxWorks(initTx3, creator3)
    const tx3 = await deployer.connect(creator3).upgradeBox(box3.address, 2)
    await updatedBoxWorks(tx3, creator3)
  });

})
