// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IPool.sol";
import "./interfaces/IProtocolDataProvider.sol";
import "./libraries/LotteryErrors.sol";
import "./libraries/LotteryViewsV2.sol";

contract NoLossLotteryV2Optimized is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IPool public immutable hyperLendPool;
    IProtocolDataProvider public immutable dataProvider;
    IERC20 public immutable depositToken;

    uint256 public constant TICKET_UNIT = 1e17;
    uint256 public constant LOTTERY_INTERVAL = 24 hours;
    uint256 public constant HARVEST_INTERVAL = 24 hours;
    uint256 public constant DRAW_BLOCKS_DELAY = 5;
    uint256 public constant INCENTIVE_BPS = 100;

    uint256 public totalDeposits;
    uint256 public prizePool;
    uint256 public lastHarvestTime;
    uint256 public currentRound;

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
    mapping(uint256 => mapping(address => uint256)) public roundTickets;
    mapping(uint256 => address[]) public roundParticipants;
    mapping(uint256 => mapping(address => bool)) public roundIsParticipant;

    mapping(address => uint256) public deposits;
    mapping(address => uint256) public tickets;
    uint256 public totalTickets;
    address[] public participants;
    mapping(address => bool) public isParticipant;

    mapping(address => uint16) public userAllocationBps;

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
        if (_hyperLendPool == address(0)) revert LotteryErrors.InvalidAddress();
        if (_dataProvider == address(0)) revert LotteryErrors.InvalidAddress();
        if (_depositToken == address(0)) revert LotteryErrors.InvalidAddress();

        hyperLendPool = IPool(_hyperLendPool);
        dataProvider = IProtocolDataProvider(_dataProvider);
        depositToken = IERC20(_depositToken);

        lastHarvestTime = block.timestamp;
        currentRound = 1;
        
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

    function depositWHYPE(uint256 amount) external nonReentrant {
        if (amount == 0) revert LotteryErrors.AmountMustBePositive();
        if (amount % TICKET_UNIT != 0) revert LotteryErrors.InvalidTicketAmount();
        if (depositToken.balanceOf(msg.sender) < amount) revert LotteryErrors.InsufficientBalance();

        uint256 beforeDeposit = deposits[msg.sender];
        uint256 afterDeposit = beforeDeposit + amount;
        
        uint256 beforeTickets = beforeDeposit / TICKET_UNIT;
        uint256 afterTickets = afterDeposit / TICKET_UNIT;
        uint256 newTickets = afterTickets - beforeTickets;

        depositToken.safeTransferFrom(msg.sender, address(this), amount);
        depositToken.safeIncreaseAllowance(address(hyperLendPool), amount);
        hyperLendPool.supply(address(depositToken), amount, address(this), 0);

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
        if (amount == 0) revert LotteryErrors.AmountMustBePositive();
        if (amount % TICKET_UNIT != 0) revert LotteryErrors.InvalidTicketAmount();
        if (deposits[msg.sender] < amount) revert LotteryErrors.InsufficientDeposit();

        uint256 beforeDeposit = deposits[msg.sender];
        uint256 afterDeposit = beforeDeposit - amount;
        
        uint256 beforeTickets = beforeDeposit / TICKET_UNIT;
        uint256 afterTickets = afterDeposit / TICKET_UNIT;
        uint256 burnedTickets = beforeTickets - afterTickets;

        deposits[msg.sender] = afterDeposit;
        totalDeposits -= amount;

        if (burnedTickets > 0) {
            tickets[msg.sender] -= burnedTickets;
            totalTickets -= burnedTickets;
        }

        if (afterDeposit == 0) {
            _removeParticipant(msg.sender);
        }

        uint256 withdrawn = hyperLendPool.withdraw(address(depositToken), amount, address(this));
        if (withdrawn < amount) revert LotteryErrors.InsufficientWithdrawal();
        depositToken.safeTransfer(msg.sender, amount);

        emit Withdrawn(msg.sender, amount, burnedTickets);
    }

    function harvestYield() external nonReentrant {
        if (block.timestamp < lastHarvestTime + HARVEST_INTERVAL) revert LotteryErrors.HarvestTooSoon();
        if (participants.length == 0) revert LotteryErrors.NoParticipants();

        uint256 currentBalance = _getCurrentSupplyBalance();
        if (currentBalance <= totalDeposits) {
            lastHarvestTime = block.timestamp;
            return;
        }

        uint256 grossYield = currentBalance - totalDeposits;
        
        uint256 withdrawnYield = hyperLendPool.withdraw(address(depositToken), grossYield, address(this));
        if (withdrawnYield < grossYield) revert LotteryErrors.InsufficientWithdrawal();

        uint256 incentive = (withdrawnYield * INCENTIVE_BPS) / 10000;
        uint256 netYield = withdrawnYield - incentive;

        prizePool += netYield;
        lastHarvestTime = block.timestamp;

        if (incentive > 0) {
            depositToken.safeTransfer(msg.sender, incentive);
        }

        emit YieldHarvested(withdrawnYield, netYield, msg.sender, incentive);
        emit IncentivePaid(msg.sender, incentive, "harvest");
    }

    function closeRound() external nonReentrant {
        Round storage round = rounds[currentRound];
        if (round.state != RoundState.Active) revert LotteryErrors.RoundNotActive();
        if (block.timestamp < round.endTime) revert LotteryErrors.RoundNotEnded();
        if (totalTickets == 0) revert LotteryErrors.NoTickets();
        if (prizePool == 0) revert LotteryErrors.NoPrize();

        round.drawBlock = block.number + DRAW_BLOCKS_DELAY;
        round.totalTickets = totalTickets;
        round.prizeAmount = prizePool;
        round.participantCount = participants.length;
        round.state = RoundState.Closed;

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
        if (round.state != RoundState.Closed) revert LotteryErrors.RoundNotClosed();
        if (block.number < round.drawBlock) revert LotteryErrors.DrawBlockNotReached();
        if (blockhash(round.drawBlock) == bytes32(0)) revert LotteryErrors.BlockhashNotAvailable();

        uint256 randomValue = uint256(keccak256(abi.encode(
            blockhash(round.drawBlock),
            currentRound,
            round.totalTickets,
            address(this)
        )));

        address winner = _selectWinner(currentRound, randomValue);
        if (winner == address(0)) revert LotteryErrors.NoWinnerSelected();

        uint256 incentive = (round.prizeAmount * INCENTIVE_BPS) / 10000;
        uint256 winnerPrize = round.prizeAmount - incentive;

        round.winner = winner;
        round.state = RoundState.Finalized;
        round.incentivePaid = true;

        prizePool = 0;
        _resetTickets();
        
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

        depositToken.safeTransfer(winner, winnerPrize);
        if (incentive > 0) {
            depositToken.safeTransfer(msg.sender, incentive);
        }

        emit RoundFinalized(currentRound - 1, winner, winnerPrize);
        emit IncentivePaid(msg.sender, incentive, "draw");
    }

    // Simplified view functions
    function getUserInfo(address user) external view returns (uint256, uint256, uint256) {
        return (
            deposits[user],
            tickets[user],
            userAllocationBps[user] == 0 ? 10000 : userAllocationBps[user]
        );
    }

    function getRoundInfo(uint256 roundId) external view returns (
        uint256, uint256, uint256, uint256, uint256, address, RoundState, uint256
    ) {
        Round storage round = rounds[roundId];
        return (
            round.startTime, round.endTime, round.drawBlock, round.totalTickets,
            round.prizeAmount, round.winner, round.state, round.participantCount
        );
    }

    function getCurrentRoundInfo() external view returns (uint256, uint256, bool, bool) {
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

    function canHarvest() external view returns (bool) {
        return block.timestamp >= lastHarvestTime + HARVEST_INTERVAL && 
               participants.length > 0 && 
               _getAccruedYield() > 0;
    }

    // Library-based view functions
    function getUserTicketHistory(address user, uint256 startRound, uint256 endRound) external view returns (
        uint256[] memory roundIds,
        uint256[] memory ticketCounts
    ) {
        if (endRound < startRound) revert LotteryErrors.InvalidRange();
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

    function getStats() external view returns (uint256, uint256, uint256, uint256, uint256, uint256) {
        return LotteryViewsV2.getStats(
            dataProvider, address(depositToken), address(this),
            totalDeposits, prizePool, totalTickets, currentRound, participants.length
        );
    }

    function setUserAllocationBps(uint16 bps) external {
        if (bps > 10000) revert LotteryErrors.InvalidAllocation();
        userAllocationBps[msg.sender] = bps;
    }

    // Internal functions
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

    function _getCurrentSupplyBalance() internal view returns (uint256) {
        return LotteryViewsV2.getCurrentSupplyBalance(dataProvider, address(depositToken), address(this));
    }

    function _getAccruedYield() internal view returns (uint256) {
        return LotteryViewsV2.getAccruedYield(dataProvider, address(depositToken), address(this), totalDeposits);
    }

    function _selectWinner(uint256 roundId, uint256 randomValue) internal view returns (address) {
        address[] memory roundParticipantsList = roundParticipants[roundId];
        uint256 roundTotalTickets = rounds[roundId].totalTickets;
        
        if (roundParticipantsList.length == 0) revert LotteryErrors.NoParticipants();
        if (roundTotalTickets == 0) revert LotteryErrors.NoTickets();
        
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
        
        return roundParticipantsList[0];
    }

    // Admin functions
    function rescueERC20(address token, uint256 amount, address to) external onlyOwner {
        if (token == address(depositToken)) revert LotteryErrors.CannotRescueDepositToken();
        if (to == address(0)) revert LotteryErrors.InvalidRecipient();
        IERC20(token).safeTransfer(to, amount);
    }

    function rescueNative(uint256 amount, address payable to) external onlyOwner {
        if (to == address(0)) revert LotteryErrors.InvalidRecipient();
        (bool success, ) = to.call{value: amount}("");
        if (!success) revert LotteryErrors.NativeTransferFailed();
    }
}