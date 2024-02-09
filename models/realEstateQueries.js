const { realEstateHolders} = require('../db/constant')
const realEstatequeriesSchema = new mongoose.Schema({
    userId: {
        type: ObjectId,
        ref: "User"
    },
    queryId:Number,
    fileId: {
        type: ObjectId,
        ref: "realestates"
    },
    customer: {
        type: ObjectId,
        ref: "customers"
    },
    Name:String,
    Message:String,
    address:String,
    instruction:String,
    Price:String,
    Area:String,
    Category:String,
    estateHolders:{
        type:String,
        enum:realEstateHolders
    },
}, {
    timestamps: true,
}
)
realEstatequeriesSchema.pre('save', async function (next) {
    const highestQuery = await this.constructor.findOne({}, {}, { sort: { queryId: -1 } });
    this.queryId = (highestQuery && highestQuery.queryId + 1) || 1;
})
module.exports = {
    realEstateQueriesModel: mongoose.model('realestatequeries', realEstatequeriesSchema),
};

