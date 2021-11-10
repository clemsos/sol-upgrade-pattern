const { ethers } = require("hardhat");
const { expect } = require("chai");

const boxWorks = async (tx, _signer) => {
  const { events } = await tx.wait()

  // check if box instance exists
  const evt = events.find((v) => v.event === 'BoxCreated')
  const { newBoxAddress } = evt.args

  // check if box instance works
  const [, creator] = await ethers.getSigners()
  const signer = _signer || creator
  const newBox = await ethers.getContractAt("IBox", newBoxAddress, signer)
  const txStore = await newBox.store(12)
  await txStore.wait()
  expect(await newBox.retrieve()).to.equal(12);

  return newBox
}

const updatedBoxWorks = async (tx, _signer)  => {
  const { events } = await tx.wait()

  // check if box instance works
  const evt = events.find((v) => v.event === 'BoxUpgraded')
  const { boxAddress } = evt.args

  // check if box instance works
  const [, creator] = await ethers.getSigners()
  const signer = _signer || creator
  let box = await ethers.getContractAt("IBox", boxAddress, signer);
  expect(await box.retrieve()).to.equal(12);
  expect(await box.version()).to.equal(2);

  // check if box v2 feature works
  const incrementTx = await box.increment()
  await incrementTx.wait()
  expect(await box.retrieve()).to.equal(13);
  
}

module.exports = {
  boxWorks,
  updatedBoxWorks
}