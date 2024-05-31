<script setup lang="ts">
import { Swiper, SwiperSlide } from 'swiper/vue';
import type { Swiper as SwiperType } from 'swiper/types';
import 'swiper/css';

import { ref } from 'vue';

const swiper = ref<SwiperType | null>(null);

const getSwiper = (swiperInstance: SwiperType) => {
  swiper.value = swiperInstance;
};
</script>

<template>
  <main>
    <section>
      <div class="app_width">
        <Swiper :slides-per-view="1" :space-between="20" @swiper="getSwiper">
          <SwiperSlide>
            <div class="announcement">
              <div class="announcement_gradient"></div>
              <img class="annoucement_bg" src="/images/space.webp" />
              <div class="announcement_content">
                <h3>Unlock the universe of decentralized finance with Orbital: Your gateway to limitless cross-chain
                  lending.</h3>
                <p>Built with Wormhole X Supra Oracles.</p>
              </div>
            </div>
          </SwiperSlide>

          <SwiperSlide>
            <div class="announcement">
              <img class="annoucement_bg" src="/images/sui-overflow.webp" />
              <div class="announcement_content">
                <h3>Sui Overflow: <br> Sui’s first global virtual hackathon.</h3>
                <p>Orbital is participating.</p>
              </div>
            </div>
          </SwiperSlide>
        </Swiper>

        <div class="announcement_nav">
          <button @click="swiper?.slidePrev()">Prev</button>
          <button @click="swiper?.slideNext()">Next</button>
        </div>
      </div>
    </section>

    <section>
      <div class="app_width">
        <div class="use_case">
          <div class="borrow">
            <div class="borrow_text">
              <h3>Cross-Chain Loans</h3>
              <p>Bridge your assets seamlessly with our cross-chain lending protocol on Sui: Where liquidity meets
                opportunity.</p>
              <RouterLink to="/borrow"><button>$ cd ../borrow</button></RouterLink>
            </div>

            <div class="borrow_image">
              <img src="/images/borrow.webp" alt="">
            </div>
          </div>

          <div class="lend">
            <div class="lend_image">
              <img src="/images/flash_loan.webp" alt="">
            </div>

            <div class="lend_text">
              <h3>Cross-Chain Flash Loans</h3>
              <p>A flash loan is a type of uncollateralized loan that allows you to borrow and repay within a single
                blockchain transaction.</p>
              <RouterLink to="/flash-loan"><button>$ cd ../flash_loans</button></RouterLink>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section>
      <div class="app_width">
        <div class="birth_container">
          <a href="https://youtu.be/rDJPmtL1cfA" target="_blank" rel="noopener noreferrer">
            <div class="birth">
              <img src="/images/birth.png" alt="" srcset="">
              <button>▶️ Watch Demo</button>
            </div>
          </a>
        </div>
      </div>
    </section>
  </main>
</template>

<style scoped>
section {
  padding: 40px 0;
}

.announcement {
  width: 100%;
  border-radius: 24px;
  border: 4px solid var(--background-light);
  overflow: hidden;
  position: relative;
}

.announcement img {
  position: absolute;
  z-index: -2;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.announcement_nav {
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
  padding: 0 16px;
}

.announcement_nav>button {
  height: 45px;
  padding: 0 20px;
  border-radius: 24px;
  background: var(--background-light);
  font-size: 16px;
  font-weight: 500;
  color: var(--primary);
}

.announcement_gradient {
  background-image: linear-gradient(to top, var(--background-lighter), transparent);
  position: absolute;
  z-index: -1;
  width: 100%;
  height: 100%;
}

.announcement_content {
  padding: 50px;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  height: 450px;
}

.announcement_content h3 {
  font-size: 40px;
  line-height: 55px;
  color: var(--tx-normal);
}

.announcement_content p {
  margin-top: 30px;
  font-size: 20px;
  color: var(--tx-dimmed);
}

.use_case {
  margin-top: 60px;
}

.borrow {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 100px;
  flex-wrap: wrap;
}

.borrow_text {
  width: 500px;
  max-width: 100%;
}

.borrow_text h3 {
  font-size: 40px;
  font-weight: 500;
  color: #C88579;
}

.borrow_text p {
  margin-top: 20px;
  font-size: 20px;
  line-height: 36px;
  color: var(--tx-dimmed);
}

.borrow_text button {
  margin-top: 60px;
  height: 45px;
  padding: 0 20px;
  border-radius: 16px;
  background: var(--background-light);
  font-size: 16px;
  font-weight: 500;
  color: var(--primary)
}

.borrow_image img {
  width: 400px;
  max-width: 100%;
}

/* lend */

.borrow_container {
  margin-top: 60px;
}

.lend {
  margin-top: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 100px;
  flex-wrap: wrap;
}

.lend_text {
  width: 500px;
  max-width: 100%;
}

.lend_text h3 {
  font-size: 40px;
  font-weight: 500;
  color: #699F8B;
}

.lend_text p {
  margin-top: 20px;
  font-size: 20px;
  line-height: 36px;
  color: var(--tx-dimmed);
}

.lend_text button {
  margin-top: 60px;
  height: 45px;
  padding: 0 20px;
  border-radius: 16px;
  background: var(--background-light);
  font-size: 16px;
  font-weight: 500;
  color: var(--primary)
}

.lend_image img {
  width: 400px;
  max-width: 100%;
}

.birth_container {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 80px 0;
  cursor: pointer;
}

.birth img {
  width: 850px;
  max-width: 100%;
}

.birth {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: rgba(0, 0, 0, 0.3) 0px 19px 38px, rgba(0, 0, 0, 0.22) 0px 15px 12px;
  border-radius: 20px;
  overflow: hidden;
}

.birth:hover button {
  transform: scale(1.1, 1.1);
}

.birth button {
  position: absolute;
  z-index: 1;
  height: 65px;
  padding: 0 40px;
  background: #d33a3a31;
  font-size: 18px;
  font-weight: 500;
  color: var(--tx-normal);
  border-radius: 20px;
  backdrop-filter: blur(8px);
}
</style>