const express = require('express');
const { DepartmentController } = require('../../controller/client');
const router = express.Router();
router.delete('/delete/:id', DepartmentController.delete);
router.get('/:id', DepartmentController.get);
router.put('/update/:id',DepartmentController.update);
router.get('/', DepartmentController.getAll);
router.post('/add', DepartmentController.add);
module.exports = router;