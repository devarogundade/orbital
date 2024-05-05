// SPDX-License-Identifier: UNLICENSED
pragma solidity <=0.8.24;

interface IOrbital {
    enum LoanState {
        NONE,
        ACTIVE,
        SETTLED,
        DEFAULTED
    }
    enum TokenType {
        TOKEN,
        NFT
    }

    struct Loan {
        bytes32 sender;
        TokenType tokenType;
        bytes32 tokenIn;
        uint256 value; // Can be amount for erc20 or tokenId for erc721.
        LoanState state;
        uint256 startSecs;
    }

    struct ForeignLoan {
        bytes32 receiver;
        TokenType tokenType;
        bytes32 tokenOut;
        uint256 value; // Can be amount for erc20 or tokenId for erc721.
        LoanState state;
        uint256 startSecs;
        uint256 interestRate;
    }

    function borrow(
        uint16 toChainId,
        bytes32 tokenIn,
        bytes32 tokenOut,
        TokenType tokenType,
        uint256 value,
        bytes32 receiver
    ) external payable returns (bytes32);

    function onBorrow(bytes memory payload) external returns (bool);

    function onRepay(bytes memory payload) external returns (bool);
}
