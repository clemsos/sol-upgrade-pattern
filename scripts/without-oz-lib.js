// without oz
const { ethers } = require('hardhat');

async function main() {

  const [, creator] = await ethers.getSigners()

  // deploy impl v1
  const Box = await ethers.getContractFactory('Box');
  const box = await Box.deploy()
  await box.deployed()
  console.log('boxV1 impl:', box.address)

  // encode initializer data
  const args = [creator.address]
  const fragment = box.interface.getFunction('initialize')
  const data = box.interface.encodeFunctionData(fragment, args);
  
  // deploy and init proxy
  const Proxy = await ethers.getContractFactory('SimpleProxy')
  const proxy = await Proxy.deploy(box.address, data)
  await proxy.deployed()
  console.log('implementation:', await proxy.implementation())

  // check box v1
  const proxiedBox = await ethers.getContractAt('Box', proxy.address) 
  console.log(await proxiedBox.version())

  // deploy v2 impl
  const BoxV2 = await ethers.getContractFactory('BoxV2');
  const boxV2 = await BoxV2.deploy()
  await boxV2.deployed()
  console.log(boxV2.address)

  // upgrade to V2
  proxy.upgradeTo(boxV2.address)

  // check box v2
  console.log(await proxiedBox.version())
}

main();