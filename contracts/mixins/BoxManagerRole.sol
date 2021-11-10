// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol';
import "hardhat/console.sol";

contract BoxManagerRole is AccessControlUpgradeable {

  // Events
  event BoxManagerAdded(address indexed account);
  
  bytes32 public constant BOX_MANAGER_ROLE = keccak256("BOX_MANAGER");

  function _initialize(address sender) public {
    // allow add other proxy managers
    _setRoleAdmin(BOX_MANAGER_ROLE, BOX_MANAGER_ROLE);
    // setup roles    
    if (!isBoxManager(sender)) {
      _setupRole(BOX_MANAGER_ROLE, sender);
    }
  }

  /**
  * ROLES
    */
  modifier onlyBoxManager() {
    require( hasRole(BOX_MANAGER_ROLE, msg.sender), 'caller does not have the BoxManager role');
    _;
  }

  function isBoxManager(address account) public view returns (bool) {
    return hasRole(BOX_MANAGER_ROLE, account);
  }


  function addBoxManager(address account) public onlyBoxManager {
    grantRole(BOX_MANAGER_ROLE, account);
    emit BoxManagerAdded(account);
  }

}