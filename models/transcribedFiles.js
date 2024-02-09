const {  modules,availableLanguages } = require('../db/constant')
const transcribedFileSchema = new mongoose.Schema({
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
    module:{
        type:String,
        enum:modules
    },
    editedLang:{
        type:String,
        enum:availableLanguages
    }
   
},{
        timestamps: true,
}
)

module.exports = {
    transcribedFilesModel: mongoose.model('transcribedfiles', transcribedFileSchema),
};

