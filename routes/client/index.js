const express = require('express');
const router = express.Router();
const {Auth}=require('../../middlewares')
router.use('/transcribed',Auth('Client'),require('./transcribe'))
router.use('/queries',Auth('Client'),require('./queries'))
router.use('/customercare',Auth('Client'),require('./customerCare'));
router.use('/jobs',Auth('Client'),require('./jobs'));
router.use('/finance',Auth('Client'),require('./finances'));
router.use('/translate',Auth('Client'),require('./translate'));
router.use('/general',Auth('Client'),require('./general'));
router.use('/ecommerce',Auth('Client'),require('./ecommerce'))
router.use('/inventory/category',Auth('Client'),require('./category'));
router.use('/inventory/subcategory',Auth('Client'),require('./subcategory'))
router.use('/inventory/items',Auth('Client'),require('./item'))
router.use('/hesaathi',Auth('Client'),require('./hesaathi'))
router.use('/staff',Auth('Client'),require('./staff'))
router.use('/customers',Auth('Client'),require('./customer'))
router.use('/grievances',Auth('Client'),require('./grievances'))
router.use('/interakt',Auth('Client'),require('./interakt'));
router.use('/realestate',Auth('Client'),require('./realEstate'));
router.use('/message',require('./message'));
router.use("/enrollment",Auth("Client"),require('./enrollment'))
router.use('/dashboard',Auth("Client"),require('./dashboard'));
router.use("/department",Auth("Client"),require("./department"));
router.use("/ondc",Auth("Client"),require("./ondc"));
router.use("/inventory",Auth("Client"),require("./inventory"))
module.exports=router
