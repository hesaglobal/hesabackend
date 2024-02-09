const express = require('express');
const { TranslateController } = require('../../controller/client');
const router = express.Router();
router.post('/:fileId',TranslateController.getTranslation)
module.exports = router;

