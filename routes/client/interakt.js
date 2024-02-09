const express = require('express');
const { InteraktController } = require('../../controller/client');
const router = express.Router();
router.get('/list', InteraktController.getUploadedRecords)
module.exports = router;