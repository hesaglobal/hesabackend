const express = require('express');
const { InventoryController } = require('../../controller/client');
const router = express.Router();
const { Upload } = require('../../middlewares');
const inventoryController = require('../../controller/client/inventory.controller');
router.post('/upload', Upload.fields([{name:"zipFile",maxCount:1}]),InventoryController.uploadFiles)
router.get('/process', inventoryController.processFiles)
module.exports = router;
