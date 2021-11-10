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

  address private _admin;

  // proxys
  address public proxyAdminAddress;
  ProxyAdmin private proxyAdmin;

  // templates
  mapping(address => uint16) private _versions;
  mapping(uint16 => address) private _impls;
  uint16 public latestVersion;

  constructor() {
    _deployProxyAdmin();
    _admin = msg.sender;
  }

  function versions(address _impl) external view returns(uint16) {
    return _versions[_impl];
  }
  
  function impls(uint16 _version) external view returns(address) {
    return _impls[_version];
  }
  
  function addImpl(address impl, uint16 version) public onlyAdmin {
    require(impl != address(0), "impl address can not be 0x");
    require(version != 0, "impl address can not be 0");
    require(_versions[impl] == 0, "address already used by another version");
    require(_impls[version] == address(0), "version already assigned");

    _versions[impl] = version;
    _impls[version] = impl;
    if (latestVersion < version) latestVersion = version;
    emit BoxTemplateAdded(impl, version);
  }

  function _deployProxyAdmin() private returns(address) {
    proxyAdmin = new ProxyAdmin();
    proxyAdminAddress = address(proxyAdmin);
    emit ProxyAdminDeployed(proxyAdminAddress);
    return address(proxyAdmin);
  }

  function deployBoxWithProxy(address _creator) public returns(address) {
    // default to latest implementation
    address impl = _impls[latestVersion];

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

    // check version
    IBox box = IBox(_proxyAddress);
    uint16 currentVersion = box.version();
    require( version == currentVersion + 1, 'version error: make sure version increments only 1');

    address impl = _impls[version];
    TransparentUpgradeableProxy proxy = TransparentUpgradeableProxy(_proxyAddress);
    proxyAdmin.upgrade(proxy, impl);

    emit BoxUpgraded(address(proxy));
    return address(proxy);
  }

  function isBoxProxyManager(address _proxyAddress, address _sender) public view returns (bool){
    IBox box = IBox(_proxyAddress);
    return box.isBoxManager(_sender);
  }

  modifier onlyAdmin() {
    require( _admin == msg.sender, 'caller does not have deployer rights');
    _;
  }
}