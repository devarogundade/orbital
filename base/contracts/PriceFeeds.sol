// SPDX-License-Identifier: UNLICENSED
pragma solidity <=0.8.24;

import {IPriceFeeds} from "./interfaces/IPriceFeeds.sol";

import {IntConversion} from "./libraries/IntConversion.sol";

import "@pythnetwork/pyth-sdk-solidity/IPyth.sol";
import "@pythnetwork/pyth-sdk-solidity/PythStructs.sol";

import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";

contract PriceFeeds is IPriceFeeds, Ownable2Step {
    using IntConversion for int64;
    using IntConversion for uint64;

    IPyth private _pyth;

    /// @notice
    mapping(bytes32 => bytes32) private _priceIds;

    constructor(address pyth) Ownable2Step() {
        _pyth = IPyth(pyth);
    }

    /// @dev
    function updateFeedId(
        bytes32 tokenId,
        bytes32 priceId
    ) external override onlyOwner {
        _priceIds[tokenId] = priceId;
    }

    /// @notice
    function getPrice(
        bytes32 tokenId
    ) external view override returns (uint256) {
        PythStructs.Price memory price = _pyth.getPrice(_priceIds[tokenId]);
        return price.price.int64ToUint64();
    }

    /// @notice
    function estimateFromTo(
        bytes32 tokenIn,
        bytes32 tokenOut,
        uint256 amountIn
    ) external view override returns (uint256) {
        PythStructs.Price memory priceIn = _pyth.getPrice(_priceIds[tokenIn]);
        PythStructs.Price memory priceOut = _pyth.getPrice(_priceIds[tokenOut]);

        return ((uint256(priceIn.price.int64ToUint64()) * amountIn) /
            priceOut.price.int64ToUint64());
    }
}
