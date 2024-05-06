// SPDX-License-Identifier: UNLICENSED
pragma solidity <=0.8.24;

import {IVault} from "./interfaces/IVault.sol";

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";

contract Vault is IVault, Ownable2Step {
    mapping(address => mapping(address => Position)) private _positions;

    constructor() Ownable2Step() {}

    function deposit(address tokenId, uint256 amount) external override {
        address sender = _msgSender();

        IERC20 token = IERC20(tokenId);
        token.transferFrom(sender, address(this), amount);

        _positions[sender][tokenId] = Position({
            balance: amount,
            startSecs: block.timestamp
        });
    }

    function withdraw(address tokenId) external override {
        address sender = _msgSender();

        Position memory position = _positions[sender][tokenId];

        require(position.balance > 0, "Insufficient balance");

        IERC20 token = IERC20(tokenId);
        token.transfer(sender, position.balance);

        delete _positions[sender][tokenId];
    }

    function transfer(
        address tokenAddress,
        address receiver,
        uint256 amount
    ) external override onlyOwner {
        IERC20 token = IERC20(tokenAddress);
        token.transfer(receiver, amount);
    }

    function transferNft(
        address tokenAddress,
        address receiver,
        uint256 tokenId
    ) external override onlyOwner {
        IERC721 nft = IERC721(tokenAddress);
        nft.transferFrom(address(this), receiver, tokenId);
    }
}
