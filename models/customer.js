const mongoose = require('mongoose');
const { YesOrNoValues,validCustomerTypes,locationType,validGSTTreatmentTypes } = require('../db/constant');
const customerSchema = new mongoose.Schema({
    userId: {
        type: ObjectId,
        ref: "User"
    },
    status: {
        type: Boolean,
        default: true
    },
    name: String,
    incomingContact:{
        type: String,
        unique: true,
        trim: true,
        index: true
    },
    location: {
        locationName: { type: String },
        locality: {
            type: {
                type: String,
                enum: locationType
            },
            coordinates: {
                type: [Number],
                index: '2dsphere'
            }
        },
        city: {
            type: String,
            trim: true,
            index: true
        },
        state: {
            type: String,
            trim: true
        },
        country: {
            type: String,
            trim: true
        }
    },
    contact:{
        type: String,
        trim: true,
    },
    hesaathiLinking: { type: String, enum: YesOrNoValues },
    hesaathi:  {
        type: ObjectId,
        ref: "User"
    },
    type: {
        type:String,
        enum:validCustomerTypes
    },
    GSTTreatment: { type: String, enum: YesOrNoValues },
    GSTTreatmentType:{
        type:String,
        enum:validGSTTreatmentTypes
    },
    GSTIN:String

},
    {
        timestamps: true,
    }
)

module.exports = {
    customerModel: mongoose.model('customers', customerSchema),
};
