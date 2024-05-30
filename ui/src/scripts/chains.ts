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
        name: 'Fud the Pug',
        image: '/images/fud.png',
        symbol: 'FUD',
        addresses: {
            6: '0x89063ACC735dEF9Ec9706f5d5a69D4ADf4213158',
            21: '0xe91ee9c76f381200725dff9ac4622dcc84d5453a8610ae92659591df0bbc25c6::fud::FUD'
        }
    },
    {
        name: 'Tether USD',
        image: '/images/usdt.png',
        symbol: 'USDT',
        addresses: {
            6: '0x5c3bA76382E26b9f3a2d22CB33cb44Ad4b144643',
            21: '0xe91ee9c76f381200725dff9ac4622dcc84d5453a8610ae92659591df0bbc25c6::usdt::USDT'
        }
    }
];

export const chain = (id: number) => chains.find(c => c.chainId == id);

export const token = (symbol: string) => tokens.find(t => t.symbol == symbol);