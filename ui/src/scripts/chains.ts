export const chains = [
    {
        name: 'SUI',
        image: '/images/sui.png',
        chainId: 21,
        native: 'SUI',
        isEvm: false
    },
    {
        name: 'Polygon',
        image: '/images/polygon.png',
        chainId: 5,
        native: 'ETH',
        isEvm: true
    }
];

export const tokens = [
    {
        name: 'Bitcoin',
        image: '/images/btc.png',
        symbol: 'BTC'
    },
    {
        name: 'Tether USD',
        image: '/images/usdt.png',
        symbol: 'USDT'
    }
];

export const chain = (id: number) => chains.find(c => c.chainId == id);

export const token = (symbol: string) => tokens.find(t => t.symbol == symbol);