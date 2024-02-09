const express = require('express');
const { CustomerCareController, MessageController } = require('../../controller/client');
const router = express.Router();
router.get('', CustomerCareController.getUploadedRecords) 
router.patch('/update/:fileId',CustomerCareController.updateRecord);
router.get('/getContent/:fileId',CustomerCareController.getContent);
router.delete('/deleteContent',CustomerCareController.deleteContent)
router.post('/audio',CustomerCareController.getTranscription);
router.post('/translate/:fileId',CustomerCareController.getTranslation);
router.get('/queries',CustomerCareController.getQueries)
module.exports = router;
