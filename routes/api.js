const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const fetch = require('node-fetch');

require('dotenv').config();


const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/datasets')
    },
    filename: (req, file, cb) => {
        if (file.mimetype.split("/")[1] == 'x-zip-compressed') {
            cb(null, file.originalname + '-' + Date.now() + '.zip');
            // cb(null, `${makeid(50)}.zip`);
        } else {
            cb(new Error("Not a zip File!!"), false);
        }
    }
})

const upload = multer({
    storage: storage
});


router.post('/update-dataset', upload.single('dataset'), (req, res) => {
    res.json(req.file);
});

router.get('/list-file', (req, res) => {
    const files = fs.readdirSync('./public/datasets');
    res.json(files);

});


router.get('/list-models-tf', (req, res) => {
    const files = fs.readdirSync('./public/neural/models');
    res.json(files);

});

router.get('/:path/:file', function (req, res, next) {
    var path = './data/' + req.params.path + '/' + req.params.file;
    var fd = fs.readFileSync(path, function (err) {
        if (err) res.send(err);
    });
    var data = JSON.parse(fd);
    res.json(data);
});

router.get('/zalo', (req, res) => {
    res.status(200).send();
});

router.post('/sendZalo', (req, res) => {
    
    fetch('https://openapi.zalo.me/v2.0/oa/message', {
        method: 'POST',
        headers: {
            'access_token': process.env.ZALO_ACCESS_TOKEN,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            "recipient": {
                "user_id": "3469747508247772258",
            },
            "message": {
                "text": `
                Cảnh báo nhà bạn sắp cháy: `,
                // "quote_message_id":data.message.msg_id
            }
        })
    })
        .then(response => response.json())
        .then(dt => {
            console.log(dt);
            res.send(dt);
        });
});

router.post('/zalo', (req, res) => {
    // const data = req.body;
    // const event = data.event_name;

    // if(event == 'user_send_text'){
    //     fetch('https://openapi.zalo.me/v2.0/oa/message', {
    //         method: 'POST',
    //         headers: {
    //             'access_token': process.env.ZALO_ACCESS_TOKEN,
    //             'Content-Type': 'application/json'
    //         },
    //         body: JSON.stringify({
    //             "recipient": {
    //                 // "user_id": data.sender.id,
    //                 "message_id":data.message.msg_id
    //             },
    //             "message": {
    //                 "text": `Bạn đã gửi tin nhắn:  ${JSON.stringify(data)}`,
    //                 // "quote_message_id":data.message.msg_id
    //             }
    //         })
    //     })
    //     .then(response => response.json())
    //     .then(res => {
    //         console.log(res);
    //     });
    // }
    // else {
    //     console.log(data);
    // }


    res.status(200).send();
});





// function makeid(length) {
//     var result = '';
//     var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
//     var charactersLength = characters.length;
//     for (var i = 0; i < length; i++) {
//         result += characters.charAt(Math.floor(Math.random() *
//             charactersLength));
//     }
//     return result;
// }

module.exports = router;