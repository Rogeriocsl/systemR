const { app, BrowserWindow, ipcMain, Menu } = require('electron');
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
        height: 800,
        webPreferences: {
            nodeIntegration: true, // Permite o uso de require no frontend
            contextIsolation: false,
        }
    });

    janela.setMinimumSize(900, 670);

    Menu.setApplicationMenu(null);

    // Força o título ao terminar de carregar qualquer página
    janela.webContents.on('did-finish-load', () => {
        janela.setTitle('System R');
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

    setTimeout(() => {
        janela.webContents.openDevTools({ mode: 'undocked' });
    }, 1000); // Atraso de 1 segundo

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

// Para a navegação no menu "Estoque de Produtos"
ipcMain.on('estoque-produtos', () => {
    janela.loadFile(path.join(__dirname, 'pages/estoque/index.html'));
});

// Para a navegação no menu "Estoque de Produtos"
ipcMain.on('venda-produtos', () => {
    console.log('Carregando venda...');
    console.log(path.join(__dirname, 'pages/venda/index.html'));
    janela.loadFile(path.join(__dirname, 'pages/venda/index.html'));
});


// Para a navegação no menu "Cadastro de Produtos"
ipcMain.on('menu-principal', () => {
    console.log('Carregando menu principal...');
    console.log(path.join(__dirname, 'pages/menu/index.html'));
    janela.loadFile(path.join(__dirname, 'pages/menu/index.html'));
});

