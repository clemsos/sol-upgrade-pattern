const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Deployer", function () {
  it("Should deploy a Box contract properly", async function () {
    
    // deploy template
    const Box = await ethers.getContractFactory("Box");
    const box = await Box.deploy();
    await box.deployed();
    
    // deploy 
    const Deployer = await ethers.getContractFactory("Deployer");
    const deployer = await Deployer.deploy();
    await deployer.deployed();

    // deploy an instance of box 
    const tx = await deployer.deployBox(box.address)
    const { events } = await tx.wait()

    //
    const evt = events.find((v) => v.event === 'BoxCreated')
    const { newBoxAddress } = evt.args

    // check if box instance works
    const newBox = Box.attach(newBoxAddress)
    await newBox.store(12)
  
    expect(await newBox.retrieve()).to.equal(12);
  });
});
