
const { RealEstateService, LoggerService, CommonFun, DbService, TransribedServices,CommonAggService } = require('../../services')
const AdminMessages = require('../../db/messages/admin.messages');
const { RealEstate,RealEstateQueriesModel, RealEstateTranscriptionModel, UserModel } = require('../../models');
const translateService = require('../../services/translate.service');
module.exports = {
    getUploadedRecords: async (req, res, next) => {
        try {
            
            const { start, limit } = CommonFun.pagination(req.query.currentPage ?? 1, req.query.pageSize ?? 10)
            const transcriptions = await RealEstateService.getUploadedRecords(req.user._id, start, limit)
            return res.json({ message: AdminMessages.GET, data: { transcriptions: transcriptions[0].transcriptions ?? [], count: transcriptions[0].totalCount[0]?.count ?? 0 } });
        } catch (err) {
            let error = new Error(err.message);
            LoggerService.logger.error({ message: err, stack: error.stack })
            next(err)
        }
    },
    updateRecord: async (req, res, next) => {
        try {
            const { fileId } = req.params;
            const body = req.body;
            let updatedFields = {};
            updatedFields[body.key] = body.value;
            let transcriptions = await DbService.update(RealEstateQueriesModel, { fileId: fileId }, updatedFields)
            if(transcriptions){
                LoggerService.logger.info({ status: true, message: AdminMessages.GET })
                return res.json({ status: true, message: AdminMessages.GET })
            }else{
                LoggerService.logger.info({ status: false, message: "Something went wrong!" })
                return res.json({ status: false,  message: "Something went wrong!"  })
            }
        } catch (err) {
            let error = new Error(err.message);
            LoggerService.logger.error({ message: err, stack: error.stack });
            next(err);
        }
    },
    deleteContent: async (req, res, next) => {
        try {
            const { fileId, fileKey } = req.body;
            if (!ObjectId.isValid(fileId)) throw badReqErr({ message: AdminMessages.INVALID_OBJECT_ID });
            let deleteUploadedRecord;
            deleteUploadedRecord = await DbService.delete(RealEstate, { _id: fileId });
            const deleteTranscribedContent = await DbService.delete(RealEstateTranscriptionModel, { fileId: fileId });
            const deleteQuery = await DbService.delete(RealEstateQueriesModel, { fileId: fileId });
            const deleteFile = await CommonFun.deleteFile(fileKey)
            if (deleteQuery && deleteTranscribedContent && deleteUploadedRecord && deleteFile) {
                LoggerService.logger.info({ status: true, message: AdminMessages.DELETE })
                return res.json({ status: true, message: AdminMessages.DELETE })
            } else {
                LoggerService.logger.info({ status: false, message: "Something went wrong!" })
                return res.json({ status: false,  message: "Something went wrong!"  })
            }
        } catch (err) {
            let error = new Error(err.message);
            LoggerService.logger.error({ message: err, stack: error.stack })
            next(err)
        }
    },
    getContent: async (req, res, next) => {
        try {
            const { fileId } = req.params;
            if (!ObjectId.isValid(fileId)) throw badReqErr({ message: AdminMessages.INVALID_OBJECT_ID });
            const content = await DbService.findOne(RealEstateTranscriptionModel, { fileId: fileId })
            let uploadedFile = await DbService.findOne(RealEstate, { _id: fileId })
            const fileContent = uploadedFile.file
            let additionalContent = await DbService.findOne(RealEstateQueriesModel, { fileId }, ['customer']);
            LoggerService.logger.info({ status: true, data: { content, fileContent, additionalContent } })
            return res.json({ message: AdminMessages.GET, data: { content, fileContent, additionalContent } });
        } catch (err) {
            let error = new Error(err.message);
            LoggerService.logger.error({ message: err, stack: error.stack })
            next(err)
        }
    },
    getTranscription: async (req, res, next) => {
        try {
            const { fileKey, fileId } = req.body;
            const body = req.body;
            let query = {
                address: '',
                Message: '',
                userId: req.user._id,
                fileId: fileId,
                instruction: '',
                Price: '',
                Category: '',
                area:'',
                Name:'',
                estateHolders:''
            }
            let content;
            content = await TransribedServices.getTranscription(fileKey, 'RealEstate');
            let transcriptedData = {}
            try {
                transcriptedData = JSON.parse(content);
            } catch (error) {
                return res.json({ status: false, message: "Something went wrong with the Audio!" });
            }
           
            for (let key in transcriptedData) {
                body[key] = query[key] = transcriptedData[key];
            }
            body['content'] = body['Transcripted Text'];
            body['address'] = query.address = body['Address mentioned'];
            body['Message'] = query.Message = body['Message derived'];
            query.estateHolders=body["estateHolders"]
            body['userId'] = req.user._id;
            const user = await DbService.findOne(UserModel, { _id: req.user._id });
            let coinsUsed = user.totalCredits - user.creditsUsed
            if (coinsUsed > 0) {
                await DbService.findOneAndUpdate(RealEstate,{_id:fileId},{estateHolders:query.estateHolders})
                await DbService.create(RealEstateQueriesModel, query);

                let transcriptedRecord = await DbService.create(RealEstateTranscriptionModel, body);
              
                if (transcriptedRecord) {
                    let updateCoins = { "$inc": { "creditsUsed": 1 } }
                    let totalCredits = req.user.totalCredits;
                    if (totalCredits > 0 && req.user) {
                        let userUpdate = await DbService.update(UserModel, { _id: req.user._id }, updateCoins);
                       
                        if (userUpdate) {
                            let recordUpdate = await DbService.update(RealEstate, { userId: req.user._id, "_id": fileId }, { status: 'Processed' })
                            if (userUpdate) {
                                LoggerService.logger.info({ status: true, message: "Sucessfully transcribed!" })
                                return res.json({ status: true, message: AdminMessages.ADD, data: recordUpdate });
                            } else {
                                LoggerService.logger.info({ status: false, message: "Something went wrong!" })
                                return res.json({ status: false, message: "Something went wrong!" });
                            }
                        }
                    }
                } else {
                    return res.json({ status: false, message: "Something went wrong!" });
                }
            } else {
                return res.json({ status: false, message: "Kindly purchase more coins!" });
            }
        } catch (err) {
            let error = new Error(err.message);
            LoggerService.logger.error({ message: err, stack: error })
            next(err)
        }
    },
    getTranslation: async (req, res, next) => {
        try {
            const { lang } = req.query;
            const { fileId } = req.params;
            if (!ObjectId.isValid(fileId)) throw badReqErr({ message: AdminMessages.INVALID_OBJECT_ID });
            let content = await DbService.findOne(RealEstateTranscriptionModel, { fileId: fileId })
            const translatedContent = await translateService.getTranslation(content.content, lang);
            if (translatedContent) {
                await DbService.update(RealEstateTranscriptionModel, { fileId: fileId }, { editedContent: translatedContent, editedLang: lang })
                content = await DbService.findOne(RealEstateTranscriptionModel, { fileId: fileId })
                LoggerService.logger.info({ status: true, data: content })
                return res.json({ message: AdminMessages.GET, data: { content } })
            } else {
                return res.json({ message: "Something went wrong", status: false })
            }
        } catch (err) {
            let error = new Error(err.message);
            LoggerService.logger.error({ message: err, stack: error.stack })
            next(err)
        }
    },
    getQueries:async(req,res,next)=>{
        try {
            let {estateHolders}=req.query;
            const { start, limit } = CommonFun.pagination(req.query.currentPage ?? 1, req.query.pageSize ?? 10)
            const userId = req.user._id;
            let match = {
                userId: new ObjectId(userId)
            }
            if(estateHolders){
                match['estateHolders']=estateHolders
            }
            let agg = [
                {
                    $match: match
                },
                {
                    $lookup: {
                        from: "customers",
                        localField: "customer",
                        foreignField: "_id",
                        as: "customerInfo",
                    }
                },
                {
                    $addFields: {
                        customername: {
                            $arrayElemAt: ["$customerInfo.name", 0]
                        },
                        customercontact: {
                            $arrayElemAt: ["$customerInfo.contact", 0]
                        },
                        customerlocation: {
                            $arrayElemAt: ["$customerInfo.location.locationName", 0]
                        },
                       
                    }
                },
                {
                    $project: {
                        associatedDepartment: 0 
                    }
                },
                {
                    $sort: {
                        createdAt: -1
                    }
                },
                CommonAggService.facet(start, limit, "queries")
            ];
            const queries = await DbService.aggregate(RealEstateQueriesModel, agg)
            if (queries) {
                LoggerService.logger.info({ status: true, data: queries })
            }

            return res.json({ message: AdminMessages.GET, data: { queries: queries[0].queries ?? [], count: queries[0].totalCount[0]?.count ?? 0 } });
        } catch (err) {
            let error = new Error(err.message);
            LoggerService.logger.error({ message: err, stack: error.stack })
            next(err)
        }
    }

}
