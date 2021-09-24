import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import './index.css'

import { defineCustomElements as defineIonPhaser } from '@ion-phaser/core/loader'
 
defineIonPhaser(window);

createApp(App).use(store).use(router).mount('#app')




