// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IPool.sol";
import "./interfaces/IProtocolDataProvider.sol";

contract NoLossLotteryV2Micro is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IPool public immutable hyperLendPool;
    IProtocolDataProvider public immutable dataProvider;
    IERC20 public immutable depositToken;

    uint256 public constant TICKET_UNIT = 1e17; // 0.1 wHYPE per ticket
    uint256 public constant LOTTERY_INTERVAL = 24 hours;
    uint256 public constant HARVEST_INTERVAL = 24 hours;
    uint256 public constant DRAW_BLOCKS_DELAY = 5;
    uint256 public constant INCENTIVE_BPS = 100; // 1%

    uint256 public totalDeposits;
    uint256 public prizePool;
    uint256 public lastHarvestTime;
    uint256 public currentRound;

    enum RoundState { Active, Closed, Finalized }
    
    struct Round {
        uint256 endTime;
        uint256 drawBlock;
        uint256 totalTickets;
        uint256 prizeAmount;
        address winner;
        RoundState state;
    }

    mapping(uint256 => Round) public rounds;
    mapping(uint256 => mapping(address => uint256)) public roundTickets;
    mapping(uint256 => address[]) public roundParticipants;

    mapping(address => uint256) public deposits;
    mapping(address => uint256) public tickets;
    uint256 public totalTickets;
    address[] public participants;
    mapping(address => bool) public isParticipant;

    event Deposited(address indexed user, uint256 amount, uint256 newTickets);
    event Withdrawn(address indexed user, uint256 amount, uint256 burnedTickets);
    event YieldHarvested(uint256 yieldAmount, uint256 prizePoolIncrease, address indexed caller, uint256 incentive);
    event RoundClosed(uint256 indexed round, uint256 drawBlock, uint256 totalTickets, uint256 prizeAmount);
    event RoundFinalized(uint256 indexed round, address indexed winner, uint256 prize);

    error InvalidAddress();
    error AmountMustBePositive();
    error InvalidTicketAmount();
    error InsufficientBalance();
    error InsufficientDeposit();
    error HarvestTooSoon();
    error NoParticipants();
    error RoundNotActive();
    error RoundNotEnded();
    error NoTickets();
    error NoPrize();
    error RoundNotClosed();
    error DrawBlockNotReached();
    error BlockhashNotAvailable();
    error NoWinnerSelected();
    error InsufficientWithdrawal();

    constructor(
        address _hyperLendPool,
        address _dataProvider,
        address _depositToken
    ) Ownable(msg.sender) {
        if (_hyperLendPool == address(0)) revert InvalidAddress();
        if (_dataProvider == address(0)) revert InvalidAddress();
        if (_depositToken == address(0)) revert InvalidAddress();

        hyperLendPool = IPool(_hyperLendPool);
        dataProvider = IProtocolDataProvider(_dataProvider);
        depositToken = IERC20(_depositToken);

        lastHarvestTime = block.timestamp;
        currentRound = 1;
        
        rounds[1] = Round({
            endTime: block.timestamp + LOTTERY_INTERVAL,
            drawBlock: 0,
            totalTickets: 0,
            prizeAmount: 0,
            winner: address(0),
            state: RoundState.Active
        });
    }

    function depositWHYPE(uint256 amount) external nonReentrant {
        if (amount == 0) revert AmountMustBePositive();
        if (amount % TICKET_UNIT != 0) revert InvalidTicketAmount();
        if (depositToken.balanceOf(msg.sender) < amount) revert InsufficientBalance();

        uint256 beforeDeposit = deposits[msg.sender];
        uint256 afterDeposit = beforeDeposit + amount;
        uint256 newTickets = (afterDeposit / TICKET_UNIT) - (beforeDeposit / TICKET_UNIT);

        depositToken.safeTransferFrom(msg.sender, address(this), amount);
        depositToken.safeIncreaseAllowance(address(hyperLendPool), amount);
        hyperLendPool.supply(address(depositToken), amount, address(this), 0);

        deposits[msg.sender] = afterDeposit;
        totalDeposits += amount;

        if (newTickets > 0) {
            tickets[msg.sender] += newTickets;
            totalTickets += newTickets;
        }

        if (!isParticipant[msg.sender]) {
            participants.push(msg.sender);
            isParticipant[msg.sender] = true;
        }

        emit Deposited(msg.sender, amount, newTickets);
    }

    function withdraw(uint256 amount) external nonReentrant {
        if (amount == 0) revert AmountMustBePositive();
        if (amount % TICKET_UNIT != 0) revert InvalidTicketAmount();
        if (deposits[msg.sender] < amount) revert InsufficientDeposit();

        uint256 beforeDeposit = deposits[msg.sender];
        uint256 afterDeposit = beforeDeposit - amount;
        uint256 burnedTickets = (beforeDeposit / TICKET_UNIT) - (afterDeposit / TICKET_UNIT);

        deposits[msg.sender] = afterDeposit;
        totalDeposits -= amount;

        if (burnedTickets > 0) {
            tickets[msg.sender] -= burnedTickets;
            totalTickets -= burnedTickets;
        }

        if (afterDeposit == 0) {
            isParticipant[msg.sender] = false;
            for (uint256 i = 0; i < participants.length; i++) {
                if (participants[i] == msg.sender) {
                    participants[i] = participants[participants.length - 1];
                    participants.pop();
                    break;
                }
            }
        }

        uint256 withdrawn = hyperLendPool.withdraw(address(depositToken), amount, address(this));
        if (withdrawn < amount) revert InsufficientWithdrawal();
        depositToken.safeTransfer(msg.sender, amount);

        emit Withdrawn(msg.sender, amount, burnedTickets);
    }

    function harvestYield() external nonReentrant {
        if (block.timestamp < lastHarvestTime + HARVEST_INTERVAL) revert HarvestTooSoon();
        if (participants.length == 0) revert NoParticipants();

        (uint256 currentBalance, , , , , , , , ) = dataProvider.getUserReserveData(address(depositToken), address(this));
        if (currentBalance <= totalDeposits) {
            lastHarvestTime = block.timestamp;
            return;
        }

        uint256 grossYield = currentBalance - totalDeposits;
        uint256 withdrawnYield = hyperLendPool.withdraw(address(depositToken), grossYield, address(this));
        
        uint256 incentive = (withdrawnYield * INCENTIVE_BPS) / 10000;
        uint256 netYield = withdrawnYield - incentive;

        prizePool += netYield;
        lastHarvestTime = block.timestamp;

        if (incentive > 0) {
            depositToken.safeTransfer(msg.sender, incentive);
        }

        emit YieldHarvested(withdrawnYield, netYield, msg.sender, incentive);
    }

    function closeRound() external nonReentrant {
        Round storage round = rounds[currentRound];
        if (round.state != RoundState.Active) revert RoundNotActive();
        if (block.timestamp < round.endTime) revert RoundNotEnded();
        if (totalTickets == 0) revert NoTickets();
        if (prizePool == 0) revert NoPrize();

        round.drawBlock = block.number + DRAW_BLOCKS_DELAY;
        round.totalTickets = totalTickets;
        round.prizeAmount = prizePool;
        round.state = RoundState.Closed;

        for (uint256 i = 0; i < participants.length; i++) {
            if (tickets[participants[i]] > 0) {
                roundParticipants[currentRound].push(participants[i]);
                roundTickets[currentRound][participants[i]] = tickets[participants[i]];
            }
        }

        emit RoundClosed(currentRound, round.drawBlock, round.totalTickets, round.prizeAmount);
    }

    function finalizeRound() external nonReentrant {
        Round storage round = rounds[currentRound];
        if (round.state != RoundState.Closed) revert RoundNotClosed();
        if (block.number < round.drawBlock) revert DrawBlockNotReached();
        if (blockhash(round.drawBlock) == bytes32(0)) revert BlockhashNotAvailable();

        uint256 randomValue = uint256(keccak256(abi.encode(
            blockhash(round.drawBlock),
            currentRound,
            round.totalTickets,
            address(this)
        )));

        address winner = _selectWinner(currentRound, randomValue);
        if (winner == address(0)) revert NoWinnerSelected();

        uint256 incentive = (round.prizeAmount * INCENTIVE_BPS) / 10000;
        uint256 winnerPrize = round.prizeAmount - incentive;

        round.winner = winner;
        round.state = RoundState.Finalized;

        prizePool = 0;
        for (uint256 i = 0; i < participants.length; i++) {
            tickets[participants[i]] = 0;
        }
        totalTickets = 0;
        
        currentRound++;
        rounds[currentRound] = Round({
            endTime: block.timestamp + LOTTERY_INTERVAL,
            drawBlock: 0,
            totalTickets: 0,
            prizeAmount: 0,
            winner: address(0),
            state: RoundState.Active
        });

        depositToken.safeTransfer(winner, winnerPrize);
        if (incentive > 0) {
            depositToken.safeTransfer(msg.sender, incentive);
        }

        emit RoundFinalized(currentRound - 1, winner, winnerPrize);
    }

    // Essential view functions only
    function getUserInfo(address user) external view returns (uint256 depositAmount, uint256 userTickets) {
        return (deposits[user], tickets[user]);
    }

    function getRoundInfo(uint256 roundId) external view returns (
        uint256 endTime,
        uint256 drawBlock,
        uint256 roundTotalTickets,
        uint256 prize,
        address winner,
        RoundState state
    ) {
        Round storage round = rounds[roundId];
        return (round.endTime, round.drawBlock, round.totalTickets, round.prizeAmount, round.winner, round.state);
    }

    function getCurrentRoundInfo() external view returns (uint256 roundId, uint256 timeLeft, bool canClose, bool canFinalize) {
        Round storage round = rounds[currentRound];
        uint256 timeRemaining = block.timestamp >= round.endTime ? 0 : round.endTime - block.timestamp;
        bool closeable = round.state == RoundState.Active && block.timestamp >= round.endTime && totalTickets > 0 && prizePool > 0;
        bool finalizable = round.state == RoundState.Closed && block.number >= round.drawBlock && blockhash(round.drawBlock) != bytes32(0);
        
        return (currentRound, timeRemaining, closeable, finalizable);
    }

    function _selectWinner(uint256 roundId, uint256 randomValue) internal view returns (address) {
        address[] memory roundParticipantsList = roundParticipants[roundId];
        uint256 roundTotalTickets = rounds[roundId].totalTickets;
        
        if (roundParticipantsList.length == 0) revert NoParticipants();
        if (roundTotalTickets == 0) revert NoTickets();
        
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
}