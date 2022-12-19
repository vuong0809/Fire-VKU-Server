const btnTrainingCsv = document.getElementById('btn_train_csv');
const btnTraining = document.getElementById('btn_train');
const formTrain = document.getElementById('form_Train');
const formUpload = document.getElementById('form_upload');
const formUploadCsv = document.getElementById('form-upload-csv');
const listFile = document.getElementById('list-file');
const listData = document.getElementById('list-dataset');
const list_Csv = document.getElementById('list_csv');
const listInput = document.getElementById('list_input');
const listOutput = document.getElementById('list_Output');
const formcreatedataset = document.getElementById('form_create_dataset');
const outputCount = document.getElementById('outputCount');
const socket = io();

formTrain.addEventListener("submit", training);
formUploadCsv.addEventListener("submit", uploadData);
formUpload.addEventListener("submit", uploadData);
formcreatedataset.addEventListener("submit", create);

getData();
listCsv();

socket.on('connect', () => {
    textConsole(socket.id);
    socket.emit('trainStartus', '');
    socket.on('trainStartus', (msg) => {
        if (!msg) {
            btnTraining.disabled = false;
            btnTraining.innerHTML = `
            Training
            `;
        }
        else {
            btnTraining.disabled = true;
            btnTraining.innerHTML = `
            <span class="spinner-border spinner-border-sm"></span>
            Training..
            `;
        }
    });
    socket.on('dataset', (msg) => {
        msg.forEach(element => {
            const item = document.createElement('option');
            item.textContent = element;
            listData.appendChild(item);
        });
    });
});

async function uploadData(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const url = form.action;
    const method = form.method;
    const formData = new FormData(form);
    const res = await callAPI(url, method, formData);
    textConsole(JSON.stringify(res));
    // await getData();
    // await listCsv();

    location.reload();
}


$('#config_model').submit(function (event) {
    $.ajax({
        method: $(this).attr('method'),
        url: $(this).attr('action'),
        data: $(this).serialize(),
    }).done(function (response) {
        textConsole(JSON.stringify(response));
    });
    event.preventDefault();
});

$('#train_model').submit(function (event) {
    btnTrainingCsv.disabled = true;
    btnTrainingCsv.innerHTML = `
    <span class="spinner-border spinner-border-sm"></span>
    Training..
    `;
    $.ajax({
        method: $(this).attr('method'),
        url: $(this).attr('action'),
        data: $(this).serialize(),
    }).done(function (response) {
        btnTrainingCsv.disabled = false;
        btnTrainingCsv.innerHTML = `
        Training
        `;
        Chart(response);
        // textConsole(JSON.stringify(response));
    });
    event.preventDefault();
});



function Chart(response) {
    const data = response.data;

    
    const exModel = document.getElementById('export');
    exModel.href = `/neural/export_model?modelToken=${data.modelToken}`;
    
    exModel.style.display = '';

    Highcharts.chart('container', {

        title: {
            text: 'Model is trained'
        },

        subtitle: {
            text: data.modelToken
        },


        legend: {
            layout: 'vertical',
            align: 'right',
            verticalAlign: 'middle'
        },

        plotOptions: {
            series: {
                label: {
                    connectorAllowed: false
                },
                pointStart: 0
            }
        },

        series: [{
            name: 'loss',
            data: data.trainingInfo.loss
        }, {
            name: 'acc',
            data: data.trainingInfo.acc
        }],

        responsive: {
            rules: [{
                condition: {
                    maxWidth: 500
                },
                chartOptions: {
                    legend: {
                        layout: 'horizontal',
                        align: 'center',
                        verticalAlign: 'bottom'
                    }
                }
            }]
        }

    });
}

// $('#train_model').submit(function (event) {
//     btnTrainingCsv.disabled = true;
//     btnTrainingCsv.innerHTML = `
//     <span class="spinner-border spinner-border-sm"></span>
//     Training..
//     `;
//     $.ajax({
//         method: $(this).attr('method'),
//         url: $(this).attr('action'),
//         data: $(this).serialize(),
//     },function(data, status){
//         alert("Data: " + data + "\nStatus: " + status);
//       })
//     event.preventDefault();
// });

async function create(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const url = form.action;
    const formData = new FormData(form);
    var plainFormData = Object.fromEntries(formData.entries());
    plainFormData.nc = plainFormData.names.split(',').length;
    textConsole(JSON.stringify(plainFormData));
    socket.emit('CreateTrainingFile', plainFormData);
    // const responseData = await postAPI({ url, formData });
}

async function training(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const url = form.action;
    const formData = new FormData(form);
    const plainFormData = Object.fromEntries(formData.entries());
    textConsole(JSON.stringify(plainFormData));
    socket.emit('training', plainFormData);
    // const responseData = await postAPI({ url, formData });
}

async function callAPI(url, method, formData) {
    const fetchOptions = {
        method: method,
        body: formData
    };
    const response = await fetch(url, fetchOptions);
    if (!response.ok) {
        const errorMessage = await response.text();
        throw new Error(errorMessage);
    }
    return response.json();
}

async function getData() {
    listFile.innerHTML = '';
    fetch('api/list-file')
        .then(response => response.json())
        .then(dt => {
            dt.forEach(element => {
                const item = document.createElement('option');
                item.textContent = element;
                listFile.appendChild(item);
            });
        })
}

async function listCsv() {
    list_Csv.innerHTML = '';
    fetch('/neural/list_csv')
        .then(response => response.json())
        .then(res => {
            const data = res;
            const fetchFilename = [];
            const fetchHeader = [];
            const fetchFeatureLength = [];
            const dataArray = JSON.parse(res);
            var index;

            dataArray.map((file, i) => {
                fetchFilename.push({
                    label: file.filename,
                    value: file.filename
                });
                fetchHeader.push(file.header);
                fetchFeatureLength.push(file.uniq);
                return {};
            });
            list_Csv.addEventListener('click', loadInput);
            fetchFilename.forEach(e => {
                const item = document.createElement('option');
                item.textContent = e.label;
                item.value = e.value;
                list_Csv.appendChild(item);
            });
            function loadInput() {
                index = list_Csv.options.selectedIndex;
                listInput.innerHTML = '';
                const input = fetchHeader[index];
                listInput.addEventListener('click', loadOutput);
                input.forEach(element => {
                    const item = document.createElement('option');
                    item.textContent = element;
                    listInput.appendChild(item);
                });
            }
            function loadOutput() {
                listOutput.addEventListener('click', outputCount);
                const inputAll = fetchHeader[index];
                const input = $('#list_input').val()
                const output = inputAll.filter(item => !input.includes(item));
                listOutput.innerHTML = '';
                output.forEach(element => {
                    const item = document.createElement('option');
                    item.textContent = element;
                    listOutput.appendChild(item);
                });
                Count();
            }
            function Count() {
                const output = listOutput.value;
                const uniqFeature = fetchFeatureLength[index];
                const valueIndex = fetchHeader[index].indexOf(output);
                outputCount.value = uniqFeature[valueIndex];

            }

        })
}


function textConsole(msg) {
    console.log(msg);
    const txtConsole = document.getElementById('console');
    txtConsole.scrollTop = txtConsole.scrollHeight;
    txtConsole.append(msg + '\n');
}