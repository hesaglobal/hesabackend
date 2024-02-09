const express = require('express');
const { HesaathiController } = require('../../controller/client');
const router = express.Router();
router.get('/list', HesaathiController.getHesaathiList)
router.post('/add', HesaathiController.addHesaathi)
router.get('/get/:_id', HesaathiController.getHesaathi)
router.delete('/delete/:_id',HesaathiController.deleteHesaathi)
router.get('/searchHesaathi',HesaathiController.search)
module.exports = router;
