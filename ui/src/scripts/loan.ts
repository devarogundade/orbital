import { waitForTransactionReceipt, writeContract, readContract } from '@wagmi/core';
import { TransactionBlock } from '@mysten/sui.js/transactions';

import { abi as ethAbi } from '../contracts/eth';
import { config } from './config';
import { getCoins } from './blockeden';
import { convertToBigInt } from './erc20';

export const defaultInterestRate = 45000;

const ORBITAL_SUI = "0xabb45ed94ba7366b631bee1dce8ecb456508f66b66bf7135841d8d57d2026270";
export const ORBITAL_AVAX = '0xDdA5368dA176762d1964B868101e6592fba25b15';

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
    ltv: number
) {
    try {
        return readContract(config, {
            abi: ethAbi,
            address: ORBITAL_AVAX,
            functionName: 'getAmountOut',
            args: [tokenIn, tokenOut, convertToBigInt(Number(amountIn)), ltv]
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
            args: [toChainId, tokenIn, tokenOut, convertToBigInt(Number(value)), receiver],
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

const state: string = "0xfb27fa6eac7fa42133e8c414cd066175ffecff49d4343306a0db7a4b1ac61082";
const wormholeState: string = "0x31358d198147da50db32eda2562951d53973a0c0ad5ed738e9b17d88b213d790";
const oracleHolder: string = "0x87ef65b543ecb192e89d1e6afeaf38feeb13c3a20c20ce413b29a9cbfbebd570";
const priceFeedsState: string = "0x4f8111b5a6f228409d7e811e6ab780f6fad1c10957ff158738e6978bb2ebabb0";
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