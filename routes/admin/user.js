const express = require('express');
const { UserController } = require('../../controller/admin');
const router = express.Router();
const { Upload } = require('../../middlewares')
router.delete('/delete/:id', UserController.delete);
router.get('/get/:id', UserController.get);
router.put('/edit/:id',  Upload.fields([{name:'pic', maxCount:1}, {name:'logo', maxCount:1}, {name:'qr', maxCount:1}]),UserController.update);
router.put('/changeStatus/:id',UserController.changeStatus);
router.get('/getAll', UserController.getAll);
router.post('/add', Upload.fields([{name:'pic', maxCount:1}, {name:'logo', maxCount:1}, {name:'qr', maxCount:1}]), UserController.add);
module.exports = router;