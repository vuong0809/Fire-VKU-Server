const btnConnect = document.getElementById('btn_connect');
const videoView = document.createElement('video');
// const results = document.getElementById('results');
const results = document.createElement('canvas');
const camera = document.getElementById('view-Cam');
const userID = document.getElementById('user_id');
const btnPredict = document.getElementById('btn_predict');
const ViewResults = document.getElementById('ViewResults');
const fire_w = document.getElementById('fire-w');
const fire_h = document.getElementById('fire-h');

const temp = document.getElementById('temp');
const humi = document.getElementById('humi');
const mois = document.getElementById('mois');
const smoke = document.getElementById('smoke');

const socket = io();

const ctx = results.getContext("2d");

btnPredict.addEventListener('click', test_prediction);
btnConnect.addEventListener('click', Serial);

const weightsSensor = '/neural/test_model/model.json';

// const weights = 'yolov5s_web_model/model.json';
// const [modelWeight, modelHeight] = [256, 256];
// const names = ['person', 'bicycle', 'car', 'motorcycle', 'airplane', 'bus', 'train', 'truck', 'boat', 'traffic light',
//     'fire hydrant', 'stop sign', 'parking meter', 'bench', 'bird', 'cat', 'dog', 'horse', 'sheep', 'cow',
//     'elephant', 'bear', 'zebra', 'giraffe', 'backpack', 'umbrella', 'handbag', 'tie', 'suitcase', 'frisbee',
//     'skis', 'snowboard', 'sports ball', 'kite', 'baseball bat', 'baseball glove', 'skateboard', 'surfboard',
//     'tennis racket', 'bottle', 'wine glass', 'cup', 'fork', 'knife', 'spoon', 'bowl', 'banana', 'apple',
//     'sandwich', 'orange', 'broccoli', 'carrot', 'hot dog', 'pizza', 'donut', 'cake', 'chair', 'couch',
//     'potted plant', 'bed', 'dining table', 'toilet', 'tv', 'laptop', 'mouse', 'remote', 'keyboard', 'cell phone',
//     'microwave', 'oven', 'toaster', 'sink', 'refrigerator', 'book', 'clock', 'vase', 'scissors', 'teddy bear',
//     'hair drier', 'toothbrush'
// ]

const weights = 'fire_web_model/model.json';
const [modelWeight, modelHeight] = [320, 320];
const names = ['fire']

var model = undefined;
var modelSenor = undefined;
var listCamera = undefined;
var port = undefined;
var fire_position = undefined;


// activate();

socket.on('connect', () => {
    console.log(socket.id);
});

load(weights, weightsSensor);

var gaugeOptions = {
    chart: {
        type: 'solidgauge'
    },
    title: null,
    pane: {
        center: ['50%', '80%'],
        size: '110%',
        startAngle: -90,
        endAngle: 90,
        background: {
            backgroundColor:
                Highcharts.defaultOptions.legend.backgroundColor || '#EEE',
            innerRadius: '60%',
            outerRadius: '100%',
            shape: 'arc'
        }
    },
    exporting: {
        enabled: false
    },
    tooltip: {
        enabled: false
    },

    // the value axis
    yAxis: {
        stops: [
            [0.1, '#55BF3B'], // green
            [0.5, '#DDDF0D'], // yellow
            [0.9, '#DF5353'] // red
        ],
        lineWidth: 0,
        tickWidth: 0,
        minorTickInterval: null,
        tickAmount: 2,
        title: {
            y: -30
        },
        labels: {
            y: 20
        }
    },

    plotOptions: {
        solidgauge: {
            dataLabels: {
                y: 10,
                borderWidth: 0,
                useHTML: true
            }
        }
    }
};

