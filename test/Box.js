const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

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

  it("Should deploy properly from plugin", async function () {
    const [, creator] = await ethers.getSigners()
    Box = await ethers.getContractFactory("Box");
    box = await upgrades.deployProxy(Box, [creator.address])
    expect(await box.isBoxManager(creator.address)).to.equal(true)
    // await boxWorks(tx)
    const txStore = await box.connect(creator).store(12)
    await txStore.wait()
    expect(await box.retrieve()).to.equal(12);

    // can add roles
    const BoxV2 = await ethers.getContractFactory("BoxV2");
    boxV2 = await upgrades.upgradeProxy(box.address, BoxV2)
    expect(await boxV2.retrieve()).to.equal(12);

    const incrementTx = await boxV2.connect(creator).increment()
    const { events } = await incrementTx.wait()
    const evt = events.find((v) => v.event === 'ValueChanged')

    expect(evt.args.value.toNumber()).to.equal(13);
    expect(await boxV2.retrieve()).to.equal(13);

  });
})