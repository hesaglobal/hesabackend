const {  modules } = require('../db/constant')
const grievancesFileSchema = new mongoose.Schema({
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
    editedLang:String,
    editedLang:String,
    queryType:String,
    querySummary:String,
    queryAsk:String,
    Name:String,
    concernedDepartment:String,
    address:String,
    Category:String
},{
        timestamps: true,
}
)

module.exports = {
    GrievancesFilesModel: mongoose.model('grievancesfiles', grievancesFileSchema),
};

