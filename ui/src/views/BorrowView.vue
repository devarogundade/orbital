<script setup lang="ts">
</script>

<template>
  <section>
    <div class="app_width">
      <div class="base_container">
        <div class="borrow_container">
          <div class="borrow">
            <div class="collateral">
              <div class="token_type">
                <p>Token Type:</p>
                <div class="tabs">
                  <button class="tab active">Token</button>
                  <button class="tab">NFT</button>
                </div>
              </div>

              <div class="from_chain">
                <p>From:</p>
                <div class="chain">
                  <img src="/images/base.png" alt="">
                  <p>Base</p>
                </div>
              </div>

              <div class="input_token">
                <p>Enter amount:</p>
                <div class="input">
                  <input type="number" placeholder="0.00" />
                  <div class="token">
                    <img src="/images/eth.png" alt="">
                    <p>ETH</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="interchange">
            <button>
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
                  <img src="/images/sui.png" alt="">
                  <p>Sui</p>
                </div>
              </div>

              <div class="input_token">
                <p>Est. Principal:</p>
                <div class="input">
                  <input type="number" disabled placeholder="0.00" />
                  <div class="token">
                    <img src="/images/usdt.png" alt="">
                    <p>USDT</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="details">
            <div class="fee">
              <p>Cross-chain messaging fee</p>
              <p>Estimated at <span>0.003 ETH</span> on Base.</p>
            </div>

            <div class="action">
              <button>Approve ETH</button>
            </div>
          </div>
        </div>

        <div class="table_container">
          <h3>Open loans</h3>
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
                <tr v-for="index in 5" :key="index">
                  <td>{{ index }}</td>
                  <td>
                    <div class="table_collateral">
                      <div class="token">
                        <img src="/images/eth.png" alt="">
                        <p>ETH</p>
                      </div>
                      <div class="chain">
                        <img src="/images/base.png" alt="">
                        <p>Polygon</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div class="table_principal">
                      <div class="token">
                        <img src="/images/eth.png" alt="">
                        <p>ETH</p>
                      </div>
                      <div class="chain">
                        <img src="/images/base.png" alt="">
                        <p>Polygon</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <button>Repay</button>
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
  gap: 100px;
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

.table_container {}

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
  gap: 4px;
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