// Modules to control application life and create native browser window
const { app, BrowserWindow } = require('electron')
const path = require('path')



// var mqtt = require('mqtt');
// var mosca = require('mosca');

// var pubsubsettings = {
//   //using ascoltatore
//   type: 'mongo',		
//   url: 'mongodb://localhost:27017/mqtt',
//   pubsubCollection: 'ascoltatori',
//   mongo: {}
// };

// const settings = {
//   port: 1883,
//   backend: pubsubsettings
// };

// var broker = new mosca.Server(settings);


// const express = require('express');
// const server = express();
// const http = require('http');

// const httpServer = http.createServer(server);
// const httpPort = 8080;

// // const apiRouter = require('./src/routes/api');
// // server.use('/', apiRouter);
// server.use(express.static('src/public'));


// httpServer.listen(httpPort, () => {
//   console.log('http listening on *:',httpPort);
// });






function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1000,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  })

  // and load the index.html of the app.
  // mainWindow.loadURL('http://localhost:8080/index.html');
  mainWindow.loadFile('src/public/index.html')

  // Open the DevTools.
  mainWindow.webContents.openDevTools();


  // mainWindow.webContents.on('select-serial-port', (event, portList, callback) => {
  //   event.preventDefault();
  //   let result = portList.find((device) => {
  //     return port.portName === 'COM9'
  //   })
  //   if (!result) {
  //     callback('');
  //   } else {
  //     callback(result.portId);
  //   }
  // });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
