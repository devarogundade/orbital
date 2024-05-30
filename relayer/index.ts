import * as dotenv from "dotenv";
import Web3 from 'web3';

import {
    Environment,
    StandardRelayerApp,
    StandardRelayerContext,
} from "@wormhole-foundation/relayer-engine";
import { CHAIN_ID_SUI, CHAIN_ID_AVAX } from "@certusone/wormhole-sdk";

import { bcs } from '@mysten/bcs';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import { getFullnodeUrl, SuiClient } from '@mysten/sui.js/client';

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// @ts-ignore
import serviceAccount from './serviceAccountKey.json';

initializeApp({
    credential: cert(serviceAccount as any)
});

const db = getFirestore();

// Ethereum contract abi //
import ethOrbitalAbi from "./abis/ethereum/orbital.json";

import http from 'http';
import { parseSuiOnBorrowHex } from "./utils/sui_on_borrow_parser";
import { parseSuiOnRepayHex } from "./utils/sui_on_repay_parser";

dotenv.config();

// Firestore

const LOAN_COLLECTION = "loans";

// Orbital contract addresses //

const ORBITAL_SUI = "0x40f61258fec8ffa4b2d9e0de00c32bd1feedf622185eff2d9fbed7b6c31023d4";
const ORBITAL_SUI_EMITTER = "0xb32be58c535a1a6d5c9a9f7cb833ccb75e52b311bbb95d34793fddef1e19fda1";
const ORBITAL_AVAX = "0xA2c51C566875836874308FAAa86e37Ac4c19e545";

// Cross chain method identifiers //
const ON_BORROW_METHOD =
    "0x4f4e5f424f52524f575f4d4554484f4400000000000000000000000000000000";

const ON_REPAY_METHOD =
    "0x4f4e5f52455041595f4d4554484f440000000000000000000000000000000000";

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
            [CHAIN_ID_SUI]: ORBITAL_SUI_EMITTER,
            [CHAIN_ID_AVAX]: ORBITAL_AVAX
        },
        async (ctx) => {
            const vaa = ctx.vaa;

            // Check if VAA has a payload.
            if (!vaa?.payload) {
                console.log('Not payload was sent: ', vaa);
                return;
            }
            // Parse payload to HEX format.
            const hexPayload = '0x' + vaa?.payload.toString('hex');
            const sourceTxHash = ctx.sourceTxHash!;

            console.log('⚡[new vaa]: ', hexPayload);

            // Check for emitter chain.
            if (vaa?.emitterChain == CHAIN_ID_SUI) {
                // @dev Get the VAA method.
                if (hexPayload.startsWith(removeTrailingZeros(ON_BORROW_METHOD))) {
                    const params = parseSuiOnBorrowHex(hexPayload);

                    const tx = await signOnBorrowTransactionOnEth(
                        vaa.nonce,
                        params.loanId,
                        params.receiver,
                        CHAIN_ID_SUI,
                        params.fromContractId,
                        getDefaultEthTokenIn(),
                        getDefaultEthTokenOut(),
                        params.coinInValue,
                        sourceTxHash
                    );

                    console.log('⚡Trx hash: ', tx);

                    return;
                }

                // @dev Get the VAA method.
                if (hexPayload.startsWith(removeTrailingZeros(ON_REPAY_METHOD))) {
                    const params = parseSuiOnRepayHex(hexPayload);

                    console.log(params);

                    // const tx = await signOnRepayTransactionOnEth(
                    //     vaa.nonce,
                    //     params.loanId
                    // );

                    // console.log('⚡Trx hash: ', tx);

                    return;
                }
            } else if (vaa?.emitterChain == CHAIN_ID_AVAX) {
                const web3 = new Web3();

                // @dev Get the VAA method.
                if (hexPayload.startsWith(removeTrailingZeros(ON_BORROW_METHOD))) {
                    const params = web3.eth.abi.decodeParameters(
                        ['bytes32', 'bytes32', 'bytes32', 'bytes32', 'uint16', 'bytes32', 'bytes32', 'bytes32', 'uint256'],
                        hexPayload
                    );

                    const tx = await signOnBorrowTransactionOnSui(
                        vaa.nonce,
                        params[3], // receiver
                        params[1], // loanId
                        CHAIN_ID_AVAX,
                        params[8], // loan value
                        getDefaultSUICoinOutType(), // tokenOut
                        sourceTxHash
                    );

                    console.log('⚡Trx hash: ', tx);

                    return;
                }

                // @dev Get the VAA method.
                if (hexPayload.startsWith(removeTrailingZeros(ON_REPAY_METHOD))) {
                    const params = web3.eth.abi.decodeParameters(
                        ['bytes32', 'bytes32', 'uint16', 'bytes32', 'bytes32'],
                        hexPayload
                    );

                    const tx = await signOnRepayTransactionOnSui(
                        vaa.nonce,
                        params[1],
                        getDefaultSUICoinInType()
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
            response.end(JSON.stringify({ 'status': "OK" }), 'utf-8');
            return;
        }

        response.writeHead(405, headers);
        response.end(`${request.method} is not allowed for the request.`);
    }).listen(port);

    console.log(`[server]: Server running at http://${hostname}:${port}`);
})();

// SUI DEPS //

const state: string = "0x32fe472f37585e99d952cdff2bc377433a80d3d11fee33007dc060a0de97a7a2";
const ownerCap: string = "0xa8e8cd95629f79de0dac2bf5ed3e7ad977efbc0b56aff7ab543e8cfd119aa255";
const theClock: string = "0x0000000000000000000000000000000000000000000000000000000000000006";
const faucet = "0xe91ee9c76f381200725dff9ac4622dcc84d5453a8610ae92659591df0bbc25c6";

