const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");


describe("Deployers", function () {
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

    await newBox.increment()
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

  describe("Deployer", function () {
    beforeEach( async() => {
      // deploy 
      Deployer = await ethers.getContractFactory("Deployer");
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
    describe("upgradeWithProxy", function () {
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
  })

  describe("Box", function () {
    it("Should support roles", async function () {

      const [, creator, manager] = await ethers.getSigners()
      Box = await ethers.getContractFactory("Box");
      box = await upgrades.deployProxy(Box, [creator.address])
      expect(await box.isBoxManager(creator.address)).to.equal(true)

      // can add roles
      await box.connect(creator).addBoxManager(manager.address)
      expect(await box.isBoxManager(manager.address)).to.equal(true)
    });
  })

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
});
