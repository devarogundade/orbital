import { waitForTransactionReceipt, writeContract, readContract } from '@wagmi/core';
import { TransactionBlock } from '@mysten/sui.js/transactions';

import { abi as ethAbi } from '../contracts/eth';
import { config } from './config';

export const defaultInterestRate = 10000000000;

const ORBITAL_SUI = "0xd32d534df7c7f0e9ce67e682c70decdb67f8b17224c824f9722ab752a648b798";
export const ORBITAL_AVAX = '0x5B580c65f9174aE942a38e722A8D92fbC89CF5eB';

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

const state: string = "0x95bc176fa20d51180d2cd84cab76d239f1ddac6e73ff175c9ae5362ac3307603";
const wormholeState: string = "0x31358d198147da50db32eda2562951d53973a0c0ad5ed738e9b17d88b213d790";
const oracleHolder: string = "0x87ef65b543ecb192e89d1e6afeaf38feeb13c3a20c20ce413b29a9cbfbebd570";
const priceFeedsState: string = "0x69b0c16d85cfb83b232fde94828a274486b434d47ea1d813543f63633b52c72e";
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
        const txb = new TransactionBlock();

        const [coinGas] = txb.splitCoins(txb.gas, [
            txb.pure(0) // Wormhole fee.
        ]);

        const [coinIn] = txb.splitCoins(txb.object("0xcb5f656966dcd738eb916fe88b31edeb8bd7ee7a879fd2f60aecb0e0c1441a2e"), [
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
    coinOutValue: string,
    coinOutType: string,
    adapter: any
) {
    try {
        const txb = new TransactionBlock();

        const [coinGas] = txb.splitCoins(txb.gas, [
            txb.pure(0) // Wormhole fee.
        ]);

        const [coinOut] = txb.splitCoins(txb.gas, [
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