
var scikit = require('scikit-learn');
var features = scikit.dataset('load_iris.data');
const router = require("express").Router();
const tf = require("@tensorflow/tfjs");
require("@tensorflow/tfjs-node");
const path = require("path");
const { normalize, readCSV } = require("./util");
const TRAIN_DATA_PATH = path.resolve("./public/neural/uploads");

/**
 * todo: setup training data
 * @param { String } file_name :String path to csv_file
 * @param { [ String ]} feature_header :The header of feature that used for training
 * @param {String or Number } output_header : Header csv that was the output user for training data
*/
var data_ketqua_sgd=null;
var data_ketqua_adam=null;
var array=[];
var arraydatatest=[];
var arraydatatest_y=[];
async function trainingData(
  file_name,
  feature_header,
  output_header,
  feature_count,
  output_count
) {
  try {
    // read the csv file to get all data
    const csv_data = await readCSV(path.join(TRAIN_DATA_PATH, file_name));
    // checking if object does not including props with header csv
    if (isOwnProperty(feature_header, output_header, csv_data) === false) {
      return {
        xs: null,
        ys: null,
        error: `feature or output doesn't match with the header of csv file`
      };
    }
    // format csv data to json object that can used for training
    let csv_transform = csv_data.map(data => {
      const x = feature_header.map(label => Number(data[label]));
      return {
        xs: x,
        ys: data[output_header]
      };
    });
    
    const x_train = csv_transform.map(ele => ele.xs);
    const y_train = csv_transform.map(ele => ele.ys);
    arraydatatest=x_train;
    arraydatatest_y=y_train;
 
    const xs = tf.tensor2d(x_train, [x_train.length, Number(feature_count)]);
    // onehot encoding : [0,1,2,3] giving 1 => [0,1,0,0];
    const ys = tf.oneHot(tf.tensor1d(y_train, "int32"), Number(output_count));
    return {
      xs,
      ys,
      error: null
    };
  } catch (e) {
    return {
      xs: null,
      ys: null,
      error: e
    };
  }
}

// check props of object
function isOwnProperty(feature_header, output_header, arr) {
  let isValid = true;
  if (!arr[0].hasOwnProperty(output_header)) {
    isValid = false;
  }
  feature_header.map(label => {
    if (!arr[0].hasOwnProperty(label)) {
      isValid = false;
    }
  });

  return isValid;
}

/*
todo: setup models
**/

function configModel(feature_count, output_count, unit_count) {
  const model = tf.sequential();
  // hidden config
  model.add(
    tf.layers.dense({
      inputShape: [feature_count],
      activation: "sigmoid",
      units: unit_count
    })
  );
  // fully connected layer
  // model.add(tf.layers.dense({ units: 175, activation: "relu" }));
  //output config
  model.add(
    tf.layers.dense({
      inputShape: unit_count,
      units: output_count,
      activation: "softmax"
    })
  );
  return model;
}

/**
 * todo : Void function take the model and train it
 * @param {*} model
 * @param {*} xs
 * @param {*} ys
 */
async function trainModel(
  model,
  xs,
  ys,
  epochs = 100,
  batchSize = 32,
  learningRate = 0.001
) {
  model.summary();
  // compiling model
  model.compile({
    optimizer: "adam",
    loss: "meanSquaredError",
    metrics: ["accuracy"]
  });

  const info = await model.fit(xs, ys, {
    epochs: epochs,
    batchSize: batchSize,
    evaluate:{xs,ys}
   
  });
  console.log(`train finish data_training`);

  var data_ketqua_acc_adam=null;



  data_ketqua_adam=data_ketqua_acc_adam;
  // console.log(model);
 

  return info;

}
function datatest() {
  var data_test=arraydatatest;
  return data_test;
}
function datatest_y() {
  var data_test_y=arraydatatest_y;
  return data_test_y;
}
function roc() {
  var ketqua_roc=array;
  return ketqua_roc;
  
}

function  ketqua_acc_sgd () {
  var ketqua1=data_ketqua_sgd;

   return ketqua1;

}
function  ketqua_acc_adam () {
  var ketqua2=data_ketqua_adam;
   return ketqua2;

}



/*
todo: setup predict using model
**/
function predictSample(sample, model) {
  let result = model.predict(tf.tensor(sample, [1, sample.length])).arraySync();
  return result;
}

async function run() {
  const { xs, ys } = await trainingData(
    6,
    6
  );
  xs.print();
  ys.print();

  const model = configModel(6, 6, 100);
  const info = await trainModel(model, xs, ys);
  // console.log(`model info ${JSON.stringify(info)}`);

}
// run();

module.exports = {router,
  configModel,
  trainingData,
  trainModel,
  predictSample,
  ketqua_acc_sgd,
  ketqua_acc_adam,
  roc,
  datatest,
  datatest_y
};
