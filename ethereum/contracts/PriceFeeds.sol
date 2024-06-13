// SPDX-License-Identifier: UNLICENSED
pragma solidity <=0.8.24;

import {AddressToBytes32} from "./libraries/AddressToBytes32.sol";

import {IPriceFeeds} from "./interfaces/IPriceFeeds.sol";
import {ISupraSValueFeed} from "./interfaces/ISupraSValueFeed.sol";

import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";

contract PriceFeeds is IPriceFeeds, Ownable2Step {
    using AddressToBytes32 for bytes32;
    using AddressToBytes32 for address;

    ISupraSValueFeed private _sValueFeed;

    /// @notice
    mapping(bytes32 => uint256) private _priceIds;

    constructor(address sValueFeed) Ownable2Step() {
        _sValueFeed = ISupraSValueFeed(sValueFeed);
    }

    /// @dev
    function updateFeedId(
        address tokenId,
        uint256 priceId
    ) external override onlyOwner {
        _priceIds[tokenId.addressToBytes32()] = priceId;
    }

    /// @notice Get token price.
    function getPrice(
        bytes32 tokenId
    ) external view override returns (uint256) {
        ISupraSValueFeed.priceFeed memory data = _sValueFeed.getSvalue(
            _priceIds[tokenId]
        );
        return data.price;
    }

    /// @notice Get token amount relative to another token amount.
    function estimateFromTo(
        bytes32 tokenIn,
        bytes32 tokenOut,
        uint256 amountIn
    ) external view override returns (uint256) {
        ISupraSValueFeed.priceFeed memory dataIn = _sValueFeed.getSvalue(
            _priceIds[tokenIn]
        );
        ISupraSValueFeed.priceFeed memory dataOut = _sValueFeed.getSvalue(
            _priceIds[tokenOut]
        );

        return ((dataIn.price * amountIn) / dataOut.price);
    }
}
