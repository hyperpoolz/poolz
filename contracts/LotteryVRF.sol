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

/* ------------------------------- VRF glue ------------------------------- */

/// Minimal interface for your deployed DrandVRF (split) contract
interface IDrandVRF {
    /// @notice Request randomness; VRF will later callback rawFulfillRandomness on `consumer`
    /// @param deadline drand deadline used by VRF to compute min round
    /// @param salt     unique salt to disambiguate requests
    /// @param consumer address to callback (this contract)
    /// @return id      request id
    function requestRandomness(uint256 deadline, bytes32 salt, address consumer)
        external returns (uint256 id);
}

/// Callback surface expected by DrandVRF_Split
abstract contract VRFConsumerBase {
    function rawFulfillRandomness(uint256 requestId, bytes32 randomness) external virtual;
}

/* --------------------------- Lottery implementation --------------------------- */

contract NoLossLotteryV2Optimized is Ownable, ReentrancyGuard, VRFConsumerBase {
    using SafeERC20 for IERC20;

    /* ------------------------------ Constants ------------------------------ */

    IPool public immutable hyperLendPool;
    IProtocolDataProvider public immutable dataProvider;
    IERC20 public immutable depositToken;

    IDrandVRF public immutable drandVRF;  // VRF contract (split)
    address  public immutable vrfCaller;  // cached address(drandVRF) for callback auth

    uint256 public constant TICKET_UNIT = 1e17;
    uint256 public constant LOTTERY_INTERVAL = 10 minutes;
    uint256 public constant HARVEST_INTERVAL = 10 minutes;
    uint256 public constant DRAW_BLOCKS_DELAY = 5; // kept for compatibility, unused
    uint256 public constant INCENTIVE_BPS = 100;

    /* --------------------------------- State -------------------------------- */

    uint256 public totalDeposits;
    uint256 public prizePool;
    uint256 public lastHarvestTime;
    uint256 public currentRound;

    enum RoundState { Active, Closed, Finalized }

    struct Round {
        uint256 startTime;
        uint256 endTime;

        // VRF fields (replace old drawBlock based flow)
        uint256 requestId;         // VRF request id (0 until requested)
        bytes32 randomness;        // filled by VRF callback
        bool    randomnessReady;   // true after callback

        uint256 totalTickets;
        uint256 prizeAmount;
        address winner;
        RoundState state;
        uint256 participantCount;
        bool incentivePaid;
    }

    // requestId => roundId
    mapping(uint256 => uint256) public reqToRound;

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

    /* -------------------------------- Errors -------------------------------- */

    error InvalidVRFCaller();
    error RandomnessNotReady();

    /* -------------------------------- Events -------------------------------- */

    event Deposited(address indexed user, uint256 amount, uint256 newTickets);
    event Withdrawn(address indexed user, uint256 amount, uint256 burnedTickets);
    event YieldHarvested(uint256 yieldAmount, uint256 prizePoolIncrease, address indexed caller, uint256 incentive);

    // NOTE: kept signature for compatibility, but drawBlock is no longer used; we emit 0 there.
    event RoundClosed(uint256 indexed round, uint256 drawBlock, uint256 totalTickets, uint256 prizeAmount);

    // New, explicit VRF request event
    event RoundVRFRequested(uint256 indexed round, uint256 requestId);

    event RoundFinalized(uint256 indexed round, address indexed winner, uint256 prize);
    event IncentivePaid(address indexed caller, uint256 amount, string action);

    /* ------------------------------ Constructor ----------------------------- */

    constructor(
        address _hyperLendPool,
        address _dataProvider,
        address _depositToken,
        address _drandVRF
    ) Ownable(msg.sender) {
        if (_hyperLendPool == address(0)) revert LotteryErrors.InvalidAddress();
        if (_dataProvider == address(0)) revert LotteryErrors.InvalidAddress();
        if (_depositToken == address(0)) revert LotteryErrors.InvalidAddress();
        if (_drandVRF == address(0)) revert LotteryErrors.InvalidAddress();

        hyperLendPool = IPool(_hyperLendPool);
        dataProvider = IProtocolDataProvider(_dataProvider);
        depositToken = IERC20(_depositToken);

        drandVRF = IDrandVRF(_drandVRF);
        vrfCaller = _drandVRF;

        lastHarvestTime = block.timestamp;
        currentRound = 1;

        rounds[1] = Round({
            startTime: block.timestamp,
            endTime: block.timestamp + LOTTERY_INTERVAL,
            requestId: 0,
            randomness: bytes32(0),
            randomnessReady: false,
            totalTickets: 0,
            prizeAmount: 0,
            winner: address(0),
            state: RoundState.Active,
            participantCount: 0,
            incentivePaid: false
        });
    }

    /* ------------------------------ User actions ----------------------------- */

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

    /* ------------------------------- Yield ops ------------------------------- */

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

    /* ------------------------------- Round flow ------------------------------ */

    /// @notice Closes current round and requests VRF randomness (no blockhash)
    function closeRound() external nonReentrant {
        Round storage round = rounds[currentRound];
        if (round.state != RoundState.Active) revert LotteryErrors.RoundNotActive();
        if (block.timestamp < round.endTime) revert LotteryErrors.RoundNotEnded();
        if (totalTickets == 0) revert LotteryErrors.NoTickets();
        if (prizePool == 0) revert LotteryErrors.NoPrize();

        // Snapshot state
        round.totalTickets    = totalTickets;
        round.prizeAmount     = prizePool;
        round.participantCount = participants.length;
        round.state           = RoundState.Closed;

        // Freeze per-round distribution
        for (uint256 i = 0; i < participants.length; i++) {
            address p = participants[i];
            uint256 t = tickets[p];
            if (t > 0) {
                roundParticipants[currentRound].push(p);
                roundTickets[currentRound][p] = t;
                roundIsParticipant[currentRound][p] = true;
            }
        }

        // Request VRF randomness (deadline = endTime; unique salt)
        bytes32 salt = keccak256(abi.encode(address(this), currentRound, round.totalTickets, round.prizeAmount, block.chainid));
        uint256 reqId = drandVRF.requestRandomness(round.endTime, salt, address(this));
        round.requestId = reqId;
        reqToRound[reqId] = currentRound;

        // Emit legacy event (drawBlock set to 0 for compatibility) + explicit VRF event
        emit RoundClosed(currentRound, 0, round.totalTickets, round.prizeAmount);
        emit RoundVRFRequested(currentRound, reqId);
    }

    /// @notice VRF callback — only stores randomness (no payouts)
    function rawFulfillRandomness(uint256 requestId, bytes32 randomness) external override nonReentrant {
        if (msg.sender != vrfCaller) revert InvalidVRFCaller();

        uint256 roundId = reqToRound[requestId];
        if (roundId == 0) return; // unknown/expired request

        Round storage round = rounds[roundId];
        if (round.state != RoundState.Closed) return; // already finalized or invalid state

        round.randomness = randomness;
        round.randomnessReady = true;
        // Settlement happens in finalizeRound() to maintain your incentive payer model
    }

    /// @notice Finalize using VRF randomness; pays winner and the incentive caller
    function finalizeRound() external nonReentrant {
        Round storage round = rounds[currentRound];
        if (round.state != RoundState.Closed) revert LotteryErrors.RoundNotClosed();
        if (!round.randomnessReady) revert RandomnessNotReady();

        // Derive 256-bit value from VRF randomness (namespaced)
        uint256 randomValue = uint256(keccak256(abi.encode(
            round.randomness,
            currentRound,
            round.totalTickets,
            address(this)
        )));

        address winner = _selectWinner(currentRound, randomValue);
        if (winner == address(0)) revert LotteryErrors.NoWinnerSelected();

        uint256 incentive   = (round.prizeAmount * INCENTIVE_BPS) / 10000;
        uint256 winnerPrize = round.prizeAmount - incentive;

        round.winner = winner;
        round.state  = RoundState.Finalized;
        round.incentivePaid = true;

        prizePool = 0;

        // Start next round
        currentRound++;
        rounds[currentRound] = Round({
            startTime: block.timestamp,
            endTime: block.timestamp + LOTTERY_INTERVAL,
            requestId: 0,
            randomness: bytes32(0),
            randomnessReady: false,
            totalTickets: 0,
            prizeAmount: 0,
            winner: address(0),
            state: RoundState.Active,
            participantCount: 0,
            incentivePaid: false
        });

        // Payouts
        depositToken.safeTransfer(winner, winnerPrize);
        if (incentive > 0) {
            depositToken.safeTransfer(msg.sender, incentive);
        }

        emit RoundFinalized(currentRound - 1, winner, winnerPrize);
        emit IncentivePaid(msg.sender, incentive, "draw");
    }

    /* ------------------------------- View helpers ---------------------------- */

    function getUserInfo(address user) external view returns (uint256, uint256, uint256) {
        return (
            deposits[user],
            tickets[user],
            userAllocationBps[user] == 0 ? 10000 : userAllocationBps[user]
        );
    }

    /// NOTE: for compatibility, the 3rd returned value is now the **requestId** (previously drawBlock)
    function getRoundInfo(uint256 roundId) external view returns (
        uint256, uint256, uint256, uint256, uint256, address, RoundState, uint256
    ) {
        Round storage round = rounds[roundId];
        return (
            round.startTime, round.endTime, round.requestId, round.totalTickets,
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
        bool finalizable = round.state == RoundState.Closed && round.randomnessReady;
        return (currentRound, timeRemaining, closeable, finalizable);
    }

    function canHarvest() external view returns (bool) {
        return block.timestamp >= lastHarvestTime + HARVEST_INTERVAL &&
               participants.length > 0 &&
               _getAccruedYield() > 0;
    }

    function getUserTicketHistory(address user, uint256 startRound, uint256 endRound) external view returns (
        uint256[] memory roundIds,
        uint256[] memory ticketCounts
    ) {
        if (endRound < startRound) revert LotteryErrors.InvalidRange();
        uint256 length = endRound - startRound + 1;
        roundIds = new uint256[](length);
        ticketCounts = new uint256[](length);

        for (uint256 i = 0; i < length; i++) {
            uint256 r = startRound + i;
            roundIds[i] = r;
            ticketCounts[i] = roundTickets[r][user];
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
            if (rounds[i].state == RoundState.Finalized) actualCount++;
        }

        roundIds = new uint256[](actualCount);
        winners  = new address[](actualCount);
        prizes   = new uint256[](actualCount);

        uint256 index = 0;
        for (uint256 i = startRound; i < currentRound; i++) {
            if (rounds[i].state == RoundState.Finalized) {
                roundIds[index] = i;
                winners[index]   = rounds[i].winner;
                uint256 prizeAmt = rounds[i].prizeAmount;
                prizes[index]    = prizeAmt - (prizeAmt * INCENTIVE_BPS) / 10000;
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

    /* ------------------------------ User settings ---------------------------- */

    function setUserAllocationBps(uint16 bps) external {
        if (bps > 10000) revert LotteryErrors.InvalidAllocation();
        userAllocationBps[msg.sender] = bps;
    }

    /* ------------------------------- Admin utils ----------------------------- */

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

    /* ------------------------------ Internal utils --------------------------- */

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

    function _getCurrentSupplyBalance() internal view returns (uint256) {
        return LotteryViewsV2.getCurrentSupplyBalance(dataProvider, address(depositToken), address(this));
    }

    function _getAccruedYield() internal view returns (uint256) {
        return LotteryViewsV2.getAccruedYield(dataProvider, address(depositToken), address(this), totalDeposits);
    }

    function _selectWinner(uint256 roundId, uint256 randomValue) internal view returns (address) {
        address[] memory list = roundParticipants[roundId];
        uint256 roundTotalTickets = rounds[roundId].totalTickets;

        if (list.length == 0) revert LotteryErrors.NoParticipants();
        if (roundTotalTickets == 0) revert LotteryErrors.NoTickets();

        uint256 target = randomValue % roundTotalTickets;
        uint256 cumulative = 0;

        for (uint256 i = 0; i < list.length; i++) {
            address p = list[i];
            uint256 t = roundTickets[roundId][p];
            if (t == 0) continue;

            cumulative += t;
            if (cumulative > target) {
                return p;
            }
        }
        return list[0];
    }
}