const subCategorySchema = new mongoose.Schema({
    categoryId: {
        type: ObjectId,
        ref: "Category"
    },
    name: String,
    status: {
        type: String,
        default: true
    },
    userId: {
        type: ObjectId,
        ref: "user"
    }
},

    {
        timestamps: true,
    }
)

module.exports = {
    subCategoryModel: mongoose.model('subCategory', subCategorySchema),
};
