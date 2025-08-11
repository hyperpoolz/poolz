// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
// Removed ReentrancyGuard and Pausable to minimize bytecode
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IPool.sol";
import "./interfaces/IProtocolDataProvider.sol";

/**
 * @title NoLossLottery
 * @notice A no-loss lottery protocol built on top of HyperLend
 * @dev Users deposit tokens which are supplied to HyperLend to earn yield. 
 *      The yield is pooled and distributed to winners through daily lotteries.
 */
contract NoLossLottery is Ownable {
    using SafeERC20 for IERC20;

    // HyperLend contracts
    IPool public immutable hyperLendPool;
    IProtocolDataProvider public immutable dataProvider;
    IERC20 public immutable depositToken; // wHYPE token

    // State variables
    uint256 public totalDeposits;
    uint256 public prizePool;
    uint256 public lastHarvestTime;
    uint256 public nextLotteryTime;
    uint256 public constant LOTTERY_INTERVAL = 1 days;
    uint256 public currentRound;
    uint256 public totalTickets;
    uint256 public constant TICKET_UNIT = 1e16; // 0.01 wHYPE per ticket

    // Randomness/demo configuration
    // randomness seed removed to minimize bytecode

    // User-configurable allocation of yield to lottery (basis points, 0-10000)
    mapping(address => uint16) public userAllocationBps; // defaults to 10000 if unset

    // Protocol fee removed to minimize bytecode

    // User tracking
    struct UserInfo {
        uint256 depositAmount;
        uint256 tickets;
    }

    mapping(address => UserInfo) public users;
    address[] public participants;
    mapping(address => bool) public isParticipant;

    // Last winner fields removed to minimize bytecode

    // Events
    event Deposited(address indexed user, uint256 amount, uint256 timestamp);
    event Withdrawn(address indexed user, uint256 amount, uint256 timestamp);
    event YieldHarvested(uint256 yieldAmount, uint256 timestamp);
    event LotteryExecuted(address indexed winner, uint256 prize, uint256 round);
    // Protocol fee event removed to minimize bytecode

    /**
     * @notice Constructor
     * @param _hyperLendPool Address of HyperLend Pool contract
     * @param _dataProvider Address of HyperLend Protocol Data Provider
     * @param _depositToken Address of the deposit token (wHYPE)
     */
    constructor(
        address _hyperLendPool,
        address _dataProvider,
        address _depositToken
    ) Ownable(msg.sender) {
        require(_hyperLendPool != address(0), "Invalid pool address");
        require(_dataProvider != address(0), "Invalid data provider address");
        require(_depositToken != address(0), "Invalid token address");

        hyperLendPool = IPool(_hyperLendPool);
        dataProvider = IProtocolDataProvider(_dataProvider);
        depositToken = IERC20(_depositToken);

        lastHarvestTime = block.timestamp;
        nextLotteryTime = block.timestamp + LOTTERY_INTERVAL;
        currentRound = 1;
    }

    /**
     * @notice Get the current supply balance of this contract in HyperLend
     * @return The current hToken balance representing supplied amount + accrued interest
     */
    function getCurrentSupplyBalance() public view returns (uint256) {
        (uint256 currentHTokenBalance, , , , , , , , ) = dataProvider
            .getUserReserveData(address(depositToken), address(this));
        return currentHTokenBalance;
    }

    /**
     * @notice Get the accrued yield (interest earned) 
     * @return The yield amount = current supply balance - total user deposits
     */
    function getAccruedYield() public view returns (uint256) {
        uint256 currentBalance = getCurrentSupplyBalance();
        if (currentBalance > totalDeposits) {
            return currentBalance - totalDeposits;
        }
        return 0;
    }

    /**
     * @notice Get user information
     * @param user Address of the user
     * @return depositAmount User's deposit amount
     * @return tickets User's current tickets
     */
    function getUserInfo(address user) external view returns (uint256 depositAmount, uint256 tickets) {
        UserInfo storage u = users[user];
        return (u.depositAmount, u.tickets);
    }

    /**
     * @notice Get total number of participants
     * @return Number of active participants
     */
    function getParticipantCount() external view returns (uint256) {
        return participants.length;
    }

    /**
     * @notice Check if lottery is ready to be executed
     * @return true if lottery can be executed
     */
    function isLotteryReady() external view returns (bool) {
        return block.timestamp >= nextLotteryTime && participants.length > 0 && prizePool > 0 && totalTickets > 0;
    }

    /**
     * @notice Get time until next lottery
     * @return seconds until next lottery, 0 if ready
     */
    function getTimeToNextLottery() external view returns (uint256) {
        if (block.timestamp >= nextLotteryTime) {
            return 0;
        }
        return nextLotteryTime - block.timestamp;
    }

    // Native deposit not supported; use depositWHYPE(uint256)

    /**
     * @notice Deposit wHYPE tokens into the lottery pool (alternative method)
     * @param amount Amount of wHYPE tokens to deposit
     * @dev For users who already have wHYPE tokens
     */
    function depositWHYPE(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        require(depositToken.balanceOf(msg.sender) >= amount, "Insufficient wHYPE balance");
        
        // Transfer wHYPE tokens from user to this contract
        depositToken.safeTransferFrom(msg.sender, address(this), amount);
        
        // Approve HyperLend pool to spend tokens
        depositToken.safeIncreaseAllowance(address(hyperLendPool), amount);
        
        // Supply tokens to HyperLend
        hyperLendPool.supply(address(depositToken), amount, address(this), 0);
        
        // Update user info
        UserInfo storage user = users[msg.sender];
        user.depositAmount += amount;
        
        // Add to participants if first deposit
        _addParticipant(msg.sender);
        
        // Update total deposits
        totalDeposits += amount;
        
        emit Deposited(msg.sender, amount, block.timestamp);
    }

    /**
     * @notice Withdraw tokens from the lottery pool
     * @param amount Amount to withdraw (returned as native HYPE)
     * @dev Tokens are withdrawn from HyperLend, unwrapped, and sent as native HYPE
     */
    function withdraw(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        
        UserInfo storage user = users[msg.sender];
        require(user.depositAmount >= amount, "Insufficient deposit balance");
        
        // Update user info before external calls
        user.depositAmount -= amount;
        totalDeposits -= amount;
        
        // Remove from participants if no deposit left
        if (user.depositAmount == 0) {
            // If user holds tickets, burn them and update totalTickets
            if (user.tickets > 0) {
                totalTickets -= user.tickets;
                user.tickets = 0;
            }
            _removeParticipant(msg.sender);
        }
        
        // Withdraw underlying wHYPE from HyperLend to this contract
        uint256 withdrawn = hyperLendPool.withdraw(address(depositToken), amount, address(this));
        require(withdrawn >= amount, "Insufficient withdrawal amount");
        
        // Transfer wHYPE to user
        depositToken.safeTransfer(msg.sender, amount);
        
        emit Withdrawn(msg.sender, amount, block.timestamp);
    }

    function harvestYield() external {
        // Compute gross yield since last adjustment
        uint256 currentBalance = getCurrentSupplyBalance();
        if (currentBalance <= totalDeposits) {
            return; // nothing to harvest
        }
        uint256 grossYield = currentBalance - totalDeposits;

        // First pass: compute per-user yield share, split into lottery and retained parts
        uint256 totalLotteryPart = 0;
        uint256 totalRetainedPart = 0;

        // To avoid multiple loops for large arrays we will compute tickets and update users in the same pass
        for (uint256 i = 0; i < participants.length; i++) {
            address p = participants[i];
            UserInfo storage info = users[p];
            if (info.depositAmount == 0) {
                continue;
            }
            uint256 userYield = (info.depositAmount * grossYield) / totalDeposits;
            if (userYield == 0) {
                continue;
            }
            uint16 alloc = userAllocationBps[p];
            if (alloc == 0) {
                alloc = 10000; // default 100%
            }
            uint256 lotteryPart = (userYield * alloc) / 10000;
            uint256 retainedPart = userYield - lotteryPart;

            // Update tickets for the lottery contribution
            if (lotteryPart > 0) {
                uint256 minted = lotteryPart / TICKET_UNIT;
                if (minted == 0) minted = 1; // ensure at least one ticket if contributing
                info.tickets += minted;
                totalTickets += minted;
            }

            // Update retained as principal to preserve ownership
            if (retainedPart > 0) {
                info.depositAmount += retainedPart;
                totalRetainedPart += retainedPart;
            }

            totalLotteryPart += lotteryPart;
        }

        // Withdraw only the lottery portion from HyperLend
        if (totalLotteryPart > 0) {
            uint256 withdrawn = hyperLendPool.withdraw(address(depositToken), totalLotteryPart, address(this));
            require(withdrawn >= totalLotteryPart, "Yield withdraw failed");
            prizePool += withdrawn;
        }

        // Increase totalDeposits by retained portion (auto-compound)
        if (totalRetainedPart > 0) {
            totalDeposits += totalRetainedPart;
        }

        lastHarvestTime = block.timestamp;
        emit YieldHarvested(totalLotteryPart, block.timestamp);
    }

    function executeLottery() external {
        require(block.timestamp >= nextLotteryTime, "Lottery not ready by time");
        require(participants.length > 0, "No participants");
        require(prizePool > 0, "No prize to distribute");
        require(totalTickets > 0, "No tickets");
        
        // Generate randomness (demo fallback)
        uint256 randomValue = uint256(keccak256(abi.encode(blockhash(block.number - 1), address(this), currentRound, totalTickets)));
        
        // Select winner by weighted tickets
        address winner = _selectWinner(randomValue);
        uint256 prize = prizePool;
        
        // Effects: reset before external transfers
        prizePool = 0;
        
        // Transfer prize (wHYPE)
        depositToken.safeTransfer(winner, prize);
        
        emit LotteryExecuted(winner, prize, currentRound);
        
        // Reset tickets for next round
        _resetTickets();
        
        // Advance round and schedule next
        currentRound += 1;
        nextLotteryTime = block.timestamp + LOTTERY_INTERVAL;
    }

    // ============ View helpers ============
    // minimal views only

    // Internal helper functions
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

    // removed _distributeTickets in favor of inline logic in harvest

    function _resetTickets() internal {
        if (totalTickets == 0) return;
        for (uint256 i = 0; i < participants.length; i++) {
            address p = participants[i];
            if (users[p].tickets > 0) {
                users[p].tickets = 0;
            }
        }
        totalTickets = 0;
    }

    function _selectWinner(uint256 randomValue) internal view returns (address) {
        require(participants.length > 0, "No participants");
        require(totalTickets > 0, "No tickets");
        uint256 target = randomValue % totalTickets;
        uint256 cumulative = 0;
        for (uint256 i = 0; i < participants.length; i++) {
            address p = participants[i];
            uint256 t = users[p].tickets;
            if (t == 0) continue;
            cumulative += t;
            if (cumulative > target) {
                return p;
            }
        }
        // Fallback (should not reach here)
        return participants[0];
    }

    // removed randomness helper

    // Emergency functions removed to minimize bytecode

    function setUserAllocationBps(uint16 bps) external {
        require(bps <= 10000, "bps>10000");
        userAllocationBps[msg.sender] = bps;
    }

    // fee parameters removed

    // Removed manual funding

    // Admin rescue functions (require paused)
    function rescueERC20(address token, uint256 amount, address to) external onlyOwner {
        require(token != address(depositToken), "cannot rescue depositToken");
        require(to != address(0), "to=0");
        IERC20(token).safeTransfer(to, amount);
    }

    function rescueNative(uint256 amount, address payable to) external onlyOwner {
        require(to != address(0), "to=0");
        (bool ok, ) = to.call{value: amount}("");
        require(ok, "native transfer failed");
    }

    // ============ Analytics views ============
    // removed recent winners view

    function getLifetimeStats()
        external
        view
        returns (
            uint256 currentParticipants,
            uint256 totalManaged,
            uint256 totalTicketsCount
        )
    {
        currentParticipants = participants.length;
        totalManaged = getCurrentSupplyBalance();
        totalTicketsCount = totalTickets;
    }

    // removed internal balance view

    // removed rate view
}