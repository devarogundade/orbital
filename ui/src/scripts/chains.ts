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
            6: '0xB01c55634AB82268d0C0F915598858dEBD40d5C5',
            21: '0xf3c0743c760b0288112d1d68dddef36300c7351bad3b9c908078c01f02482f33::btc::BTC'
        }
    },
    {
        name: 'Tether USD',
        image: '/images/usdt.png',
        symbol: 'USDT',
        addresses: {
            6: '0x49321b62D46A72d9F0D0275f1CDBED2CB7753306',
            21: '0xf3c0743c760b0288112d1d68dddef36300c7351bad3b9c908078c01f02482f33::usdt::USDT'
        }
    }
];

export const chain = (id: number) => chains.find(c => c.chainId == id);

export const token = (symbol: string) => tokens.find(t => t.symbol == symbol);