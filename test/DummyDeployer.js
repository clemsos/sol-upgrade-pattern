const { expect } = require("chai");
const { ethers } = require("hardhat");
const { boxWorks, updatedBoxWorks } = require("./helpers");

describe("DummyDeployer", function () {
  let deployer 
  let Deployer 
  let box 
  let Box  
  
  const grantBoxManagement = async (tx) => {
    const [, creator] = await ethers.getSigners()
    const { events } = await tx.wait()

    // check if box instance exists
    const evt = events.find((v) => v.event === 'BoxCreated')
    const { newBoxAddress } = evt.args

    const newBox = Box.attach(newBoxAddress)
    const txRole = await newBox.initialize(creator.address) // setup perms
    await txRole.wait()
  }

  beforeEach( async() => {
    // deploy 
    Deployer = await ethers.getContractFactory("DummyDeployer");
    deployer = await Deployer.deploy();
    await deployer.deployed();
    
    // deploy template
    Box = await ethers.getContractFactory("Box");
    box = await Box.deploy();
    await box.deployed();      
  })
  describe("deployBasic", function () {
    it("Should deploy a Box contract properly", async function () {
      const tx = await deployer.deployBasic()
      await grantBoxManagement(tx)
      await boxWorks(tx)
    });
  })
  describe("deployClone", function () {
    it("Should deploy a Box contract properly", async function () {
      // deploy using minimal clone 
      const tx = await deployer.deployClone(box.address)
      await grantBoxManagement(tx)
      await boxWorks(tx)
    });
  })
  describe("deployWithProxy", function () {
    it("fail to deploy without proxy admin", async function () {
      // deploy using proxy 
      await expect(
        deployer.deployWithProxy(box.address)
      ).to.be.revertedWith("proxy admin not set");
      
    });
    it("Should deploy a Box contract properly", async function () {
      // deploy using proxy 
      const [, creator] = await ethers.getSigners()
      await deployer.createProxyAdmin()
      const tx = await deployer.connect(creator).deployWithProxy(box.address)
      await boxWorks(tx)
    });
  })
  describe("upgradeWithProxy", function () {
    it("Should upgrade a Box contract properly", async function () {
      const [, creator] = await ethers.getSigners()

      // deploy using proxy 
      await deployer.createProxyAdmin()
      const txDeploy = await deployer.connect(creator).deployWithProxy(box.address)

      const newBox = await boxWorks(txDeploy)
      expect(await newBox.retrieve()).to.equal(12);

      // upgrade 
      const BoxV2 = await ethers.getContractFactory("BoxV2");
      const boxV2 = await BoxV2.deploy();
      await boxV2.deployed();
      const tx = await deployer.upgradeWithProxy(boxV2.address)

      // check if box instance exists
      await updatedBoxWorks(tx)
    });
    it("Should fails if proxy has not been init", async function () {
      await deployer.createProxyAdmin()
      const { address } = await ethers.Wallet.createRandom()
      await expect(
        deployer.upgradeWithProxy(address)
      ).to.be.revertedWith("proxy not set");
    });
  })

});
