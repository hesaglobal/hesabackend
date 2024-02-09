const { orderStatus, paymentStatus } = require("../db/constant");
const orderSchema = new mongoose.Schema({
    userId: {
        type: ObjectId,
        ref: "User"
    },
    fileId: {
        type: ObjectId
    },
    orderId:Number,
    customerId:{
        type:ObjectId,
        ref:"customers"
    },
    name:String,
    itemCount:{
        type:Number,
        default:0
    },
    paymentStatus:{
        type:String,
        enum:paymentStatus,
        default:paymentStatus[2]
    },
    pdfResult:String,
    orderStatus:{
        type:String,
        enum:orderStatus,
        default:orderStatus[0]
    },
    amountpaid:Number,
    totalamount:Number,
    balance:Number,
    matched:{
        type:Boolean,
        default:false
    },
    receiptURL:String,
    receipt:String,
    remarks:String,
    sentReceipt:{
        type:Boolean,
        default:false
    }
},
    {
        timestamps: true,
    }
)
orderSchema.pre('save', async function (next) {
    if (!this.isNew) {
      return next();
    }
    try {
      const maxOrderId = await mongoose.model('orders').findOne({ userId: this.userId }, { orderId: 1 }).sort({ orderId: -1 });
      this.orderId = (maxOrderId && maxOrderId.orderId ? maxOrderId.orderId : 100) + 1;
      return next();
    } catch (error) {
      return next(error);
    }
  });
module.exports = {
    orderModel: mongoose.model('orders', orderSchema),
};
