const { expect } = require("chai");
const { ethers } = require("hardhat");


describe("Deployer", function () {
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
    it("Should deploy a Box contract properly", async function () {
      // deploy using proxy 
      const tx = await deployer.deployWithProxy()
      
  
      await boxWorks(tx)
    });
  })
});