// The speed gauge
var chartSpeed = Highcharts.chart('container-speed', Highcharts.merge(gaugeOptions, {
    yAxis: {
        min: 0,
        max: 100,
        title: {
            text: 'predict'
        }
    },
    credits: {
        enabled: false
    },
    series: [{
        name: 'Speed',
        data: [0],
        dataLabels: {
            format:
                '<div style="text-align:center">' +
                '<span style="font-size:40px">{y} %</span><br/>' +
                // '<span style="font-size:12px;opacity:0.4">km/h</span>' +
                '</div>'
        },
        tooltip: {
            valueSuffix: ' km/h'
        }
    }]

}));

async function load(weights, weightsSensor) {
    model = await tf.loadGraphModel(weights);
    modelSenor = await tf.loadLayersModel(weightsSensor);
    // modelSenor.summary();
    viewListCamera();
}

navigator.mediaDevices.enumerateDevices().then(function (devices) {
    devices.forEach(element => {
        if (element.kind == 'videoinput' && element.label == "") {
            navigator.mediaDevices.getUserMedia({ video: true }).then(function () {
                location.reload();
            });
        }
        if (element.kind == 'videoinput') {
            listCamera = devices;
            return;
        }
    });
});

async function viewListCamera() {
    const list = document.getElementById('list_camera');
    listCamera.forEach(element => {
        if (element.kind == 'videoinput') {
            const item = document.createElement('div');
            item.className = 'mt-2';
            item.innerHTML = `
                                <a id = "${element.deviceId}" class="list-group-item list-group-item-action py-3 lh-tight" onclick="enableCam(this.id)">
                                    <div class="d-flex w-100 align-items-center justify-content-between">
                                        <strong class="mb-1">${element.label}</strong>
                                    </div>
                                    <div class="col-10 mb-1 small " style = "overflow: hidden" >${element.deviceId}</div>
                                </a>
                            `;
            list.appendChild(item);
        }
    });
}

function enableCam(device) {
    if (model) {
        results.style = '';
        var constraints = {
            video: {
                width: 1920,
                height: 1080,
                deviceId: device ? { exact: device } : undefined
            }
        };
        navigator.mediaDevices.getUserMedia(constraints).then(function (mediaStream) {
            videoView.srcObject = mediaStream;
            videoView.onloadedmetadata = function (e) {
                videoView.play();
            };
            videoView.addEventListener('loadeddata', predictWebcam);
        });
    }
    else console.log('model loading .....');
}

function predictWebcam() {
    const input = tf.tidy(() => {
        return tf.image.resizeBilinear(tf.browser.fromPixels(videoView), [modelWeight, modelHeight])
            .div(255.0)
            .expandDims(0);
    });
    model.executeAsync(input).then(res => {
        drawBox(res);
        tf.dispose([res, input]);
    });
    window.requestAnimationFrame(predictWebcam);
}

