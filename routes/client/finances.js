const express = require('express');
const { FinanceController } = require('../../controller/client');
const router = express.Router();
router.get('',FinanceController.getUploadedRecords)
module.exports = router;

