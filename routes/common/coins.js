const express = require('express');
const { CoinsController } = require('../../controller/common');
const router = express.Router();
router.get('/',CoinsController.getCoinsLeft);
module.exports=router;
