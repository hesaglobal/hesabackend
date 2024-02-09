const express = require('express');
const { TranscribeController } = require('../../controller/client');
const router = express.Router();
router.delete('/deleteContent',TranscribeController.deleteContent)
router.post('/audio',TranscribeController.getTranscriptionForQueries);
router.post('/updateContent/:fileId',TranscribeController.updateTranscribedContent)
router.get('/getContent/:fileId',TranscribeController.getContent)
router.get('/queries',TranscribeController.getQueries)
router.post('/general',TranscribeController.getGeneralTranscription)
router.post('/image',TranscribeController.getImageTranscription),
module.exports = router;
