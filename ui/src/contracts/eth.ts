export const abi = [
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "priceFeeds",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "wormhole",
                "type": "address"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "previousOwner",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "newOwner",
                "type": "address"
            }
        ],
        "name": "OwnershipTransferStarted",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "previousOwner",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "newOwner",
                "type": "address"
            }
        ],
        "name": "OwnershipTransferred",
        "type": "event"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "tokenId",
                "type": "address"
            }
        ],
        "name": "_isNftSupported",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "tokenId",
                "type": "address"
            }
        ],
        "name": "_isTokenSupported",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "acceptOwnership",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint16",
                "name": "toChainId",
                "type": "uint16"
            },
            {
                "internalType": "bytes32",
                "name": "tokenIn",
                "type": "bytes32"
            },
            {
                "internalType": "bytes32",
                "name": "tokenOut",
                "type": "bytes32"
            },
            {
                "internalType": "enum IOrbital.TokenType",
                "name": "tokenType",
                "type": "uint8"
            },
            {
                "internalType": "uint256",
                "name": "value",
                "type": "uint256"
            },
            {
                "internalType": "bytes32",
                "name": "receiver",
                "type": "bytes32"
            }
        ],
        "name": "borrow",
        "outputs": [
            {
                "internalType": "bytes32",
                "name": "",
                "type": "bytes32"
            }
        ],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "owner",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "pendingOwner",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint32",
                "name": "wormholeNonce",
                "type": "uint32"
            },
            {
                "internalType": "bytes32",
                "name": "method",
                "type": "bytes32"
            },
            {
                "internalType": "bytes32",
                "name": "loanId",
                "type": "bytes32"
            },
            {
                "internalType": "bytes32",
                "name": "receiver",
                "type": "bytes32"
            },
            {
                "internalType": "uint16",
                "name": "fromChainId",
                "type": "uint16"
            },
            {
                "internalType": "bytes32",
                "name": "fromContractId",
                "type": "bytes32"
            },
            {
                "internalType": "bytes32",
                "name": "tokenOut",
                "type": "bytes32"
            },
            {
                "internalType": "enum IOrbital.TokenType",
                "name": "tokenType",
                "type": "uint8"
            },
            {
                "internalType": "uint256",
                "name": "value",
                "type": "uint256"
            }
        ],
        "name": "receiveOnBorrow",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint32",
                "name": "wormholeNonce",
                "type": "uint32"
            },
            {
                "internalType": "bytes32",
                "name": "method",
                "type": "bytes32"
            },
            {
                "internalType": "bytes32",
                "name": "loanId",
                "type": "bytes32"
            }
        ],
        "name": "receiveOnRepay",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "renounceOwnership",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "bytes32",
                "name": "loanId",
                "type": "bytes32"
            }
        ],
        "name": "repay",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "newOwner",
                "type": "address"
            }
        ],
        "name": "transferOwnership",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
];