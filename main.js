// main.js — proceso principal de GeoEditor con soporte de IPC y estructura geodata/
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

// Crea la ventana principal
function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, 'app', 'icon.png'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  win.loadFile(path.join(__dirname, 'app', 'index.html'));
}

// Se ejecuta cuando la aplicación está lista
app.whenReady().then(createWindow);

// Maneja guardado automático en geodata/{pueblo}/{zona}.json
ipcMain.on('auto-save-project', (event, { project }) => {
  try {
    const pueblo = project.pueblo?.trim();
    const zona = project.zona?.trim();
    if (!pueblo || !zona) throw new Error("Faltan campos 'pueblo' o 'zona'");

    const folder = path.join(__dirname, 'geodata', pueblo);
    const filePath = path.join(folder, `${zona}.json`);
    fs.mkdirSync(folder, { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(project, null, 2), 'utf-8');

    event.sender.send('project-saved', filePath);
  } catch (err) {
    dialog.showErrorBox('Error al guardar proyecto', err.message);
  }
});

// Maneja la carga de proyecto desde archivo .json
ipcMain.on('load-project', async (event) => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: 'Seleccionar archivo de proyecto',
    defaultPath: path.join(__dirname, 'geodata'),
    filters: [{ name: 'JSON', extensions: ['json'] }],
    properties: ['openFile']
  });

  if (canceled || filePaths.length === 0) return;

  try {
    const raw = fs.readFileSync(filePaths[0], 'utf-8');
    const project = JSON.parse(raw);
    event.sender.send('project-loaded', project);
  } catch (err) {
    dialog.showErrorBox('Error al cargar archivo', err.message);
  }
});
