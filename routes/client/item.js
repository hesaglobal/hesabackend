const express = require('express');
const { ItemController } = require('../../controller/client');
const router = express.Router();
router.get('', ItemController.get)
router.delete('/delete/:id',ItemController.delete)
router.post('/add', ItemController.add);
router.patch('/update/:id', ItemController.update);
router.get('/getItem/:id',ItemController.getItem);
module.exports = router;
