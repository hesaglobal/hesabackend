const Joi = require("joi") 
Joi.extend(require('@joi/date'))
Joi.objectId = require('joi-objectid')(Joi);
const {  role } = require('../../db/constant');

module.exports = {
    signUp: (data) => {
        return Joi.object({
            name: Joi.string().trim().required(),
            email: Joi.string().trim().email().required(),
            password: Joi.string().min(6).max(30).required(),
            role:Joi.string().valid(...role).required(),
            phoneNo: Joi.string().length(10).pattern(/^\d+$/)
        }).validate(data);
    },
    logIn: (data) => {
        return Joi.object({
            email: Joi.string().trim().required(),
            password: Joi.string().max(30).required(),
        }).validate(data);
    },
    changePassword:(data) =>{
        return Joi.object({
            password: Joi.string().min(6).max(30).required(),
            new_password: Joi.string().min(6).max(30).required(),
            confirm_password: Joi.string().min(6).max(30).required().valid(Joi.ref('new_password')),
        }).validate(data)
    },
    uploadFile:(data)=>{
        return Joi.object({
            module: Joi.string().trim().required(),
            audio:Joi.array().required()
        }).validate(data);
    },
}

