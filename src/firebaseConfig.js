const { initializeApp } = require('firebase/app');
const { getAuth } = require('firebase/auth');

const firebaseConfig = {
    apiKey: "AIzaSyDryQ2Hqe0aMkfKxmJIJej_GPUQ7g5LXR0",
    authDomain: "systemr-4877c.firebaseapp.com",
    projectId: "systemr-4877c",
    storageBucket: "systemr-4877c.firebasestorage.app",
    messagingSenderId: "76346580988",
    appId: "1:76346580988:web:cfad64e204195886cedc79",
    measurementId: "G-9H1YSVVT7X"
  };

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

module.exports = { auth };
