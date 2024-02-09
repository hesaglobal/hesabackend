const { status} = require('../db/constant')
const customercarequeriesSchema = new mongoose.Schema({
    userId: {
        type: ObjectId,
        ref: "User"
    },
    queryId:Number,
    fileId: {
        type: ObjectId,
        ref: "uploadrecords"
    },
    customer: {
        type: ObjectId,
        ref: "customers"
    },
    Name:String,
    Nature:String,
    Message:String,
    productType:String,
    Complaint:String,
    address:String,
    concernedDepartment:[
        {
            type:ObjectId,
            ref:"departments"
        }
    ],
    instruction:String,
    Type:String,
    category:String,
    staff:[
        {
            type:ObjectId,
            ref:"staff"
        }
    ],
    queryStatus:{
        type:String,
        enum:status,
        default:status[4]
    },
    lastDueDay:{
        type:Number
    }
}, {
    timestamps: true,
}
)
customercarequeriesSchema.pre('save', async function (next) {
    const highestQuery = await this.constructor.findOne({}, {}, { sort: { queryId: -1 } });
    this.queryId = (highestQuery && highestQuery.queryId + 1) || 1;
})
module.exports = {
    customercarequeriesModel: mongoose.model('customercarequeries', customercarequeriesSchema),
};

