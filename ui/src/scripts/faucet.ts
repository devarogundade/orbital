import Web3 from 'web3';
import { token } from './chains';
import { abi } from '../contracts/erc20';

import { TransactionBlock } from '@mysten/sui.js/transactions';
import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import { getFullnodeUrl, SuiClient } from '@mysten/sui.js/client';

export async function mintAll(suiAddress: string, ethAddress: string) {
    await mintSuiUsdt(suiAddress);
    await mintSuiFud(suiAddress);
    await mintEthUsdt(ethAddress);
    await mintEthFud(ethAddress);
}

const SUI_FAUCET = "0xae28fd09dc8df11e5b3a1d3389723cd9469988944661e708f6ddf4fb2f1fd644";

async function mintSuiUsdt(address: string) {
    const rpcUrl = getFullnodeUrl('testnet');
    const usdtFaucet = "0x14c67ee6b188901c82ed3fd33a6fd9045ba1b9c93229ac49348234f1aff6010d";

    const client = new SuiClient({ url: rpcUrl });

    try {
        const txb = new TransactionBlock();

        txb.moveCall({
            target: `${SUI_FAUCET}::usdt::mint`,
            arguments: [
                txb.object(usdtFaucet),
                txb.pure.address(address)
            ],
            typeArguments: [
                token('USDT')!.addresses[21]
            ]
        });

        txb.setGasBudget(50_000_000);

        // create signer object from private key.
        const keypair = Ed25519Keypair.deriveKeypair(
            import.meta.env.VITE_SUI_PRIVATE_KEY
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

async function mintSuiFud(address: string) {
    const rpcUrl = getFullnodeUrl('testnet');
    const fudFaucet = "0xff8f6cd586a67ed59f0f75cc177e2ff7071d2dd0d7d80f7c49c25eff11ae924d";

    const client = new SuiClient({ url: rpcUrl });

    try {
        const txb = new TransactionBlock();

        txb.moveCall({
            target: `${SUI_FAUCET}::fud::mint`,
            arguments: [
                txb.object(fudFaucet),
                txb.pure.address(address)
            ],
            typeArguments: [
                token('FUD')!.addresses[21]
            ]
        });

        txb.setGasBudget(50_000_000);

        // create signer object from private key.
        const keypair = Ed25519Keypair.deriveKeypair(
            import.meta.env.VITE_SUI_PRIVATE_KEY
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

async function mintEthUsdt(address: string) {
    const web3 = new Web3('https://avalanche-fuji-c-chain-rpc.publicnode.com');

    const orbital = new web3.eth.Contract(abi as any, token('USDT')!.addresses[6]);

    // create signer object from private key.
    const ethSigner = web3.eth.accounts.privateKeyToAccount(
        import.meta.env.VITE_EVM_PRIVATE_KEY
    );

    // add signer to web3.
    web3.eth.accounts.wallet.add(ethSigner);

    try {
        // estimate base eth gas fee.
        const gas = await orbital.methods.mint(
            address
        ).estimateGas({ from: ethSigner.address });

        // get base eth gas price.
        const gasPrice = await web3.eth.getGasPrice();

        // call the transaction.
        const { transactionHash } = await orbital.methods.mint(
            address
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

async function mintEthFud(address: string) {
    const web3 = new Web3('https://avalanche-fuji-c-chain-rpc.publicnode.com');

    const orbital = new web3.eth.Contract(abi as any, token('FUD')!.addresses[6]);

    // create signer object from private key.
    const ethSigner = web3.eth.accounts.privateKeyToAccount(
        import.meta.env.VITE_EVM_PRIVATE_KEY
    );

    // add signer to web3.
    web3.eth.accounts.wallet.add(ethSigner);

    try {
        // estimate base eth gas fee.
        const gas = await orbital.methods.mint(
            address
        ).estimateGas({ from: ethSigner.address });

        // get base eth gas price.
        const gasPrice = await web3.eth.getGasPrice();

        // call the transaction.
        const { transactionHash } = await orbital.methods.mint(
            address
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