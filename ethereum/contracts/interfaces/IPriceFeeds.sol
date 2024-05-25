// SPDX-License-Identifier: UNLICENSED
pragma solidity <=0.8.24;

interface IPriceFeeds {
    function updateFeedId(address tokenId, uint256 priceId) external;

    function getPrice(bytes32 tokenId) external view returns (uint256);

    function estimateFromTo(
        bytes32 tokenIn,
        bytes32 tokenOut,
        uint256 amountIn
    ) external view returns (uint256);
}
