// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import './IBox.sol';
import './Box.sol';
import './utils/Clone2Factory.sol';
import "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol";
import "@openzeppelin/contracts/proxy/transparent/ProxyAdmin.sol";

contract Deployer {

  using Clone2Factory for address;

  // Events
  event BoxCreated(address indexed newBoxAddress);
  event BoxUpgraded(address indexed newBoxAddress);

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

  // deploys BoxV1 with a proxy
  function deployWithProxy() public returns(address) {
    
    // deploy ProxyAdmin
    ProxyAdmin proxyAdmin = new ProxyAdmin();

    // deploy basic
    address boxV1 = deployBasic();

    // create a proxy
    TransparentUpgradeableProxy proxy = new TransparentUpgradeableProxy(boxV1, address(proxyAdmin), abi.encodePacked(uint16(0)));

    // create new contract
    address newBox = address(proxy);

    // emit an event 
    emit BoxCreated(newBox);

    return newBox;

  }

  /*
  function upgradeBox() public returns(address) {
    // upgrade via proxy to Boxv2
  }
  */

}