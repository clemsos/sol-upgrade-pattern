// without oz
const { ethers } = require('hardhat');

async function main() {

    const [, creator] = await ethers.getSigners()

  // impl
  const Box = await ethers.getContractFactory('Box');
  const box = await Box.deploy()
  await box.deployed()
  console.log(box.address)

  const args = [creator.address]
  const fragment = box.interface.getFunction('initialize')
  console.log(fragment)
  const data = box.interface.encodeFunctionData(fragment, args);
  console.log(data)

  // impl
  const Proxy = await ethers.getContractFactory('SimpleProxy')
  console.log(Proxy.interface)
  const proxy = await Proxy.deploy(box.address, data)
  await proxy.deployed()

  console.log(await proxy.implementation())

  const proxiedBox = await ethers.getContractAt('Box', proxy.address) 
  console.log(await proxiedBox.version())

  // make an upgrade
  const BoxV2 = await ethers.getContractFactory('BoxV2');
  const boxV2 = await BoxV2.deploy()
  await boxV2.deployed()
  console.log(boxV2.address)

  // upgrade
  proxy.upgradeTo(boxV2.address)

  //
  console.log(await proxiedBox.version())

  
}

main();