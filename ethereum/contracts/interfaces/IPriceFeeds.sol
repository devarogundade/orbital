// SPDX-License-Identifier: UNLICENSED
pragma solidity <=0.8.24;

import "@pythnetwork/pyth-sdk-solidity/PythStructs.sol";

interface IPriceFeeds {
    function updateFeedId(bytes32 tokenId, bytes32 priceId) external;

    function getPrice(bytes32 tokenId) external view returns (uint256);

    function estimateFromTo(
        bytes32 tokenIn,
        bytes32 tokenOut,
        uint256 amountIn
    ) external view returns (uint256);
}
