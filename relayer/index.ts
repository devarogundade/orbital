import * as dotenv from "dotenv";
import Web3 from 'web3';

import {
    Environment,
    StandardRelayerApp,
    StandardRelayerContext,
} from "@wormhole-foundation/relayer-engine";
import { CHAIN_ID_SUI, CHAIN_ID_AVAX, hexToUint8Array } from "@certusone/wormhole-sdk";

import { TransactionBlock } from '@mysten/sui.js/transactions';
import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import { getFullnodeUrl, SuiClient } from '@mysten/sui.js/client';

// Ethereum contract abi //
import ethOrbitalAbi from "./abis/ethereum/orbital.json";

import http from 'http';

dotenv.config();

// Orbital contract addresses //

const ORBITAL_SUI = "0xfb77bc2d72a4e1ca782ffe89cc18e1631621548939e108de053c7f1618dc0fdd";
const ORBITAL_AVAX = "0xdBFc47ccd46BfACa4141c9372028fF09008DAd11";

// Cross chain method identifiers //
const ON_BORROW_METHOD =
    "0x4f4e5f424f52524f575f4d4554484f4400000000000000000000000000000000";

const ON_REPAY_METHOD =
    "0x4f4e5f52455041595f4d4554484f440000000000000000000000000000000000";

const ON_AMPLIFY_METHOD =
    "0x4f4e5f44454641554c545f4d4554484f44000000000000000000000000000000";

(async function main() {
    // initialize relayer engine app, pass relevant config options
    const app = new StandardRelayerApp<StandardRelayerContext>(
        Environment.TESTNET,
        {
            name: "OrbitalRelayer",
            missedVaaOptions: {
                startingSequenceConfig: {
                    '21': BigInt(1), /* sui */
                    '6': BigInt(1) /* avalanche */
                }
            }
        },
    );

    // add a filter with a callback that will be
    // invoked on finding a VAA that matches the filter
    app.multiple(
        {
            [CHAIN_ID_SUI]: ORBITAL_SUI,
            [CHAIN_ID_AVAX]: ORBITAL_AVAX
        },
        async (ctx) => {
            const vaa = ctx.vaa;

            // Check if VAA has a payload.
            if (!vaa?.payload) {
                console.log('Not payload was sent: ', vaa);
                return;
            }

            const web3 = new Web3();
            console.log('⚡Got VAA: ', vaa?.payload.toString('hex'));

            // Parse payload to HEX format.
            const hexPayload = '0x' + vaa?.payload.toString('hex');

            // Check for emitter chain.
            if (vaa?.emitterChain == CHAIN_ID_SUI) {
                // @dev Get the VAA method.
                if (hexPayload.startsWith(ON_BORROW_METHOD)) {
                    const params = web3.eth.abi.decodeParameters(
                        ['bytes32', 'bytes32', 'bytes32', 'bytes32', 'uint16', 'bytes32', 'bytes32', 'string', 'uint64'],
                        hexPayload
                    );

                    const tx = await signOnBorrowTransactionOnEth(
                        vaa.nonce,
                        params[1],
                        params[3],
                        CHAIN_ID_SUI,
                        params[5],
                        getCoinType(params[7]),
                        params[8]
                    );

                    console.log('⚡Trx hash: ', tx);

                    return;
                }

                // @dev Get the VAA method.
                if (hexPayload.startsWith(ON_REPAY_METHOD)) {
                    const params = web3.eth.abi.decodeParameters(
                        ['bytes32', 'bytes32', 'uint16', 'bytes32', 'bytes32', 'string'],
                        hexPayload
                    );

                    const tx = await signOnRepayTransactionOnEth(
                        vaa.nonce,
                        params[1]
                    );

                    console.log('⚡Trx hash: ', tx);

                    return;
                }

                // @dev Get the VAA method.
                if (hexPayload.startsWith(ON_AMPLIFY_METHOD)) {
                    const params = web3.eth.abi.decodeParameters(
                        ['bytes32', 'bytes32', 'bool'],
                        hexPayload
                    );

                    const tx = await signOnAmplifyTransactionOnEth(
                        vaa.nonce,
                        params[1],
                        params[2]
                    );

                    console.log('⚡Trx hash: ', tx);

                    return;
                }
            } else if (vaa?.emitterChain == CHAIN_ID_AVAX) {
                // @dev Get the VAA method.
                if (hexPayload.startsWith(ON_BORROW_METHOD)) {
                    const params = web3.eth.abi.decodeParameters(
                        ['bytes32', 'bytes32', 'bytes32', 'bytes32', 'uint16', 'bytes32', 'bytes32', 'bytes32', 'uint256'],
                        hexPayload
                    );

                    const tx = signOnBorrowTransactionOnSui(
                        vaa.nonce,
                        params[3], // receiver
                        params[1], // loanId
                        CHAIN_ID_AVAX,
                        params[8], // loan value
                        getCoinType(params[7]) // tokenOut
                    );

                    console.log('⚡Trx hash: ', tx);

                    return;
                }

                // @dev Get the VAA method.
                if (hexPayload.startsWith(ON_REPAY_METHOD)) {
                    const params = web3.eth.abi.decodeParameters(
                        ['bytes32', 'bytes32', 'uint16', 'bytes32', 'bytes32'],
                        hexPayload
                    );

                    const tx = signOnRepayTransactionOnSui(
                        vaa.nonce,
                        params[1],
                        getDefaultCoinInType(21)
                    );

                    console.log('⚡Trx hash: ', tx);

                    return;
                }
            } else {
                console.error('Undefined emiitter id');
            }
        },
    );

    // add and configure any other middleware ..
    // start app, blocks until unrecoverable error or process is stopped
    await app.listen();
})();

