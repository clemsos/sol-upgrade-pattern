# Solidity Upgrade patterns

A simple repo to demonstrate varioous patterns to deploy contracts from a contract in Solidity.

Two main deployer contracts are available:

- `DummyDeployer` : deploy 3rd part contracts from a `Deployer` contract
- `ProxyDeployer` : deploy a contract through openzeppelin's [`TransparentUpgradeableProxy`](https://docs.openzeppelin.com/contracts/4.x/api/proxy#TransparentUpgradeableProxy) from a `Deployer` contract


### Run the tests

```shell
yarn hardhat test
```
