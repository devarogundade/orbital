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
        native: 'ETH',
        isEvm: true
    }
];

export const tokens = [
    {
        name: 'Bitcoin',
        image: '/images/btc.png',
        symbol: 'BTC',
        addresses: {
            6: '',
            21: ''
        }
    },
    {
        name: 'Tether USD',
        image: '/images/usdt.png',
        symbol: 'USDT',
        addresses: {
            6: '',
            21: ''
        }
    }
];

export const chain = (id: number) => chains.find(c => c.chainId == id);

export const token = (symbol: string) => tokens.find(t => t.symbol == symbol);