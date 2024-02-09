const Joi = require("joi") 
Joi.extend(require('@joi/date'))
Joi.objectId = require('joi-objectid')(Joi);

module.exports = {
    add : (data) => {
        return Joi.object({
            name : Joi.string().trim().required(),
            phoneNo : Joi.number().min(10).required(),
            email :Joi.string().trim().email().required(),
            joiningDate :  Joi.string().trim().optional().isoDate().allow(""),
            designation : Joi.string().trim().required(),
            department: Joi.array().items(Joi.string()).required(),
            password: Joi.string().min(6).max(30).required(),
        }).validate(data);
    },
    update:(data)=>{
        return Joi.object({
             name : Joi.string().trim().optional(),
             phoneNo :Joi.number().min(10).optional(),
             email :Joi.string().trim().email().optional(),
             joiningDate :  Joi.string().trim().optional().isoDate().allow(""),
             designation : Joi.string().trim().optional(),
             department: Joi.array().items(Joi.string()).optional(),
             password: Joi.string().min(6).max(30).required(),
        }).validate(data);
    }
}