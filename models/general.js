const { transcribedStatus ,transcribedViews} = require('../db/constant')
const generalSchema = new mongoose.Schema({
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
    generalModel: mongoose.model('general', generalSchema),
};
