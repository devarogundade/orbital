<script setup lang="ts">
import ArrowDownIcon from "@/components/icons/ArrowDownIcon.vue";
</script>

<template>
  <section>
    <div class="app_width">
      <div class="base_container">
        <div class="borrow_container">
          <div class="blur">
            <p>Research In Progress.</p>
          </div>

          <div class="borrow">
            <div class="principal">
              <div class="from_chain">
                <p>Chain:</p>
                <div class="chain">
                  <img src="/images/sui.png" alt="">
                  <p>SUI</p>
                  <ArrowDownIcon />
                </div>
              </div>

              <div class="input_token">
                <div class="input">
                  <div></div>
                  <div class="token">
                    <img src="/images/usdt.png" alt="">
                    <p>USDT</p>
                    <ArrowDownIcon />
                  </div>
                </div>
              </div>
            </div>

            <div class="principal">
              <div class="from_chain">
                <p>Chain:</p>
                <div class="chain">
                  <img src="/images/avax.png" alt="">
                  <p>Avalanche</p>
                  <ArrowDownIcon />
                </div>
              </div>

              <div class="input_token">
                <div class="input">
                  <div></div>
                  <div class="token">
                    <img src="/images/fud.png" alt="">
                    <p>FUD</p>
                    <ArrowDownIcon />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="details">
            <div class="fee">
              <p>Cross-chain fee.</p>
              <p>Estimated at <span>0 SUI</span> on SUI.</p>
            </div>

            <div class="action">
              <button>Execute</button>
            </div>
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
  position: relative;
}

.blur {
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  width: 100%;
  height: 100%;
  z-index: 5;
  backdrop-filter: blur(4px);
  border-radius: 16px;
  color: var(--tx-normal);
  font-size: 24px;
  font-weight: 500px;
  text-align: center;
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

.chain {
  padding: 0 12px;
  background: var(--background-light);
  border-radius: 24px;
  height: 30px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.chain p {
  font-size: 14px;
  font-weight: 500;
  color: var(--tx-normal);
}

.chain img {
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

.input>div:first-child {
  color: var(--tx-normal);
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  padding: 0 16px;
  height: 100%;
  width: 100%;
}

.token {
  border-left: 1px solid var(--background-lighter);
  padding: 0 16px;
  height: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
}

.token p {
  font-size: 14px;
  font-weight: 500;
  color: var(--tx-normal);
}

.token img {
  width: 24px;
  height: 24px;
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

.table_container {
  width: 400px;
  min-height: 591px;
  border-radius: 16px;
  background: var(--background-lighter);
}
</style>