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

// Ethereum contract abi //
import ethOrbitalAbi from "./abis/ethereum/orbital.json";

import http from 'http';

dotenv.config();

// Orbital contract addresses //

const ORBITAL_SUI = "0xd32d534df7c7f0e9ce67e682c70decdb67f8b17224c824f9722ab752a648b798";
const ORBITAL_SUI_EMITTER = "0x558c271d84cdeb5658e9ae7bc119cb9b8276123f51c71eb011a38c2d0425112a";
const ORBITAL_AVAX = "0x5B580c65f9174aE942a38e722A8D92fbC89CF5eB";

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

            console.log('⚡[new vaa]: ', hexPayload);

            // Check for emitter chain.
            if (vaa?.emitterChain == CHAIN_ID_SUI) {
                // @dev Get the VAA method.
                if (hexPayload.startsWith(removeTrailingZeros(ON_BORROW_METHOD))) {
                    const params: any[] = [];

                    const tx = await signOnBorrowTransactionOnEth(
                        vaa.nonce,
                        params[1],
                        params[3],
                        CHAIN_ID_SUI,
                        params[5],
                        getDefaultEthTokenIn(),
                        params[8]
                    );

                    console.log('⚡Trx hash: ', tx);

                    return;
                }

                // @dev Get the VAA method.
                if (hexPayload.startsWith(removeTrailingZeros(ON_REPAY_METHOD))) {
                    const params: any[] = [];

                    const tx = await signOnRepayTransactionOnEth(
                        vaa.nonce,
                        params[1]
                    );

                    console.log('⚡Trx hash: ', tx);

                    return;
                }

                // @dev Get the VAA method.
                if (hexPayload.startsWith(removeTrailingZeros(ON_AMPLIFY_METHOD))) {
                    const params = splitSuiAmplifierHex(hexPayload);

                    const tx = await signOnAmplifyTransactionOnEth(
                        vaa.nonce,
                        params.receiver,
                        params.status
                    );

                    console.log('⚡Trx hash: ', tx);

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
                        getDefaultSUICoinOutType() // tokenOut
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

const state: string = "0x95bc176fa20d51180d2cd84cab76d239f1ddac6e73ff175c9ae5362ac3307603";
const ownerCap: string = "0xdaa5474a7612f2ace0370e0962a3fd3701a3989215e67557fda070b2395b7f9e";
const theClock: string = "0x0000000000000000000000000000000000000000000000000000000000000006";

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
                txb.pure.u32(nonce),
                txb.pure(bcs.vector(bcs.u8()).serialize(hexToUint8Array(loanId))),
                txb.pure.u16(fromChainId),
                txb.pure.address(receiver),
                txb.pure.u64(coinOutValue),
                txb.object(theClock)
            ],
            typeArguments: [coinOutType]
        });

        txb.setGasBudget(50_000_000);

        // create signer object from private key.
        const keypair = Ed25519Keypair.deriveKeypair(
            process.env.SUI_PRIVATE_KEY!!
        );

        const { digest } = await client.signAndExecuteTransactionBlock(
            { signer: keypair, transactionBlock: txb }
        );

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
        const gas = await orbital.methods.receiveOnStakeSuiFrens(
            nonce,
            receiver,
            status
        ).estimateGas({ from: ethSigner.address });

        // get base eth gas price.
        const gasPrice = await web3.eth.getGasPrice();

        // call the transaction.
        const { transactionHash } = await orbital.methods.receiveOnStakeSuiFrens(
            nonce,
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

const faucet = "0xf3c0743c760b0288112d1d68dddef36300c7351bad3b9c908078c01f02482f33";

function getDefaultSUICoinInType(): string {
    return `${faucet}::usdt::USDT`;
}

function getDefaultSUICoinOutType(): string {
    return `${faucet}::btc::BTC`;
}

function getDefaultEthTokenIn(): string {
    return addressToBytes32("0x49321b62D46A72d9F0D0275f1CDBED2CB7753306");
}

function getDefaultEthTokenOut(): string {
    return addressToBytes32("0xB01c55634AB82268d0C0F915598858dEBD40d5C5");
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

function splitSuiAmplifierHex(hex: string): { method: string, receiver: string, status: boolean; } {
    // Remove the '0x' prefix
    const hexData = hex.slice(2);

    // Extract bytes20 (first 20 bytes, 40 hex characters)
    const method = '0x' + hexData.slice(0, 40);

    // Extract address (next 20 bytes, 40 hex characters)
    const receiver = '0x' + hexData.slice(40, 40 + 40);

    // Extract boolean (last byte, 2 hex characters)
    const booleanByte = hexData.slice(80, 82);
    const status = booleanByte !== '00';


    return { method, receiver, status };
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