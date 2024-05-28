// SPDX-License-Identifier: UNLICENSED
pragma solidity <=0.8.24;

interface IOrbital {
    enum LoanState {
        NONE,
        ACTIVE,
        SETTLED,
        DEFAULTED
    }

    struct Loan {
        bytes32 sender;
        bytes32 tokenIn;
        uint256 value; // Can be amount for erc20 or tokenId for erc721.
        LoanState state;
        uint256 startSecs;
    }

    struct ForeignLoan {
        bytes32 foreignLoanId;
        bytes32 receiver;
        bytes32 tokenOut;
        uint256 value; // Can be amount for erc20 or tokenId for erc721.
        LoanState state;
        uint256 startSecs;
        uint256 interestRate;
        uint16 fromChainId;
    }

    function borrow(
        uint16 toChainId,
        bytes32 tokenIn,
        bytes32 tokenOut,
        uint256 value,
        bytes32 receiver
    ) external payable returns (bytes32);

    function repay(bytes32 loanId) external payable returns (bool);

    function receiveOnBorrow(
        uint32 wormholeNonce,
        bytes32 loanId,
        bytes32 receiver,
        uint16 fromChainId,
        bytes32 fromContractId,
        bytes32 tokenIn,
        bytes32 tokenOut,
        uint256 value
    ) external;

    function receiveOnRepay(uint32 wormholeNonce, bytes32 loanId) external;

    function getAmountOut(
        bytes32 tokenIn,
        bytes32 tokenOut,
        uint256 amountIn,
        uint8 ltv
    ) external view returns (uint256);
}
