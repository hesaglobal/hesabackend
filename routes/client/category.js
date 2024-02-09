const express = require('express');
const { CategoryController } = require('../../controller/client');
const router = express.Router();
router.get('', CategoryController.get)
router.get('/getAll', CategoryController.getAll)
router.delete('/delete/:id',CategoryController.delete)
router.post('/add', CategoryController.add);
router.patch('/update/:id', CategoryController.update);
module.exports = router;
