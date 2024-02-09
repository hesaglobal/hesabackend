const express = require('express');
const { GeneralController } = require('../../controller/client');
const router = express.Router();
router.get('',GeneralController.getUploadedRecords)
module.exports = router;
