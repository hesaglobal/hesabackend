const express = require('express');
const { SubCategoryController } = require('../../controller/client');
const router = express.Router();
router.get('', SubCategoryController.get)
router.delete('/delete/:id',SubCategoryController.delete)
router.post('/add', SubCategoryController.add);
router.get('/getAll', SubCategoryController.getAll)
router.patch('/update/:id', SubCategoryController.update);
router.get('/:categoryId', SubCategoryController.subcategoryByCategory);
module.exports = router;