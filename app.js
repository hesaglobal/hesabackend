const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');
const { env } = require('./db/constant');
const bodyParser = require('body-parser');
global.ObjectId = require('mongoose').Types.ObjectId;
global.mongoose = require('mongoose');
require('./db/config').configure(mongoose);
const { amqpConnectAndConsume} = require('./services/message/subscriber.service');
const app = express();
if (env.Logs === 'true') {
    logger.token('body', (req, res) => JSON.stringify(req.body, 0, 2));
    app.use(logger(`:method :url :status :response-time ms - :res[content-length] :body - :req[content-length]`));
}

app.use(cors());
app.use(bodyParser.json({ limit: '2480mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '2480mb' }));
app.use(cookieParser());
const webPath = './dist/WwAI/';
app.use(express.static(path.join(__dirname, webPath)));
app.use(express.static(path.join(__dirname, 'public')))
app.use('/api/admin', require('./routes/admin'));
app.use('/api/common', require('./routes/common'));
app.use('/api/client', require('./routes/client'));
app.use(['/admin', '/auth','/client', '/view','admin', 'auth', 'client','view'], (req, res) => {
    res.sendFile(path.join(__dirname, webPath + 'index.html'));
  });

amqpConnectAndConsume()
app.use('**', (req, res) => {
    res.status(404).json({ success: false, message: "Invalid router" })
});

global.badReqErr = (err) => {
    err.statusCode = 400;
    return err;
};
app.use((err, req, res, next) => {
    console.log('err:', err)
    if (err && err.code == 11000) {
        let { keyValue, keyPattern } = err;
        keyPattern = Object.keys(keyPattern)[0];
        keyValue = keyValue[keyPattern];
        if (keyPattern == 'email') err.message = 'This email already exist';
        if (keyPattern == 'phoneNo') err.message = 'This phone number already exist'
        return res.status(400).json({ success: false, message: err.message || 'Unexpected error occured!', error: err })
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') return res.status(400).json({ success: false, message: 'File uploading limit exceeded', error: err })
    if (err.statusCode == 400) return res.status(400).json({ success: false, message: err.message || 'Unexpected error occured!', error: err });
    return res.status(500).json({ success: false, message: err.message || 'Unexpected error occured!', error: err });
})

module.exports = app;






