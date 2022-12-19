const router = require("express").Router();
const Busboy = require("busboy");
const fs = require("fs");
const path = require("path");
const uuid = require("uuid/v4");
const zip = require("express-zip");
const {
  parseForm,
  mkdirIfExist,
  readAllFile,
  transposeArray
} = require("../helpers/util");

var csvUploadeds = [];

// run first to get all file in contsent
loadCsv("neural");

function loadCsv(name) {
  
  
var uploadDir = "./public/" + name + "/uploads";

  csvUploadeds = [];
  readAllFile(
    uploadDir,
    (filename, header, content) => {
      const __1dArray = transposeArray(content);
      // return length of each ele in content by remove duplicate element.
      let uniq = __1dArray.map(ele => {
        const set = [...new Set(ele)];
        return set.length;
      });
      csvUploadeds.push({
        filename,
        header,
        uniq
      });
    },
    err => {
      console.log(err);
    }
  );
}


router.post("/neural/csv_datas", async (req, res) => {
  const busboy = new Busboy({ headers: req.headers });
  var newFilename = uuid();
  busboy.on("file", (fieldname, file, filename, encoding, mimeType) => {
    newFilename = filename;
    // newFilename += filename;
    const saveTo = path.join("./public/neural/uploads", newFilename);
    if (!mimeType.includes("application/vnd.ms-excel"))
      return res.status(403).json(`file type should be text/csv`);
    file.pipe(fs.createWriteStream(saveTo));
  });
  busboy.on("finish", function() {
    // update csv file list
    loadCsv("neural");
    // send back
    res.status(200).json({
      status: "OKE",
      msg: "Write file finished",
      file_name: newFilename
    });
  });
  req.pipe(busboy);
});

router.get("/neural/export_model", async (req, res) => {
  const modelToken = req.query.modelToken;
  res.zip([
    {
      path: `./public/neural/models/${modelToken}/model.json`,
      name: "model.json"
    },
    {
      path: `./public/neural/models/${modelToken}/weights.bin`,
      name: "weights.bin"
    }
  ]);
});

router.post("/neural/upload_models", async (req, res, next) => {
  try {
    const files = await parseForm(req);
    for (const [i, file] of files.entries()) {
      const { fileBuffer, ...fileParams } = file;
      // console.log("file buffer", fileBuffer);
      console.log(`file type ${fileParams.fileType}`);
      if (
        fileParams.fileType != "application/json" &&
        fileParams.fileType != "application/octet-stream"
      ) {
        console.log("type fail");
        return res.status(400).json({
          msg: "Your file does not match with the model file type"
        });
      } else {
        const saveTo = path.join(`./public/neural/test_model`, fileParams.fileName);
        fs.writeFile(saveTo, fileBuffer[i], err => {
          if (err) {
            console.log("write file faile");
            return res.status(403).json({
              msg: "Fail when upload your file"
            });
          }
        });
      }
    }
    return res.status(200).json({
      msg: "Ready for predict new model"
    });
  } catch (err) {
    console.log("parse form fail");

    return res.status(403).send(`file err` + err);
  }
});

router.get("/neural/list_csv", (req, res) => {
  res.status(200).json(JSON.stringify(csvUploadeds));
});

module.exports = router;
