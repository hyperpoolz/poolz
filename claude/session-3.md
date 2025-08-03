# Session 3: Yield Harvesting System

**Duration**: 2 hours  
**Status**: 🔄 **PENDING**  
**Planned Date**: TBD

## Objectives
Build the automated yield harvesting system that claims interest from HyperLend, converts it to lottery tickets, and manages the prize pool for daily distributions.

## Tasks & Checklist

### 🔄 Yield Harvesting Core
- [ ] Implement `harvestYield()` function with HyperLend integration
- [ ] Calculate accrued interest since last harvest
- [ ] Withdraw only yield (not principal) from HyperLend
- [ ] Update prize pool with harvested yield
- [ ] Track harvest timestamps and amounts
- [ ] Add access controls (anyone can trigger harvest)

### 🔄 Ticket Allocation System
- [ ] Implement ticket generation based on user yield contribution
- [ ] Calculate each user's share of harvested yield
- [ ] Allocate tickets proportional to yield generated
- [ ] Update user ticket counts in UserInfo struct
- [ ] Track total tickets issued per round
- [ ] Add view functions for ticket information

### 🔄 Prize Pool Management
- [ ] Accumulate harvested yield in prize pool
- [ ] Track prize pool history by round
- [ ] Add functions to query current prize amount
- [ ] Implement prize pool rollover if no lottery executed
- [ ] Add safety mechanisms for prize pool protection

### 🔄 Automated Scheduling
- [ ] Add daily harvest automation capability
- [ ] Implement time-based harvest triggers
- [ ] Create `canHarvest()` view function for timing
- [ ] Add harvest frequency limits to prevent spam
- [ ] Track last harvest timestamp per user/global

## Implementation Plan

### Core Function Signatures
```solidity
// Harvest Operations
function harvestYield() external nonReentrant whenNotPaused;
function canHarvest() external view returns (bool);
function getHarvestableAmount() external view returns (uint256);

// Ticket System
function updateUserTickets() external;
function getUserTickets(address user) external view returns (uint256);
function getTotalTickets() external view returns (uint256);
function getTicketPrice() external view returns (uint256);

// Prize Pool
function getCurrentPrizePool() external view returns (uint256);
function getPrizePoolHistory(uint256 round) external view returns (uint256);

// Internal Functions
function _calculateUserYieldShare(address user) internal view returns (uint256);
function _allocateTickets(address user, uint256 yieldAmount) internal;
function _updatePrizePool(uint256 amount) internal;
```

### Yield Harvesting Logic
```solidity
function harvestYield() external nonReentrant whenNotPaused {
    // Get current supply balance from HyperLend
    uint256 currentBalance = getCurrentSupplyBalance();
    
    // Calculate yield = current balance - total deposits
    uint256 yieldAmount = currentBalance > totalDeposits ? 
        currentBalance - totalDeposits : 0;
    
    if (yieldAmount > 0) {
        // Withdraw only the yield from HyperLend
        hyperLendPool.withdraw(address(depositToken), yieldAmount, address(this));
        
        // Allocate tickets to users based on their contribution
        _distributeTickets(yieldAmount);
        
        // Update prize pool
        prizePool += yieldAmount;
        lastHarvestTime = block.timestamp;
        
        emit YieldHarvested(yieldAmount, block.timestamp);
    }
}
```

### Ticket Allocation Strategy
```solidity
function _distributeTickets(uint256 totalYield) internal {
    for (uint256 i = 0; i < participants.length; i++) {
        address user = participants[i];
        UserInfo storage userInfo = users[user];
        
        // Calculate user's share of yield based on deposit amount and time
        uint256 userYieldShare = _calculateUserYieldShare(user, totalYield);
        
        // Convert yield to tickets (1 ticket per X amount of yield)
        uint256 newTickets = userYieldShare / TICKET_PRICE;
        
        // Update user's ticket count
        userInfo.tickets += newTickets;
        userInfo.lastTicketUpdate = block.timestamp;
        
        emit TicketsUpdated(user, userInfo.tickets);
    }
}
```

