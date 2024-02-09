const Joi = require("joi") 
Joi.extend(require('@joi/date'))
Joi.objectId = require('joi-objectid')(Joi);

module.exports = {
    patch: (data) => {
        return Joi.object({
            name: Joi.string().trim().required()
        }).validate(data);
    },
    add: (data) => {
        return Joi.object({
            name: Joi.string().trim().required()
        }).validate(data);
    }
}


