const express = require('express');
const app = express();
const http = require('http');
const https = require('https');
const ngrok = require('ngrok');
const cors = require("cors");
const mqtt = require('mqtt');
const fs = require('fs');

// const options = {
//     key: fs.readFileSync('config/ssl/key.pem'),
//     cert: fs.readFileSync('config/ssl/cert.pem')
// };

// const httpsServer = https.createServer(options, app);


// const mqttClient = mqtt.connect('mqtt://broker.hivemq.com');

// const mqttClient = mqtt.connect('63156a3d1fef45f8826b24ff258bb6e4.s1.eu.hivemq.cloud');

require('dotenv').config();

var httpPort = process.env.HTTP_PORT;
const httpServer = http.createServer(app);

// const { Server } = require("socket.io");
// const io = new Server(httpServer);

const io = require("socket.io")(httpServer, {
    cors: {
        methods: ["GET", "POST"]
    }
});

var listSocket = [];
var trainStartus = false;

app.set("view engine", "ejs");
app.set("views", "./views");
app.use(express.static('public'));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const indexRouter = require('./routes/index');
const adminRouter = require('./routes/admin');
const apiRouter = require('./routes/api');

app.use('/', indexRouter);
app.use('/admin', adminRouter);
app.use('/api', apiRouter);

app.use("/", require("./routes/mainRoutes"));
app.use("/", require("./routes/fileRoutes"));

// mqttClient.on('connect', () => {
//     mqttClient.subscribe('ntvuong');
//     console.log('mqtt Connect');
//     mqttClient.on('message', (topic, msg) => {
//         io.emit('sensor', msg.toString());
//     });
// });


io.on('connection', (socket) => {
    count = io.engine.clientsCount;
    listSocket.push(socket.id);
    // console.log('Socket number online', count);
    io.emit(socket.id, listSocket);
    socket.broadcast.emit('connect Socket', socket.id);

    socket.on('StreamID', msg => {
        socket.broadcast.emit('AllCam', msg);
    });

    socket.on('results', (msg) => {
        socket.broadcast.emit('results', msg);
    });

    socket.on('sensor', (msg) => {
        socket.broadcast.emit('sensor', msg);
    });

    socket.on('trainStartus', (msg) => {
        socket.broadcast.emit('dataset', '');
        io.emit('trainStartus', trainStartus);
    });
    socket.on('dataset', (msg) => {
        socket.broadcast.emit('dataset', msg);
    });
    socket.on('training', (msg) => {
        if (!trainStartus) {
            socket.broadcast.emit('training', msg);
        }
    });
    socket.on('TrainingDone', (msg) => {
        trainStartus = false;
        socket.broadcast.emit('trainStartus', trainStartus);
    });
    socket.on('TrainingStart', (msg) => {
        trainStartus = true;
        socket.broadcast.emit('trainStartus', trainStartus);
    });
    socket.on('CreateTrainingFile', (msg) => {
        socket.broadcast.emit('CreateTrainingFile', msg);
    });

    console.log('connect', socket.id);
    socket.on('disconnect', () => {
        console.log('disconnect', socket.id);
        count = io.engine.clientsCount;
        // console.log('Socket number online', count);
        listSocket = listSocket.filter((element) => {
            return element !== socket.id;
        });
        io.emit('disconnect Socket', socket.id);
    });
});

httpServer.listen(httpPort, () => {
    console.log('http listening on *:', httpPort);
});

(async function() {
    const url = await ngrok.connect({
        addr: httpPort,
        authtoken: process.env.NGROK_TOKEN
    });
    console.log(url);
  })();