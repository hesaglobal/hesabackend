const { RealEstate,UserModel,RealEstateTranscriptionModel,RealEstateQueriesModel,InteraktMessageModel } = require('../models');
const LoggerService = require('./logger.service')
const DbService = require('./Db.service')
const CommonAggService = require('./commonAgg.service')
const TransribedServices = require('./transcribe.service')
const AwsService = require('./aws.services')
const CommonFun = require('./commonFun')
const ObjectId = require('mongoose').Types.ObjectId;
module.exports = {
    getUploadedRecords: async (userId, start, limit) => {
        try {
            let filter={  userId: new ObjectId(userId)}
            console.log(filter,'filter')
            let agg = [
                {
                    $match: filter
                },
               
                {
                    $sort: {
                        createdAt: -1
                    }
                },
                CommonAggService.facet(start, limit, "transcriptions")
            ];
            const transcriptions = await DbService.aggregate(RealEstate, agg)
            if (transcriptions) {
                LoggerService.logger.info({ status: true, data: transcriptions })
                return transcriptions
            }
        } catch (err) {
            let error = new Error(err.message);
            LoggerService.logger.error({ message: err, stack: error.stack })
            throw new Error(err.message)
        }
    },
    processRequest: async (fileLink, filename, content, userId, phonenumber, customerId,alreadyUploaded,messageId) => {
        try {
            let fileUrl;
            if(alreadyUploaded){
                fileUrl=fileLink
            }else{
                fileUrl== await AwsService.uploadFileFromLink(fileLink, `file/${userId}/RealEstate`)
            }
                
            let fileData = {
                file: { name: filename, url: fileUrl },
                customer: customerId,
                userId
            }

            const estate = await DbService.create(RealEstate, fileData);
            await DbService.findOneAndUpdate(InteraktMessageModel,{_id:messageId},{fileId:estate._id,module:"RealEstate"})
          
            const user = await DbService.findOne(UserModel, { _id: userId });
            let coinsUsed = user.totalCredits - user.creditsUsed
            if (coinsUsed > 0) {
                let query = {
                    address: '',
                    Message: '',
                    userId: userId,
                    fileId: estate._id,
                    instruction: '',
                    Price: '',
                    Category: '',
                    area:'',
                    Name:'',
                    estateHolders:''
                }
                let data;
                let body={}
                data = await TransribedServices.getFormattedTranscriptionByModule(content, 'RealEstate');
              
                let transcriptedData = {}
                try {
                    transcriptedData = JSON.parse(data);
                } catch (error) {

                    return { status: false, message: "Something went wrong with the Audio!" };
                }
               
                for (let key in transcriptedData) {
                    body[key] = query[key] = transcriptedData[key];
                }
                body['content'] = body['Transcripted Text'];
                body['address'] = query.address = body['Address mentioned'];
                body['Message'] = query.Message = body['Message derived'];
                body['userId']=userId;
                body['fileId']=estate._id
                query.estateHolders=body["estateHolders"]
                console.log('============ here 2', query)
                // Add coin system
                
                const queryData = await DbService.create(RealEstateQueriesModel, query);
                let transcriptedRecord = await DbService.create(RealEstateTranscriptionModel, body);
                if (transcriptedRecord) {
                    recordUpdate = await DbService.update(RealEstate, { "_id": estate._id }, { status: 'Processed',estateHolders:query.estateHolders })
                    let coinsReduced = recordUpdate ? await CommonFun.reduceCoins(1, user) : false
                     
                    if (coinsReduced) {
                        await DbService.update(RealEstate, { userId: user._id, "_id": estate._id }, { status: 'Processed' })
                    }

                    return { status: true, queryData }
                }
            }

            return { status: false }
        } catch (err) {
            console.log(err, '==============> ')
            let error = new Error(err.message);
            LoggerService.logger.error({ message: err, stack: error.stack })
            throw error
        }
    },
    buildMessageData: async (userId, customer, query) => {
        try {
            let user = await DbService.findOne(UserModel, { _id: userId })
            let bodyValues = [customer.name, user.name, query?.queryId, query?.Message]
            if (customer.location?.locationName) {
                bodyValues.push(customer.location?.locationName)
            }
            
            let messageData = {
                template: customer.location?.locationName ? 'thank_you_with_location' : 'thank_you_without_location',
                contactNumber: customer.contact,
                bodyValues,
                callbackMessage: 'Done',
                userId
            }
            
            console.log('===========> ', messageData)
            return messageData
        } catch (err) {
            console.log('=========> err ', err)
            let error = new Error(err.message);
            LoggerService.logger.error({ message: err, stack: error.stack })
            throw error
        }
    }
}
