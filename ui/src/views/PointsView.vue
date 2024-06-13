<template>
    <section>
        <div class="app_width">
            <div class="points_container">
                <div class="points">
                    <h3>Total Earned Points</h3>
                    <p>☄️ {{ Converter.toMoney(points.valueOf()) }} ORBITS</p>
                </div>
                <button @click="claim">Claim</button>
            </div>
        </div>
    </section>
</template>

<script setup lang="ts">
// @ts-ignore
import { useStore } from 'vuex';
import { key } from '../store';
import { ref, onMounted, watch, computed } from 'vue';
import { getUserPoints } from '@/scripts/storage';
import Converter from '@/scripts/converter';
import { notify } from '@/reactives/notify';

const store = useStore(key);

const points = ref(0);
const requesting = ref(false);

const claim = async () => {
    if (!store.state.ethAddress || !store.state.suiAddress) {
        notify.push({
            title: 'Connect your wallets first!',
            description: 'Then try again.',
            category: 'error'
        });
        return;
    }

    notify.push({
        title: 'Claim coming soon.',
        description: 'Your Orbital journey continues.',
        category: 'error'
    });
};

const getPoints = async (suiAddress: string) => {
    requesting.value = true;
    points.value = await getUserPoints(suiAddress);
    requesting.value = false;
};

const suiAddressState = computed(() => store.state.suiAddress);

watch(suiAddressState, () => {
    if (store.state.suiAddress) {
        getPoints(store.state.suiAddress);
    }
});

onMounted(() => {
    if (store.state.suiAddress) {
        getPoints(store.state.suiAddress);
    }
});
</script>

<style scoped>
.points_container {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 40px;
    padding-top: 40px;
    flex-direction: column;
}

.points {
    min-width: 500px;
    padding: 40px;
    border: 6px dashed var(--background-lighter);
    border-radius: 16px;
    text-align: center;
}

.points h3 {
    color: var(--tx-normal);
    font-size: 20px;
    font-weight: 500;
}

.points p {
    margin-top: 10px;
    color: var(--tx-dimmed);
    font-size: 36px;
    font-weight: 600;
}

.points_container button {
    height: 45px;
    min-width: 160px;
    border-radius: 16px;
    background: var(--background-lighter);
    font-size: 18px;
    font-weight: 500;
    padding: 0 16px;
    color: var(--primary);
}
</style>