const { transcribedStatus ,transcribedViews, PersonTypes} = require('../db/constant')
const jobsSchema = new mongoose.Schema({
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
    },
    customer: {
        type: ObjectId,
        ref: "customers"
    },
    personType:{
        type:String,
        enum:PersonTypes
    }
},

    {
        timestamps: true,
    }
)

module.exports = {
    jobsModel: mongoose.model('jobs', jobsSchema),
};