const drawBox = (res) => {
    // // results.width = camera.offsetWidth;
    // results.height = results.width * 9 / 16
    ctx.clearRect(0, 0, results.width, results.height);
    ctx.drawImage(videoView, 0, 0, results.width, results.height);

    ctx.font = "40px Arial";
    ctx.fillStyle = "#FFFF00";
    ctx.fillText('|', results.width / 2, 0);

    const [boxes, scores, classes, valid_detections] = res;
    const boxes_data = boxes.dataSync();
    const scores_data = scores.dataSync();
    const classes_data = classes.dataSync();
    const valid_detections_data = valid_detections.dataSync()[0];

    var a = [], b = [], prev, result = '';
    for (i = 0; i < valid_detections_data; ++i) {
        if (classes_data[i] !== prev) {
            a.push(names[classes_data[i]]);
            b.push(1);
        } else b[b.length - 1]++;
        prev = classes_data[i];
    }
    for (i = 0; i < a.length; i++) {
        result = result + a[i] + ': ' + b[i] + ', ';
    }

    ctx.font = "20px Arial";
    ctx.fillStyle = "#00FFFF";
    ctx.fillText(`${result} `, 5, 20);

    for (i = 0; i < valid_detections_data; ++i) {
        let [x1, y1, x2, y2] = boxes_data.slice(i * 4, (i + 1) * 4);
        x1 *= results.width;
        x2 *= results.width;
        y1 *= results.height;
        y2 *= results.height;
        const width = x2 - x1;
        const height = y2 - y1;
        const klass = names[classes_data[i]];
        const score = scores_data[i].toFixed(2);

        ctx.strokeStyle = "#00FFFF";
        ctx.lineWidth = 2;
        ctx.strokeRect(x1, y1, width, height);

        ctx.font = "15px Arial";
        ctx.fillStyle = "#00FFFF";
        ctx.fillText(`${klass} ${score}`, x1, y1);

        if (classes_data[i] == 0) {



            var fire_x = (x1 + x2) / 2;
            var fire_y = (y1 + y2) / 2;

            // var fire_x = 320;
            // var fire_y = 10;

            // ctx.font = "40px Arial";
            // ctx.fillStyle = "#FF0000";
            // ctx.fillText('x', fire_x, fire_y);

            const xy = MathLocation(fire_x, fire_y);
            fire_position = JSON.parse(`
                {
                    "position":{
                        "x": ${xy.H},
                        "y": ${xy.E}
                    },
                    "alarm":0,
                    "relay":0
                }
            `);
            return;

        }
    }

    // const xy = MathLocation(320, 0);
    // fire_position = JSON.parse(`
    //             {
    //                 "position":{
    //                     "x": ${xy.H},
    //                     "y": ${xy.E}
    //                 }
    //             }
    //         `);
}

function activate() {
    document.getElementById('block-test').style.display = "";
    document.getElementById('connect').removeChild(btnConnect);
    userID.disabled = true;
    const image = new Image(1260, 710);
    image.onload = drawImageActualSize;
    image.src = 'img/nocam/noCamera.jpg';

    const stream = results.captureStream(25);
    ViewResults.srcObject = stream;
    // ViewResults.play();

    function drawImageActualSize() {
        // results.width = camera.offsetWidth;
        results.width = 640;
        results.height = results.width * 9 / 16
        ctx.drawImage(this, 0, 0, results.width, results.height);
    }
}

async function Serial() {
    if (userID.value) {
        if (navigator.serial) {
            try {
                port = await navigator.serial.requestPort();
                await port.open({
                    baudRate: 9600
                });

                const decoder = new TextDecoderStream();
                port.readable.pipeTo(decoder.writable);
                const inputStream = decoder.readable;
                const reader = inputStream.getReader();

                activate();
                test();

                var rdata = '';
                while (true) {
                    const { value, done } = await reader.read();
                    if (value) {
                        rdata = rdata + value;
                        var text = Array.from(rdata);
                        var n = text.length;
                        if (text[n - 1] == '\n') {
                            PrintSerial('Serial Read: ' + rdata);
                            try {
                                const req = JSON.parse(rdata);
                                loop(req);
                            }
                            catch (error) { }
                            rdata = '';
                        }
                    }
                    if (done) {
                        reader.releaseLock();
                        break;
                    }
                }
            }
            catch (error) {
                PrintSerial(error);
            }
        }
        else {
            alert('Web Serial API not supported.');
        }
    }
    else alert('Vui lòng nhập User ID');
}

async function loop(req) {
    if (req.event_name == 'sensor-value') {

        // req.body[0] = req.body[0] + 10;
        // req.body[1] = req.body[1] - 10;

        const tempVal = req.body[0];
        const humiVal = req.body[1];
        const moisVal = req.body[2];
        const smokeVal = req.body[3];

        temp.innerHTML = tempVal;
        humi.innerHTML = humiVal;
        mois.innerHTML = moisVal;
        smoke.innerHTML = smokeVal;

        const pr = await prediction(req.body);

        if (chartSpeed) {
            const point = chartSpeed.series[0].points[0];
            point.update(pr);
        }
        if (pr > 80 && fire_position) {
            sendZalo(pr);
            fire_position.relay = 1
        }

        if (fire_position) {
            console.log(fire_position);
            sendGateway('fire_position', fire_position);
            fire_position = undefined;
        }
        const imgString = results.toDataURL();
        socket.emit('results', {
            imgString,
            tempVal,
            humiVal,
            moisVal,
            smokeVal,
            pr
        });
    }
}

