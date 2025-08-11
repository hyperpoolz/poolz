// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract MockPool {
    // token => user => balance supplied (we only need for address(this) of the lottery)
    mapping(address => mapping(address => uint256)) public supplied;

    function supply(
        address asset,
        uint256 amount,
        address onBehalfOf,
        uint16 /*referralCode*/
    ) external {
        require(amount > 0, "amount=0");
        // pull tokens from msg.sender (the lottery)
        require(IERC20(asset).transferFrom(msg.sender, address(this), amount));
        supplied[asset][onBehalfOf] += amount;
    }

    function withdraw(
        address asset,
        uint256 amount,
        address to
    ) external returns (uint256) {
        uint256 bal = IERC20(asset).balanceOf(address(this));
        uint256 toWithdraw = amount;
        if (toWithdraw > bal) {
            toWithdraw = bal;
        }
        require(toWithdraw > 0, "no-liquidity");
        // decrease accounting for the caller's onBehalf - model minimal behavior
        if (supplied[asset][msg.sender] >= toWithdraw) {
            supplied[asset][msg.sender] -= toWithdraw;
        } else {
            supplied[asset][msg.sender] = 0;
        }
        require(IERC20(asset).transfer(to, toWithdraw));
        return toWithdraw;
    }
}


