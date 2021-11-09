// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import './IBox.sol';
import './Box.sol';
import './BoxV2.sol';
import './BoxProxy.sol';
import 'hardhat/console.sol';

contract ProxyDeployer {

  // Events
  event BoxCreated(address indexed newBoxAddress);
  event BoxUpgraded(address indexed newBoxAddress);

  BoxProxy proxy;

  function deployBoxWithProxy(address _creator) public returns(address) {

    // 1. deploy impl
    Box box = new Box();

    // 2. deploy a proxy
    bytes memory data = abi.encodeWithSignature('initialize(address)', _creator);
    proxy = new BoxProxy(address(box), address(this), data);
    
    // 3. notify
    emit BoxCreated(address(proxy));
    return address(proxy);
  }

  function upgradeBox() public returns(address) {
    require(address(proxy) != address(0), "proxy not set");

    // NB: perms are checked at proxy level
    BoxV2 boxV2 = new BoxV2();    
    proxy.upgradeTo(address(boxV2), msg.sender);

    emit BoxUpgraded(address(proxy));
    return address(proxy);
  }

}