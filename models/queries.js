const {  modules ,QueryStatus} = require('../db/constant')
const queriesSchema = new mongoose.Schema({
    userId: {
        type: ObjectId,
        ref: "User"
    },
    queryId:Number,
    fileId: {
        type: ObjectId,
        ref: "uploadrecords"
    },
    module:{
        type:String,
        enum:modules
    },
    customer: {
        type: ObjectId,
        ref: "customers"
    },
    queryType:String,
    querySummary:String,
    queryAsk:String,
    Name:String,
    Nature:String,
    Message:String,
    matchedStatus:[
    {
        matchedWith:ObjectId,
        matchingScore:Number
    }],
    skills:[String],
    productType:String,
    Quantity:String,
    Complaint:String,
    address:String,
    concernedDepartment:String,
    instruction:String,
    jobType:String,
    Type:String,
    category:String,
    personType:String,
    queryStatus:{
        type:String,
        enum:QueryStatus
    },
    contact:String,
    staff:[
        {
            type:ObjectId,
            ref:"staff"
        }
    ]
}, {
        timestamps: true,
  }
)
queriesSchema.pre('save', async function (next) {
    const highestQuery = await this.constructor.findOne({}, {}, { sort: { queryId: -1 } });
    this.queryId = (highestQuery && highestQuery.queryId + 1) || 1;
})
module.exports = {
    queriesModel: mongoose.model('queries', queriesSchema),
};

