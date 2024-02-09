const mongoose = require('mongoose');
const { statuses } = require('../db/constant')

const staffSchema = new mongoose.Schema({
    status : {
        type : Boolean,
        enum : statuses,
        default : statuses[0]
    },
    name : {
        type : String,
        default: "Staff",
        trim: true,
    },
    email: {
        type: String,
        trim: true
    },
    userId:{
        type:ObjectId,
        ref:"user"
    },
    joiningDate : {
        type: Date,
        default: new Date()
    },
    department:[
    {
      type:ObjectId,
      ref:"department"
    }
    ],
    phoneNo: {
        type: String,
        unique: true,
        trim: true
    },
    designation : {
        type : String,
        trim : true
    }
}, { timestamps : true })

module.exports = {
    staffModel: mongoose.model('staff', staffSchema),
};