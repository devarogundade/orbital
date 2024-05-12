import { waitForTransactionReceipt, writeContract, readContract } from '@wagmi/core';

import { abi as ethAbi } from '';

export const orbitalId = '';

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

}

export async function suiBorrow() {

}

export async function suiRepay() {

}