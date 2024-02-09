const ondcDescriptionSchema = new mongoose.Schema({
    userId: {
        type: ObjectId,
        ref: "User"
    },
    longDescription:{
      type:String
    },
    shortDescription:{
      type:String
    },
    ondcId:{
        type:"ObjectId",
        ref:"ondcs"
    }
},
{
    timestamps: true,
}
)

module.exports = {
    ondcDescriptionModel: mongoose.model('ondcdescriptions', ondcDescriptionSchema),
};
