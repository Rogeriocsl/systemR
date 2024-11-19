const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let janela;

function createWindow() {
    janela = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true, // Permite o uso de require no frontend
            contextIsolation: false,
        }
    });

    // Carrega a página de login ao iniciar o app
    janela.loadFile(path.join(__dirname, 'pages/login/index.html'));
    janela.webContents.openDevTools(); // Abre DevTools para depuração
}

// Quando o app estiver pronto, cria a janela
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// Navegação para o menu principal após login bem-sucedido
ipcMain.on('login-sucesso', () => {
    janela.loadFile(path.join(__dirname, 'pages/menu/index.html'));
});