(function server(): void {
    // use hostname 127.0.0.1 unless there exists a preconfigured port
    const hostname = process.env.HOST || '127.0.0.1';

    // use port 3000 unless there exists a preconfigured port
    const port = process.env.PORT || 3000;

    http.createServer(function (request, response) {
        const headers = {
            'Access-Control-Allow-Origin': '*', /* @dev First, read about security */
            'Access-Control-Allow-Methods': 'OPTIONS, POST, GET',
            'Access-Control-Max-Age': 2592000, /* 30 days */
            'Content-Type': 'application/json'
        };

        if (request.method === 'OPTIONS') {
            response.writeHead(204, headers);
            response.end();
            return;
        }

        if (['GET', 'POST'].indexOf(request.method!!) > -1) {
            response.writeHead(200, headers);
            response.end(JSON.stringify({ 'status': true }), 'utf-8');
            return;
        }

        response.writeHead(405, headers);
        response.end(`${request.method} is not allowed for the request.`);
    }).listen(port);

    console.log(`[server]: Server running at http://${hostname}:${port}`);
})();

// SUI DEPS //

const state: string = "";
const ownerCap: string = "";
const theClock: string = "";

// SUI TRANSACTIONS //

async function signOnBorrowTransactionOnSui(
    nonce: number,
    receiver: string,
    loanId: string,
    fromChainId: number,
    coinOutValue: number,
    coinOutType: string
): Promise<string | null> {
    const rpcUrl = getFullnodeUrl('testnet');

    const client = new SuiClient({ url: rpcUrl });

    try {
        const txb = new TransactionBlock();

        txb.moveCall({
            target: `${ORBITAL_SUI}::orbital::receive_on_borrow`,
            arguments: [
                txb.object(ownerCap),
                txb.object(state),
                txb.pure(nonce),
                txb.pure(hexToUint8Array(ON_BORROW_METHOD)),
                txb.pure(hexToUint8Array(loanId)),
                txb.pure(fromChainId),
                txb.pure(receiver),
                txb.pure(coinOutValue),
                txb.object(theClock)
            ],
            typeArguments: [coinOutType]
        });

        // create signer object from private key.
        const suiSigner = Ed25519Keypair.fromSecretKey(
            hexToUint8Array(process.env.SUI_PRIVATE_KEY!!)
        );

        const result = await client.signAndExecuteTransactionBlock(
            { signer: suiSigner, transactionBlock: txb }
        );

        return result.digest;
    } catch (error) {
        console.error('Transaction: ', error);

        return null;
    }
}

async function signOnRepayTransactionOnSui(
    nonce: number,
    loan: string,
    coinInType: string
): Promise<string | null> {
    const rpcUrl = getFullnodeUrl('testnet');

    const client = new SuiClient({ url: rpcUrl });

    try {
        const txb = new TransactionBlock();

        txb.moveCall({
            target: `${ORBITAL_SUI}::orbital::receive_on_borrow`,
            arguments: [
                txb.object(ownerCap),
                txb.object(state),
                txb.pure(nonce),
                txb.pure(hexToUint8Array(ON_REPAY_METHOD)),
                txb.object(loan)
            ],
            typeArguments: [coinInType]
        });

        // create signer object from private key.
        const suiSigner = Ed25519Keypair.fromSecretKey(
            hexToUint8Array(process.env.SUI_PRIVATE_KEY!!)
        );

        const result = await client.signAndExecuteTransactionBlock(
            { signer: suiSigner, transactionBlock: txb }
        );

        return result.digest;
    } catch (error) {
        console.error('Transaction: ', error);

        return null;
    }
}

// ETHEREUM TRANSACTIONS //

