import { config } from './config';
import { waitForTransactionReceipt, writeContract, readContract, getBalance } from '@wagmi/core';
import { abi as erc20Abi } from "../contracts/erc20";

export function convertToBigInt(num: number) {
    // Check if the number is in scientific notation
    if (num.toString().includes('e')) {
        // Convert the number to a string in scientific notation
        let [significand, exponent] = num.toExponential().split('e').map((str: any) => str.trim());

        // Remove the decimal point from the significand
        significand = significand.replace('.', '');

        // Convert to BigInt
        let bigIntResult = BigInt(significand) * BigInt(10) ** BigInt(exponent - (significand.length - 1));
        return bigIntResult;
    } else {
        // If the number is not in scientific notation, directly convert it to BigInt
        return BigInt(num);
    }
}

export async function getTokenBalance(tokenId: `0x${string}`, address: `0x${string}`) {
    try {
        const { value } = await getBalance(config, { token: tokenId, address });
        return value;
    } catch (error) {
        console.log(error);

        return BigInt(0);
    }
}

export async function getAllowance(tokenId: `0x${string}`, address: `0x${string}`, spender: `0x${string}`) {
    try {
        return await readContract(config, {
            abi: erc20Abi,
            address: tokenId,
            functionName: 'allowance',
            args: [address, spender]
        });
    } catch (error) {
        console.log(error);

        return 0;
    }
}

export async function approve(tokenId: `0x${string}`, spender: `0x${string}`, amount: string) {
    try {
        const result = await writeContract(config, {
            abi: erc20Abi,
            address: tokenId,
            functionName: 'approve',
            args: [spender, convertToBigInt(Number(amount))]
        });

        const receipt = await waitForTransactionReceipt(config, { hash: result });

        return receipt.transactionHash;
    } catch (error) {
        console.log(error);

        return null;
    }
}

export async function faucet(tokenId: `0x${string}`): Promise<any> {
    try {
        const result = await writeContract(config, {
            abi: erc20Abi,
            address: tokenId,
            functionName: 'faucet'
        });

        const receipt = await waitForTransactionReceipt(config, { hash: result });

        return receipt.transactionHash;
    } catch (error) {
        console.log(error);

        return null;
    }
}

export async function addToWallet(tokenId: `0x${string}`, symbol: string, image: string) {
    try {
        // @ts-ignore
        await ethereum.request({
            method: 'wallet_watchAsset',
            params: {
                type: 'ERC20',
                options: {
                    address: tokenId,
                    symbol: symbol,
                    decimals: '18',
                    image: 'https://myorbital.xyz/images/' + image + '.png',
                },
            },
        });
        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
}