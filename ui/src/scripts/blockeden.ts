import axios from 'axios';

export async function getCoinBalances(address: string) {
    try {
        const response = await axios.post(`https://rpc-testnet.suiscan.xyz:443`, {
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
        const response = await axios.post(`https://rpc-testnet.suiscan.xyz:443`, {
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