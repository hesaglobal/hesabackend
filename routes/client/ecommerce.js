const express = require('express');
const { EcommerceController } = require('../../controller/client');
const router = express.Router();
const { Upload } = require('../../middlewares')
router.get('', EcommerceController.getUploadedRecords)
router.delete('/deleteitem/:fileId',EcommerceController.deleteOrderItem)
router.post('/processorder', EcommerceController.processOrder);
router.get('/processorder/:orderId', EcommerceController.processOrderById);
router.patch('/updateitem/:fileId', EcommerceController.patchOrderItem);
router.get('/orders',EcommerceController.getOrders)
router.put('/addCustomer', EcommerceController.addCustomerForOrder);
router.put('/updateCustomer/:id',EcommerceController.updateCustomerForOrder)
router.put('/addPayment/:id', Upload.fields([{name:'receipt'}]),EcommerceController.addPayment)
router.post('/transcribe/image', EcommerceController.transcribeImage);
router.post('/transcribe/audio', EcommerceController.transcribeAudio);
router.get('/generateReceipt/:id',EcommerceController.generateReceipt);
router.put('/queue',EcommerceController.message)
module.exports = router;
