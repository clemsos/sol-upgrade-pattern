// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import 'hardhat/console.sol';
import "../ProxyDeployer.sol";

contract ProxyDeployerV2 is ProxyDeployer {

  // add a function to try
  function sayHello() external pure returns (string memory) {
    return 'hello world';
  }
}

