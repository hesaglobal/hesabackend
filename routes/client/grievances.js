const express = require('express');
const { GrievancesController } = require('../../controller/client');
const router = express.Router();
router.get('',GrievancesController.getUploadedRecords)
router.get('/records',GrievancesController.getGrievances)
router.post('/transcription',GrievancesController.getTranscriptionForGrievance)
router.get('/content/:fileId',GrievancesController.getContent)
router.delete('/deleteGrievance',GrievancesController.deleteGrievance)
router.post('/updateContent/:fileId',GrievancesController.updateTranscribedContent)
router.post('/translate/:fileId',GrievancesController.getTranslation)
router.patch('/update/:fileId',GrievancesController.updateGrievance)
module.exports = router;

