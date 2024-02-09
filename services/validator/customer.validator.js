const Joi = require("joi") 
Joi.extend(require('@joi/date'))
Joi.objectId = require('joi-objectid')(Joi);
const { YesOrNoValues,validCustomerTypes,locationType,validGSTTreatmentTypes} = require('../../db/constant');

module.exports = {
    patch: (data) => {
        return Joi.object({
            name: Joi.string().trim().optional(),
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
            incomingContact:Joi.string().trim().regex(/^\d{10}$/).optional(),
            contact: Joi.string().trim().regex(/^\d{10}$/).optional(),
            hesaathiLinking:Joi.string().valid(...YesOrNoValues).optional(),
            hesaathi:Joi.string().trim().optional().allow(""),
            type:Joi.string().valid(...validCustomerTypes).optional(),
            GSTTreatment:Joi.string().valid(...YesOrNoValues).optional(),
            orderId:Joi.string().trim().optional(),
            GSTTreatmentType:Joi.string().valid(...validGSTTreatmentTypes).optional(),
            GSTIN:Joi.string().trim().regex(/^(01|02|03|04|05|06|07|08|09|10|11|12|13|14|15|16|17|18|19|20|21|22|23|24|26|27|28|29|30|31|32|33|34|35|36|37|38|97|99)[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}$/).length(15).optional()
        }).validate(data);
    },
    add: (data) => {
        return Joi.object({
            name: Joi.string().trim().required(),
            location:Joi.object({
                locationName: Joi.string().required(),
                locality: Joi.object({
                  type: Joi.string().valid(...locationType).required(),
                  coordinates: Joi.array().items(Joi.number())
                }).required(),
                city: Joi.string().trim().optional(),
                state: Joi.string().trim().optional(),
                country: Joi.string().trim().optional()
            }),
            contact: Joi.string().trim().regex(/^\d{10}$/).required(),
            hesaathiLinking:Joi.string().valid(...YesOrNoValues).required(),
            hesaathi:Joi.string().trim().optional().allow(""),
            type:Joi.string().valid(...validCustomerTypes).required(),
            GSTTreatment:Joi.string().valid(...YesOrNoValues).required(),
            orderId:Joi.string().trim().optional(),
            incomingContact:Joi.string().trim().regex(/^\d{10}$/).optional(),
            GSTTreatmentType:Joi.string().valid(...validGSTTreatmentTypes).optional(),
            GSTIN:Joi.string().trim().regex(/^(01|02|03|04|05|06|07|08|09|10|11|12|13|14|15|16|17|18|19|20|21|22|23|24|26|27|28|29|30|31|32|33|34|35|36|37|38|97|99)[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}$/).length(15).optional()
        }).validate(data);
    }
}

