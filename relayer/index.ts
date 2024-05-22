import * as dotenv from "dotenv";
import Web3 from 'web3';

import { TransactionBlock } from '@mysten/sui.js/transactions';
import { getFullnodeUrl, SuiClient } from '@mysten/sui.js/client';

// import ethOrbitalAbi from "./abis/ethereum/orbital.json";

import http from 'http';

dotenv.config();

// Signing private keys.

// const suiKeyPair = Ed25519Keypair.fromSecretKey(
//     new Uint8Array(
//         process.env.SUI_PRIVATE_KEY!!.trim.toString().split(",").map(Number)
//     )
// );

// const handlerEvmKey = process.env.EVM_PRIVATE_KEY!!;

import {
    Environment,
    StandardRelayerApp,
    StandardRelayerContext,
} from "@wormhole-foundation/relayer-engine";
import { CHAIN_ID_SUI, CHAIN_ID_AVAX, hexToUint8Array } from "@certusone/wormhole-sdk";

const ORBITAL_SUI = "0xfb77bc2d72a4e1ca782ffe89cc18e1631621548939e108de053c7f1618dc0fdd";
const ORBITAL_AVAX = "0xdBFc47ccd46BfACa4141c9372028fF09008DAd11";

/// @notice cross chain method identifier.
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
            const hash = ctx.sourceTxHash;

            if (!vaa?.payload) return;

            if (vaa?.emitterChain == CHAIN_ID_SUI) {
                console.log('⚡Got VAA: ', vaa?.payload.toString('hex'));
            }
            // Emitted for base chain
            else if (vaa?.emitterChain == CHAIN_ID_AVAX) {
                const web3 = new Web3();

                const hexPayload = '0x' + vaa?.payload.toString('hex');

                if (hexPayload.startsWith(ON_BORROW_METHOD)) {
                    const params = web3.eth.abi.decodeParameters(
                        ['bytes32', 'bytes32', 'bytes32', 'bytes32', 'uint16', 'bytes32', 'bytes32', 'bytes32', 'uint256'],
                        hexPayload
                    );

                    // signOnBorrowTransactionOnSui(
                    //     vaa.nonce,
                    //     params[3],
                    //     params[1],
                    //     CHAIN_ID_AVAX,
                    //     params[8],
                    //     getCoinType(params[7])
                    // );
                }

                if (hexPayload.startsWith(ON_REPAY_METHOD)) {

                }

                if (hexPayload.startsWith(ON_AMPLIFY_METHOD)) {

                }

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

const ownerCap: string = "0x202796a6237ab8e4a6bb7fdd77cd7477fad08f1965085b790296eded2d1443fb";
const state: string = "0xa340666496beed25da5cc167507f211f92cfedc8fd182dea645984f26c9eeb1e";
const theClock: string = "";
const wormholeState: string = "0x31358d198147da50db32eda2562951d53973a0c0ad5ed738e9b17d88b213d790";
const oracleHolder: string = "0x7ab6aa7c4f8ec79c630dc560ae34bd745a035c5a9ab9143b90b504399a4f1040";
const priceFeedsState: string = "0x355075b86c56bb4ca1144365a9abb044a5acca48e6439bdf0a83c66252e0035a";

// async function signOnBorrowTransactionOnSui(
//     nonce: number,
//     receiver: string,
//     loanId: string,
//     fromChainId: number,
//     coinOutValue: number,
//     coinOutType: string
// ): Promise<string | null> {
//     const rpcUrl = getFullnodeUrl('testnet');

//     // create a client connected to devnet
//     const client = new SuiClient({ url: rpcUrl });

//     try {
//         const txb = new TransactionBlock();

//         txb.moveCall({
//             target: `${ORBITAL_SUI}::orbital::receive_on_borrow`,
//             // object IDs must be wrapped in moveCall arguments
//             arguments: [
//                 txb.object(ownerCap),
//                 txb.object(state),
//                 txb.pure(nonce),
//                 txb.pure(hexToUint8Array(ON_BORROW_METHOD)),
//                 txb.pure(hexToUint8Array(loanId)),
//                 txb.pure(fromChainId),
//                 txb.pure(receiver),
//                 txb.pure(coinOutValue),
//                 txb.object(theClock)
//             ],
//             typeArguments: [
//                 coinOutType
//             ]
//         });

//         const result = await client.signAndExecuteTransactionBlock(
//             { signer: suiKeyPair, transactionBlock: txb }
//         );

//         const transactionBlock = await client.waitForTransactionBlock({
//             digest: result.digest,
//             options: {
//                 showEffects: true,
//             },
//         });

//         return transactionBlock.digest;
//     } catch (error) {
//         console.error('Transaction: ', error);

//         return null;
//     }
// }

// async function signTransactionOnEth(nonce: number, payload: string) {
//     const web3 = new Web3('https://polygon-mumbai.gateway.tenderly.co');

//     const orbital = new web3.eth.Contract(ethOrbitalAbi as any, ORBITAL_POLYGON);

//     // create signer object from private key.
//     const signer = web3.eth.accounts.privateKeyToAccount(handlerEvmKey);

//     // add signer to web3.
//     web3.eth.accounts.wallet.add(signer);

//     const method: string = extractEthMethod(payload);
//     const methodArguments: string = extractArguments(nonce, payload);

//     try {
//         // estimate base eth gas fee.
//         const gas = await orbital.methods.receiveMessage(
//             nonce, method, methodArguments
//         ).estimateGas({ from: signer.address });

//         // get base eth gas price.
//         const gasPrice = await web3.eth.getGasPrice();

//         // call the transaction.
//         const { transactionHash } = await orbital.methods.receiveMessage(
//             nonce, method, methodArguments
//         ).send({
//             from: signer.address,
//             gasPrice: gasPrice.toString(),
//             gas: gas.toString()
//         });

//         return transactionHash;
//     } catch (error) {
//         console.error('Transaction: ', error);
//         return null;
//     }
// }

// Extraction methods

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