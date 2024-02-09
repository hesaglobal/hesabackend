const express = require('express');
const router = express.Router();
const { UploadController } = require('../../controller/common');
const { Auth, Upload } = require('../../middlewares')

router.post('/',[Auth('Client'), Upload.fields([{name:"file",maxCount:5}])],UploadController.uploadFiles);

module.exports = router;
