const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

function createWindow() {
  const win = new BrowserWindow({
  width: 1200,
  height: 800,
  icon: path.join(__dirname, 'icon.png'), // ← добавлено
  webPreferences: {
    nodeIntegration: true,
    contextIsolation: false
    }
  });

  win.loadFile(path.join(__dirname, 'app', 'index.html'));
}

app.whenReady().then(createWindow);

// Guardar proyecto
ipcMain.on('auto-save-project', (event, { project }) => {
  const { pueblo, zona } = project;
  const dir = path.join(__dirname, 'geodata', pueblo);
  const filePath = path.join(dir, `${zona}.json`);

  try {
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(project, null, 2), 'utf-8');
    event.sender.send('project-saved', filePath);
  } catch (err) {
    dialog.showErrorBox("Error al guardar", err.message);
  }
});

// Cargar proyecto
ipcMain.on('load-project', async (event) => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: 'Selecciona archivo JSON',
    defaultPath: __dirname,
    filters: [{ name: 'JSON', extensions: ['json'] }],
    properties: ['openFile']
  });

  if (canceled || filePaths.length === 0) return;

  const filePath = filePaths[0];

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const project = JSON.parse(content);
    event.sender.send('project-loaded', project);
  } catch (err) {
    dialog.showErrorBox("Error al cargar archivo", err.message);
  }
});
