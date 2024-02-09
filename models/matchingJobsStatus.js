const matchingJobsStatusSchema = new mongoose.Schema({
    candidateId: {
        type: ObjectId,
        ref: "candidates"
    },
    matchedStatus: [
        {
            jobId: ObjectId,
            matchingScore: Number,
        }
  ],
},
    {
        timestamps: true,
    }
)

module.exports = {
    matchingJobsStatusModel: mongoose.model('matchingjobsstatus', matchingJobsStatusSchema),
};
