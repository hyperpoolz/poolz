// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IProtocolDataProvider.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

library LotteryViewsV2 {
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

    function getCurrentSupplyBalance(
        IProtocolDataProvider dataProvider,
        address token,
        address user
    ) external view returns (uint256) {
        (uint256 currentHTokenBalance, , , , , , , , ) = dataProvider
            .getUserReserveData(token, user);
        return currentHTokenBalance;
    }

    function getAccruedYield(
        IProtocolDataProvider dataProvider,
        address token,
        address user,
        uint256 totalDeposits
    ) external view returns (uint256) {
        (uint256 currentBalance, , , , , , , , ) = dataProvider.getUserReserveData(token, user);
        if (currentBalance > totalDeposits) {
            return currentBalance - totalDeposits;
        }
        return 0;
    }

    // Remove function that requires storage mapping access

    // Remove complex function that requires storage mapping access

    function getStats(
        IProtocolDataProvider dataProvider,
        address token,
        address contractAddr,
        uint256 totalDeposits,
        uint256 prizePool,
        uint256 totalTickets,
        uint256 currentRound,
        uint256 participantCount
    ) external view returns (
        uint256 totalParticipants,
        uint256 totalManagedFunds,
        uint256 currentPrizePool,
        uint256 totalActiveTickets,
        uint256 accruedYield,
        uint256 roundNumber
    ) {
        (uint256 managedFunds, , , , , , , , ) = dataProvider.getUserReserveData(token, contractAddr);
        uint256 yield = managedFunds > totalDeposits ? managedFunds - totalDeposits : 0;
        
        return (
            participantCount,
            managedFunds,
            prizePool,
            totalTickets,
            yield,
            currentRound
        );
    }
}