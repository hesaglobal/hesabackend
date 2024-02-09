const express = require('express');
const { JobsController } = require('../../controller/client');
const router = express.Router();
router.get('',JobsController.getUploadedRecords);
router.post('/transcribe/audio', JobsController.getTranscription);
router.delete('/delete', JobsController.deleteTranscribedContent);
router.get("/candidate",JobsController.getQueriesCandidate);
router.get("/employer",JobsController.getQueriesEmployer);
router.get("/others",JobsController.getQueriesOthers);
module.exports = router;

