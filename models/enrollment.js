const { YesOrNoValues,locationType } = require("../db/constant");
const enrollmentSchema = new mongoose.Schema({
    userId: {
        type: ObjectId,
        ref: "User"
    },
    Name: String,
    referredBy: {
        type: ObjectId,
        ref: "customers"
    },
    age: Number,
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
    hasAdhaar: {
        type: String,
        enum:YesOrNoValues
    },
    phoneNo: String,
    adhaarNumber:{
     type:String
    },
    constituency:String
}, {
    timestamps: true,
}
)
module.exports = {
    enrollmentModel: mongoose.model('enrollments', enrollmentSchema),
};

