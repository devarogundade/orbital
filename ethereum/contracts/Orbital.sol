// SPDX-License-Identifier: UNLICENSED
pragma solidity <=0.8.24;

import {IOrbital} from "./interfaces/IOrbital.sol";
import {IPriceFeeds} from "./interfaces/IPriceFeeds.sol";

import {AddressToBytes32} from "./libraries/AddressToBytes32.sol";

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";

import {IWormhole} from "wormhole-solidity-sdk/interfaces/IWormhole.sol";

contract Orbital is IOrbital, Ownable2Step {
    using AddressToBytes32 for bytes32;
    using AddressToBytes32 for address;

    uint256 private constant ONE_YEAR = 31_536_000;

    /// @notice cross chain method identifier.
    bytes32 private ON_BORROW_METHOD =
        0x4f4e5f424f52524f575f4d4554484f4400000000000000000000000000000000;
    bytes32 private ON_REPAY_METHOD =
        0x4f4e5f52455041595f4d4554484f440000000000000000000000000000000000;
    bytes32 private ON_AMPLIFY_METHOD =
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
    bytes32[] private _supportedTokens;

    /// @notice PriceFeeds - using by pyth network.
    IPriceFeeds private _priceFeeds;

    /// @notice Wormhole deps
    IWormhole private immutable _wormhole;
    uint8 private constant CONSISTENCY_LEVEL = 0;

    ////////////////////////////////
    ////      CONSTRUCTOR       ////
    ////////////////////////////////

    constructor(address priceFeeds, address wormhole) Ownable2Step() {
        _wormholeNonce = 1;
        _priceFeeds = IPriceFeeds(priceFeeds);
        _wormhole = IWormhole(wormhole);
    }

    function addForeignOrbital(
        uint16 chainId,
        bytes32 orbital
    ) external onlyOwner {
        _orbitals[chainId] = orbital;
    }

    function addSupportedToken(
        address token,
        uint256 interestRate
    ) external onlyOwner {
        _supportedTokens.push(token.addressToBytes32());
        _interestRates[token.addressToBytes32()] = interestRate;
    }

    /// @notice
    function borrow(
        uint16 toChainId,
        bytes32 tokenIn,
        bytes32 tokenOut,
        uint256 value,
        bytes32 receiver
    ) external payable returns (bytes32) {
        address sender = _msgSender();

        /// @notice Check if the tokens are supported.
        require(_isTokenSupported(tokenIn), "Token in not supported");

        require(_isTokenSupported(tokenOut), "Token out not supported");

        /// @notice Convert input token to solidity address.
        address tokenInAddress = tokenIn.bytes32ToAddress();

        /// @notice Transfer tokens to vault.
        IERC20 token = IERC20(tokenInAddress);
        token.transferFrom(sender, address(this), value);

        /// @notice Get input amount equivalent of output amount.
        uint256 amountOut = _priceFeeds.estimateFromTo(
            tokenIn,
            tokenOut,
            value
        );

        /// @notice Calculate amount out with LTV, i.e 80% of the actual value.
        (uint256 loan, ) = _splitAmount(amountOut, LTV);

        /// @notice Get wormhole messgase fee.
        uint256 wormholeFee = _wormhole.messageFee();

        /// @notice Check if gas supplied is enough for wormhole operation.
        require(msg.value >= wormholeFee, "Insufficient message fee");

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
            ON_BORROW_METHOD,
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
            tokenIn: tokenIn,
            value: value,
            state: LoanState.ACTIVE,
            startSecs: block.timestamp
        });

        /// @notice Update nonce tracker.
        _wormholeNonce++;

        /// @notice Return the laon identifier for external systems.
        return loanId;
    }

    function repay(bytes32 loanId) external payable override returns (bool) {
        address sender = _msgSender();

        /// @notice Look up for foreign loan.
        ForeignLoan memory loan = _foreignLoans[loanId];

        /// @notice Check if foreign loan is active.
        require(loan.state == LoanState.ACTIVE, "Loan is not active");

        /// @notice Convert nft receiver address to evm address.
        address receiverAddress = loan.receiver.bytes32ToAddress();

        /// @notice Check the loan receiver is the sender.
        require(receiverAddress == sender, "Unauthorized loan");

        /// @notice Calculate the interest accrued.
        uint256 interest = _estimateInterest(
            loan.value,
            loan.startSecs,
            loan.interestRate
        );

        uint256 amountIn = loan.value + interest;

        /// @notice Convert output token to solidity address.
        address tokenOutAddress = loan.tokenOut.bytes32ToAddress();

        /// @notice Transfer tokens to vault.
        IERC20 token = IERC20(tokenOutAddress);
        token.transferFrom(sender, address(this), amountIn);

        /// @notice Convert this orbital address to type bytes32.
        bytes32 fromContractId = AddressToBytes32.addressToBytes32(
            address(this)
        );

        /// @notice Get the destination orbital address in bytes32.
        bytes32 toContractId = _orbitals[loan.fromChainId];

        /// @notice Get wormhole messgase fee.
        uint256 wormholeFee = _wormhole.messageFee();

        /// @notice Check if gas supplied is enough for wormhole operation.
        require(msg.value == wormholeFee, "Insufficient message fee");

        /// @notice Build an inter-chain message.
        bytes memory payload = abi.encode(
            ON_REPAY_METHOD,
            loanId,
            loan.fromChainId,
            fromContractId,
            toContractId
        );

        /// @notice Publish message on wormhole guardian.
        _wormhole.publishMessage{value: wormholeFee}(
            _wormholeNonce,
            payload,
            CONSISTENCY_LEVEL
        );

        /// @notice Update nonce tracker.
        _wormholeNonce++;

        loan.state = LoanState.SETTLED;

        return true;
    }

    /// @dev Function will be trigger my orbital reyaler.
    function receiveOnBorrow(
        uint32 wormholeNonce,
        bytes32 loanId,
        bytes32 receiver,
        uint16 fromChainId,
        bytes32 fromContractId,
        bytes32 tokenIn,
        bytes32 tokenOut,
        uint256 value
    ) external override onlyOwner {
        /// @notice Check if nonce was executed.
        require(!_executeds[wormholeNonce], "Nonce was already executed.");

        bool result = onBorrow(
            loanId,
            receiver,
            fromChainId,
            fromContractId,
            tokenIn,
            tokenOut,
            value
        );

        /// @notice Update nonce as executed.
        _executeds[wormholeNonce] = result;
    }

    /// @dev Function will be trigger my orbital reyaler.
    function receiveOnRepay(
        uint32 wormholeNonce,
        bytes32 loanId
    ) external override onlyOwner {
        /// @notice Check if nonce was executed.
        require(!_executeds[wormholeNonce], "Nonce was already executed.");

        bool result = onRepay(loanId);

        /// @notice Update nonce as executed.
        _executeds[wormholeNonce] = result;
    }

    /// @notice Thus function receives borrow events from foreign orbitals.
    function onBorrow(
        bytes32 foreignLoanId,
        bytes32 receiver,
        uint16 fromChainId,
        bytes32 fromContractId,
        bytes32 tokenIn,
        bytes32 tokenOut,
        uint256 tokenInValue
    ) internal returns (bool) {
        /// @notice Check the foreign orbital is correct.
        require(
            _orbitals[fromChainId] == fromContractId,
            "Invalid foreign orbital"
        );

        /// @notice Check if foreign loan already exists.
        require(
            _foreignLoans[foreignLoanId].state == LoanState.NONE,
            "Loan already created"
        );

        /// @notice Send out loan tokens to receiver.
        /// @notice Convert output token to solidity address.
        address tokenOutAddress = tokenOut.bytes32ToAddress();

        /// @notice Convert token receiver address to evm address.
        address receiverAddress = receiver.bytes32ToAddress();

        uint256 tokenInValue18d = tokenInValue * 1_000_000_000;

        /// @notice Get input amount equivalent of output amount.
        uint256 tokenOutValue = _priceFeeds.estimateFromTo(
            tokenIn,
            tokenOut,
            tokenInValue18d
        );

        /// @notice Calculate amount out with LTV, i.e 80% of the actual value.
        (uint256 loan, ) = _splitAmount(tokenOutValue, LTV);

        /// @notice Transfer tokens to receiver.
        IERC20 token = IERC20(tokenOutAddress);
        token.transfer(receiverAddress, loan);

        /// @notice Look up for token interest rate.
        uint256 interestRate = _interestRates[tokenOut];

        /// @notice Create the foreign loan.
        _foreignLoans[foreignLoanId] = ForeignLoan({
            foreignLoanId: foreignLoanId,
            receiver: receiver,
            tokenOut: tokenOut,
            value: loan,
            state: LoanState.ACTIVE,
            startSecs: block.timestamp,
            interestRate: interestRate,
            fromChainId: fromChainId
        });

        return true;
    }

    /// @notice This function receives repay events from foreign orbitals.
    function onRepay(bytes32 loanId) internal returns (bool) {
        /// @notice Lookup for loan.
        Loan memory loan = _loans[loanId];

        /// @notice Check if loan is still active.
        require(loan.state == LoanState.ACTIVE, "Loan is not active");

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

    ////////////////////////////////
    ////     READ FUNCTIONS     ////
    ////////////////////////////////

    function getAmountOut(
        bytes32 tokenIn,
        bytes32 tokenOut,
        uint256 amountIn,
        uint8 ltv
    ) external view override returns (uint256) {
        /// @notice Get input amount equivalent of output amount.
        uint256 amountOut = _priceFeeds.estimateFromTo(
            tokenIn,
            tokenOut,
            amountIn
        );

        (uint256 loan, ) = _splitAmount(amountOut, ltv);

        return loan;
    }

    ////////////////////////////////
    ////   PRIVATE FUNCTIONS    ////
    ////////////////////////////////

    /// @notice Check if Token is supported.
    function _isTokenSupported(bytes32 tokenId) public view returns (bool) {
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
            (100 * ONE_YEAR * 24 * 60 * 60);

        return interest;
    }
}
