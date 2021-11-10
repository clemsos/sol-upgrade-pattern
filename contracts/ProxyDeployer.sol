// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import './IBox.sol';
import 'hardhat/console.sol';

import "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol";
import "@openzeppelin/contracts/proxy/transparent/ProxyAdmin.sol";

contract ProxyDeployer {

  // Events
  event BoxCreated(address indexed newBoxAddress);
  event BoxUpgraded(address indexed boxAddress);
  event ProxyAdminDeployed(address indexed newProxyAdminAddress);
  
  event BoxTemplateAdded(address indexed impl, uint16 indexed version);

  // proxys
  address public proxyAdminAddress;
  ProxyAdmin private proxyAdmin;

  // templates
  mapping(address => uint16) public versions;
  mapping(uint16 => address) public impls;

  constructor() {
    _deployProxyAdmin();
  }
  
  function addImpl(address impl, uint16 version) public {
    require(impl != address(0), "impl address can not be 0x");
    require(version != 0, "impl address can not be 0");
    versions[impl] = version;
    impls[version] = impl;
    emit BoxTemplateAdded(impl, version);
  }

  function _deployProxyAdmin() private returns(address) {
    proxyAdmin = new ProxyAdmin();
    proxyAdminAddress = address(proxyAdmin);
    emit ProxyAdminDeployed(proxyAdminAddress);
    return address(proxyAdmin);
  }

  function deployBoxWithProxy(address _creator, uint16 version) public returns(address) {

    address impl = impls[version];

    // deploy a proxy pointing to Box impl
    bytes memory data = abi.encodeWithSignature('initialize(address)', _creator);
    TransparentUpgradeableProxy proxy = new TransparentUpgradeableProxy(impl, proxyAdminAddress, data);

    // notify
    emit BoxCreated(address(proxy));
    return address(proxy);
  }

  function upgradeBox(address payable _proxyAddress, uint16 version) public returns(address){
    require(_proxyAddress != address(0), "proxy can not be 0x");
    require( isBoxProxyManager(_proxyAddress, msg.sender) == true, 'you are not a proxy manager');

    address impl = impls[version];
    TransparentUpgradeableProxy proxy = TransparentUpgradeableProxy(_proxyAddress);
    proxyAdmin.upgrade(proxy, impl);

    emit BoxUpgraded(address(proxy));
    return address(proxy);
  }

  function isBoxProxyManager(address _proxyAddress, address _sender) public view returns (bool){
    IBox box = IBox(_proxyAddress);
    return box.isBoxManager(_sender);
  }
}