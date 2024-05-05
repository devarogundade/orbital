<script setup lang="ts">
import { Swiper, SwiperSlide } from 'swiper/vue';
import type { Swiper as SwiperType } from 'swiper/types';
import 'swiper/css';

import { ref, watch } from 'vue';

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
              <img class="annoucement_bg"
                src="https://img.freepik.com/free-vector/cartoon-galaxy-background_23-2148973053.jpg?t=st=1714925481~exp=1714929081~hmac=ddb847bec7a31fb272ecd5035866427ccdc8d6e39e11d51f2fd80a4283ddbb61&w=1380" />
              <div class="announcement_content">
                <h3>Unlock the universe of decentralized finance with Orbital: Your gateway to limitless cross-chain
                  lending.</h3>
                <p>Built with Wormhole X Pyth Network.</p>
              </div>
            </div>
          </SwiperSlide>

          <SwiperSlide>
            <div class="announcement">
              <img class="annoucement_bg"
                src="https://assets-global.website-files.com/6425f546844727ce5fb9e5ab/65ddde15a859b34c7181a542_wave.webp" />
              <div class="announcement_content">
                <h3>Sui Overflow: <br> Sui’s first global virtual hackathon.</h3>
                <p>Orbital is participating.</p>
              </div>
            </div>
          </SwiperSlide>
        </Swiper>

        <div class="announcement_nav">
          <button @click="swiper?.slidePrev()">ann.prev()</button>
          <button @click="swiper?.slideNext()">ann.next()</button>
        </div>
      </div>
    </section>

    <section>
      <div class="app_width">
        <div class="use_case">
          <div class="borrow">
            <div class="borrow_text">
              <h3>Borrow</h3>
              <p>Bridge your assets seamlessly with our cross-chain lending protocol on Sui: Where liquidity meets
                opportunity."</p>
              <RouterLink to="/borrow"><button>borrow.start()</button></RouterLink>
            </div>

            <div class="borrow_image">
              <img src="https://cdn.pixabay.com/photo/2023/09/04/17/04/mars-8233226_640.png" alt="">
            </div>
          </div>

          <div class="lend">
            <div class="lend_image">
              <img src="https://cdn.pixabay.com/photo/2023/09/04/17/04/mars-8233226_640.png" alt="">
            </div>

            <div class="lend_text">
              <h3>Provide liquidity</h3>
              <p>Bridge your assets seamlessly with our cross-chain lending protocol on Sui: Where liquidity meets
                opportunity."</p>
              <RouterLink to="/earn"><button>earn.start()</button></RouterLink>
            </div>
          </div>
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
  color: var(--primary)
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
  height: 400px;
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
  color: #a66118;
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
  color: #10943c;
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
</style>