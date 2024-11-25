const { ipcRenderer } = require('electron');
const { auth } = require('../../firebaseConfig');
const { signInWithEmailAndPassword } = require('firebase/auth');

// Captura o evento de submissão do formulário e realiza o login
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const errorMessage = document.getElementById('error-message');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            console.log('Usuário logado:', userCredential.user);
            ipcRenderer.send('login-sucesso'); // Envia o evento para redirecionar
        } catch (error) {
            console.error('Erro de login:', error);
            errorMessage.textContent = "Erro de login: " + error.message;
        }
    });
});
