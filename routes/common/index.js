const express = require('express');
const router = express.Router();
const {Auth}=require('../../middlewares')
router.use('/',require('./auth'));
router.use('/upload',require('./upload'))
router.use('/coinsLeft',Auth("Client"),require('./coins'))
module.exports=router;
