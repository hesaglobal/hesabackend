const express = require('express');
const { RealEstateController } = require('../../controller/client');
const router = express.Router();
router.get('', RealEstateController.getUploadedRecords) 
router.patch('/update/:fileId',RealEstateController.updateRecord);
router.get('/getContent/:fileId',RealEstateController.getContent);
router.delete('/deleteContent',RealEstateController.deleteContent)
router.post('/audio',RealEstateController.getTranscription);
router.post('/translate/:fileId',RealEstateController.getTranslation);
router.get('/queries',RealEstateController.getQueries)
module.exports = router;