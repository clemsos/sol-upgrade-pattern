// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import '@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol';
import './mixins/BoxManagerRole.sol';
import "hardhat/console.sol";

contract BoxV2 is Initializable, BoxManagerRole {
    uint256 private _value;

    function initialize(address _creator) public initializer() {
        // owner of the contract logic
        BoxManagerRole._initialize(_creator);
    }

    // Emitted when the stored value changes
    event ValueChanged(uint256 value);

    // Stores a new value in the contract
    function store(uint256 value) public onlyBoxManager {
        _value = value;
        emit ValueChanged(value);
    }

    // Reads the last stored value
    function retrieve() public view returns (uint256) {
        return _value;
    }

    function version() public pure returns (uint16) {
        return 2;
    }

    // Increments the stored value by 1
    function increment() public onlyBoxManager {
        _value = _value + 1;
        emit ValueChanged(_value);
    }
}