function test() {
    setInterval(() => {
        var sensor = [getRandomInt(30), getRandomInt(100), 0.26, getRandomInt(2)];
        sendGateway('sensor-value', sensor);
    }, 2000);
}

function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

async function test_prediction() {
    const sensor = document.getElementById('sensor');
    const input = sensor.value;
    const strInput = input.split(" ");

    prediction(strInput);

}

async function prediction(strInput) {
    const numInput = strInput.map(ele => {
        return parseInt(ele);
    });

    var result = await modelSenor.predict(tf.tensor(numInput, [1, numInput.length])).arraySync()[0];
    result = result[1];
    result = result.toFixed(2);
    result *= 100;

    // if (chartSpeed) {
    //     const point = chartSpeed.series[0].points[0];
    //     point.update(result);
    // }

    // if (result > 80) {
    //     sendZalo(result);
    // }

    return result;

}

async function sendGateway(event, msg) {
    if (msg && port) {
        var frame = {};
        frame.event_name = event;
        frame.body = msg;
        const encoder = new TextEncoder();
        const writer = port.writable.getWriter();
        await writer.write(encoder.encode(`${JSON.stringify(frame)}\n`));
        writer.releaseLock();
        // PrintSerial('Serial Write: ' + JSON.stringify(frame) + '\n');
    }
    else PrintSerial('no data or port');
}

function sendZalo(pr) {

    const msg = `[Emergency Warning] Today December 24, 2021, current temperature is ${temp.textContent}°C , humidity is ${humi.textContent}% and smoke is detected, potential ${pr}% fire hazard. Please check immediately `
    // console.log(userID.value);
    console.log(msg);
    fetch('https://openapi.zalo.me/v2.0/oa/message', {
        method: 'POST',
        headers: {
            'access_token': 'nCtbMQ-e2Yl9o-THewmF9CFAu5UejNnWcDJYMFlqRMhctDPCtkvaVFhozMcQncz9h_JWVuViRcoxte95eTPdK8Blqdovn7PQqwtWGBUU13MtbvO7lRu11DkjbZFlhGays9wy7REa5XBOe8OAowuJAkt8crsAj01TaAQ99h2701MCXBarkB8H5O-9W3ckwcKpoyw1A_Fj1JpLwkb8ukyPKCJjgdVEop9lpVYzIDx-0MV4_kjtpkXKKkYFstJvhMa5_hFiFkItVpRdjkeopRv15DIVoI_afM84m8AE1CBd5n5rKb7TGgMo2oW ',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            "recipient": {
                "user_id": userID.value,
            },
            "message": {
                "text": msg,
                // "quote_message_id":data.message.msg_id
            }
        })
    })
        .then(response => response.json())
        .then(dt => {
            console.log(dt);
        });
}


function MathLocation(x, y) {

    x = x * 0.0264583333;
    y = y * 0.0264583333;

    x = x.toFixed(0);
    y = y.toFixed(0);

    // console.log(x+':'+y);

    const AD = fire_w.value;
    const EH = fire_h.value;
    const AH = AD / 2;
    const Hx = (AH - x);

    const HK = Math.sqrt((Hx * Hx) + (y * y));

    var H = (Math.atan(Hx / y)) * (180 / Math.PI);
    var E = (Math.atan(HK / EH)) * (180 / Math.PI);

    H = H.toFixed(0);
    E = E.toFixed(0);

    // console.log('góc E = ' + E);
    // console.log('góc H = ' + H);

    return { H, E };
}

function PrintSerial(msg) {
    const log = document.getElementById('Serial');
    log.scrollTop = log.scrollHeight;
    log.append(msg + '\n');
}

function mapValue(x, in_min, in_max, out_min, out_max) {
    return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}