### Yield Share Calculation
```solidity
function _calculateUserYieldShare(address user, uint256 totalYield) 
    internal view returns (uint256) {
    UserInfo memory userInfo = users[user];
    if (userInfo.depositAmount == 0) return 0;
    
    // Time-weighted yield share
    uint256 timeHeld = block.timestamp - userInfo.depositTime;
    uint256 userWeight = userInfo.depositAmount * timeHeld;
    uint256 totalWeight = getTotalShareWeight();
    
    return (totalYield * userWeight) / totalWeight;
}
```

## Testing Strategy

### Test Categories
1. **Harvest Functionality**
   - Successful yield harvest from HyperLend
   - Yield calculation accuracy
   - Prize pool updates
   - Multiple harvest cycles
   - Zero yield scenarios

2. **Ticket Allocation**
   - Proportional ticket distribution
   - Time-weighted allocation fairness
   - Multiple users with different deposits
   - Ticket accumulation over time
   - Edge cases with very small yields

3. **Prize Pool Management**
   - Accurate yield accumulation
   - Prize pool rollover scenarios
   - Historical tracking
   - Security of funds

4. **Integration Tests**
   - End-to-end harvest to ticket flow
   - Mock HyperLend yield scenarios
   - Gas optimization verification
   - Event emission testing

## User Interface Requirements

### Harvest Dashboard
- Current harvestable yield display
- Time since last harvest
- Harvest button with gas estimation
- Historical harvest data chart
- APY tracking and trends

### Ticket Information
- User's current ticket count
- Ticket value and conversion rate
- Probability calculation display
- Ticket history and accumulation
- Next lottery participation status

### Prize Pool Display
- Current prize pool amount in wHYPE
- Prize pool growth over time
- Estimated next prize amount
- Historical winner amounts
- Yield source breakdown

## Demo Capabilities
After Session 3 completion:

1. **Yield Harvest**: Demonstrate automatic yield collection from HyperLend
2. **Ticket Generation**: Show tickets being allocated to users based on yield
3. **Prize Pool Growth**: Display accumulating prize pool over time
4. **Fair Distribution**: Prove time-weighted ticket allocation fairness
5. **Real-time Updates**: Show live yield accrual and ticket updates

## Advanced Features

### Compound Interest Effect
- Track yield-on-yield accumulation
- Display compound APY vs simple APY
- Show exponential growth potential

### Harvest Optimization
- Gas-efficient batch operations
- Optimal harvest timing suggestions
- Automatic harvest triggers

### Ticket Economics
- Dynamic ticket pricing based on yield
- Ticket burning mechanisms
- Bonus ticket promotions

## Success Criteria
- [ ] Yield harvesting works accurately with HyperLend
- [ ] Tickets allocated fairly based on time-weighted contributions
- [ ] Prize pool grows correctly with harvested yield
- [ ] All users can see their ticket counts and win probability
- [ ] Gas-efficient harvest operations
- [ ] Comprehensive test coverage (20+ tests)
- [ ] Real yield demonstration on testnet

## Risk Mitigation
1. **Yield Calculation**: Precise arithmetic to prevent rounding errors
2. **Ticket Fairness**: Thorough testing of allocation algorithms
3. **Prize Pool Security**: Multiple validation layers for fund safety
4. **Gas Costs**: Optimize for reasonable harvest costs

## Dependencies
- Session 2 completion: deposit/withdraw functionality
- HyperLend yield generation: requires actual deposits earning interest
- Time progression: may need to wait for yield accumulation

## Files to Modify/Create
- `contracts/NoLossLottery.sol` - Add harvest and ticket functions
- `test/HarvestSystem.test.js` - Comprehensive harvest testing
- `scripts/simulate-yield.js` - Yield simulation for demos
- `scripts/harvest-demo.js` - Manual harvest demonstration

**Session 3 Dependencies**: Requires functioning deposit system from Session 2.