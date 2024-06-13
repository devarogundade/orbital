<template>
    <section>
        <div class="app_width">
            <header>
                <div class="logo">
                    <OrbitalIcon />
                </div>

                <div class="tabs">
                    <RouterLink to="/">
                        <button :class="$route.name == 'home' ? 'tab active' : 'tab'">../</button>
                    </RouterLink>
                    <RouterLink to="/borrow">
                        <button :class="$route.name == 'borrow' ? 'tab active' : 'tab'">Borrow</button>
                    </RouterLink>
                    <RouterLink to="/flash-loan">
                        <button :class="$route.name == 'flash-loan' ? 'tab active' : 'tab'">Flash Loan</button>
                    </RouterLink>
                    <RouterLink to="/points">
                        <button :class="$route.name == 'points' ? 'tab active' : 'tab'">Points ☄️</button>
                    </RouterLink>
                </div>

                <div class="action">
                    <RouterLink to="/borrow" v-if="$route.name == 'home'">
                        <button class="connect">Launch App</button>
                    </RouterLink>

                    <div v-else>
                        <button v-if="!requesting.valueOf()" @click="requesting = !requesting" class="connect">
                            Connect Wallet
                        </button>

                        <div v-else style="display: flex; gap: 16px; align-items: center;">
                            <button v-if="!store.state.suiAddress" class="connect" @click="sui.onClick()">
                                Connect to SUI
                            </button>

                            <button v-else class="connect">
                                {{ Converter.fineHash(store.state.suiAddress, 5) }}
                            </button>

                            <button v-if="!store.state.ethAddress" class="connect" @click="modal.open()">
                                Connect to Avalanche
                            </button>

                            <button v-else class="connect">
                                {{ Converter.fineHash(store.state.ethAddress, 5) }}
                            </button>

                            <RouterLink v-if="store.state.ethAddress && store.state.suiAddress" class="faucet"
                                to="/faucet">
                                ⛽</RouterLink>
                        </div>
                    </div>
                </div>
            </header>
            <SignInWithSui ref="sui" :visible="false" defaultChain="sui:testnet" @adapter="onAdapter"
                @connected="onSuiConnected" @disconnected="onSuiDisConnected" />
        </div>
    </section>
</template>

<script setup lang="ts">
import { createWeb3Modal } from '@web3modal/wagmi/vue';
import { useWeb3Modal } from '@web3modal/wagmi/vue';
import { watchAccount } from '@wagmi/core';
// @ts-ignore
import { SignInWithSui } from 'vue-sui';
import Converter from '@/scripts/converter';
import { config, projectId, chains } from '../scripts/config';
// @ts-ignore
import { useStore } from 'vuex';
import { key } from '../store';
import { onMounted, ref } from 'vue';
import OrbitalIcon from './icons/OrbitalIcon.vue';

const sui = ref<SignInWithSui | null>(null);
const requesting = ref(false);

const store = useStore(key);

const onSuiConnected = (address: string) => {
    store.commit('setSuiAddress', address);
};

const onSuiDisConnected = () => {
    store.commit('setSuiAddress', null);
};

const onAdapter = (adapter: any) => {
    store.commit('setSuiAdapter', adapter);
};

createWeb3Modal({
    wagmiConfig: config,
    projectId: projectId,
    // @ts-ignore
    chains: chains,
    enableAnalytics: true
});

const modal = useWeb3Modal();

onMounted(() => {
    watchAccount(config, {
        onChange(account: any) {
            store.commit('setEthAddress', account.address);
        }
    });
});
</script>

<style scoped>
section {
    position: sticky;
    top: 0;
    z-index: 10;
}

header {
    width: 100%;
    height: 100px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.logo svg {
    width: 150px;
}

.logo,
.action {
    min-width: 390px;
}

.tabs {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 6px;
    background: var(--background-light);
    border-radius: 8px;
}

.tab {
    padding: 0 20px;
    height: 45px;
    font-size: 16px;
    font-weight: 500;
    border-radius: 4px;
    color: var(--tx-dimmed);
}

.tab.active {
    color: var(--tx-normal);
    background: var(--background-lighter);
}

.action {
    display: flex;
    justify-content: flex-end;
    align-items: center;
}

.action button {
    height: 45px;
    min-width: 160px;
    border-radius: 16px;
    background: var(--primary);
    font-size: 18px;
    font-weight: 500;
    padding: 0 16px;
    color: var(--tx-normal);
}

.faucet {
    font-size: 18px;
}
</style>