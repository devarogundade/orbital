<template>
    <section>
        <div class="app_width">
            <div class="faucet">
                <button @click="requestFaucet">
                    {{ requesting?.valueOf() ? 'Requesting...' : 'Request test tokens.' }}</button>
            </div>
        </div>
    </section>
</template>

<script setup lang="ts">
// @ts-ignore
import { useStore } from 'vuex';
import { key } from '../store';
import { notify } from '@/reactives/notify';
import { mintAll } from '@/scripts/faucet';
import { ref } from 'vue';

const store = useStore(key);

const requesting = ref(false);

const requestFaucet = async () => {
    if (!store.state.ethAddress || !store.state.suiAddress) {
        notify.push({
            title: 'Connect your wallets first!',
            description: 'Then try again.',
            category: 'error'
        });
        return;
    }

    if (requesting.value) {
        return;
    }

    requesting.value = true;

    await mintAll(store.state.suiAddress, store.state.ethAddress);

    requesting.value = false;

    notify.push({
        title: 'Minting successful.',
        description: 'Your Orbital journey starts here.',
        category: 'success',
        linkTitle: 'Borrow now',
        linkUrl: `/borrow`
    });
};
</script>

<style scoped>
.faucet {
    padding: 40px 0;
    display: flex;
    justify-content: center;
}

.faucet button {
    height: 45px;
    min-width: 160px;
    border-radius: 16px;
    background: var(--primary);
    font-size: 18px;
    font-weight: 500;
    padding: 0 16px;
    color: var(--tx-normal);
}
</style>