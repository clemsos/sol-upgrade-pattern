// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import './IBox.sol';
import './Box.sol';
import './utils/Clone2Factory.sol';
import "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol";
import "@openzeppelin/contracts/proxy/transparent/ProxyAdmin.sol";
import "hardhat/console.sol";

contract DummyDeployer {

  using Clone2Factory for address;

  // Events
  event BoxCreated(address indexed newBoxAddress);
  event BoxUpgraded(address indexed boxAddress);

  // fake (almost) random number
  function _getSalt() private view
    returns (bytes32)
  {
    return keccak256(abi.encodePacked(block.difficulty, block.timestamp));
  }

  // deploys BoxV1 
  function deployBasic() public returns(address) {
    Box newBox = new Box();
    
    // emit an event 
    address newBoxAddress = address(newBox);
    emit BoxCreated(newBoxAddress);
    return newBoxAddress;
  }

  // deploys BoxV1 with a minimal Clone
  function deployClone(address boxTemplate) public returns(address) {
    
    // generate salt
    bytes32 salt = _getSalt();

    // create new contract
    address newBox = address(uint160(boxTemplate.createClone2(salt)));

    // init contract
    // newBox.initiliaze(43);

    // emit an event 
    emit BoxCreated(newBox);

    return newBox;

  }

  // store proxy admin
  ProxyAdmin proxyAdmin;
  function createProxyAdmin() public returns(address) {
    // deploy ProxyAdmin
    proxyAdmin = new ProxyAdmin();
    return address(proxyAdmin);
  }

  // deploys BoxV1 with a proxy
  TransparentUpgradeableProxy proxy;
  function deployWithProxy(address _impl) public returns(address) {
    require(_impl != address(0), "implementation can not be 0x");
    require(address(proxyAdmin) != address(0), "proxy admin not set");

    // create a proxy
    bytes memory data = abi.encodeWithSignature('initialize(address)', msg.sender);
    proxy = new TransparentUpgradeableProxy(_impl, address(proxyAdmin), data);

    // emit an event 
    emit BoxCreated(address(proxy));
    return address(proxy);
  }

  function upgradeWithProxy(address _impl) public returns(address) {
    require(address(proxyAdmin) != address(0), "proxy admin not set");
    require(address(proxy) != address(0), "proxy not set");
    proxyAdmin.upgrade(proxy, _impl);
    emit BoxUpgraded(address(proxy));
    return address(proxy);
  }

}