// SUI TRANSACTIONS //

async function signOnBorrowTransactionOnSui(
    nonce: number,
    receiver: string,
    loanId: string,
    fromChainId: number,
    coinOutValue: number,
    coinOutType: string,
    txHash: string
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
                txb.pure.u32(nonce),
                txb.pure(bcs.vector(bcs.u8()).serialize(hexToUint8Array(loanId))),
                txb.pure.u16(fromChainId),
                txb.pure.address(receiver),
                txb.pure.u128(coinOutValue),
                txb.object(theClock)
            ],
            typeArguments: [coinOutType]
        });

        txb.setGasBudget(50_000_000);

        // create signer object from private key.
        const keypair = Ed25519Keypair.deriveKeypair(
            process.env.SUI_PRIVATE_KEY!!
        );

        const { digest, effects } = await client.signAndExecuteTransactionBlock(
            { signer: keypair, transactionBlock: txb, options: { showEffects: true } }
        );

        if (effects && effects.created) {
            for (let index = 0; index < effects.created.length; index++) {
                const created = effects.created[index];
                const owner: any = created.owner;

                if ('Shared' in owner && 'initial_shared_version' in owner.Shared) {
                    const newLoanId = created.reference.objectId;

                    const data = { loanId: newLoanId };

                    // Add a new document in collection "cities" with ID 'LA'
                    await db.collection(LOAN_COLLECTION).doc(txHash).set(
                        data, { merge: true }
                    );

                    break;
                }
            }
        }

        await client.waitForTransactionBlock({ digest });

        return digest;
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
            target: `${ORBITAL_SUI}::orbital::receive_on_repay`,
            arguments: [
                txb.object(ownerCap),
                txb.object(state),
                txb.pure(nonce),
                txb.object(loan)
            ],
            typeArguments: [coinInType]
        });

        txb.setGasBudget(50_000_000);

        // create signer object from private key.
        const keypair = Ed25519Keypair.deriveKeypair(
            process.env.SUI_PRIVATE_KEY!!
        );

        const result = await client.signAndExecuteTransactionBlock(
            { signer: keypair, transactionBlock: txb }
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
    tokenIn: string,
    tokenOut: string,
    value: string,
    txHash: string
) {
    const data = { loanId };

    // Add a new document in collection "loans".
    await db.collection(LOAN_COLLECTION).doc(txHash).set(
        data, { merge: true }
    );

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
            loanId,
            receiver,
            fromChainId,
            fromContractId,
            tokenIn,
            tokenOut,
            value
        ).estimateGas({ from: ethSigner.address });

        // get base eth gas price.
        const gasPrice = await web3.eth.getGasPrice();

        // call the transaction.
        const { transactionHash } = await orbital.methods.receiveOnBorrow(
            nonce,
            loanId,
            receiver,
            fromChainId,
            fromContractId,
            tokenIn,
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
            loanId
        ).estimateGas({ from: ethSigner.address });

        // get base eth gas price.
        const gasPrice = await web3.eth.getGasPrice();

        // call the transaction.
        const { transactionHash } = await orbital.methods.receiveOnRepay(
            nonce,
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

// Extraction methods //

function getDefaultSUICoinInType(): string {
    return `${faucet}::usdt::USDT`;
}

function getDefaultSUICoinOutType(): string {
    return `${faucet}::fud::FUD`;
}

function getDefaultEthTokenIn(): string {
    return addressToBytes32("0x5c3bA76382E26b9f3a2d22CB33cb44Ad4b144643");
}

function getDefaultEthTokenOut(): string {
    return addressToBytes32("0x89063ACC735dEF9Ec9706f5d5a69D4ADf4213158");
}

function addressToBytes32(address: string): string {
    // Remove the '0x' prefix if present
    const strippedAddress = address.startsWith('0x') ? address.slice(2) : address;

    // Pad the address with leading zeros to ensure it is 32 bytes long
    const paddedAddress = strippedAddress.padStart(64, '0');

    // Add the '0x' prefix back
    return '0x' + paddedAddress;
}

function hexToUint8Array(hex: string): number[] {
    // Ensure the hex string is valid
    if (typeof hex !== 'string') {
        throw new TypeError('Expected input to be a string');
    }

    // Remove any potential leading "0x"
    if (hex.startsWith('0x')) {
        hex = hex.slice(2);
    }

    // Check if the length of the string is even
    if (hex.length % 2 !== 0) {
        throw new Error('Hex string must have an even number of characters');
    }

    // Create a Uint8Array
    const byteArray = new Uint8Array(hex.length / 2);

    for (let i = 0; i < hex.length; i += 2) {
        byteArray[i / 2] = parseInt(hex.substr(i, 2), 16);
    }

    const numberArray: number[] = [];

    for (let i = 0; i < byteArray.length; i++) {
        if (byteArray[i] > 0) {
            numberArray.push(byteArray[i]);
        }
    }

    return numberArray;
}

function removeTrailingZeros(bytes32: string): string {
    // Ensure the input starts with '0x' and is 66 characters long (including '0x')
    if (!bytes32.startsWith('0x') || bytes32.length !== 66) {
        throw new Error('Invalid bytes32 format or length');
    }

    // Remove the '0x' prefix
    let hexData = bytes32.slice(2);

    // Remove trailing zeros
    hexData = hexData.replace(/0+$/, '');

    // Add the '0x' prefix back
    return '0x' + hexData;
}