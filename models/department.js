const departmentSchema = new mongoose.Schema({
    name:String,
    userId:{
        type:ObjectId,
        ref:"users"
    },
    status:{
        type:Boolean,
        default:true
    }
   },{
        timestamps: true,
     }
)
module.exports = {
    departmentModel: mongoose.model('department', departmentSchema),
};

