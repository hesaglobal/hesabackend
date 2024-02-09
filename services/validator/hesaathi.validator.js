const Joi = require("joi") 
Joi.extend(require('@joi/date'))
Joi.objectId = require('joi-objectid')(Joi);
const {  hesaathitype,locationType } = require('../../db/constant');

module.exports = {
    add: (data) => {
        return Joi.object({
            name: Joi.string().trim().required(),
            mobile: Joi.string().trim().required(),
            address:Joi.object({
                locationName: Joi.string().required(),
                locality: Joi.object({
                  type: Joi.string().valid(...locationType).required(),
                  coordinates: Joi.array().items(Joi.number())
                }).required(),
                city: Joi.string().trim().required(),
                state: Joi.string().trim().required(),
                country: Joi.string().trim().required()
            }),
            type: Joi.string().valid(...hesaathitype).required(),
            staff: Joi.string().trim().required(),
            aadhar: Joi.string().trim().required(),
            gst:Joi.boolean().required()
        }).validate(data);
    },
    update: (data) => {
        return Joi.object({
            _id:Joi.string().trim().allow('').optional(),
            name: Joi.string().trim().optional(),
            mobile: Joi.string().trim().optional(),
            address:Joi.object({
                locationName: Joi.string().optional(),
                locality: Joi.object({
                  type: Joi.string().valid(...locationType).optional(),
                  coordinates: Joi.array().items(Joi.number())
                }).optional(),
                city: Joi.string().trim().optional(),
                state: Joi.string().trim().optional(),
                country: Joi.string().trim().optional()
            }),
            type: Joi.string().valid(...hesaathitype).required(),
            staff: Joi.string().trim().required(),
            aadhar: Joi.string().trim().optional(),
            gst:Joi.boolean().optional()
        }).validate(data);
    }
}


