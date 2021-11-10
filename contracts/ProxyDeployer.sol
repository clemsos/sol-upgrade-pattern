// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import './IBox.sol';
import './Box.sol';
import './BoxV2.sol';
import './BoxProxyAdmin.sol';
import 'hardhat/console.sol';

import "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol";
import "@openzeppelin/contracts/proxy/transparent/ProxyAdmin.sol";

contract ProxyDeployer {

  // Events
  event BoxCreated(address indexed newBoxAddress);
  event BoxUpgraded(address indexed boxAddress);
  event ProxyAdminDeployed(address indexed newProxyAdminAddress);

  address public proxyAdminAddress;
  BoxProxyAdmin private proxyAdmin;
  TransparentUpgradeableProxy proxy;

  constructor() {
    _deployProxyAdmin();
  }

  function changeProxyAdmin(address _proxyAdminAddress) public {
    // store proxyAdmin address
    require(_proxyAdminAddress != address(0), "proxyAdmin address can not be 0x");
    proxyAdminAddress = _proxyAdminAddress;
    proxyAdmin = BoxProxyAdmin(_proxyAdminAddress);
  }
  
  // deploy from contract to prevent 'Ownable: caller is not the owner' error
  function _deployProxyAdmin() private returns(address) {
    proxyAdmin = new BoxProxyAdmin();
    proxyAdminAddress = address(proxyAdmin);
    emit ProxyAdminDeployed(proxyAdminAddress);
    return address(proxyAdmin);
  }

  function deployBoxWithProxy(address _creator, address impl ) public returns(address) {
    // deploy a proxy pointing to Box impl
    bytes memory data = abi.encodeWithSignature('initialize(address)', _creator);
    proxy = new TransparentUpgradeableProxy(impl, proxyAdminAddress, data);

    // notify
    emit BoxCreated(address(proxy));
    return address(proxy);
  }

  function upgradeBox(address impl) public proxyIsSet onlyBoxProxyManager returns(address){
    require(address(proxy) != address(0), "proxy not set");

    // check perms
    require( isBoxProxyManager(msg.sender) == true, 'you are not a BoxProxy manager');
 
    proxyAdmin.upgrade(proxy, impl);

    emit BoxUpgraded(address(proxy));
    return address(proxy);
  }

  function isBoxProxyManager(address _sender) public view returns (bool){
    IBox box = IBox(address(proxy));
    return box.isBoxManager(_sender);
  }

  modifier proxyIsSet() {
    require(address(proxy) != address(0), "proxy not set");
    _;
  }
  modifier onlyBoxProxyManager() {
    require( isBoxProxyManager(msg.sender) == true, 'you are not a BoxProxy manager');
    _;
  }

}