const bcryptjs = require('bcryptjs')
const { statuses, role, gender, modules, locationType } = require('../db/constant')
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        default: "User",
        trim: true,
        index: true
    },
    phoneNo: {
        type: Number,
        unique: true,
        trim: true,
        index: true
    },
    whatsappNo: {
        type: Number,
        trim: true
    },
    displayName:String,
    gstin: {
        type: String,
        unique: true,
        trim: true,
        index: true
    },
    invoiceaddress: {
        type: String,
        trim: true
    },
    email: {
        type: String,
        unique: true,
        trim: true,
        index: true
    },
    regDate: {
        type: Date,
        default: new Date()
    },
    gender: {
        type: String,
        enum: gender
    },
    password: {
        type: String,
    },
    token: {
        type: String,
    },
    modules: {
        type: [String],
        enum: modules,
        default: [modules[0]],
    },
    role: {
        type: String,
        enum: role,
        default: role[1],
    },
    pic:String,
    logo:String,
    qr: String,
    status: {
        type: Boolean,
        enum: statuses,
        default: true,
    },
    dob: {
        type: Date
    },
    totalCredits:{
      type:Number,
      default:10
    },
    creditsUsed:{
    type:Number,
    default:0
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
},

    {
        timestamps: true,
    }
)
userSchema.pre('save', async function (next) {
    console.log(this.roles);
    if (this.password) this.password = await bcryptjs.hash(this.password, 10)
    if (this.role == "Admin") this.modules = []
})
userSchema.pre('findOneAndUpdate', async function preSave(next) {
    try {
        if (this._update.password) {
            this._update.password = await bcryptjs.hash(this._update.password, 10);
        }
        next();
    } catch (err) {
        return next(err);
    }
});
module.exports = {
    userModel: mongoose.model('user', userSchema),
};

