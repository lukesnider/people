import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import './index.css'
import PN from './PN'
// import webpush from 'web-push'


new PN();

// Check if service workers are supported
// function checkNotificationPromise() {
//     try {
//       Notification.requestPermission().then();
//     } catch(e) {
//       return false;
//     }

//     return true;
//   }
// function askNotificationPermission() {
//     // function to actually ask the permissions
//     function handlePermission(permission) {
//       // set the button to shown or hidden, depending on what the user answers
//       if(Notification.permission === 'denied' || Notification.permission === 'default') {
//         console.log('notifications NOT allowed')
//       } else {
//         console.log('notifications allowed')
//       }
//     }
//     // Let's check if the browser supports notifications
//     if (!('Notification' in window)) {
//       console.log("This browser does not support notifications.");
//     } else {
//       if(checkNotificationPromise()) {
//         Notification.requestPermission()
//         .then((permission) => {
//           handlePermission(permission);
//         })
//       } else {
//         Notification.requestPermission(function(permission) {
//           handlePermission(permission);
//         });
//       }
//     }
//   }

//   askNotificationPermission();




// createApp(App).use(store).use(router).mount('#app')




