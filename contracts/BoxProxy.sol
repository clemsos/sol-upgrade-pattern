// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import 'hardhat/console.sol';
import './IBox.sol';
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract BoxProxy is ERC1967Proxy {

  constructor(address _logic, address _creator, bytes memory _data) payable ERC1967Proxy(_logic, _data) {
    // IBox box = IBox(address(this));
  }

  function upgradeTo(address _impl, address _sender) public {
    require( isBoxProxyManager(_sender) == true, 'you are not a BoxProxy manager');
    _upgradeToAndCall(_impl, bytes(""), false);
    console.log('new _impl', _impl);
    // _upgradeTo(_impl);
  }

  function isBoxProxyManager(address _sender) public view returns (bool){
    IBox box = IBox(address(this));
    return box.isBoxManager(_sender);
  }

  modifier onlyBoxProxyManager() {
    require( isBoxProxyManager(msg.sender) == true, 'you are not a BoxProxy manager');
    _;
  }

}