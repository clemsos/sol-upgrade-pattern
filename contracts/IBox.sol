// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IBox {
    // event ValueChanged(uint256 value);

    // Stores a new value in the contract
    function store(uint256 value) external;

    // Reads the last stored value
    function retrieve() external view returns (uint256);

    function version() external view returns (uint256);

    function increment() external view returns (uint256);

    // roles
    function BOX_MANAGER_ROLE() external pure returns (bytes32);
    function addBoxManager(address account) external;
    function isBoxManager(address account) external view returns (bool);

}