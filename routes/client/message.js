const express = require('express');
const { MessageController } = require('../../controller/client');
const { Upload, Auth } = require('../../middlewares');

const router = express.Router();
router.post('/:userId', MessageController.addMessageThorughWhatsapp)
router.post("/uploadaudio",Upload.single("audio"),MessageController.addMessageThroughWeb);
module.exports = router;
