const Joi = require("joi") 
Joi.extend(require('@joi/date'))
Joi.objectId = require('joi-objectid')(Joi);

module.exports = {
    addOrPatch: (data) => {
        return Joi.object({
            name: Joi.string().trim().required(),
            categoryId:Joi.string().trim().required()
        }).validate(data);
    }
}


