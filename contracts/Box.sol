// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import '@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol';
import './mixins/Roles.sol';
import "hardhat/console.sol";

contract Box is Initializable, Roles {
    uint256 private _value;

    function initialize(address payable _creator) public initializer() {
        Roles._initialize(_creator);
        console.log("Box contract initiliazed with creator", _creator);
    }

    // Emitted when the stored value changes
    event ValueChanged(uint256 value);

    // Stores a new value in the contract
    function store(uint256 value) public {
        _value = value;
        emit ValueChanged(value);
    }

    // Reads the last stored value
    function retrieve() public view returns (uint256) {
        return _value;
    }

    function version() public pure returns (uint256) {
        return 1;
    }
}