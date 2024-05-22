import { waitForTransactionReceipt, writeContract, readContract } from '@wagmi/core';
import { TransactionBlock } from '@mysten/sui.js/transactions';

import { abi as ethAbi } from '../contracts/eth';
import { config } from './config';

const state: string = "";
const wormholeState: string = "";
const oracleHolder: string = "";
const priceFeedsState: string = "";
const theClock: string = "";


const ORBITAL_SUI_ADDRESS: `${string}::${string}` = "::";

export const orbitalId: `0x${string}` = '0x';

export async function ethBorrow(
    toChainId: number,
    tokenIn: string,
    tokenOut: string,
    tokenType: number,
    value: string,
    receiver: string
) {
    try {
        const result = await writeContract(config, {
            abi: ethAbi,
            address: orbitalId,
            functionName: 'borrow',
            args: [toChainId, tokenIn, tokenOut, tokenType, value, receiver]
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
            address: orbitalId,
            functionName: 'repay',
            args: [loanId]
        });

        const receipt = await waitForTransactionReceipt(config, { hash: result });

        return receipt.transactionHash;
    } catch (error) {
        console.log(error);

        return null;
    }
}

export async function suiBorrow(
    toChainId: number,
    coinInValue: string,
    coinType: number,
    receiver: string
) {
    const txb = new TransactionBlock();

    const [coinGas] = txb.splitCoins(txb.gas, [
        0
    ]);

    const [coinIn] = txb.splitCoins(txb.gas, [
        txb.pure.u64(coinInValue)
    ]);

    txb.moveCall({
        target: `${ORBITAL_SUI_ADDRESS}::borrow`,
        arguments: [
            txb.object(state),
            txb.object(wormholeState),
            txb.object(oracleHolder),
            txb.object(priceFeedsState),
            txb.object(theClock),
            txb.pure.u16(toChainId),
            coinGas,
            coinIn,
            txb.pure.u8(coinType),
            txb.pure.address(receiver)
        ],
    });

    txb.sign();
}

export async function suiRepay(
) {



}