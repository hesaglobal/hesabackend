const express = require('express');
const router = express.Router();
const {Auth}=require('../../middlewares')
router.use('/users', Auth('Admin'), require('./user'))
module.exports=router;
