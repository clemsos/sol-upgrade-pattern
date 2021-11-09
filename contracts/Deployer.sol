// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import './IBox.sol';
import './utils/Clone2Factory.sol';


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

  // deploys BoxV1 with a proxy
  function deployBox(address boxTemplate) public returns(address) {
    
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

  /*
  function upgradeBox() public returns(address) {
    // upgrade via proxy to Boxv2
  }
  */

}