import * as dotenv from "dotenv";
import Web3 from 'web3';

import suiOrbitalAbi from "./abis/sui/orbital.json";
import baseOrbitalAbi from "./abis/base/orbital.json";

dotenv.config();

import http from 'http';

import {
    Environment,
    StandardRelayerApp,
    StandardRelayerContext,
} from "@wormhole-foundation/relayer-engine";
import { CHAIN_ID_SUI, CHAIN_ID_BASE } from "@certusone/wormhole-sdk";

const ORBITAL_SUI = "";
const ORBITAL_BASE = "";

(async function main() {
    // initialize relayer engine app, pass relevant config options
    const app = new StandardRelayerApp<StandardRelayerContext>(
        Environment.TESTNET,
        {
            name: "OrbitalRelayer",
            missedVaaOptions: {
                startingSequenceConfig: {
                    '21': BigInt(1), /* sui */
                    '30': BigInt(1) /* base */
                }
            }
        },
    );

    // add a filter with a callback that will be
    // invoked on finding a VAA that matches the filter
    app.multiple(
        {
            [CHAIN_ID_SUI]: `${ORBITAL_SUI}`,
            [CHAIN_ID_BASE]: `${ORBITAL_BASE}`
        },
        async (ctx, next) => {
            const vaa = ctx.vaa;
            const hash = ctx.sourceTxHash;

            if (!vaa?.payload) return;

            console.log(`⚡ Got VAA: from chain id ${vaa?.emitterChain}`, vaa?.payload.toString('hex'));

            if (vaa?.emitterChain == CHAIN_ID_SUI) {
                const transactionId = await signTransactionOnBase(
                    vaa.nonce, "METHOD", vaa?.payload.toString('hex')
                );

                console.log('⚡From TxID: ', hash);
                console.log('⚡To TxID: ', transactionId);
            }
            // Emitted for base chain
            else if (vaa?.emitterChain == CHAIN_ID_BASE) {
                const transactionId = await signTransactionOnSui(
                    vaa.nonce, "METHOD", vaa?.payload.toString('hex')
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

async function signTransactionOnSui(nonce: number, method: string, payload: string): Promise<string | null> {
    return null;
}

async function signTransactionOnBase(nonce: number, method: string, payload: string) {
    const web3 = new Web3('https://base-goerli.public.blastapi.io');

    const orbital = new web3.eth.Contract(baseOrbitalAbi as any, ORBITAL_BASE);

    // Signing private key.
    const handlerEvmKey = process.env.EVM_PRIVATE_KEY!!;

    // create signer object from private key.
    const signer = web3.eth.accounts.privateKeyToAccount(handlerEvmKey);

    // add signer to web3.
    web3.eth.accounts.wallet.add(signer);

    try {
        // estimate base eth gas fee.
        const gas = await orbital.methods.receiveMessage(
            nonce, method, payload
        ).estimateGas({ from: signer.address });
        console.log('Gas: ', gas);

        // get base eth gas price.
        const gasPrice = await web3.eth.getGasPrice();
        console.log('Gas Price: ', gasPrice);

        // call the transaction.
        const { transactionHash } = await orbital.methods.receiveMessage(
            nonce, method, payload
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