// SPDX-License-Identifier: UNLICENSED
pragma solidity <=0.8.24;

interface IVault {
    struct Position {
        uint256 balance;
        uint256 startSecs;
    }

    function deposit(address tokenId, uint256 amount) external;

    function withdraw(address tokenId) external;

    function transferTokens(
        address tokenAddress,
        address receiver,
        uint256 amount
    ) external;

    function transferNft(
        address tokenAddress,
        address receiver,
        uint256 tokenId
    ) external;
}
