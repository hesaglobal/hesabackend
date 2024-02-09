const Joi = require("joi") 
Joi.extend(require('@joi/date'))

module.exports = {
    add: (data) => {
        return Joi.object({
            name: Joi.string().trim().required()
        }).validate(data);
    },
    update:(data)=>{
        return Joi.object({
            name: Joi.string().trim().optional(),
            status:Joi.boolean().optional()
        }).validate(data);
    }
}

