const {EnrollmentModel, UserModel,InteraktMessageModel,Customer } = require('../models');
const LoggerService = require('./logger.service')
const DbService = require('./Db.service')
const TransribedServices = require('./transcribe.service');
const locationService = require('./location.service');
const CommonFun=require('./commonFun')
module.exports = {
    processRequest: async (content, userId,messageId,customerId,phone_number) => {
        try {
            let customer=await DbService.findOne(Customer,{_id:customerId,userId})
            const user = await DbService.findOne(UserModel, { _id: userId });
            let coinsUsed = user.totalCredits - user.creditsUsed
            if (coinsUsed > 0) {
                let data = await TransribedServices.getFormattedTranscriptionByModule(content, 'Enrollment')
                console.log('=============> data is ', data)
                let transcriptedData = {}
                try {
                    transcriptedData = JSON.parse(data);
                } catch (error) {
                    return { status: false, message: "Something went wrong with the File while parsing!" };
                }
                let bodyData={}
                for (let key in transcriptedData) {
                    bodyData[key] = transcriptedData[key];
                }
                bodyData['userId'] = userId;
                bodyData['phoneNo'] = phone_number;
                if(bodyData['referredPerson']){
                    let value=bodyData['referredPerson'];
                    let regex = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
                    let searchData = {
                      $or: [
                        {
                          name: {
                            "$regex": regex,
                            "$options": "i"
                          }
                        },
                        {
                            contact: regex
                        }
                    ]
                }
                let referredPerson=await DbService.findOne(Customer,searchData);
                if(referredPerson)
                    bodyData['referredBy']=referredPerson._id;
                }
                if(customer.location.locality&&customer.location.locality.coordinates){
                    bodyData['location']=customer.location;
                }else{
                    
                    bodyData['location']=await locationService.getLocationDetails(bodyData["address"]);
                    await DbService.findOneAndUpdate(Customer,{_id:customerId},{location:bodyData['location']})
                }
                console.log('============ here 1', bodyData)
                const enrollment = await DbService.create(EnrollmentModel, bodyData);
        
                await DbService.findOneAndUpdate(InteraktMessageModel,{_id:messageId},{module:"Enrollment",enrollmentId:enrollment._id})
                if (enrollment) {
                    await CommonFun.reduceCoins(1, user)
                    return { status: true, enrollment }
                }
            }

            return { status: false }
        } catch (err) {
            console.log(err, '==============> ')
            let error = new Error(err.message);
            LoggerService.logger.error({ message: err, stack: error.stack })
            throw error
        }
    }
}
