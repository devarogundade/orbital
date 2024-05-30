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
            6: '0x65203C47fD727AB55974Ded62F01c53F7aB98fE4',
            21: '0xae28fd09dc8df11e5b3a1d3389723cd9469988944661e708f6ddf4fb2f1fd644::fud::FUD'
        }
    },
    {
        name: 'Tether USD',
        image: '/images/usdt.png',
        symbol: 'USDT',
        addresses: {
            6: '0x19Fa5d8485fE33ebcd41989CE76F20311a9E6F28',
            21: '0xae28fd09dc8df11e5b3a1d3389723cd9469988944661e708f6ddf4fb2f1fd644::usdt::USDT'
        }
    }
];

export const chain = (id: number) => chains.find(c => c.chainId == id);

export const token = (symbol: string) => tokens.find(t => t.symbol == symbol);