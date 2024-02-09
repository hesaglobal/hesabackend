const {  modules } = require('../db/constant')
const grievancesQueriesSchema = new mongoose.Schema({
    userId: {
        type: ObjectId,
        ref: "User"
    },
    queryId:Number,
    fileId: {
        type: ObjectId,
        ref: "grievances"
    },
    module:{
        type:String,
        enum:modules
    },
    queryType:String,
    querySummary:String,
    queryAsk:String,
    Name:String,
    address:String,
    concernedDepartment:String,
    Category:String,
}, {
        timestamps: true,
  }
)
grievancesQueriesSchema.pre('save', async function (next) {
    const highestQuery = await this.constructor.findOne({}, {}, { sort: { queryId: -1 } });
    this.queryId = (highestQuery && highestQuery.queryId + 1) || 1;
})
module.exports = {
    grievancesQueriesModel: mongoose.model('grievancesqueries', grievancesQueriesSchema),
};

