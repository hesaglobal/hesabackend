const { availableLanguages } = require('../db/constant')
const realEstateTranscribedFileSchema = new mongoose.Schema({
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
    realEstateTranscribedFilesModel: mongoose.model('realEstatetranscribedfiles', realEstateTranscribedFileSchema),
};

