const { transcribedStatus } = require('../db/constant')
const uploadRecords = new mongoose.Schema({
    userId: {
        type: ObjectId,
        ref: "User"
    },
    status: {
        type: String,
        enum: transcribedStatus,
        default: transcribedStatus[0]
    },
    file: {
        name: String,
        url: String
    }
},

    {
        timestamps: true,
    }
)

module.exports = {
    uploadRecordsModel: mongoose.model('uploadrecords', uploadRecords),
};

