const { ipcRenderer } = require('electron');

document.getElementById('menu-back').addEventListener('click', () => {
    ipcRenderer.send('menu-principal');
});