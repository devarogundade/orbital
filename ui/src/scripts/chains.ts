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
            6: '0x70527a5098443849069603C26815705436500565',
            21: '0x76ab030e93509eaeac54d7feb270c95af5f5b38c56584cbfedc747efaac63636::fud::FUD'
        }
    },
    {
        name: 'Tether USD',
        image: '/images/usdt.png',
        symbol: 'USDT',
        addresses: {
            6: '0xd08080A98d57239Ea7379861Fc1fdDAb190ba287',
            21: '0x76ab030e93509eaeac54d7feb270c95af5f5b38c56584cbfedc747efaac63636::usdt::USDT'
        }
    }
];

export const chain = (id: number) => chains.find(c => c.chainId == id);

export const token = (symbol: string) => tokens.find(t => t.symbol == symbol);