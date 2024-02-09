const matchingStatusSchema = new mongoose.Schema({
    jobId: {
        type: ObjectId,
        ref: "Jobs"
    },
    matchedStatus: [
        {
            candidateId: ObjectId,
            matchingScore: Number
        }
  ],
},
    {
        timestamps: true,
    }
)

module.exports = {
    matchingStatusModel: mongoose.model('matchingstatus', matchingStatusSchema),
};
