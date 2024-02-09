const express = require('express');
const { CustomerController } = require('../../controller/client');
const router = express.Router();
router.get('', CustomerController.get)
router.get('/searchCustomer',CustomerController.search)
router.delete('/delete/:id',CustomerController.delete)
router.post('/add', CustomerController.add);
router.put('/update/:id', CustomerController.update);
router.get('/:id',CustomerController.getCustomer)
module.exports = router;
