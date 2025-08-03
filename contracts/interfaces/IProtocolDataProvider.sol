// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IProtocolDataProvider
 * @notice Interface for HyperLend Protocol Data Provider
 */
interface IProtocolDataProvider {
    /**
     * @notice Returns the user reserve data
     * @param asset The address of the underlying asset of the reserve
     * @param user The address of the user
     * @return currentHTokenBalance The current hToken balance of the user
     * @return currentStableDebt The current stable debt of the user
     * @return currentVariableDebt The current variable debt of the user
     * @return principalStableDebt The principal stable debt of the user
     * @return scaledVariableDebt The scaled variable debt of the user
     * @return stableBorrowRate The stable borrow rate of the user
     * @return liquidityRate The liquidity rate of the reserve
     * @return stableRateLastUpdated The timestamp of the last stable rate update
     * @return usageAsCollateralEnabled Whether the user's deposit is used as collateral
     */
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
        );

    /**
     * @notice Returns the reserve data
     * @param asset The address of the underlying asset of the reserve
     * @return availableLiquidity The amount of available liquidity
     * @return totalStableDebt The total stable debt
     * @return totalVariableDebt The total variable debt
     * @return liquidityRate The liquidity rate
     * @return variableBorrowRate The variable borrow rate
     * @return stableBorrowRate The stable borrow rate
     * @return averageStableBorrowRate The average stable borrow rate
     * @return liquidityIndex The liquidity index
     * @return variableBorrowIndex The variable borrow index
     * @return lastUpdateTimestamp The timestamp of the last update
     */
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
        );
}