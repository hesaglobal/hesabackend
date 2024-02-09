const express = require('express');
const { EnrollmentController } = require('../../controller/client');
const router = express.Router();
router.get('', EnrollmentController.get)
router.get('/searchCustomer',EnrollmentController.search)
router.delete('/delete/:id',EnrollmentController.delete)
router.post('/add', EnrollmentController.add);
router.put('/update/:id', EnrollmentController.update);
router.get('/:id',EnrollmentController.getEnrollment)
module.exports = router;