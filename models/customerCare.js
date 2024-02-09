const { transcribedStatus ,transcribedViews} = require('../db/constant')
const customerCareSchema = new mongoose.Schema({
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
},

    {
        timestamps: true,
    }
)

module.exports = {
    customerCareModel: mongoose.model('customerCare', customerCareSchema),
};
