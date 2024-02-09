const express = require('express');
const { TranscribeController } = require('../../controller/client');
const router = express.Router();
router.post('/content',TranscribeController.getTranscriptionForQueries);
router.post('/updateContent/:fileId',TranscribeController.updateTranscribedContent)
router.get('/getContent/:fileId',TranscribeController.getContent)
router.patch('/update/:fileId',TranscribeController.update)
module.exports = router;
