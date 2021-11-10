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
  
  event BoxTemplateAdded(address indexed impl, uint16 indexed version);

  //
  address public proxyAdminAddress;
  BoxProxyAdmin private proxyAdmin;
  TransparentUpgradeableProxy proxy;

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

  // function _getImpl(uint16 version) private returns(address) {
  //   return impls[version];
  // }

  function changeProxyAdmin(address _proxyAdminAddress) public {
    // store proxyAdmin address
    require(_proxyAdminAddress != address(0), "proxyAdmin address can not be 0x");
    proxyAdminAddress = _proxyAdminAddress;
    proxyAdmin = BoxProxyAdmin(_proxyAdminAddress);
  }
  
  function _deployProxyAdmin() private returns(address) {
    proxyAdmin = new BoxProxyAdmin();
    proxyAdminAddress = address(proxyAdmin);
    emit ProxyAdminDeployed(proxyAdminAddress);
    return address(proxyAdmin);
  }

  function deployBoxWithProxy(address _creator, uint16 version) public returns(address) {

    address impl = impls[version];

    // deploy a proxy pointing to Box impl
    bytes memory data = abi.encodeWithSignature('initialize(address)', _creator);
    proxy = new TransparentUpgradeableProxy(impl, proxyAdminAddress, data);

    // notify
    emit BoxCreated(address(proxy));
    return address(proxy);
  }

  function upgradeBox(uint16 version) public proxyIsSet onlyBoxProxyManager returns(address){
    require(address(proxy) != address(0), "proxy not set");
    // check perms
    require( isBoxProxyManager(msg.sender) == true, 'you are not a BoxProxy manager');

    address impl = impls[version];
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