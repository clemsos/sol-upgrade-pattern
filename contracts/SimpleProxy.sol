import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";


contract SimpleProxy is ERC1967Proxy {

  constructor(
        address _logic,
        bytes memory _data
    ) payable ERC1967Proxy(_logic, _data) {}

  function implementation() external view returns (address implementation_) {
    implementation_ = _implementation();
  }

  function upgradeTo(address newImplementation) external {
        _upgradeToAndCall(newImplementation, bytes(""), false);
  }
}