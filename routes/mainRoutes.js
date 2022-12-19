const router = require("express").Router();
const fs = require("fs");
const path = require("path");
const tf = require("@tensorflow/tfjs");
const tfn = require("@tensorflow/tfjs-node");
const uuid = require("uuid/v4");
const {
  configModel,
  trainingData,
  trainModel,
  predictSample,
  ketqua_acc_sgd,
  ketqua_acc_adam,
  roc,
  datatest,
  datatest_y
} = require("../helpers/neural");
const { modelConfigValidation } = require("../helpers/formValidate");

var x_train;
var y_train;
var feature_count;
var output_count;

router.get("/", (req, res) => {
  res.send("WELCOME TO R-IOT SIMPLE TEACHABLE MACHINE");
});

//--------------------------------------------------
// NEURAL NETWORK ..................................
// config the layer and model
router.post("/neural/config_model", async (req, res, next) => {

  console.log(req.body);
  // res.send();
  const { filename, featureHeader, outputHeader, outputCount } = req.body;
  try {
    // validate form
    await modelConfigValidation.validateAsync({
      filename,
      featureHeader,
      outputHeader,
      outputCount
    });

    
    const featureCount = featureHeader.length;
    // check if file is exist or not
    if (!fs.existsSync(path.join("./public/neural/uploads", filename))) {
      return res.status(400).json({
        fileError: `This file ${filename} was not exist`
      });
    }


    // create training data
    const { xs, ys, error } = await trainingData(
      filename,
      featureHeader,
      outputHeader,
      featureCount,
      outputCount
    );
    
    // if errors respone error to client and exit
    if (error) {
      return res.status(400).json({
        configErr: error
      });
    }

    // Set data to global variable x_train,y_train,feature_count and output count
    x_train = xs;
    y_train = ys;
    feature_count = Number(featureCount);
    output_count = Number(outputCount);
    // respone 200 code to client
    return res.json({
      status: "OKE",
      msg: "Config model finshed, ready for training"
    });
  } catch (e) {
    return res.status(400).send(e);
  }
});

