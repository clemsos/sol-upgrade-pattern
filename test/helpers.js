const { ethers } = require("hardhat");
const { expect } = require("chai");

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

module.exports = {
  boxWorks,
  updatedBoxWorks
}