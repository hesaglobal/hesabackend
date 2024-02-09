const { Hesaathi,locationType } = require('../db/constant')
const hesaathiSchema = new mongoose.Schema({
    userId: {
        type: ObjectId,
        ref: "User"
    },
    name: {
        type: String,
        required: true
    },
    mobile: {
        type: String,
        required: true
    },
    address: {
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
    type: {
        type: String,
        enum: Hesaathi,
        required: true
    },
    staff: {
        type: ObjectId,
        ref: 'staff'
    },
    aadhar: {
        type: String,
        required: true
    },
    gst: {
        type: Boolean,
        required: true
    },
    status: {
        type: Boolean,
        default: true
    }
},

    {
        timestamps: true,
    }
)

module.exports = {
    hesaathiModel: mongoose.model('hesaathi', hesaathiSchema),
};
