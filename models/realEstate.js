const { transcribedStatus,realEstateHolders} = require('../db/constant')
const realEstateSchema = new mongoose.Schema({
    userId: {
        type: ObjectId,
        ref: "User"
    },
    status: {
        type: String,
        enum: transcribedStatus,
        default:transcribedStatus[0]
    },
    estateHolders:{
        type:String,
        enum:realEstateHolders
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
    realEstateModel: mongoose.model('realestates', realEstateSchema),
};
