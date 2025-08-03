# HyperLoops Development

## Commands
- `npm test` - Run all tests
- `npx hardhat test` - Run all tests via Hardhat
- `npx hardhat test test/NoLossLottery.test.js` - Run single test file
- `npx hardhat node` - Start local Hardhat network
- `npx hardhat compile` - Compile contracts
- `npx hardhat clean` - Clean build artifacts

## Project Structure
- Solidity 0.8.20 with optimizer (200 runs)
- Uses OpenZeppelin contracts (ReentrancyGuard, SafeERC20, Ownable, Pausable)
- Hardhat + Mocha/Chai for testing

## Code Style
- **Solidity**: UpperCamelCase for contracts, lowerCamelCase for functions, UPPER_CASE for constants
- **JavaScript/Tests**: camelCase for variables/functions, PascalCase for classes
- **Import ordering**: external libs → interfaces → contracts → internal
- **Error handling**: Standard revert messages, no custom errors (consistent with codebase)
- **Visibility**: Explicit visibility modifiers, use immutable for constants
- **Storage**: Pack struct variables efficiently, use uint256 unless gas optimization required