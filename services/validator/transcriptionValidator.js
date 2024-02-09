const Joi = require("joi"); 
Joi.extend(require('@joi/date'))
Joi.objectId = require('joi-objectid')(Joi);

module.exports={
    updateTranscription:(data)=>{
        return Joi.object({
            content:Joi.string().trim().required()
        }).validate(data);
    },
}