router.post("/neural/train_model", async (req, res, next) => {
  if (!x_train || !y_train) {
    return res.status(400).send(`You need to config model in step 2 first`);
  }
  const { batchSize, epoch, learningRate } = req.body;

  //train model with mode for default we set 100 to number of unit node
  const model = configModel(feature_count, output_count, 100);
  const info = await trainModel(
    model,
    x_train,
    y_train,
    Number(epoch),
    Number.parseInt(batchSize),
    Number(learningRate)
  );
  // console.log(`model info ${JSON.stringify(info)}`);
 


  // save mode to server
  let modelPath = uuid();
  await model.save(`file://./public/neural/models/${modelPath}`);
  //predict model
  
// var code=[];
//     for(i=0;i<360;i++){
//       const result = predictSample(array[i], model);
//       if(result[0][0]>0.4){
//         code[i]=0;
//       }else code[i]=1;

   var data_test=datatest();
   var data_test_y=datatest_y();
   
//     }
    
    // const result = predictSample([29.01,50,1.79,25.65,0.27], model);
    // console.log(result);
    // console.log(result[0][1]);
  //   var code=[];
  // var vitri=0 
  // for(i=0;i<1000;i++){
  //       const result = predictSample(data_test[i], model);
  //       var array_result=[(result[0][1]*100).toFixed(3),
  //                         (result[0][2]*100).toFixed(3),
  //                         (result[0][3]*100).toFixed(3),
  //                         (result[0][4]*100).toFixed(3),
  //                         (result[0][5]*100).toFixed(3),
  //                         (result[0][6]*100).toFixed(3)]
  //       var max = Math.max.apply(Math, array_result);                  
  //       for( j = 0; j < 6; j++){
  //         if(array_result[j] == max){
  //             vitri = j+1;
              
  //         }         
  //       }
  //       console.log(vitri)  ; 
      
  // }

  // for(i=0;i<10;i++){
  //   for(j=0;j<3;j++){
  //     console.log("hihi"+j)
  //   }
  // }
  
  // // const result = predictSample([30, 32,40,10], model);
  // console.log( result);
  // console.log("resultrfffff", result[0][0]);
  // // response to client
    // var TPR=[];
    // var FPR=[];
    // var threshold=[];
    // var giatritam_chay;
    // var giatritam_0chay;
    // var true1=0;
    // //dự báo đúng khả năng cháy rừng TP
    // var true0=0;
    // //dự báo đúng ko có khả năng cháy TN
    // var false1=0;
    // // dự báo sai ko cháy mà báo cháy FP
    // var false0=0;
    // //dự báo sai có cháy àm báo ko FN

    // for(i=0;i<=100;i++){
    //   for(j=0;j<1000;j++){
    //     const result = predictSample(data_test[j], model);
    //     if(result[0][1]>=(i/100)){
    //       giatritam_chay=1;
    //     } else 
    //     if(result[0][0]<(i/100)){
    //       giatritam_0chay=0;
    //     } 
    //     if(giatritam_chay==1 && giatritam_chay==data_test_y[j]){
    //       true1++;
         
    //     }
    //     if(giatritam_chay==1 && giatritam_chay!=data_test_y[j]){
    //       false1++;
    //     }
    //     if(giatritam_0chay==0 && giatritam_0chay==data_test_y[j]){
    //       true0++;
    //     }
    //     if(giatritam_0chay==0 && giatritam_0chay!=data_test_y[j]){
    //       false0++;
    //     }
        
    //   }

    // }
    
  
//     for(i=0;i<=100;i++){
//       for(j=0;j<1000;j++){
//         const result = predictSample(data_test[j], model);
//             if(result[0][1]>=(i/100)&&data_test_y[j]==1){
//               true1++;
//             } else
//             if(result[0][1]>=(i/100)&&data_test_y[j]==0){
//               false1++;
//             }else
//             if(result[0][1]<(i/100)&&data_test_y[j]==0){
//               true0++;
//             } else
//             if(result[0][1]<(i/100)&&data_test_y[j]!==0){
//               false0++;
//             }
//       }
//      TPR[i]=true1/(true1+false0);
//      FPR[i]=false1/(false1+true0);
//     //  threshold[i]=i/1000;
//     //  console.log(TPR[i]);
//     }
// for(i=0;i<=100;i++){
//   console.log(TPR[i]);
// }
// console.log("-----------------");
// for(i=0;i<100;i++){
//   console.log(FPR[i]);
// }
// for(i=0;i<20;i++){
//   console.log(i/20);
// }
    // console.log(true1);
    // console.log(true0);
    // console.log(false1);
    // console.log(false0);
    // console.log("TPR:"+true1/(true1+false0));
    // console.log("fPR:"+false1/(false1+true0));
   
    
    // const result = predictSample(data_test[2], model);
    // console.log(result);
    // for(j=0;j<100;i++){
    //   const result = predictSample(data_test[j], model);
    //   if(result[0][1]>0){
    //     giatritam=1;
    //   } else giatritam=0
    //   console.log(giatritam);
    //   }
    
    // for(j=0;j<700;j++){
    //       const result = predictSample(data_test[j], model);
    //       if(result[0][1]>0.4){
    //         giatritam_chay=1;
    //       } else giatritam_chay=0;
    //       console.log(giatritam_chay);
    //     }


    // console.log("--------------------------------")
    // const dudoan=predictSample([93.98,157.14,52.36,0.91,11.91,51.39],model);
    // console.log("dudoan:"+dudoan)
    // var array_result=[(dudoan[0][1]*100).toFixed(3),
    //                   (dudoan[0][2]*100).toFixed(3),
    //                   (dudoan[0][3]*100).toFixed(3),
    //                   (dudoan[0][4]*100).toFixed(3),
    //                   (dudoan[0][5]*100).toFixed(3),
    //                   (dudoan[0][6]*100).toFixed(3)]



    // var max = Math.max.apply(Math, array_result);                  
    // for( i = 0; i < 6; i++){
    //     console.log(array_result[i])
    //   }
    // //   console.log("----------------------")                    
   
    // var vitri=i  
    //   for( i = 0; i < 6; i++){
    //     if(array_result[i] == max){
    //         vitri = i+1;
    //     }}
    // // var array=[2,4,1,6,3,7]
    // // var max=0
    // // for( i = 0; i < 6; i++){
    // //   if(array[i] > max){
    // //       max = array[i];
    // //       console.log(max)
    // //   }}
  
    //   console.log("gia tri:"+max+"   vitri:"+vitri)
  



  res.json({
    status: "OK",
    msg: `model is trained`,
    data: {
      modelToken: modelPath,
      trainingInfo: { ...info.history, ...{ epoch: info.epoch } }
    }
  });
});


router.get("/neural/test_model_sgd", (req, res) => {
  res.status(200).json(JSON.stringify(ketqua_acc_sgd()));
  
  
});
router.get("/neural/test_model_adam", (req, res) => {
  res.status(200).json(JSON.stringify(ketqua_acc_adam()));
  
});

router.get("/neural/roc", (req, res) => {
  res.status(200).json(JSON.stringify(roc()));
  
});


router.get("/neural/predict", async (req, res) => {
  const { input } = req.query;
  // create handler to get model and weight file in to handler variable
  const handler = tfn.io.fileSystem(`./public/neural/test_model/model.json`);
  // now we can use tf.loadLayerModel like when we using in browser
  const model = await tf.loadLayersModel(handler);
  const strInput = input.split(" ");
  const numInput = strInput.map(ele => {
    return parseInt(ele);
  });
  const result = predictSample(numInput, model);
  res.status(200).send(result);
});

//--------------------------------------------------
// END NEURAL NETWORK ..............................
//--------------------------------------------------

module.exports = router;
