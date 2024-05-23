<script setup lang="ts">
import { ref } from 'vue';
import { chain, token } from '@/scripts/chains';
import { ethBorrow, ethRepay, suiBorrow, suiRepay } from '@/scripts/loan';
import Converter from '@/scripts/converter';
// @ts-ignore
import { useStore } from 'vuex';
import { key } from '../store';

const store = useStore(key);

const interchange = () => {
  let toTemp: number | null = loan.value.toChainId;

  loan.value.toChainId = loan.value.fromChainId;
  loan.value.fromChainId = toTemp;
  loan.value.interchange = !loan.value.interchange;

  toTemp = null;
};

const borrowing = ref(false);
const repaying = ref(null);

const loan = ref({
  amountIn: undefined,
  amountOut: undefined,
  tokenType: 0,
  fromChainId: 6,
  toChainId: 21,
  collateral: 'USDT',
  principal: 'BTC',
  interchange: false
});

const borrow = async () => {
  if (!store.state.ethAddress || !store.state.suiAddress) {

    return;
  }

  if (borrowing.value) {
    return;
  }

  if (!loan.value.amountIn || loan.value.amountIn == 0) {

    return;
  }

  // Check for Avalanche
  if (loan.value.fromChainId == 6) {
    borrowing.value = true;

    const tx = await ethBorrow(
      loan.value.toChainId,
      token(loan.value.collateral)!.addresses[6],
      token(loan.value.principal)!.addresses[6],
      Converter.toWei(loan.value.amountIn),
      store.state.suiAddress
    );

    if (tx) {

    } else {

    }

    borrowing.value = false;
  }

  // Check for SUI
  if (loan.value.fromChainId == 21) {
    borrowing.value = true;

    const tx = await suiBorrow(
      loan.value.toChainId,
      Converter.toWei(loan.value.amountIn),
      token(loan.value.collateral)!.addresses[21],
      token(loan.value.principal)!.addresses[21],
      store.state.suiAddress,
      store.state.suiAdapter
    );

    if (tx) {

    } else {

    }

    borrowing.value = false;
  }
};

const repay = async (loan: any, index: number) => {
  if (!store.state.ethAddress || !store.state.suiAddress) {

    return;
  }

  if (repaying.value) {
    return;
  }

  // Check for Avalanche. @reversed
  if (loan.fromChainId == 21) {
    repaying.value == index;

    const tx = await ethRepay(loan.loanId);

    if (tx) {

    } else {

    }

    repaying.value == null;
  }

  // Check for SUI. @reversed
  if (loan.fromChainId == 6) {
    repaying.value == index;

    // Calcalute estimated interest plus principal.
    const coinOutValue = "1000";

    const tx = await suiRepay(
      loan.loanId,
      Converter.toWei(coinOutValue),
      token(loan.value.principal)!.addresses[21],
      store.state.suiAdapter
    );

    if (tx) {

    } else {

    }

    repaying.value == null;
  }
};
</script>