async function signOnBorrowTransactionOnEth(
    nonce: number,
    loanId: string,
    receiver: string,
    fromChainId: number,
    fromContractId: string,
    tokenOut: string,
    value: string
) {
    const web3 = new Web3('https://avalanche-fuji-c-chain-rpc.publicnode.com');

    const orbital = new web3.eth.Contract(ethOrbitalAbi as any, ORBITAL_AVAX);

    // create signer object from private key.
    const ethSigner = web3.eth.accounts.privateKeyToAccount(
        process.env.EVM_PRIVATE_KEY!!
    );

    // add signer to web3.
    web3.eth.accounts.wallet.add(ethSigner);

    try {
        // estimate base eth gas fee.
        const gas = await orbital.methods.receiveOnBorrow(
            nonce,
            ON_BORROW_METHOD,
            loanId,
            receiver,
            fromChainId,
            fromContractId,
            tokenOut,
            value
        ).estimateGas({ from: ethSigner.address });

        // get base eth gas price.
        const gasPrice = await web3.eth.getGasPrice();

        // call the transaction.
        const { transactionHash } = await orbital.methods.receiveOnBorrow(
            nonce,
            ON_BORROW_METHOD,
            loanId,
            receiver,
            fromChainId,
            fromContractId,
            tokenOut,
            value
        ).send({
            from: ethSigner.address,
            gasPrice: gasPrice.toString(),
            gas: gas.toString()
        });

        return transactionHash;
    } catch (error) {
        console.error('Transaction: ', error);

        return null;
    }
}

async function signOnRepayTransactionOnEth(
    nonce: number,
    loanId: string
) {
    const web3 = new Web3('https://avalanche-fuji-c-chain-rpc.publicnode.com');

    const orbital = new web3.eth.Contract(ethOrbitalAbi as any, ORBITAL_AVAX);

    // create signer object from private key.
    const ethSigner = web3.eth.accounts.privateKeyToAccount(
        process.env.EVM_PRIVATE_KEY!!
    );

    // add signer to web3.
    web3.eth.accounts.wallet.add(ethSigner);

    try {
        // estimate base eth gas fee.
        const gas = await orbital.methods.receiveOnRepay(
            nonce,
            ON_REPAY_METHOD,
            loanId
        ).estimateGas({ from: ethSigner.address });

        // get base eth gas price.
        const gasPrice = await web3.eth.getGasPrice();

        // call the transaction.
        const { transactionHash } = await orbital.methods.receiveOnRepay(
            nonce,
            ON_REPAY_METHOD,
            loanId
        ).send({
            from: ethSigner.address,
            gasPrice: gasPrice.toString(),
            gas: gas.toString()
        });

        return transactionHash;
    } catch (error) {
        console.error('Transaction: ', error);

        return null;
    }
}

async function signOnAmplifyTransactionOnEth(
    nonce: number,
    receiver: string,
    status: boolean
): Promise<string | null> {
    const web3 = new Web3('https://avalanche-fuji-c-chain-rpc.publicnode.com');

    const orbital = new web3.eth.Contract(ethOrbitalAbi as any, ORBITAL_AVAX);

    // create signer object from private key.
    const ethSigner = web3.eth.accounts.privateKeyToAccount(
        process.env.EVM_PRIVATE_KEY!!
    );

    // add signer to web3.
    web3.eth.accounts.wallet.add(ethSigner);

    try {
        // estimate base eth gas fee.
        const gas = await orbital.methods.receiveOnRepay(
            nonce,
            ON_AMPLIFY_METHOD,
            receiver,
            status
        ).estimateGas({ from: ethSigner.address });

        // get base eth gas price.
        const gasPrice = await web3.eth.getGasPrice();

        // call the transaction.
        const { transactionHash } = await orbital.methods.receiveOnRepay(
            nonce,
            ON_AMPLIFY_METHOD,
            receiver,
            status
        ).send({
            from: ethSigner.address,
            gasPrice: gasPrice.toString(),
            gas: gas.toString()
        });

        return transactionHash;
    } catch (error) {
        console.error('Transaction: ', error);

        return null;
    }
}

// Extraction methods //

function getCoinType(tokenId: string): string {
    // BTC
    if (tokenId == '0x000000000000000000000000e61c27b23970d90bb6a0425498d41cc990b8f517') {
        return "0xf3c0743c760b0288112d1d68dddef36300c7351bad3b9c908078c01f02482f33::usdt::USDT";
    }

    if (tokenId == '0xf3c0743c760b0288112d1d68dddef36300c7351bad3b9c908078c01f02482f33::usdt::USDT') {
        return "0x000000000000000000000000e61c27b23970d90bb6a0425498d41cc990b8f517";
    }

    // USDT
    if (tokenId == '0x000000000000000000000000e61c27b23970d90bb6a0425498d41cc990b8f517') {
        return "0xf3c0743c760b0288112d1d68dddef36300c7351bad3b9c908078c01f02482f33::btc::BTC";
    }

    if (tokenId == '0xf3c0743c760b0288112d1d68dddef36300c7351bad3b9c908078c01f02482f33::btc::BTC') {
        return "0x000000000000000000000000e61c27b23970d90bb6a0425498d41cc990b8f517";
    }

    return "";
}

function getDefaultCoinInType(chainId: number): string {
    if (chainId == 21) {
        return "0xf3c0743c760b0288112d1d68dddef36300c7351bad3b9c908078c01f02482f33::usdt::USDT";
    }

    return "";
}