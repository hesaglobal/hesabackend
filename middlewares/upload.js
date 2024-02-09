const multer = require('multer');
const inMemoryStorage = multer.memoryStorage()
const upload = multer({ storage: inMemoryStorage })
module.exports = upload