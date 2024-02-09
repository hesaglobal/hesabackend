const { transcribedStatus, transcribedViews } = require('../db/constant')
const ecommerceSchema = new mongoose.Schema({
    userId: {
        type: ObjectId,
        ref: "User"
    },
    customer: {
        type: ObjectId,
        ref: "customers"
    },
    status: {
        type: String,
        enum: transcribedStatus,
        default: transcribedStatus[0]
    },
    views: {
        type: [String],
        enum: transcribedViews,
        default: transcribedViews
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
    ecommerceModel: mongoose.model('ecommerce', ecommerceSchema),
};
