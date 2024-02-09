const orderItemsSchema = new mongoose.Schema({
    userId: {
        type: ObjectId,
        ref: "User"
    },
    orderId: {
        type: ObjectId
    },
    fileId: {
        type: ObjectId
    },
    itemName: String,
    inputItem: String,
    quantity: Number,
    available: String,
    salePrice:Number,
    displayPrice:Number,
    purchasePrice:Number,
    HSNCode:String,
    GSTRate:Number,
    units:String,
    amount:Number,
    itemunit:String
},

    {
        timestamps: true,
    }
)

module.exports = {
    orderItemModel: mongoose.model('orderitems', orderItemsSchema),
};
