import { walletConnect } from '@wagmi/connectors';
import { avalancheFuji } from '@wagmi/core/chains';
import { defaultWagmiConfig } from '@web3modal/wagmi';

export const projectId = 'c8af093fb15a6a3b6e325460f68d1587';

const metadata = {
    name: 'Orbital',
    description: 'Orbital',
    url: 'https://myorbital.xyz',
    icons: ['https://avatars.githubusercontent.com/u/37784886']
};

export const chains = [avalancheFuji];

export const config = defaultWagmiConfig({
    // @ts-ignore
    chains, projectId, metadata, connectors: [walletConnect({
        projectId: projectId
    })]
});