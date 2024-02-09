const Joi = require("joi"); 
const {gender,modules,locationType} = require("../../db/constant");
Joi.extend(require('@joi/date'))
Joi.objectId = require('joi-objectid')(Joi);

module.exports={
    user:(data)=>{
        return Joi.object({
            name: Joi.string().trim().required(),
            email: Joi.string().trim().email().required(),
            gstin: Joi.string().trim().regex(/^(01|02|03|04|05|06|07|08|09|10|11|12|13|14|15|16|17|18|19|20|21|22|23|24|26|27|28|29|30|31|32|33|34|35|36|37|38|97|99)[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}$/).length(15).required(),
            invoiceaddress: Joi.string().trim(),
            qr: Joi.string().optional().allow(""),
            password: Joi.string().min(6).max(30).required(),
            phoneNo: Joi.string().length(10).pattern(/^\d+$/),
            dob:Joi.date(),
            gender:Joi.string().valid(...gender).allow("").optional(),
            pic:Joi.string().optional().allow(""),
            logo:Joi.string().optional().allow(""),
            modules:Joi.array().items(Joi.string().valid(...modules)).required(),
            location:Joi.object({
                locationName: Joi.string().optional(),
                locality: Joi.object({
                  type: Joi.string().valid(...locationType).optional(),
                  coordinates: Joi.array().items(Joi.number())
                }).optional(),
                city: Joi.string().trim().optional(),
                state: Joi.string().trim().optional(),
                country: Joi.string().trim().optional()
            }).allow(""),
            allocateCoins:Joi.number().integer().optional(),
            displayName:Joi.string().trim().required()            
        }).validate(data);
    },
    updateuser:(data)=>{
        return Joi.object({
            name: Joi.string().trim().required(),
            email: Joi.string().trim().email().required(),
            gstin: Joi.string().trim().regex(/^(01|02|03|04|05|06|07|08|09|10|11|12|13|14|15|16|17|18|19|20|21|22|23|24|26|27|28|29|30|31|32|33|34|35|36|37|38|97|99)[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}$/).length(15).required(),
            invoiceaddress: Joi.string().trim(),
            qr: Joi.string().optional().allow(""),
            phoneNo: Joi.number().min(10),
            dob:Joi.date(),
            gender:Joi.string().valid(...gender).optional().allow(""),
            pic:Joi.string().optional().allow(""),
            logo:Joi.string().optional().allow(""),
            modules:Joi.array().items(Joi.string().valid(...modules)).required(),
            location:Joi.object({
                locationName: Joi.string().optional(),
                locality: Joi.object({
                  type: Joi.string().valid(...locationType).optional(),
                  coordinates: Joi.array().items(Joi.number())
                }).optional(),
                city: Joi.string().trim().optional(),
                state: Joi.string().trim().optional(),
                country: Joi.string().trim().optional()
            }).allow(""),
            allocateCoins:Joi.number().integer().optional(),
            displayName:Joi.string().trim().required()
        }).validate(data);
    },
    
}