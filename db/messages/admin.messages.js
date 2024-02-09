// const Joi = require('joi');
// require('dotenv-flow').config();

const CMSMessages = {
    // AUTH messages
    AUTH_SIGNUP: "Please check your email to confirm your account.",
    AUTH_LOGIN: "Login successfully",
    AUTH_VERIFY: "Verify Successfully",
    AUTH_PASSWORD_SET: "Password Set successfully",
    AUTH_FORGET_PASSWORD: "Forget password mail send successfully",
    AUTH_PASSWORD_NOT_MATCH: "Password not match",
    AUTH_INVALID_TOKEN: "Invalid token",
    AUTH_INVALID_OTP: "Invalid OTP",
    AUTH_VERIFY_OTP: "Verify Successfully",
    INVALID_CREDENTIAL: "Invalid Credential",
    GET: 'Get Successfully',
    UPDATE: 'Updated Successfully',
    DELETE: 'Deleted Successfully',
    ADD: 'Added Successfully',
    VISIT:'Added Visit Successfully',
    CONTACT: 'Contact Successfully',
    INVALID_OBJECT_ID: "Invalid ObjectId",
    LIMIT_EXCEED: `File uploading limit exceeded`,
    VIDEO_LIMIT_EXCEED: `Video uploading limit exceeded`,
    ADD_MODULE: 'Modules added successfully',
    UPDTAE_MODULE: 'Modules successfully updated',
    USER_NOT_EXIST:"User doesn't exist"
}
module.exports = CMSMessages;