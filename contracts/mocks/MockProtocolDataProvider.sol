// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MockProtocolDataProvider {
    // asset => user => hToken balance
    mapping(address => mapping(address => uint256)) public userBalance;
    // asset => reserve liquidity rate
    mapping(address => uint256) public reserveLiquidityRate;

    function setUserReserveBalance(address asset, address user, uint256 balance) external {
        userBalance[asset][user] = balance;
    }

    function setReserveLiquidityRate(address asset, uint256 rate) external {
        reserveLiquidityRate[asset] = rate;
    }

    // getUserReserveData returns 9 values; we only use the first, but must match signature
    function getUserReserveData(address asset, address user)
        external
        view
        returns (
            uint256 currentHTokenBalance,
            uint256 currentStableDebt,
            uint256 currentVariableDebt,
            uint256 principalStableDebt,
            uint256 scaledVariableDebt,
            uint256 stableBorrowRate,
            uint256 liquidityRate,
            uint40 stableRateLastUpdated,
            bool usageAsCollateralEnabled
        )
    {
        currentHTokenBalance = userBalance[asset][user];
        currentStableDebt = 0;
        currentVariableDebt = 0;
        principalStableDebt = 0;
        scaledVariableDebt = 0;
        stableBorrowRate = 0;
        liquidityRate = reserveLiquidityRate[asset];
        stableRateLastUpdated = 0;
        usageAsCollateralEnabled = false;
    }

    // getReserveData returns 10 values; we only use liquidityRate
    function getReserveData(address asset)
        external
        view
        returns (
            uint256 availableLiquidity,
            uint256 totalStableDebt,
            uint256 totalVariableDebt,
            uint256 liquidityRate,
            uint256 variableBorrowRate,
            uint256 stableBorrowRate,
            uint256 averageStableBorrowRate,
            uint256 liquidityIndex,
            uint256 variableBorrowIndex,
            uint40 lastUpdateTimestamp
        )
    {
        availableLiquidity = 0;
        totalStableDebt = 0;
        totalVariableDebt = 0;
        liquidityRate = reserveLiquidityRate[asset];
        variableBorrowRate = 0;
        stableBorrowRate = 0;
        averageStableBorrowRate = 0;
        liquidityIndex = 0;
        variableBorrowIndex = 0;
        lastUpdateTimestamp = 0;
    }
}



