// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IPool.sol";
import "./interfaces/IProtocolDataProvider.sol";

/**
 * @title NoLossLottery
 * @notice A no-loss lottery protocol built on top of HyperLend
 * @dev Users deposit tokens which are supplied to HyperLend to earn yield. 
 *      The yield is pooled and distributed to winners through daily lotteries.
 */
contract NoLossLottery is ReentrancyGuard, Pausable, Ownable {
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

    // User tracking
    struct UserInfo {
        uint256 depositAmount;
        uint256 depositTime;
        uint256 tickets;
        uint256 lastTicketUpdate;
    }

    mapping(address => UserInfo) public users;
    address[] public participants;
    mapping(address => bool) public isParticipant;

    // Events
    event Deposited(address indexed user, uint256 amount, uint256 timestamp);
    event Withdrawn(address indexed user, uint256 amount, uint256 timestamp);
    event YieldHarvested(uint256 yieldAmount, uint256 timestamp);
    event LotteryExecuted(address indexed winner, uint256 prize, uint256 round);
    event TicketsUpdated(address indexed user, uint256 newTickets);

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
     * @return UserInfo struct containing user's deposit info and tickets
     */
    function getUserInfo(address user) external view returns (UserInfo memory) {
        return users[user];
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
        return block.timestamp >= nextLotteryTime && participants.length > 0 && prizePool > 0;
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

    /**
     * @notice Deposit native HYPE into the lottery pool
     * @dev Native HYPE is automatically wrapped to wHYPE and supplied to HyperLend
     */
    function deposit() external payable nonReentrant whenNotPaused {
        require(msg.value > 0, "Must send HYPE to deposit");
        
        uint256 amount = msg.value;
        
        // For demo: we'll treat msg.value as wHYPE equivalent
        // In production, this would wrap HYPE to wHYPE first
        
        // Approve HyperLend pool to spend tokens (in production, after wrapping)
        // depositToken.safeIncreaseAllowance(address(hyperLendPool), amount);
        
        // Supply tokens to HyperLend (in production, would supply wHYPE)
        // hyperLendPool.supply(address(depositToken), amount, address(this), 0);
        
        // Update user info
        UserInfo storage user = users[msg.sender];
        user.depositAmount += amount;
        user.depositTime = block.timestamp;
        
        // Add to participants if first deposit
        _addParticipant(msg.sender);
        
        // Update total deposits
        totalDeposits += amount;
        
        emit Deposited(msg.sender, amount, block.timestamp);
    }

    /**
     * @notice Deposit wHYPE tokens into the lottery pool (alternative method)
     * @param amount Amount of wHYPE tokens to deposit
     * @dev For users who already have wHYPE tokens
     */
    function depositWHYPE(uint256 amount) external nonReentrant whenNotPaused {
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
        user.depositTime = block.timestamp;
        
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
    function withdraw(uint256 amount) external nonReentrant whenNotPaused {
        require(amount > 0, "Amount must be greater than 0");
        
        UserInfo storage user = users[msg.sender];
        require(user.depositAmount >= amount, "Insufficient deposit balance");
        require(address(this).balance >= amount, "Insufficient contract balance for withdrawal");
        
        // Update user info before external calls
        user.depositAmount -= amount;
        totalDeposits -= amount;
        
        // Remove from participants if no deposit left
        if (user.depositAmount == 0) {
            _removeParticipant(msg.sender);
        }
        
        // In production: Withdraw from HyperLend first
        // hyperLendPool.withdraw(address(depositToken), amount, address(this));
        // Then unwrap wHYPE to HYPE
        
        // For demo: Send native HYPE directly
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "HYPE transfer failed");
        
        emit Withdrawn(msg.sender, amount, block.timestamp);
    }

    function harvestYield() external nonReentrant whenNotPaused {
        revert("Not implemented yet - Session 3");
    }

    function executeLottery() external nonReentrant whenNotPaused {
        revert("Not implemented yet - Session 4");
    }

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

    // Emergency functions
    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}