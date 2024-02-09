const { availableLanguages } = require('../db/constant')
const customerCareTranscribedFileSchema = new mongoose.Schema({
    userId: {
        type: ObjectId,
        ref: "User"
    },
    fileId: {
        type: ObjectId
    },
    editedContent: {
        type: String
    },
    content: {
        type: String
    },
    editedLang: {
        type: String,
        enum: availableLanguages
    }

}, {
    timestamps: true,
}
)

module.exports = {
    customerCareTranscribedFilesModel: mongoose.model('customercaretranscribedfiles', customerCareTranscribedFileSchema),
};

