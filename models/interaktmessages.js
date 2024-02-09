const { modules } = require("../db/constant");
const interaktmessageSchema = new mongoose.Schema({
    customer: {
        id: String,
        channel_phone_number: String,
        phone_number: String,
        country_code: String,
        traits: {
            name: String,
            whatsapp_opted_in: Boolean,
            source_id: String,
            source_url: String
        }
    },
    replayedOn:Date,
    source: {
        type: String,
        default: 'web'
    },
    userId:{
      type:ObjectId,
      ref:"user"
    },
    fileId:ObjectId,
    module:{
        type:String,
        enum:modules
    },
    enrollmentId:{
        type:ObjectId,
        ref:"enrollments"
    },
    message: {
        id: String,
        chat_message_type: String, // CustomerMessage
        channel_failure_reason: String,
        message_status: String, //Sent,
        received_at_utc: Date,
        delivered_at_utc: Date,
        seen_at_utc: String,
        campaign_id: String,
        is_template_message: Boolean,
        raw_template: String,
        channel_error_code: String,
        message_content_type: String,
        media_url: String,
        message: String
    }
},
    {
        timestamps: true,
    }
)

module.exports = {
    interaktModel: mongoose.model('interaktmessage', interaktmessageSchema),
};
