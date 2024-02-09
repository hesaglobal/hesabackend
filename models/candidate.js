const candidateSchema = new mongoose.Schema({
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
    queryType:String,
    querySummary:String,
    queryAsk:String,
    Name:String,
    Nature:String,
    Message:String,
    skills:[String],
    instruction:String,
    jobType:String,
    Type:String,
    category:String,
    personType:String,
}, {
        timestamps: true,
  }
)
candidateSchema.pre('save', async function (next) {
    const highestQuery = await this.constructor.findOne({}, {}, { sort: { queryId: -1 } });
    this.queryId = (highestQuery && highestQuery.queryId + 1) || 1;
})
module.exports = {
    candidateModel: mongoose.model('candidates', candidateSchema),
};

