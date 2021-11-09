// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol';
import "hardhat/console.sol";

contract Roles is AccessControlUpgradeable {

  // Events
  event BoxCreated(address indexed newBoxAddress);
  event BoxUpgraded(address indexed newBoxAddress);
  event ProxyManagerAdded(address indexed account);
  
  bytes32 public constant PROXY_MANAGER_ROLE = keccak256("PROXY_MANAGER");


  function _initialize(address sender) public {
    
    // allow add other proxy managers
    _setRoleAdmin(PROXY_MANAGER_ROLE, PROXY_MANAGER_ROLE);

    // setup roles    
    if (!isProxyManager(sender)) {
      _setupRole(PROXY_MANAGER_ROLE, sender);  
    }
  }

  /**
  * ROLES
    */
  modifier onlyProxyManager() {
    require( hasRole(PROXY_MANAGER_ROLE, msg.sender), 'caller does not have the Proxy Manager role');
    _;
  }

  function isProxyManager(address account) public view returns (bool) {
    return hasRole(PROXY_MANAGER_ROLE, account);
  }


  function addProxyManager(address account) public onlyProxyManager {
    grantRole(PROXY_MANAGER_ROLE, account);
    emit ProxyManagerAdded(account);
  }

}