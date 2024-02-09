
const { CustomerCareService, LoggerService, CommonFun, DbService, TransribedServices,CommonAggService } = require('../../services')
const AdminMessages = require('../../db/messages/admin.messages');
const {  CustomerCare, CustomerCareQueriesModel, CustomerCareTranscribedFiles, DepartmentModel, StaffModel, UserModel } = require('../../models');
const translateService = require('../../services/translate.service');
module.exports = {
    getUploadedRecords: async (req, res, next) => {
        try {
            const { start, limit } = CommonFun.pagination(req.query.currentPage ?? 1, req.query.pageSize ?? 10)
            const transcriptions = await CustomerCareService.getUploadedRecords(req.user._id, start, limit)
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
            if(body.key==='queryStatus'&&body.value!=='Due'){
                let recentRecord=await DbService.findOne(CustomerCareQueriesModel,{fileId:fileId})
                updatedFields['lastDueDay']=Math.round((new Date() - new Date(recentRecord.createdAt)) / (1000 * 60 * 60 * 24))
            }else{
                updatedFields['$set']={'lastDueDay':0}
            }
            let transcriptions = await DbService.update(CustomerCareQueriesModel, { fileId: fileId }, updatedFields)
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
            deleteUploadedRecord = await DbService.delete(CustomerCare, { _id: fileId });
            const deleteTranscribedContent = await DbService.delete(CustomerCareTranscribedFiles, { fileId: fileId });
            const deleteQuery = await DbService.delete(CustomerCareQueriesModel, { fileId: fileId });
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
            const content = await DbService.findOne(CustomerCareTranscribedFiles, { fileId: fileId })
            let uploadedFile = await DbService.findOne(CustomerCare, { _id: fileId })
            const fileContent = uploadedFile.file
            let additionalContent = await DbService.findOne(CustomerCareQueriesModel, { fileId }, ['customer']);
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
                productType: '',
                concernedDepartment: '',
                address: '',
                Message: '',
                userId: req.user._id,
                fileId: fileId,
                instruction: '',
                jobType: '',
                category: '',
            }
            let content;
            let departments = await DbService.find(DepartmentModel, { userId: req.user._id })
            departments = departments.map((item) => item.name)
            content = await TransribedServices.getTranscription(fileKey, 'CustomerCare', departments);
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

            body['productType'] = query.productType = body['Type of Product'];
            body['concernedDepartment'] = query.concernedDepartment = body['Concerned Department'];
            let staffAssociated = [];
            let departmentAssociated=[]
            let validDepartments = body['Concerned Department'].split(",");
            for (let item of validDepartments) {
                const escapedName = item.trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
                let concernedDepartment = await DbService.findOne(DepartmentModel, { name: { $regex: new RegExp(escapedName, 'i') } })
                departmentAssociated.push(concernedDepartment._id)
                if (concernedDepartment) {
                    let staffConcerned = await DbService.find(StaffModel, { department: concernedDepartment._id });
                    if (staffConcerned && staffConcerned.length > 0) {
                        for (let staff of staffConcerned) {
                            staffAssociated.push(staff._id)
                        }
                    }
                }
            }
            query.concernedDepartment = departmentAssociated;
            body['address'] = query.address = body['Address mentioned'];
            body['Message'] = query.Message = body['Message derived'];
            query['staff'] = [...new Set(staffAssociated.map(objId => objId.toString()))].map(str => new ObjectId(str));
            body['userId'] = req.user._id;
            const user = await DbService.findOne(UserModel, { _id: req.user._id });
            let coinsUsed = user.totalCredits - user.creditsUsed
            if (coinsUsed > 0) {
                await DbService.create(CustomerCareQueriesModel, query);
                let transcriptedRecord = await DbService.create(CustomerCareTranscribedFiles, body);
                if (transcriptedRecord) {
                    let updateCoins = { "$inc": { "creditsUsed": 1 } }
                    let totalCredits = req.user.totalCredits;
                    if (totalCredits > 0 && req.user) {
                        let userUpdate = await DbService.update(UserModel, { _id: req.user._id }, updateCoins);
                        if (userUpdate) {
                            let recordUpdate = await DbService.update(CustomerCare, { userId: req.user._id, "_id": fileId }, { status: 'Processed' })
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
            let content = await DbService.findOne(CustomerCareTranscribedFiles, { fileId: fileId })
            const translatedContent = await translateService.getTranslation(content.content, lang);
            if (translatedContent) {
                await DbService.update(CustomerCareTranscribedFiles, { fileId: fileId }, { editedContent: translatedContent, editedLang: lang })
                content = await DbService.findOne(CustomerCareTranscribedFiles, { fileId: fileId })
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
            const { start, limit } = CommonFun.pagination(req.query.currentPage ?? 1, req.query.pageSize ?? 10)
            const userId = req.user._id;
            let match = {
                userId: new ObjectId(userId)
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
                    $lookup: {
                        from: "departments",
                        localField: "concernedDepartment",
                        foreignField: "_id",
                        as: "associatedDepartment",
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
                        daysSinceCreation: {
                            $cond: {
                                if: {
                                    $eq: ["$queryStatus", "Due"]
                                },
                                then: {
                                    $round: {
                                        $divide: [
                                            {
                                                $subtract: [new Date(), "$createdAt"]
                                            },
                                            1000 * 60 * 60 * 24
                                        ]
                                    }
                                },
                                else: 0 
                            }
                        },
                        departments: {
                            $map: {
                                input: "$associatedDepartment",
                                as: "dept",
                                in: "$$dept.name"
                            }
                        }
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
            const queries = await DbService.aggregate(CustomerCareQueriesModel, agg)
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
