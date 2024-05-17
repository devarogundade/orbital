import * as dotenv from "dotenv";
import Web3 from 'web3';

import { TransactionBlock } from '@mysten/sui.js/transactions';
import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import { getFullnodeUrl, SuiClient } from '@mysten/sui.js/client';

import ethOrbitalAbi from "./abis/ethereum/orbital.json";

import http from 'http';

dotenv.config();

// Signing private keys.

const suiKeyPair = Ed25519Keypair.fromSecretKey(
    new Uint8Array(
        process.env.SUI_PRIVATE_KEY!!.trim.toString().split(",").map(Number)
    )
);

const handlerEvmKey = process.env.EVM_PRIVATE_KEY!!;

import {
    Environment,
    StandardRelayerApp,
    StandardRelayerContext,
} from "@wormhole-foundation/relayer-engine";
import { CHAIN_ID_SUI, CHAIN_ID_POLYGON } from "@certusone/wormhole-sdk";

const ORBITAL_SUI = "";
const ORBITAL_POLYGON = "";

/// @notice cross chain method identifier.
const ON_BORROW_METHOD =
    "0x4f4e5f424f52524f575f4d4554484f4400000000000000000000000000000000";

const ON_REPAY_METHOD =
    "0x4f4e5f52455041595f4d4554484f440000000000000000000000000000000000";

const ON_DEFAULT_METHOD =
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
                    '5': BigInt(1) /* polygon */
                }
            }
        },
    );

    // add a filter with a callback that will be
    // invoked on finding a VAA that matches the filter
    app.multiple(
        {
            [CHAIN_ID_SUI]: `${ORBITAL_SUI}`,
            [CHAIN_ID_POLYGON]: `${ORBITAL_POLYGON}`
        },
        async (ctx) => {
            const vaa = ctx.vaa;
            const hash = ctx.sourceTxHash;

            if (!vaa?.payload) return;

            console.log(`⚡ Got VAA: from chain id ${vaa?.emitterChain}`, vaa?.payload.toString('hex'));

            if (vaa?.emitterChain == CHAIN_ID_SUI) {
                const transactionId = await signTransactionOnEth(
                    vaa.nonce, vaa?.payload.toString('hex')
                );

                console.log('⚡From TxID: ', hash);
                console.log('⚡To TxID: ', transactionId);
            }
            // Emitted for base chain
            else if (vaa?.emitterChain == CHAIN_ID_POLYGON) {
                const transactionId = await signTransactionOnSui(
                    vaa.nonce, vaa?.payload.toString('hex')
                );

                console.log('⚡From TxID: ', hash);
                console.log('⚡To TxID: ', transactionId);
            }
            // Otherwise ~ error
            else {
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
            response.end(JSON.stringify({ 'status': 'good' }), 'utf-8');
            return;
        }

        response.writeHead(405, headers);
        response.end(`${request.method} is not allowed for the request.`);
    }).listen(port);

    console.log(`[server]: Server running at http://${hostname}:${port}`);
})();

async function signTransactionOnSui(nonce: number, payload: string): Promise<string | null> {
    // use getFullnodeUrl to define Devnet RPC location
    const rpcUrl = getFullnodeUrl('devnet');

    // create a client connected to devnet
    const client = new SuiClient({ url: rpcUrl });

    const target: `${string}::${string}::${string}` = extractSuiTarget(payload);
    const targetArguments: string[] = extractSuiArguments(nonce, payload);

    try {
        const txb = new TransactionBlock();

        txb.moveCall({
            target: `${ORBITAL_SUI}::orbital::receive_message`,
            // object IDs must be wrapped in moveCall arguments
            arguments: targetArguments,
        });

        const result = await client.signAndExecuteTransactionBlock(
            { signer: suiKeyPair, transactionBlock: txb }
        );

        const transactionBlock = await client.waitForTransactionBlock({
            digest: result.digest,
            options: {
                showEffects: true,
            },
        });

        return transactionBlock.digest;
    } catch (error) {
        console.error('Transaction: ', error);

        return null;
    }
}

async function signTransactionOnEth(nonce: number, payload: string) {
    const web3 = new Web3('https://polygon-mumbai.gateway.tenderly.co');

    const orbital = new web3.eth.Contract(ethOrbitalAbi as any, ORBITAL_POLYGON);

    // create signer object from private key.
    const signer = web3.eth.accounts.privateKeyToAccount(handlerEvmKey);

    // add signer to web3.
    web3.eth.accounts.wallet.add(signer);

    const method: string = extractEthMethod(payload);
    const methodArguments: string = extractArguments(nonce, payload);

    try {
        // estimate base eth gas fee.
        const gas = await orbital.methods.receiveMessage(
            nonce, method, methodArguments
        ).estimateGas({ from: signer.address });

        // get base eth gas price.
        const gasPrice = await web3.eth.getGasPrice();

        // call the transaction.
        const { transactionHash } = await orbital.methods.receiveMessage(
            nonce, method, methodArguments
        ).send({
            from: signer.address,
            gasPrice: gasPrice.toString(),
            gas: gas.toString()
        });

        return transactionHash;
    } catch (error) {
        console.error('Transaction: ', error);
        return null;
    }
}

// Extraction methods

function extractSuiTarget(payload: string): string {
    if (true) {

        return ON_BORROW_METHOD;
    }

    if (true) {

        return ON_REPAY_METHOD;
    }

    if (true) {

        return ON_DEFAULT_METHOD;
    }

    return '';
}

function extractEthMethod(payload: string): string {
    if (true) {

        return ON_BORROW_METHOD;
    }

    if (true) {

        return ON_REPAY_METHOD;
    }

    if (true) {

        return ON_DEFAULT_METHOD;
    }

    return '';
}

function extractArguments(nonce: number, payload: string): string {
    if (true) {
        return '';
    }

    if (true) {
        return '';
    }

    if (true) {
        return '';
    }

    return '';
}