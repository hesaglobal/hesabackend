const { transcribedStatus, endcFileTypes} = require('../db/constant')
const ondcSchema = new mongoose.Schema({
    userId: {
        type: ObjectId,
        ref: "User"
    },
    status: {
        type: String,
        enum: transcribedStatus,
        default:transcribedStatus[0]
    },
    file:[{
        name:String,
        url:String,
        type:endcFileTypes
    }],
    customer: {
        type: ObjectId,
        ref: "customers"
    },
},

    {
        timestamps: true,
    }
)

module.exports = {
    ondcModel: mongoose.model('ondc', ondcSchema),
};
