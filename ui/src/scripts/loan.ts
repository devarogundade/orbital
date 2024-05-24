import { waitForTransactionReceipt, writeContract, readContract } from '@wagmi/core';
import { TransactionBlock } from '@mysten/sui.js/transactions';

import { abi as ethAbi } from '../contracts/eth';
import { config } from './config';

export const defaultInterestRate = 10000000000;

const ORBITAL_SUI = "0xba2ec7f4380343fe672a76fe0f334e4dc26e125f617d8e0a32d46c1ef36923bd";
export const ORBITAL_AVAX = '0xdD7276F4e1983006033d583426e0D7947A7c14c8';

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

const state: string = "0x6ceebbd7158f29a62b0dbb2f277d24089f01bb7aa12824ea28cf6664854624a7";
const wormholeState: string = "0x31358d198147da50db32eda2562951d53973a0c0ad5ed738e9b17d88b213d790";
const oracleHolder: string = "0x7ab6aa7c4f8ec79c630dc560ae34bd745a035c5a9ab9143b90b504399a4f1040";
const priceFeedsState: string = "0xc51ecfe4b7499c3ffbaaf9ac2a5b4c197e657e8ce468c8919610eab01227e720";
const theClock: string = "0x0000000000000000000000000000000000000000000000000000000000000006";

export async function suiBorrow(
    toChainId: number,
    coinInValue: string,
    coinInType: string,
    coinOutType: string,
    receiver: string,
    adapter: any
) {
    try {
        const txb = new TransactionBlock();

        const [coinGas] = txb.splitCoins(txb.gas, [
            txb.pure(0) // Wormhole fee.
        ]);

        const [coinIn] = txb.splitCoins(txb.object("0x656f9dd7bbf01bda7e0775018b4b88aa94128e63c0dc97ed113659c6d316fedb"), [
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
                txb.pure.u16(toChainId),
                coinGas,
                coinIn,
                txb.pure.address(receiver)
            ],
            typeArguments: [coinInType, coinOutType]
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
                coinGas,
                txb.object(wormholeState),
                txb.object(theClock),
                txb.object(loan),
                coinOut
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