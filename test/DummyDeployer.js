const { expect } = require("chai");
const { ethers } = require("hardhat");


describe("DummyDeployer", function () {
  let deployer 
  let Deployer 
  let box 
  let Box  
  
  const updatedBoxWorks = async (tx) => {
    const { events } = await tx.wait()

    // check if box instance works
    const evt = events.find((v) => v.event === 'BoxUpgraded')
    const { newBoxAddress } = evt.args

    // check if box instance works
    const newBox = await ethers.getContractAt("IBox", newBoxAddress);
    expect(await newBox.retrieve()).to.equal(12);
    expect(await newBox.version()).to.equal(2);

    const [, creator] = await ethers.getSigners()
    const incrementTx = await newBox.connect(creator).increment()
    await incrementTx.wait()
    expect(await newBox.retrieve()).to.equal(13);
  }

  const boxWorks = async (tx) => {
    const { events } = await tx.wait()

    // check if box instance exists
    const evt = events.find((v) => v.event === 'BoxCreated')
    const { newBoxAddress } = evt.args

    // check if box instance works
    const [, creator] = await ethers.getSigners()

    const newBox = await ethers.getContractAt("IBox", newBoxAddress)
    const txStore = await newBox.connect(creator).store(12)
    await txStore.wait()
    expect(await newBox.retrieve()).to.equal(12);
  }

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
        deployer.deployWithProxy()
      ).to.be.revertedWith("proxy admin not set");
      
    });
    it("Should deploy a Box contract properly", async function () {
      // deploy using proxy 
      await deployer.createProxyAdmin()
      const tx = await deployer.deployWithProxy()
      await grantBoxManagement(tx)
      await boxWorks(tx)
    });
  })
  describe.skip("upgradeWithProxy", function () {
    it("Should upgrade a Box contract properly", async function () {
      // deploy using proxy 
      await deployer.createProxyAdmin()
      const txDeploy = await deployer.deployWithProxy()
      await grantBoxManagement(txDeploy)
      await boxWorks(txDeploy)

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
