// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

library LotteryErrors {
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
    error InvalidAllocation();
    error InvalidRange();
    error CannotRescueDepositToken();
    error InvalidRecipient();
    error InsufficientWithdrawal();
    error NativeTransferFailed();
}