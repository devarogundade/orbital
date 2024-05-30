import axios from 'axios';

const endpoint = `https://api.blockeden.xyz/sui/testnet/${import.meta.env.VITE_BLOCK_EDEN_KEY}`;

export async function getCoinBalances(address: string) {
    try {
        const response = await axios.post(endpoint, {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "suix_getAllBalances",
            "params": [address]
        });

        return response.data.result;
    } catch (error) {
        console.log(error);

        return null;
    }
}

export async function getCoins(address: string, coinType: string) {
    try {
        const response = await axios.post(endpoint, {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "suix_getAllCoins",
            "params": [address]
        });

        const result = response.data.result.data;

        return result.filter((r: any) => r.coinType == coinType);
    } catch (error) {
        console.log(error);

        return null;
    }
}