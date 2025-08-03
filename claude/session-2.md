# Session 2: Core Deposit/Withdraw Logic

**Duration**: 2 hours  
**Status**: 🔄 **PENDING**  
**Planned Date**: TBD

## Objectives
Implement the fundamental user operations: deposits and withdrawals with automatic HyperLend integration, user balance tracking, and time-weighted participation system.

## Tasks & Checklist

### 🔄 Deposit Functionality
- [ ] Implement `deposit(uint256 amount)` function
- [ ] Add token transfer from user to contract
- [ ] Integrate automatic HyperLend Pool.supply() call
- [ ] Update user deposit amount and timestamp
- [ ] Add user to participants array if first deposit
- [ ] Emit Deposited event with details
- [ ] Add input validation and error handling

### 🔄 Withdrawal Functionality  
- [ ] Implement `withdraw(uint256 amount)` function
- [ ] Validate user has sufficient deposited balance
- [ ] Calculate withdrawal impact on HyperLend position
- [ ] Call HyperLend Pool.withdraw() for specified amount
- [ ] Update user deposit amount and participant status
- [ ] Remove user from participants if fully withdrawn
- [ ] Emit Withdrawn event with details

### 🔄 User Balance & Share System
- [ ] Implement time-weighted balance calculation
- [ ] Add `getUserShareWeight()` function for lottery probability
- [ ] Create `updateUserShares()` internal function
- [ ] Track user deposit timestamps for fair participation
- [ ] Calculate total weighted shares across all users
- [ ] Add view functions for user statistics

### 🔄 Testing & Validation
- [ ] Write comprehensive tests for deposit functionality
- [ ] Test withdrawal with various scenarios (partial, full)
- [ ] Test participant management (add/remove logic)
- [ ] Test edge cases (zero amounts, unauthorized withdrawals)
- [ ] Mock HyperLend interactions for local testing
- [ ] Verify gas usage and optimization

## Implementation Plan

### Core Function Signatures
```solidity
// User Operations
function deposit(uint256 amount) external nonReentrant whenNotPaused;
function withdraw(uint256 amount) external nonReentrant whenNotPaused;

// View Functions
function getUserShareWeight(address user) external view returns (uint256);
function getTotalShareWeight() external view returns (uint256);
function getUserStats(address user) external view returns (
    uint256 depositAmount,
    uint256 timeHeld,
    uint256 shareWeight,
    uint256 winProbability
);

// Internal Functions  
function _updateUserShares(address user) internal;
function _addParticipant(address user) internal;
function _removeParticipant(address user) internal;
```

### Deposit Flow
1. **Validation**: Check amount > 0, contract not paused
2. **Transfer**: Pull wHYPE tokens from user to contract
3. **HyperLend Supply**: Approve and supply tokens to Pool
4. **State Update**: Update user deposit amount and timestamp
5. **Participant Management**: Add to participants if new user
6. **Event Emission**: Log deposit with all relevant data

### Withdrawal Flow
1. **Validation**: Check user balance, amount <= deposited
2. **HyperLend Withdraw**: Retrieve tokens from Pool
3. **Transfer**: Send tokens back to user
4. **State Update**: Update user deposit amount
5. **Participant Cleanup**: Remove if fully withdrawn
6. **Event Emission**: Log withdrawal details

### Time-Weighted Participation
```solidity
function getUserShareWeight(address user) public view returns (uint256) {
    UserInfo memory info = users[user];
    if (info.depositAmount == 0) return 0;
    
    uint256 timeHeld = block.timestamp - info.depositTime;
    return info.depositAmount * timeHeld;
}
```

## Testing Strategy

### Test Categories
1. **Deposit Tests**
   - Successful deposit with HyperLend integration
   - First-time user participant addition
   - Multiple deposits from same user
   - Zero amount rejection
   - Paused contract rejection

2. **Withdrawal Tests**
   - Partial withdrawal maintaining participation
   - Full withdrawal with participant removal
   - Insufficient balance rejection
   - Non-participant withdrawal attempt

3. **Share System Tests**
   - Time-weighted calculation accuracy
   - Share updates on deposit/withdrawal
   - Total share weight calculation
   - Win probability calculations

4. **Integration Tests**
   - Mock HyperLend Pool interactions
   - Event emission verification
   - Gas usage analysis
   - Edge case handling

## User Interface Requirements

### Deposit Interface
- Clean input form with wHYPE amount
- Balance display (wallet and deposited)
- APY information from HyperLend
- Transaction confirmation modal
- Loading states during blockchain interactions

### Withdrawal Interface  
- Available balance display
- Withdrawal amount input with validation
- Impact preview (remaining deposit, participation)
- Confirmation with security warnings
- Transaction status feedback

### Dashboard Elements
- User deposit amount and time held
- Current share weight and win probability
- Projected 24-hour yield
- Next lottery countdown
- Recent transaction history

## Demo Capabilities
After Session 2 completion:

1. **Deposit Demo**: Show user depositing wHYPE with automatic HyperLend supply
2. **Balance Tracking**: Display real user balances and time-weighted shares
3. **Withdrawal Demo**: User can withdraw partial or full amounts
4. **Participant System**: Show users joining/leaving participant pool
5. **HyperLend Integration**: Demonstrate actual yield accrual in HyperLend

## Success Criteria
- [ ] Users can deposit wHYPE tokens successfully
- [ ] Deposits automatically supply to HyperLend Pool
- [ ] Users can withdraw their principal at any time
- [ ] Time-weighted participation system works correctly
- [ ] All edge cases handled properly
- [ ] Comprehensive test coverage (15+ tests)
- [ ] Gas-efficient implementation

## Risk Mitigation
1. **HyperLend Integration**: Thorough testing of Pool.supply/withdraw calls
2. **Balance Tracking**: Precise accounting to prevent discrepancies
3. **Participant Management**: Robust add/remove logic to prevent duplicates
4. **Access Control**: Proper validation of user permissions

## Files to Modify/Create
- `contracts/NoLossLottery.sol` - Add deposit/withdraw functions
- `test/NoLossLottery.test.js` - Expand test suite significantly
- `scripts/test-deposit.js` - Manual testing script for deposits
- `scripts/mock-hyperlend.js` - Mock contracts for testing

**Session 2 Readiness**: Foundation from Session 1 provides solid base for implementation.