const { transcribedStatus,transcribedViews} = require('../db/constant')
const financeSchema = new mongoose.Schema({
    userId: {
        type: ObjectId,
        ref: "User"
    },
    status: {
        type: String,
        enum: transcribedStatus,
        default:transcribedStatus[0]
    },
    views:{
        type:[String],
        enum:transcribedViews,
        default:transcribedViews
    },
    file:{
        name:String,
        url:String
    }
},

    {
        timestamps: true,
    }
)

module.exports = {
    financeModel: mongoose.model('finances', financeSchema),
};
