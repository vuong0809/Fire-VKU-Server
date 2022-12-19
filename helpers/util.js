const csv = require("csv-parser");
const fs = require("fs");
const Busboy = require("busboy");
const mkdirp = require("mkdirp");
const path = require("path");
function normalizeData(value, min, max) {
  if (min === undefined || max === undefined) {
    return value;
  }
  return (value - min) / (max - min);
}

function readCSV(path) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(path)
      .pipe(csv())
      .on("error", err => {
        console.log("error when reading file", err);
        return reject("error when reading file");
      })
      .on("data", data => {
        // check if content was not numeric data
        if (Object.values(data).some(isNaN)) {
          return reject("Csv data must be a numeric data");
        }
        results.push(data);
      })
      .on("end", () => {
        console.log("data loaded");
        return resolve(results);
      });
  });
}

function transposeArray(array) {
  return array[0].map((col, i) => array.map(row => row[i]));
}

async function readAllFile(dirName, onFileContent, onError) {
  fs.readdir(dirName, (err, filenames) => {
    if (err) {
      onError(err);
      return;
    }
    filenames.map(filename => {
      var content = [];
      var headers = [];
      fs.createReadStream(path.join(dirName, filename))
        .pipe(csv())
        .on("error", err => {
          onError(err);
        })
        .on("headers", header => {
          headers = header;
        })
        .on("data", data => {
          content.push(Object.values(data));
        })
        .on("end", () => {
          onFileContent(filename, headers, content);
        });
    });
  });
}

async function parseForm(req) {
  return new Promise((resolve, reject) => {
    const form = new Busboy({ headers: req.headers });
    const files = []; // create an empty array to hold the processed files
    const buffers = {}; // create an empty object to contain the buffers
    form.on("file", (field, file, filename, enc, mime) => {
      buffers[field] = []; // add a new key to the buffers object
      file.on("data", data => {
        buffers[field].push(data);
      });
      file.on("end", () => {
        files.push({
          fileBuffer: buffers[field],
          fileType: mime,
          fileName: filename,
          fileEnc: enc
        });
      });
    });
    form.on("error", err => {
      reject(err);
    });
    form.on("finish", () => {
      resolve(files);
    });
    req.pipe(form); // pipe the request to the form handler
  });
}

async function mkdirIfExist(saveDir) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(saveDir)) {
      mkdirp(saveDir).then(dir => {
        return resolve(`make dir finish`);
      });
    } else {
      return reject(`dir was created`);
    }
  });
}

module.exports.normalize = normalizeData;
module.exports.readCSV = readCSV;
module.exports.parseForm = parseForm;
module.exports.mkdirIfExist = mkdirIfExist;
module.exports.readAllFile = readAllFile;
module.exports.transposeArray = transposeArray;
