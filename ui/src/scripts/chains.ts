export const chains = [
    {
        name: 'SUI',
        image: '/images/sui.png',
        chainId: 21,
        native: 'SUI',
        isEvm: false
    },
    {
        name: 'Avalanche',
        image: '/images/avax.png',
        chainId: 6,
        native: 'AVAX',
        isEvm: true
    }
];

export const tokens = [
    {
        name: 'Bitcoin',
        image: '/images/btc.png',
        symbol: 'BTC',
        addresses: {
            6: '0xbDD5A6fD93267B9dc3943361f6cF162bC201F6F7',
            21: '0xf3c0743c760b0288112d1d68dddef36300c7351bad3b9c908078c01f02482f33::btc::BTC'
        }
    },
    {
        name: 'Tether USD',
        image: '/images/usdt.png',
        symbol: 'USDT',
        addresses: {
            6: '0xFD132250838394168dFC2Da524C5Ee612715c431',
            21: '0xf3c0743c760b0288112d1d68dddef36300c7351bad3b9c908078c01f02482f33::usdt::USDT'
        }
    }
];

export const chain = (id: number) => chains.find(c => c.chainId == id);

export const token = (symbol: string) => tokens.find(t => t.symbol == symbol);