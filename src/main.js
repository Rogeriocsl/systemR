const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { auth } = require('./firebaseConfig'); // Importa o auth do Firebase
const { onAuthStateChanged } = require('firebase/auth');

let janela; // Instância da janela principal

require('electron-reload')(path.join(__dirname, '..', 'src'), {
    electron: path.join(__dirname, '..', 'node_modules', '.bin', 'electron' + (process.platform === 'win32' ? '.cmd' : '')),
});

function createWindow() {
    janela = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true, // Permite o uso de require no frontend
            contextIsolation: false,
        }
    });

    // Verifica o estado de autenticação do usuário
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // Se o usuário estiver logado, carrega a tela principal
            console.log('Usuário logado:', user);
            janela.loadFile(path.join(__dirname, 'pages/menu/index.html')); // Carrega a tela principal
        } else {
            // Se o usuário não estiver logado, carrega a tela de login
            console.log('Usuário não logado');
            janela.loadFile(path.join(__dirname, 'pages/login/index.html')); // Carrega a tela de login
        }
    });

    // Abre DevTools para depuração (remova esta linha em produção)
    janela.webContents.openDevTools();
}

// Quando o app estiver pronto, cria a janela
app.whenReady().then(createWindow);

// Fechar a aplicação quando todas as janelas forem fechadas
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// Criar a janela novamente quando o ícone do aplicativo for clicado (macOS)
app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// Navegação para o menu principal após login bem-sucedido
ipcMain.on('login-sucesso', () => {
    janela.loadFile(path.join(__dirname, 'pages/menu/index.html'));
});

// Para a navegação no menu "Cadastro de Produtos"
ipcMain.on('abrir-cadastro-produtos', () => {
    janela.loadFile(path.join(__dirname, 'pages/CadastroProduto/index.html'));
});
