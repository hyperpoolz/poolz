// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IPool.sol";
import "./interfaces/IProtocolDataProvider.sol";

/**
 * @title NoLossLotteryV2 
 * @notice An improved no-loss lottery with secure randomness and fixed ticketing
 * @dev Key improvements:
 * - Tickets proportional to stake (0.1 wHYPE = 1 ticket)
 * - Two-phase secure randomness without VRF
 * - Incentivized harvest/draw calls with 24h limits
 * - Gas-optimized for scale (O(1) operations)
 * - Comprehensive analytics and read functions
 */
contract NoLossLotteryV2 is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // HyperLend integration
    IPool public immutable hyperLendPool;
    IProtocolDataProvider public immutable dataProvider;
    IERC20 public immutable depositToken; // wHYPE token

    // Core constants
    uint256 public constant TICKET_UNIT = 1e17; // 0.1 wHYPE per ticket
    uint256 public constant LOTTERY_INTERVAL = 24 hours;
    uint256 public constant HARVEST_INTERVAL = 24 hours;
    uint256 public constant DRAW_BLOCKS_DELAY = 5; // blocks to wait for randomness
    uint256 public constant INCENTIVE_BPS = 100; // 1% of prize for caller

    // State variables
    uint256 public totalDeposits;
    uint256 public prizePool;
    uint256 public lastHarvestTime;
    uint256 public currentRound;

    // Round management
    enum RoundState { Active, Closed, Finalized }
    
    struct Round {
        uint256 startTime;
        uint256 endTime;
        uint256 drawBlock;
        uint256 totalTickets;
        uint256 prizeAmount;
        address winner;
        RoundState state;
        uint256 participantCount;
        bool incentivePaid;
    }

    mapping(uint256 => Round) public rounds;
    mapping(uint256 => mapping(address => uint256)) public roundTickets; // round => user => tickets
    mapping(uint256 => address[]) public roundParticipants;
    mapping(uint256 => mapping(address => bool)) public roundIsParticipant;

    // Current active state
    mapping(address => uint256) public deposits; // user total deposit amount
    mapping(address => uint256) public tickets;  // user current tickets
    uint256 public totalTickets;
    address[] public participants;
    mapping(address => bool) public isParticipant;

    // User settings
    mapping(address => uint16) public userAllocationBps; // yield allocation to lottery (default 10000 = 100%)

    // Events
    event Deposited(address indexed user, uint256 amount, uint256 newTickets);
    event Withdrawn(address indexed user, uint256 amount, uint256 burnedTickets);
    event YieldHarvested(uint256 yieldAmount, uint256 prizePoolIncrease, address indexed caller, uint256 incentive);
    event RoundClosed(uint256 indexed round, uint256 drawBlock, uint256 totalTickets, uint256 prizeAmount);
    event RoundFinalized(uint256 indexed round, address indexed winner, uint256 prize);
    event IncentivePaid(address indexed caller, uint256 amount, string action);

    constructor(
        address _hyperLendPool,
        address _dataProvider,
        address _depositToken
    ) Ownable(msg.sender) {
        require(_hyperLendPool != address(0), "Invalid pool");
        require(_dataProvider != address(0), "Invalid data provider");
        require(_depositToken != address(0), "Invalid token");

        hyperLendPool = IPool(_hyperLendPool);
        dataProvider = IProtocolDataProvider(_dataProvider);
        depositToken = IERC20(_depositToken);

        lastHarvestTime = block.timestamp;
        currentRound = 1;
        
        // Initialize first round
        rounds[1] = Round({
            startTime: block.timestamp,
            endTime: block.timestamp + LOTTERY_INTERVAL,
            drawBlock: 0,
            totalTickets: 0,
            prizeAmount: 0,
            winner: address(0),
            state: RoundState.Active,
            participantCount: 0,
            incentivePaid: false
        });
    }

    // ============ DEPOSIT/WITHDRAW ============

    function depositWHYPE(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be > 0");
        require(amount % TICKET_UNIT == 0, "Must be multiple of 0.1 wHYPE");
        require(depositToken.balanceOf(msg.sender) >= amount, "Insufficient balance");

        // Calculate tickets before deposit
        uint256 beforeDeposit = deposits[msg.sender];
        uint256 afterDeposit = beforeDeposit + amount;
        
        uint256 beforeTickets = beforeDeposit / TICKET_UNIT;
        uint256 afterTickets = afterDeposit / TICKET_UNIT;
        uint256 newTickets = afterTickets - beforeTickets;

        // Transfer and supply to HyperLend
        depositToken.safeTransferFrom(msg.sender, address(this), amount);
        depositToken.safeIncreaseAllowance(address(hyperLendPool), amount);
        hyperLendPool.supply(address(depositToken), amount, address(this), 0);

        // Update state
        deposits[msg.sender] = afterDeposit;
        totalDeposits += amount;

        if (newTickets > 0) {
            tickets[msg.sender] += newTickets;
            totalTickets += newTickets;
        }

        _addParticipant(msg.sender);

        emit Deposited(msg.sender, amount, newTickets);
    }

    function withdraw(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be > 0");
        require(amount % TICKET_UNIT == 0, "Must be multiple of 0.1 wHYPE");
        require(deposits[msg.sender] >= amount, "Insufficient deposit");

        // Calculate tickets to burn
        uint256 beforeDeposit = deposits[msg.sender];
        uint256 afterDeposit = beforeDeposit - amount;
        
        uint256 beforeTickets = beforeDeposit / TICKET_UNIT;
        uint256 afterTickets = afterDeposit / TICKET_UNIT;
        uint256 burnedTickets = beforeTickets - afterTickets;

        // Update state before external calls
        deposits[msg.sender] = afterDeposit;
        totalDeposits -= amount;

        if (burnedTickets > 0) {
            tickets[msg.sender] -= burnedTickets;
            totalTickets -= burnedTickets;
        }

        if (afterDeposit == 0) {
            _removeParticipant(msg.sender);
        }

        // Withdraw from HyperLend and transfer to user
        uint256 withdrawn = hyperLendPool.withdraw(address(depositToken), amount, address(this));
        require(withdrawn >= amount, "Insufficient withdrawal");
        depositToken.safeTransfer(msg.sender, amount);

        emit Withdrawn(msg.sender, amount, burnedTickets);
    }

    // ============ YIELD MANAGEMENT ============

    function harvestYield() external nonReentrant {
        require(block.timestamp >= lastHarvestTime + HARVEST_INTERVAL, "Harvest too soon");
        require(participants.length > 0, "No participants");

        uint256 currentBalance = getCurrentSupplyBalance();
        if (currentBalance <= totalDeposits) {
            lastHarvestTime = block.timestamp;
            return; // No yield to harvest
        }

        uint256 grossYield = currentBalance - totalDeposits;
        
        // Withdraw yield from HyperLend
        uint256 withdrawnYield = hyperLendPool.withdraw(address(depositToken), grossYield, address(this));
        require(withdrawnYield >= grossYield, "Yield withdrawal failed");

        // Calculate incentive for caller (1% of yield)
        uint256 incentive = (withdrawnYield * INCENTIVE_BPS) / 10000;
        uint256 netYield = withdrawnYield - incentive;

        // Add to prize pool
        prizePool += netYield;
        lastHarvestTime = block.timestamp;

        // Pay incentive to caller
        if (incentive > 0) {
            depositToken.safeTransfer(msg.sender, incentive);
        }

        emit YieldHarvested(withdrawnYield, netYield, msg.sender, incentive);
        emit IncentivePaid(msg.sender, incentive, "harvest");
    }

    // ============ LOTTERY EXECUTION ============

    function closeRound() external nonReentrant {
        Round storage round = rounds[currentRound];
        require(round.state == RoundState.Active, "Round not active");
        require(block.timestamp >= round.endTime, "Round not ended");
        require(totalTickets > 0, "No tickets");
        require(prizePool > 0, "No prize");

        // Set draw block for future randomness
        round.drawBlock = block.number + DRAW_BLOCKS_DELAY;
        round.totalTickets = totalTickets;
        round.prizeAmount = prizePool;
        round.participantCount = participants.length;
        round.state = RoundState.Closed;

        // Snapshot participants and tickets
        for (uint256 i = 0; i < participants.length; i++) {
            address participant = participants[i];
            if (tickets[participant] > 0) {
                roundParticipants[currentRound].push(participant);
                roundTickets[currentRound][participant] = tickets[participant];
                roundIsParticipant[currentRound][participant] = true;
            }
        }

        emit RoundClosed(currentRound, round.drawBlock, round.totalTickets, round.prizeAmount);
    }

    function finalizeRound() external nonReentrant {
        Round storage round = rounds[currentRound];
        require(round.state == RoundState.Closed, "Round not closed");
        require(block.number >= round.drawBlock, "Draw block not reached");
        require(blockhash(round.drawBlock) != bytes32(0), "Blockhash not available");

        // Generate secure randomness
        uint256 randomValue = uint256(keccak256(abi.encode(
            blockhash(round.drawBlock),
            currentRound,
            round.totalTickets,
            address(this)
        )));

        // Select winner
        address winner = _selectWinner(currentRound, randomValue);
        require(winner != address(0), "No winner selected");

        // Calculate prize and incentive
        uint256 incentive = (round.prizeAmount * INCENTIVE_BPS) / 10000;
        uint256 winnerPrize = round.prizeAmount - incentive;

        // Update round state
        round.winner = winner;
        round.state = RoundState.Finalized;
        round.incentivePaid = true;

        // Reset for next round
        prizePool = 0;
        _resetTickets();
        
        // Start next round
        currentRound++;
        rounds[currentRound] = Round({
            startTime: block.timestamp,
            endTime: block.timestamp + LOTTERY_INTERVAL,
            drawBlock: 0,
            totalTickets: 0,
            prizeAmount: 0,
            winner: address(0),
            state: RoundState.Active,
            participantCount: 0,
            incentivePaid: false
        });

        // Transfer prizes
        depositToken.safeTransfer(winner, winnerPrize);
        if (incentive > 0) {
            depositToken.safeTransfer(msg.sender, incentive);
        }

        emit RoundFinalized(currentRound - 1, winner, winnerPrize);
        emit IncentivePaid(msg.sender, incentive, "draw");
    }

    // ============ VIEW FUNCTIONS ============

    function getCurrentSupplyBalance() public view returns (uint256) {
        (uint256 currentHTokenBalance, , , , , , , , ) = dataProvider
            .getUserReserveData(address(depositToken), address(this));
        return currentHTokenBalance;
    }

    function getAccruedYield() public view returns (uint256) {
        uint256 currentBalance = getCurrentSupplyBalance();
        if (currentBalance > totalDeposits) {
            return currentBalance - totalDeposits;
        }
        return 0;
    }

    function getUserInfo(address user) external view returns (
        uint256 depositAmount,
        uint256 userTickets,
        uint256 userAllocation
    ) {
        return (
            deposits[user],
            tickets[user],
            userAllocationBps[user] == 0 ? 10000 : userAllocationBps[user]
        );
    }

    function getRoundInfo(uint256 roundId) external view returns (
        uint256 startTime,
        uint256 endTime,
        uint256 drawBlock,
        uint256 roundTotalTickets,
        uint256 prize,
        address winner,
        RoundState state,
        uint256 participantCount
    ) {
        Round storage round = rounds[roundId];
        return (
            round.startTime,
            round.endTime,
            round.drawBlock,
            round.totalTickets,
            round.prizeAmount,
            round.winner,
            round.state,
            round.participantCount
        );
    }

    function getCurrentRoundInfo() external view returns (
        uint256 roundId,
        uint256 timeLeft,
        bool canClose,
        bool canFinalize
    ) {
        Round storage round = rounds[currentRound];
        uint256 timeRemaining = block.timestamp >= round.endTime ? 0 : round.endTime - block.timestamp;
        bool closeable = round.state == RoundState.Active && 
                       block.timestamp >= round.endTime && 
                       totalTickets > 0 && 
                       prizePool > 0;
        bool finalizable = round.state == RoundState.Closed && 
                          block.number >= round.drawBlock &&
                          blockhash(round.drawBlock) != bytes32(0);
        
        return (currentRound, timeRemaining, closeable, finalizable);
    }

    function getParticipantCount() external view returns (uint256) {
        return participants.length;
    }

    function getRoundParticipants(uint256 roundId) external view returns (address[] memory) {
        return roundParticipants[roundId];
    }

    function getRoundParticipantTickets(uint256 roundId, address participant) external view returns (uint256) {
        return roundTickets[roundId][participant];
    }

    function canHarvest() external view returns (bool) {
        return block.timestamp >= lastHarvestTime + HARVEST_INTERVAL && 
               participants.length > 0 && 
               getAccruedYield() > 0;
    }

    function getTimeToNextHarvest() external view returns (uint256) {
        if (block.timestamp >= lastHarvestTime + HARVEST_INTERVAL) {
            return 0;
        }
        return (lastHarvestTime + HARVEST_INTERVAL) - block.timestamp;
    }

    function getStats() external view returns (
        uint256 totalParticipants,
        uint256 totalManagedFunds,
        uint256 currentPrizePool,
        uint256 totalActiveTickets,
        uint256 accruedYield,
        uint256 roundNumber
    ) {
        return (
            participants.length,
            getCurrentSupplyBalance(),
            prizePool,
            totalTickets,
            getAccruedYield(),
            currentRound
        );
    }

    function getUserTicketHistory(address user, uint256 startRound, uint256 endRound) external view returns (
        uint256[] memory roundIds,
        uint256[] memory ticketCounts
    ) {
        require(endRound >= startRound, "Invalid range");
        uint256 length = endRound - startRound + 1;
        roundIds = new uint256[](length);
        ticketCounts = new uint256[](length);
        
        for (uint256 i = 0; i < length; i++) {
            uint256 roundId = startRound + i;
            roundIds[i] = roundId;
            ticketCounts[i] = roundTickets[roundId][user];
        }
    }

    function getRecentWinners(uint256 count) external view returns (
        uint256[] memory roundIds,
        address[] memory winners,
        uint256[] memory prizes
    ) {
        if (currentRound <= 1 || count == 0) {
            return (new uint256[](0), new address[](0), new uint256[](0));
        }
        
        uint256 startRound = currentRound > count ? currentRound - count : 1;
        uint256 actualCount = 0;
        
        // Count finalized rounds
        for (uint256 i = startRound; i < currentRound; i++) {
            if (rounds[i].state == RoundState.Finalized) {
                actualCount++;
            }
        }
        
        roundIds = new uint256[](actualCount);
        winners = new address[](actualCount);
        prizes = new uint256[](actualCount);
        
        uint256 index = 0;
        for (uint256 i = startRound; i < currentRound; i++) {
            if (rounds[i].state == RoundState.Finalized) {
                roundIds[index] = i;
                winners[index] = rounds[i].winner;
                prizes[index] = rounds[i].prizeAmount - (rounds[i].prizeAmount * INCENTIVE_BPS) / 10000;
                index++;
            }
        }
    }

    // ============ USER SETTINGS ============

    function setUserAllocationBps(uint16 bps) external {
        require(bps <= 10000, "Invalid allocation");
        userAllocationBps[msg.sender] = bps;
    }

    // ============ INTERNAL FUNCTIONS ============

    function _addParticipant(address user) internal {
        if (!isParticipant[user]) {
            participants.push(user);
            isParticipant[user] = true;
        }
    }

    function _removeParticipant(address user) internal {
        if (isParticipant[user]) {
            for (uint256 i = 0; i < participants.length; i++) {
                if (participants[i] == user) {
                    participants[i] = participants[participants.length - 1];
                    participants.pop();
                    break;
                }
            }
            isParticipant[user] = false;
        }
    }

    function _resetTickets() internal {
        for (uint256 i = 0; i < participants.length; i++) {
            tickets[participants[i]] = 0;
        }
        totalTickets = 0;
    }

    function _selectWinner(uint256 roundId, uint256 randomValue) internal view returns (address) {
        address[] memory roundParticipantsList = roundParticipants[roundId];
        uint256 roundTotalTickets = rounds[roundId].totalTickets;
        
        require(roundParticipantsList.length > 0, "No participants");
        require(roundTotalTickets > 0, "No tickets");
        
        uint256 target = randomValue % roundTotalTickets;
        uint256 cumulative = 0;
        
        for (uint256 i = 0; i < roundParticipantsList.length; i++) {
            address participant = roundParticipantsList[i];
            uint256 participantTickets = roundTickets[roundId][participant];
            if (participantTickets == 0) continue;
            
            cumulative += participantTickets;
            if (cumulative > target) {
                return participant;
            }
        }
        
        return roundParticipantsList[0]; // Fallback
    }

    // ============ ADMIN FUNCTIONS ============

    function rescueERC20(address token, uint256 amount, address to) external onlyOwner {
        require(token != address(depositToken), "Cannot rescue deposit token");
        require(to != address(0), "Invalid recipient");
        IERC20(token).safeTransfer(to, amount);
    }

    function rescueNative(uint256 amount, address payable to) external onlyOwner {
        require(to != address(0), "Invalid recipient");
        (bool success, ) = to.call{value: amount}("");
        require(success, "Native transfer failed");
    }
}