import { waitForTransactionReceipt, writeContract } from '@wagmi/core';
import { TransactionBlock } from '@mysten/sui.js/transactions';

import { abi as ethAbi } from '../contracts/eth';
import { config } from './config';

const ORBITAL_SUI: string = "";
export const ORBITAL_AVAX: `0x${string}` = '0x';

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

const state: string = "";
const wormholeState: string = "";
const oracleHolder: string = "";
const priceFeedsState: string = "";
const theClock: string = "";

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

        const [coinIn] = txb.splitCoins(txb.gas, [
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