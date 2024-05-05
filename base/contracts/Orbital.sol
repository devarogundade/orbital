// SPDX-License-Identifier: UNLICENSED
pragma solidity <=0.8.24;

import {IOrbital} from "./interfaces/IOrbital.sol";
import {IPriceFeeds} from "./interfaces/IPriceFeeds.sol";

import {AddressToBytes32} from "./libraries/AddressToBytes32.sol";

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";

import {IWormhole} from "wormhole-solidity-sdk/interfaces/IWormhole.sol";

contract Orbital is IOrbital, Ownable2Step {
    using AddressToBytes32 for bytes32;
    using AddressToBytes32 for address;

    /// @notice cross chain method identifier.
    bytes32 private ON_BORROW_METHOD =
        0x4f4e5f424f52524f575f4d4554484f4400000000000000000000000000000000;
    bytes32 private ON_REPAY_METHOD =
        0x4f4e5f52455041595f4d4554484f440000000000000000000000000000000000;
    bytes32 private ON_DEFAULT_METHOD =
        0x4f4e5f44454641554c545f4d4554484f44000000000000000000000000000000;

    /// @notice Keeps wormhole dispatches.
    uint32 private _wormholeNonce;

    /// @notice Keeps wormhole nonces execution state.
    mapping(uint32 => bool) private _executeds;

    /// @notice Loan to value ratio.
    uint8 private LTV = 80; // 80 percent

    /// @notice Keeps tracks of orbital contracts across chains.
    mapping(uint16 => bytes32) private _orbitals;

    /// @notice Keeps tracks of loans.
    mapping(bytes32 => Loan) private _loans;

    /// @notice Keeps tracks of foreign loans.
    mapping(bytes32 => ForeignLoan) private _foreignLoans;

    /// @dev interest rate is in basis points (0.01%)
    /// @notice Keeps tracks of tokens and their interest rate.
    mapping(bytes32 => uint256) private _interestRates;

    /// @notice
    address[] private _supportedTokens;

    /// @notice
    address[] private _supportedNfts;

    /// @notice PriceFeeds - using by pyth network.
    IPriceFeeds private _priceFeeds;

    /// @notice Wormhole deps
    IWormhole private immutable _wormhole;
    uint8 private constant CONSISTENCY_LEVEL = 200;

    constructor(address priceFeeds, address wormhole) Ownable2Step() {
        _wormholeNonce = 1;
        _priceFeeds = IPriceFeeds(priceFeeds);
        _wormhole = IWormhole(wormhole);
    }

    /// @notice
    function borrow(
        uint16 toChainId,
        bytes32 tokenIn,
        bytes32 tokenOut,
        TokenType tokenType,
        uint256 value,
        bytes32 receiver
    ) external payable returns (bytes32) {
        address sender = _msgSender();

        /// @notice Take loan with erc20 tokens.
        if (tokenType == TokenType.TOKEN) {
            return
                _borrowWithFungibleTokens(
                    sender,
                    toChainId,
                    tokenIn,
                    tokenOut,
                    value,
                    receiver
                );
        }
        /// @notice Take loan with erc721 tokens.
        else if (tokenType == TokenType.NFT) {
            return
                _borrowWithNonFungibleTokens(
                    sender,
                    toChainId,
                    tokenIn,
                    tokenOut,
                    value,
                    receiver
                );
        }
        /// @notice Otherwise throw errors.
        else {
            revert("Undefined method");
        }
    }

    function repay(bytes32 loanId) external payable returns (bool) {
        address sender = _msgSender();

        /// @notice Look up for foreign loan.
        ForeignLoan memory loan = _foreignLoans[loanId];

        /// @notice Check if foreign loan is active.
        require(loan.state == LoanState.ACTIVE, "Loan is not active");

        /// @notice Convert nft receiver address to evm address.
        address receiverAddress = loan.receiver.bytes32ToAddress();

        /// @notice Check the loan receiver is the sender.
        require(receiverAddress == sender, "Unauthorized loan");

        /// @notice Repay loan with erc20 tokens.
        if (loan.tokenType == TokenType.TOKEN) {
            return _repayWithFungibleTokens(loanId, sender);
        }
        /// @notice Otherwise throw errors.
        else {
            revert("Undefined method");
        }
    }

    ////////////////////////////////
    ////         REPAY          ////
    ////////////////////////////////

    /// @notice This pay back the loan and send events for foreign tokens unlock.
    function _repayWithFungibleTokens(
        bytes32 loanId,
        address sender
    ) internal returns (bool) {
        /// @notice Look up for foreign loan.
        ForeignLoan storage loan = _foreignLoans[loanId];

        /// @notice Calculate the interest accrued.
        uint256 interest = _estimateInterest(
            loan.value,
            loan.startSecs,
            loan.interestRate
        );

        uint256 amountIn = loan.value + interest;

        /// @notice Convert output token to solidity address.
        address tokenOutAddress = loan.tokenOut.bytes32ToAddress();

        IERC20 token = IERC20(tokenOutAddress);
        token.transferFrom(sender, address(this), amountIn);

        loan.state = LoanState.SETTLED;

        return true;
    }

    /// @dev Function will be trigger my orbital reyaler.
    function receiveMessage(
        uint32 wormholeNonce,
        bytes32 method,
        bytes memory payload
    ) external override onlyOwner {
        /// @notice Check if nonce was executed.
        require(!_executeds[wormholeNonce], "Nonce was already executed.");

        /// @notice Otherwise
        if (method == ON_BORROW_METHOD) {
            require(onBorrow(payload));
        }
        /// @notice Otherwise
        else if (method == ON_REPAY_METHOD) {
            require(onRepay(payload));
        }
        /// @notice Otherwise
        else if (method == ON_DEFAULT_METHOD) {
            // todo
        }
        /// @notice Otherwise
        else {
            revert("Undefined method");
        }

        /// @notice Update nonce as executed.
        _executeds[wormholeNonce] = true;
    }

    /// @notice Thus function receives borrow events from foreign orbitals.
    function onBorrow(bytes memory payload) internal returns (bool) {
        (
            bytes32 loanId,
            bytes32 receiver,
            uint16 fromChainId,
            bytes32 fromContractId,
            bytes32 tokenOut,
            TokenType tokenType,
            uint256 value // Can be amount for erc20 or tokenId for erc721.
        ) = abi.decode(
                payload,
                (bytes32, bytes32, uint16, bytes32, bytes32, TokenType, uint256)
            );

        /// @notice Check the foreign orbital is correct.
        require(
            _orbitals[fromChainId] == fromContractId,
            "Invalid foreign orbital"
        );

        /// @notice Check if foreign loan already exists.
        require(
            _foreignLoans[loanId].state == LoanState.NONE,
            "Loan already created"
        );

        /// @notice Send out loan tokens to receiver.
        if (tokenType == TokenType.TOKEN || tokenType == TokenType.NFT) {
            return _onBorrow(loanId, tokenOut, receiver, tokenType, value);
        }
        /// @notice Otherwise
        else {
            revert("Undefined method");
        }
    }

    /// @notice This function receives repay events from foreign orbitals.
    function onRepay(bytes memory payload) internal returns (bool) {
        bytes32 loanId = abi.decode(payload, (bytes32));

        /// @notice Lookup for loan.
        Loan memory loan = _loans[loanId];

        /// @notice Check if loan is still active.
        require(loan.state == LoanState.ACTIVE, "Loan is not active");

        if (loan.tokenType == TokenType.TOKEN) {
            return _onRepayWithFungibleTokens(loanId);
        }
        /// @notice
        else if (loan.tokenType == TokenType.NFT) {
            return _onRepayWithNonFungibleTokens(loanId);
        }
        /// @notice
        else {
            revert("Undefined method");
        }
    }

    /// @dev Private functions for borrow.

    ////////////////////////////////
    ////         BORROW         ////
    ////////////////////////////////

    /// @notice
    function _borrowWithFungibleTokens(
        address sender,
        uint16 toChainId,
        bytes32 tokenIn,
        bytes32 tokenOut,
        uint256 amountIn,
        bytes32 receiver
    ) internal returns (bytes32) {
        /// @notice Convert input token to solidity address.
        address tokenInAddress = tokenIn.bytes32ToAddress();

        /// @notice Check if the token is supported.
        require(_isTokenSupported(tokenInAddress), "Token not supported");

        /// @notice Extract tokens from sender.
        IERC20 token = IERC20(tokenInAddress);
        token.transferFrom(sender, address(this), amountIn);

        /// @notice Get input amount equivalent of output amount.
        uint256 amountOut = _priceFeeds.estimateFromTo(
            tokenIn,
            tokenOut,
            amountIn
        );

        /// @notice Calculate amount out with LTV, i.e 80% of the actual value.
        (uint256 loan, ) = _splitAmount(amountOut, LTV);

        /// @notice Get wormhole messgase fee.
        uint256 wormholeFee = _wormhole.messageFee();

        /// @notice Check if gas supplied is enough for wormhole operation.
        require(msg.value == wormholeFee, "Insufficient message fee");

        /// @notice Convert this orbital address to type bytes32.
        bytes32 fromContractId = AddressToBytes32.addressToBytes32(
            address(this)
        );

        /// @notice Get the destination orbital address in bytes32.
        bytes32 toContractId = _orbitals[toChainId];

        /// @notice Construct a unique loan identifier.
        bytes32 loanId = keccak256(
            abi.encode(sender, receiver, _wormholeNonce, block.timestamp)
        );

        /// @notice Build an inter-chain message.
        bytes memory payload = abi.encode(
            loanId,
            sender.addressToBytes32(),
            receiver,
            toChainId,
            fromContractId,
            toContractId,
            tokenOut,
            loan
        );

        /// @notice Publish message on wormhole guardian.
        _wormhole.publishMessage{value: wormholeFee}(
            _wormholeNonce,
            payload,
            CONSISTENCY_LEVEL
        );

        /// @notice Save loan object.
        _loans[loanId] = Loan({
            sender: sender.addressToBytes32(),
            tokenType: TokenType.TOKEN,
            tokenIn: tokenIn,
            value: amountIn,
            state: LoanState.ACTIVE,
            startSecs: block.timestamp
        });

        /// @notice Update nonce tracker.
        _wormholeNonce++;

        /// @notice Return the laon identifier for external systems.
        return loanId;
    }

    /// @notice
    function _borrowWithNonFungibleTokens(
        address sender,
        uint16 toChainId,
        bytes32 nftIn,
        bytes32 tokenOut,
        uint256 tokenId,
        bytes32 receiver
    ) internal returns (bytes32) {
        /// @notice Convert input token to solidity address.
        address tokenInAddress = nftIn.bytes32ToAddress();

        /// @notice Check if the token is supported.
        require(_isNftSupported(tokenInAddress), "Token not supported");

        /// @notice Extract nft from sender.
        IERC721 nft = IERC721(tokenInAddress);
        nft.transferFrom(sender, address(this), tokenId);

        /// @notice Get input amount equivalent of output amount.
        uint256 amountOut = _priceFeeds.estimateFromTo(
            nftIn,
            tokenOut,
            1 // calculating for 1 nft unit.
        );

        /// @notice Calculate amount out with LTV, i.e 80% of the actual value.
        (uint256 loan, ) = _splitAmount(amountOut, LTV);

        /// @notice Get wormhole messgase fee.
        uint256 wormholeFee = _wormhole.messageFee();

        /// @notice Check if gas supplied is enough for wormhole operation.
        require(msg.value == wormholeFee, "Insufficient message fee");

        /// @notice Convert this orbital address to type bytes32.
        bytes32 fromContractId = AddressToBytes32.addressToBytes32(
            address(this)
        );

        /// @notice Get the destination orbital address in bytes32.
        bytes32 toContractId = _orbitals[toChainId];

        /// @notice Construct a unique loan identifier.
        bytes32 loanId = keccak256(
            abi.encode(sender, receiver, _wormholeNonce, block.timestamp)
        );

        /// Build inter-chain message.
        bytes memory payload = abi.encode(
            loanId,
            sender.addressToBytes32(),
            receiver,
            toChainId,
            fromContractId,
            toContractId,
            tokenOut,
            loan
        );

        /// @notice Publish message on wormhole infra.
        _wormhole.publishMessage{value: wormholeFee}(
            _wormholeNonce,
            payload,
            CONSISTENCY_LEVEL
        );

        /// @notice Save loan object.
        _loans[loanId] = Loan({
            sender: sender.addressToBytes32(),
            tokenType: TokenType.NFT,
            tokenIn: nftIn,
            value: tokenId,
            state: LoanState.ACTIVE,
            startSecs: block.timestamp
        });

        /// @notice Update nonce tracker.
        _wormholeNonce++;

        /// @notice Return the laon identifier for external systems.
        return loanId;
    }

    ////////////////////////////////
    ////         REPAY          ////
    ////////////////////////////////

    /// @dev Private functions for repay.

    function _onRepayWithFungibleTokens(
        bytes32 loanId
    ) internal returns (bool) {
        /// @notice Lookup for loan.
        Loan storage loan = _loans[loanId];

        /// @notice Convert input token to solidity address.
        address tokenInAddress = loan.tokenIn.bytes32ToAddress();

        /// @notice Convert token receiver address to evm address.
        address receiver = loan.sender.bytes32ToAddress();

        /// @notice Transfer back locked tokens to sender.
        IERC20 token = IERC20(tokenInAddress);
        token.transfer(receiver, loan.value);

        /// @notice Update loan status.
        loan.state = LoanState.SETTLED;

        return true;
    }

    function _onRepayWithNonFungibleTokens(
        bytes32 loanId
    ) internal returns (bool) {
        /// @notice Lookup for loan.
        Loan storage loan = _loans[loanId];

        /// @notice Convert input token to solidity address.
        address tokenInAddress = loan.tokenIn.bytes32ToAddress();

        /// @notice Convert nft receiver address to evm address.
        address receiver = loan.sender.bytes32ToAddress();

        /// @notice Transfer back locked nft to sender.
        IERC721 nft = IERC721(tokenInAddress);
        nft.transferFrom(receiver, address(this), loan.value);

        /// @notice Update loan status.
        loan.state = LoanState.SETTLED;

        return true;
    }

    /// @notice
    function _onBorrow(
        bytes32 loanId,
        bytes32 tokenOut,
        bytes32 receiver,
        TokenType tokenType,
        uint256 amount
    ) internal returns (bool) {
        /// @notice Convert output token to solidity address.
        address tokenOutAddress = tokenOut.bytes32ToAddress();

        /// @notice Convert token receiver address to evm address.
        address receiverAddress = receiver.bytes32ToAddress();

        /// @notice Transfer tokens to receiver.
        IERC20 token = IERC20(tokenOutAddress);
        token.transfer(receiverAddress, amount);

        /// @notice Look up for token interest rate.
        uint256 interestRate = _interestRates[tokenOut];

        /// @notice Create the foreign loan.
        _foreignLoans[loanId] = ForeignLoan({
            receiver: receiver,
            tokenType: tokenType,
            tokenOut: tokenOut,
            value: amount,
            state: LoanState.ACTIVE,
            startSecs: block.timestamp,
            interestRate: interestRate
        });

        return true;
    }

    ////////////////////////////////
    ////   PRIVATE FUNCTIONS    ////
    ////////////////////////////////

    /// @notice Check if NFT is supported.
    function _isNftSupported(address tokenId) public view returns (bool) {
        for (uint256 i = 0; i < _supportedNfts.length; i++) {
            if (_supportedNfts[i] == tokenId) {
                return true;
            }
        }
        return false;
    }

    /// @notice Check if Token is supported.
    function _isTokenSupported(address tokenId) public view returns (bool) {
        for (uint256 i = 0; i < _supportedTokens.length; i++) {
            if (_supportedTokens[i] == tokenId) {
                return true;
            }
        }
        return false;
    }

    /// @notice Splits a value based on a given percentage.
    function _splitAmount(
        uint256 value,
        uint8 percentage
    ) private pure returns (uint256, uint256) {
        require(percentage <= 100, "Percentage must be between 0 and 100");

        uint256 portion = (value * percentage) / 100;
        uint256 remainder = value - portion;

        return (portion, remainder);
    }

    /// @notice
    function _estimateInterest(
        uint256 value,
        uint256 startSecs,
        uint256 interestRate
    ) internal view returns (uint256) {
        /// @notice startSecs is in seconds
        uint256 duration = block.timestamp - startSecs;

        /// @notice interestRate is in basis points (0.01%)
        uint256 interest = (value * interestRate * duration) /
            (100 * 365 days * 24 * 60 * 60);
        return interest;
    }
}
