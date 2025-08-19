// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

library LotteryViews {
    struct Round {
        uint256 startTime;
        uint256 endTime;
        uint256 drawBlock;
        uint256 totalTickets;
        uint256 prizeAmount;
        address winner;
        uint8 state; // 0=Active, 1=Closed, 2=Finalized
        uint256 participantCount;
        bool incentivePaid;
    }
    
    function getRecentWinners(
        mapping(uint256 => Round) storage rounds,
        uint256 currentRound,
        uint256 count
    ) external view returns (
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
            if (rounds[i].state == 2) { // RoundState.Finalized
                actualCount++;
            }
        }
        
        roundIds = new uint256[](actualCount);
        winners = new address[](actualCount);
        prizes = new uint256[](actualCount);
        
        uint256 index = 0;
        for (uint256 i = startRound; i < currentRound; i++) {
            if (rounds[i].state == 2) { // RoundState.Finalized
                roundIds[index] = i;
                winners[index] = rounds[i].winner;
                // Calculate net prize (minus 1% incentive)
                prizes[index] = rounds[i].prizeAmount - (rounds[i].prizeAmount * 100) / 10000;
                index++;
            }
        }
    }
    
    function getUserTicketHistory(
        mapping(uint256 => mapping(address => uint256)) storage roundTickets,
        address user,
        uint256 startRound,
        uint256 endRound
    ) external view returns (
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
}