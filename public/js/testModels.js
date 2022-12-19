const listModels = document.getElementById('list-models');
const load_Model = document.getElementById('load-models');
const btnPredict = document.getElementById('btn-predict');

load_Model.addEventListener('submit', loadModel);
btnPredict.addEventListener('click', prediction);

var model = undefined;


fetch('api/list-models-tf')
    .then(response => response.json())
    .then(dt => {
        dt.forEach(element => {
            const item = document.createElement('option');
            item.textContent = element;
            listModels.appendChild(item);
        });
    })

async function loadModel(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const plainFormData = Object.fromEntries(formData.entries());
    const weights = `neural/models/${plainFormData.model}/model.json`;

    model = await tf.loadLayersModel(weights);
    model.summary();


    textConsole('Download model successfully');
}

async function prediction() {
    const sensor = document.getElementById('sensor');
    const input = sensor.value;
    const strInput = input.split(" ");

    const numInput = strInput.map(ele => {
        return parseInt(ele);
    });
    if (model) {
        const result = await model.predict(tf.tensor(numInput, [1, numInput.length])).arraySync();
        textConsole(JSON.stringify(result));
    } else {
        textConsole('Please choose model');
    }



}

function textConsole(msg) {
    console.log(msg);
    const txtConsole = document.getElementById('console');
    txtConsole.scrollTop = txtConsole.scrollHeight;
    txtConsole.append(msg + '\n');
}