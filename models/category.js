const CategorySchema = new mongoose.Schema({
    name: String,
    status: {
        type: Boolean,
        default: true
    },
    userId: {
        type: ObjectId,
        ref: "user"
    },
},
    { timestamps: true }
)

module.exports = {
    categoryModel: mongoose.model('categories', CategorySchema),
};
