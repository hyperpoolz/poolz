// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IWETHLike {
    function deposit() external payable;
    function withdraw(uint256 wad) external;
    function approve(address spender, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}



