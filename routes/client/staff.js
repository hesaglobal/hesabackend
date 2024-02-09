const express = require('express');
const { StaffController } = require('../../controller/client')
const router = express.Router()
module.exports = router
router.post('/add', StaffController.add)
router.get('/getStaffs', StaffController.getStaffs)
router.put('/updateStaff/:id', StaffController.updateStaff)
router.delete('/deleteStaff/:id',StaffController.deleteStaff)
router.get('/searchStaff',StaffController.search)
router.get('/:id',StaffController.getStaffById)