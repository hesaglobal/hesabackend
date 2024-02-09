const { availableLanguages } = require('../db/constant')
const ondcTranscribedFileSchema = new mongoose.Schema({
    userId: {
        type: ObjectId,
        ref: "User"
    },
    ondcId:{
        type:"ObjectId",
        ref:"ondcs"
    },
    editedContent: {
        type: String
    },
    imageTranscription: {
        type: String
    },
    audioTranscription:{
        type:String
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
    ondcTranscribedFilesModel: mongoose.model('ondctranscribedfiles', ondcTranscribedFileSchema),
};

