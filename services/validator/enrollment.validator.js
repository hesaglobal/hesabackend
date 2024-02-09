const Joi = require("joi") 
Joi.extend(require('@joi/date'))
Joi.objectId = require('joi-objectid')(Joi);
const { ageGroups,YesOrNoValues,locationType} = require('../../db/constant');

module.exports = {
    patch: (data) => {
        return Joi.object({
            Name: Joi.string().trim().optional(),
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
            constituency:Joi.string().trim().optional(),
            phoneNo: Joi.string().trim().regex(/^\d{10}$/).optional(),
            adhaarNumber:Joi.string().trim().regex( /^[0-9]{12}$/).optional(),
            hasAdhaar:Joi.string().valid(...YesOrNoValues).optional(),
            age: Joi.number().integer().max(120).optional(),
            referredBy:Joi.string().trim().required()
        }).validate(data);
    },
    add: (data) => {
        return Joi.object({
            Name: Joi.string().trim().required(),
            location:Joi.object({
                locationName: Joi.string().required(),
                locality: Joi.object({
                  type: Joi.string().valid(...locationType).required(),
                  coordinates: Joi.array().items(Joi.number())
                }).required(),
                city: Joi.string().trim().required(),
                state: Joi.string().trim().required(),
                country: Joi.string().trim().required()
            }).allow(""),
            constituency:Joi.string().trim().required(),
            phoneNo: Joi.string().trim().regex(/^\d{10}$/).required(),
            adhaarNumber:Joi.string().trim().regex( /^[0-9]{12}$/).optional(),
            hasAdhaar:Joi.string().valid(...YesOrNoValues).optional(),
            age: Joi.number().integer().max(99).optional(),
            referredBy:Joi.string().trim().required()
        }).validate(data);
    }
}