<template>
  <section>
    <div class="app_width">
      <div class="base_container">
        <div class="borrow_container">
          <div class="borrow">
            <div class="collateral">
              <div class="token_type">
                <p>Asset Type:</p>
                <div class="tabs">
                  <button :class="loan.tokenType == 0 ? 'tab active' : 'tab'" @click="loan.tokenType = 0">Token</button>
                  <button :class="'tab'" style="cursor: not-allowed;">NFT</button>
                </div>
              </div>

              <div class="from_chain">
                <p>From:</p>
                <div class="chain">
                  <img :src="chain(loan.fromChainId)!.image" alt="">
                  <p>{{ chain(loan.fromChainId)!.name }}</p>
                </div>
              </div>

              <div class="input_token">
                <p>Enter amount:</p>
                <div class="input">
                  <input v-model="loan.amountIn" type="number" placeholder="0.00" />
                  <div class="token">
                    <img :src="token(loan.collateral)!.image" alt="">
                    <p>{{ token(loan.collateral)!.symbol }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="interchange">
            <button @click="interchange" :style="loan.interchange ? 'rotate: 180deg;' : ''">
              /
            </button>
          </div>

          <div class="borrow">
            <div class="principal">
              <div class="from_chain">
                <p>Loan-To-Vlalue:</p>
                <div class="chain">
                  <!-- <img src="/images/sui.png" alt=""> -->
                  <p>80%</p>
                </div>
              </div>

              <div class="from_chain">
                <p>Destination:</p>
                <div class="chain">
                  <img :src="chain(loan.toChainId)!.image" alt="">
                  <p>{{ chain(loan.toChainId)!.name }}</p>
                </div>
              </div>

              <div class="input_token">
                <p>Est. Principal:</p>
                <div class="input">
                  <input type="number" :value="loan.amountOut" disabled placeholder="0.00" />
                  <div class="token">
                    <img :src="token(loan.principal)!.image" alt="">
                    <p>{{ token(loan.principal)!.symbol }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="details">
            <div class="fee">
              <p>Cross-chain messaging fee.</p>
              <p>Estimated at <span>0 {{ chain(loan.fromChainId)!.native }}</span> on {{
                chain(loan.fromChainId)!.name }}.</p>
            </div>

            <div class="action">
              <button @click="borrow">Borrow</button>
            </div>
          </div>
        </div>

        <div class="table_container">
          <h3>My loans</h3>
          <div class="open_loans">
            <table>
              <thead>
                <tr>
                  <td>#</td>
                  <td>Collateral</td>
                  <td>Principal</td>
                  <td>Action</td>
                </tr>
              </thead>
              <tbody>
                <tr v-for="loan, index in 1" :key="index">
                  <td>{{ index }}</td>
                  <td>
                    <div class="table_collateral">
                      <div class="token">
                        <img src="/images/btc.png" alt="">
                        <p>0.1 BTC</p>
                      </div>
                      <div class="chain">
                        <img src="/images/avax.png" alt="">
                        <p>Polygon</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div class="table_principal">
                      <div class="token">
                        <img src="/images/usdt.png" alt="">
                        <p>10 USDT</p>
                      </div>
                      <div class="chain">
                        <img src="/images/sui.png" alt="">
                        <p>SUI</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <button @click="repay(loan, index)">Repay</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
section {
  padding: 40px 0;
}

.base_container {
  display: flex;
  gap: 50px;
  justify-content: center;
}

.borrow_container {
  display: flex;
  align-items: center;
  flex-direction: column;
  gap: 5px;
}

.borrow {
  width: 400px;
  border-radius: 16px;
  background: var(--background-lighter);
  display: flex;
  align-items: center;
  flex-direction: column;
}

.collateral {
  width: 100%;
}

.principal {
  padding-top: 14px;
  width: 100%;
}

.token_type {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px 24px 10px 24px;
  border-radius: 16px 16px 0 0;
  background: var(--background);
  border: 2px solid var(--background-lighter);
}

.token_type>p {
  font-size: 14px;
  font-weight: 500;
  color: var(--tx-dimmed);
}

.tabs {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  background: var(--background-light);
  border-radius: 8px;
}

.tab {
  padding: 0 16px;
  height: 30px;
  font-size: 14px;
  font-weight: 500;
  border-radius: 4px;
  color: var(--tx-dimmed);
}

.tab.active {
  color: var(--tx-normal);
  background: var(--background-lighter);
}

.from_chain {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 24px;
}

.from_chain>p {
  font-size: 14px;
  font-weight: 500;
  color: var(--tx-dimmed);
}

.borrow_container .chain {
  padding: 0 10px;
  background: var(--background-light);
  border-radius: 24px;
  height: 30px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.borrow_container .chain p {
  font-size: 14px;
  font-weight: 500;
  color: var(--tx-normal);
}

.borrow_container .chain img {
  width: 20px;
  height: 20px;
  border-radius: 10px;
}

.input_token {
  padding: 10px 24px 30px 24px;
}

.input_token>p {
  font-size: 14px;
  font-weight: 500;
  color: var(--tx-dimmed);
}

.input {
  margin-top: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 40px;
  background: var(--background-light);
  border-radius: 8px;
}

input {
  color: var(--tx-normal);
  font-size: 16px;
  font-weight: 500;
  border: none;
  outline: none;
  background: none;
  padding: 0 16px;
  height: 100%;
  width: 100%;
}

.borrow_container .token {
  padding: 0 16px;
  height: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
}

.borrow_container .token p {
  font-size: 14px;
  font-weight: 500;
  color: var(--tx-normal);
}

.borrow_container .token img {
  width: 20px;
  height: 20px;
  border-radius: 10px;
}

.interchange {
  width: 100%;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
}

.interchange>button {
  position: absolute;
  width: 45px;
  height: 45px;
  border-radius: 16px;
  background: var(--background-light);
  border: 3px solid var(--background);
  color: var(--tx-normal);
}

.details {
  margin-top: 20px;
  width: 400px;
  border-radius: 16px;
  background: var(--background-lighter);
  display: flex;
  align-items: center;
  flex-direction: column;
  overflow: hidden;
}

.fee {
  width: 100%;
  text-align: center;
  padding: 24px 24px 10px 24px;
}

.fee>p:first-child {
  font-size: 12px;
  font-weight: 500;
  color: var(--tx-dimmed);
}


.fee>p:last-child {
  margin-top: 8px;
  font-size: 14px;
  font-weight: 300;
  color: var(--tx-normal);
}

.fee>p:last-child span {
  font-weight: 500;
  color: var(--primary);
}

.action {
  width: 100%;
  padding: 10px 24px 24px 24px;
}

.action button {
  height: 45px;
  width: 100%;
  border-radius: 16px;
  background: var(--primary);
  font-size: 18px;
  font-weight: 500;
  color: var(--tx-normal);
}

/* .table_container {} */

.table_container>h3 {
  color: var(--tx-normal);
  font-size: 24px;
}

.open_loans {
  width: 450px;
  border-radius: 16px;
  background: var(--background-lighter);
  margin-top: 16px;
}

table {
  width: 100%;
}

thead {
  height: 60px;
}

thead td,
tbody td {
  color: var(--tx-normal);
  font-size: 16px;
  font-weight: 600;
}

td {
  padding: 0 16px;
}

.table_collateral {
  display: flex;
  flex-direction: column;
}

td button {
  height: 35px;
  padding: 0 20px;
  border-radius: 10px;
  background: var(--primary);
  font-size: 16px;
  font-weight: 500;
  border: none;
}

.table_container .token {
  padding: 0 6px;
  height: 100%;
  display: flex;
  align-items: center;
  gap: 6px;
}

.table_container .token p {
  font-size: 12px;
  font-weight: 500;
  color: var(--tx-normal);
}

.table_container .token img {
  width: 16px;
  height: 16px;
  border-radius: 10px;
}

.table_container .chain {
  padding: 0 6px;
  background: var(--background-light);
  border-radius: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  gap: 6px;
  width: fit-content;
  margin-top: 4px
}

.table_container .chain p {
  font-size: 12px;
  font-weight: 500;
  color: var(--tx-normal);
}

.table_container .chain img {
  width: 16px;
  height: 16px;
  border-radius: 10px;
}

tbody tr {
  height: 70px;
}
</style>