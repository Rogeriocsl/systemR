const { initializeApp } = require('firebase/app');
const { getAuth, browserLocalPersistence, setPersistence } = require('firebase/auth');

const firebaseConfig = {
    apiKey: "AIzaSyDryQ2Hqe0aMkfKxmJIJej_GPUQ7g5LXR0",
    authDomain: "systemr-4877c.firebaseapp.com",
    projectId: "systemr-4877c",
    storageBucket: "systemr-4877c.firebasestorage.app",
    messagingSenderId: "76346580988",
    appId: "1:76346580988:web:cfad64e204195886cedc79",
    measurementId: "G-9H1YSVVT7X"
};

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);

// Configura a persistência para LOCAL (manter o login entre reinicializações da aplicação)
setPersistence(auth, browserLocalPersistence)
  .then(() => {
    console.log("PersistEncia configurada para LOCAL");
  })
  .catch((error) => {
    console.error("Erro ao configurar persistEncia: ", error);
  });

module.exports = { auth }; // Exporta o auth para ser usado em outros arquivos
