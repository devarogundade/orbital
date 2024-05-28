import { waitForTransactionReceipt, writeContract, readContract } from '@wagmi/core';
import { TransactionBlock } from '@mysten/sui.js/transactions';

import { abi as ethAbi } from '../contracts/eth';
import { config } from './config';
import { getCoins } from './blockeden';

export const defaultInterestRate = 10000000000;

const ORBITAL_SUI = "0x0cb3ed8d5c81bf10b99844d63844e764fe689e507b2aa7edc0a28cfae3d1c878";
export const ORBITAL_AVAX = '0x9d18ab7AA68Ffcd6192e775E26c2631c8F66334e';

export function addressToBytes32(address: string): string {
    // Remove the '0x' prefix if present
    const strippedAddress = address.startsWith('0x') ? address.slice(2) : address;

    // Pad the address with leading zeros to ensure it is 32 bytes long
    const paddedAddress = strippedAddress.padStart(64, '0');

    // Add the '0x' prefix back
    return '0x' + paddedAddress;
}

export function bytes32ToAddress(bytes32: string): string {
    // Check if the input is a valid bytes32 string
    if (bytes32.length !== 66 || !bytes32.startsWith('0x')) {
        throw new Error('Invalid bytes32 string');
    }

    // Extract the last 20 bytes (40 hexadecimal characters)
    const address = '0x' + bytes32.slice(-40);

    return address;
}

export async function getAmountOut(
    tokenIn: string,
    tokenOut: string,
    amountIn: string,
    ltv: number = 80
) {
    try {
        return readContract(config, {
            abi: ethAbi,
            address: ORBITAL_AVAX,
            functionName: 'getAmountOut',
            args: [tokenIn, tokenOut, amountIn, ltv]
        }
        );
    } catch (error) {
        console.log(error);

        return 0;
    }
}

export async function ethBorrow(
    toChainId: number,
    tokenIn: string,
    tokenOut: string,
    value: string,
    receiver: string
) {
    try {
        const result = await writeContract(config, {
            abi: ethAbi,
            address: ORBITAL_AVAX,
            functionName: 'borrow',
            args: [toChainId, tokenIn, tokenOut, value, receiver],
            value: BigInt(0) // Wormhole fee.
        });

        const receipt = await waitForTransactionReceipt(config, { hash: result });

        return receipt.transactionHash;
    } catch (error) {
        console.log(error);

        return null;
    }
}

export async function ethRepay(
    loanId: string
) {
    try {
        const result = await writeContract(config, {
            abi: ethAbi,
            address: ORBITAL_AVAX,
            functionName: 'repay',
            args: [loanId],
            value: BigInt(0) // Wormhole fee.
        });

        const receipt = await waitForTransactionReceipt(config, { hash: result });

        return receipt.transactionHash;
    } catch (error) {
        console.log(error);

        return null;
    }
}

// SUI DEPS //

const state: string = "0x478d818bb6c5c7e12d0503a5511d4e3157dd867b274bf1159055c07ec04cc268";
const wormholeState: string = "0x31358d198147da50db32eda2562951d53973a0c0ad5ed738e9b17d88b213d790";
const oracleHolder: string = "0x87ef65b543ecb192e89d1e6afeaf38feeb13c3a20c20ce413b29a9cbfbebd570";
const priceFeedsState: string = "0x0baf46c8db4087ad9a170576b0f59c55cffcea8a847f8282ef0c13336d13890b";
const theClock: string = "0x0000000000000000000000000000000000000000000000000000000000000006";

