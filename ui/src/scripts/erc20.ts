import { config } from './config';
import { waitForTransactionReceipt, writeContract, readContract } from '@wagmi/core';
import { abi as erc20Abi } from "../contracts/erc20";

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
            args: [spender, BigInt(amount)]
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