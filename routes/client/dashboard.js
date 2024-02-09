const express = require('express');
const { DashboardController } = require('../../controller/client');
const router = express.Router();
router.get('', DashboardController.getDashboardFields)
module.exports = router;