export async function suiBorrow(
    toChainId: number,
    coinInValue: string,
    coinInType: string,
    coinOutType: string,
    sender: string,
    receiver: string,
    adapter: any
) {
    try {
        console.log('f');

        const txb = new TransactionBlock();

        const [coinGas] = txb.splitCoins(txb.gas, [
            txb.pure(0) // Wormhole fee.
        ]);

        const requestAllCoins = await getCoins(sender, coinInType);

        // Check if coins objects are not empty.
        if (!requestAllCoins || requestAllCoins.length == 0) {
            return null;
        }

        // Get only coin object ids
        const allCoinsObject = requestAllCoins.map((r: any) => r.coinObjectId);

        // Pick the first coin object as destination coin
        const destinationInCoin = allCoinsObject[0];

        // If there are other destination coins left, merge them together
        if (allCoinsObject.length > 1) {
            const [, ...otherInCoins] = allCoinsObject;
            txb.mergeCoins(destinationInCoin, otherInCoins);
        }

        // Take only the amount user specified out of the merges coins;
        const [coinIn] = txb.splitCoins(destinationInCoin, [
            txb.pure.u64(coinInValue)
        ]);

        txb.moveCall({
            target: `${ORBITAL_SUI}::orbital::borrow`,
            arguments: [
                txb.object(state),
                txb.object(wormholeState),
                txb.object(oracleHolder),
                txb.object(priceFeedsState),
                txb.object(theClock),
                txb.pure(toChainId),
                txb.object(coinGas),
                txb.object(coinIn),
                txb.pure(receiver)
            ],
            typeArguments: [coinInType, coinOutType]
        });

        txb.setGasBudget(50_000_000);

        const result = await adapter.signAndExecuteTransactionBlock(
            { transactionBlock: txb }
        );

        // Wait for confirmation

        return result.digest;
    } catch (error) {
        console.log(error);

        return null;
    }
}

export async function suiRepay(
    loan: string,
    sender: string,
    coinOutValue: string,
    coinOutType: string,
    adapter: any
) {
    try {
        const txb = new TransactionBlock();

        const [coinGas] = txb.splitCoins(txb.gas, [
            txb.pure(0) // Wormhole fee.
        ]);

        const requestAllCoins = await getCoins(sender, coinOutType);

        // Check if coins objects are not empty.
        if (!requestAllCoins || requestAllCoins.length == 0) {
            return null;
        }

        // Get only coin object ids
        const allCoinsObject = requestAllCoins.map((r: any) => r.coinObjectId);

        // Pick the first coin object as destination coin
        const destinationInCoin = allCoinsObject[0];

        // If there are other destination coins left, merge them together
        if (allCoinsObject.length > 1) {
            const [, ...otherInCoins] = allCoinsObject;
            txb.mergeCoins(destinationInCoin, otherInCoins);
        }

        // Take only the amount user specified out of the merges coins;
        const [coinOut] = txb.splitCoins(destinationInCoin, [
            txb.pure.u64(coinOutValue)
        ]);

        txb.moveCall({
            target: `${ORBITAL_SUI}::orbital::repay`,
            arguments: [
                txb.object(state),
                txb.object(coinGas),
                txb.object(wormholeState),
                txb.object(theClock),
                txb.object(loan),
                txb.object(coinOut),
            ],
            typeArguments: [coinOutType]
        });

        const result = await adapter.signAndExecuteTransactionBlock(
            { transactionBlock: txb }
        );

        // Wait for confirmation

        return result.digest;
    } catch (error) {
        console.log(error);

        return null;
    }
}

export async function suiStakeFrens(
    status: boolean,
    receiver: string,
    adapter: any
) {
    try {
        const txb = new TransactionBlock();

        const [coinGas] = txb.splitCoins(txb.gas, [
            txb.pure(0) // Wormhole fee.
        ]);

        txb.moveCall({
            target: `${ORBITAL_SUI}::orbital::stake_sui_frens`,
            arguments: [
                txb.object(state),
                txb.pure(status),
                txb.object(coinGas),
                txb.object(wormholeState),
                txb.object(theClock),
                txb.pure(receiver)
            ]
        });

        txb.setGasBudget(50_000_000);

        const result = await adapter.signAndExecuteTransactionBlock(
            { transactionBlock: txb }
        );

        // Wait for confirmation

        return result.digest;
    } catch (error) {
        console.log(error);

        return null;
    }
}