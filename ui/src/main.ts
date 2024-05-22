import './assets/main.css';

import { createApp } from 'vue';
// import axios from 'axios';
// import VueAxios from 'vue-axios';
import App from './App.vue';
import { store, key } from './store';
import router from './router';

const app = createApp(App);

app.use(store, key);

app.use(router);
// app.use(VueAxios, axios);

app.mount('#app');
