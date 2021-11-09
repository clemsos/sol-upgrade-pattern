const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");


describe("Deployers", function () {
  let deployer 
  let Deployer 
  let box 
  let Box 
  
  const boxWorks = async (tx) => {
    const { events } = await tx.wait()

    // check if box instance exists
    const evt = events.find((v) => v.event === 'BoxCreated')
    const { newBoxAddress } = evt.args

    // check if box instance works
    const newBox = Box.attach(newBoxAddress)
    await newBox.store(12)
    expect(await newBox.retrieve()).to.equal(12);
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
        await boxWorks(tx)
      });
    })
    describe("deployClone", function () {
      it("Should deploy a Box contract properly", async function () {
        // deploy using minimal clone 
        const tx = await deployer.deployClone(box.address)
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
        await boxWorks(tx)
      });
    })
    describe("upgradeWithProxy", function () {
      it("Should upgrade a Box contract properly", async function () {
        // deploy using proxy 
        await deployer.createProxyAdmin()
        const txDeploy = await deployer.deployWithProxy()
        await boxWorks(txDeploy)

        // upgrade 
        const BoxV2 = await ethers.getContractFactory("BoxV2");
        const boxV2 = await BoxV2.deploy();
        await boxV2.deployed();
        const tx = await deployer.upgradeWithProxy(boxV2.address)

        // check if box instance exists
        const {events} = await tx.wait()
        const evt = events.find((v) => v.event === 'BoxUpgraded')
        const { newBoxAddress } = evt.args

        // check if box instance works
        const newBox = BoxV2.attach(newBoxAddress)
        await newBox.store(12)
        expect(await newBox.retrieve()).to.equal(12);
        
        await newBox.increment()
        expect(await newBox.retrieve()).to.equal(13);

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
      expect(await box.isProxyManager(creator.address)).to.equal(true)

      // can add roles
      await box.connect(creator).addProxyManager(manager.address)
      expect(await box.isProxyManager(manager.address)).to.equal(true)
    });
  })

  describe.only("ProxyDeployer", function () {
    beforeEach(async () => {
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
      const tx = await deployer.deployBasic()
      await boxWorks(tx)
    });
  })
});
