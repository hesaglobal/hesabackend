const Joi = require("joi"); 
const { orderStatus, paymentStatus } = require("../../db/constant");
Joi.extend(require('@joi/date'))
Joi.objectId = require('joi-objectid')(Joi);
module.exports = {
    patchItem: (data) => {
        return Joi.object({
            _id:Joi.string().trim().allow('').optional(),
            inputItem: Joi.string().trim().optional(),
            itemName: Joi.string().trim().optional(),
            quantity: Joi.string().trim().optional(),
            available:Joi.boolean().optional(),
            fileId:Joi.string().trim().required(),
            units:Joi.string().optional(),
            salePrice:Joi.number().precision(2).optional().positive(),
            displayPrice:Joi.number().precision(2).optional().positive(),
            purchasePrice:Joi.number().precision(2).optional().positive(),
            HSNCode:Joi.string().optional(),
            GSTRate:Joi.number().precision(2).optional().positive().allow(0),
            amount:Joi.number().precision(2).optional().positive().allow(0)
        }).validate(data);
    },
    processOrder: (data) => {
        return Joi.object({
            content: Joi.string().trim().required(),
            fileId:Joi.string().trim().required(),
        }).validate(data);
    },
    updatePayment:(data)=>{
        return Joi.object({
            totalamount: Joi.number().precision(2).optional().positive().allow(0),
            amountpaid:Joi.number().precision(2).optional().positive().allow(0),
            balance:Joi.number().precision(2).optional().positive().allow(0),
            paymentStatus:Joi.string().valid(...paymentStatus).optional(),
            orderStatus:Joi.string().valid(...orderStatus).optional(),
            receipt:Joi.string().optional().allow(""),
            remarks:Joi.string().trim().optional()
        }).validate(data);
    }
}


