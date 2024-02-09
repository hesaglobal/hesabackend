const { TranscribedFiles, DepartmentModel, UserModel, Queries, Finance, Jobs, General, CustomerCare, Customer, GrievancesFilesModel, Ecommerce, Order, OrderItems, Grievances, CandidateModel, EmployerModel, OthersModel, StaffModel } = require('../../models');
const { DbService, TransribedServices, CommonFun, CommonAggService, LoggerService,JobsService } = require('../../services')
const AdminMessages = require('../../db/messages/admin.messages');
const transcriptionValidator = require('../../services/validator/transcriptionValidator');
const commonFun = require('../../services/commonFun');
const { env } = require('../../db/constant');
module.exports = {
    updateTranscribedContent: async (req, res, next) => {
        try {
            const { fileId } = req.params;
            if (!ObjectId.isValid(fileId)) throw badReqErr({ message: AdminMessages.INVALID_OBJECT_ID });
            const body = commonFun.strToObj(req.body)
            const { value, error } = transcriptionValidator.updateTranscription(body);
            if (error) throw badReqErr(error);
            let updatedFields = {}
            if (value.content) {
                updatedFields['editedContent'] = value.content;
            }
            let transcriptions = await DbService.update(TranscribedFiles, { fileId: fileId }, updatedFields)
            if (transcriptions) {
                LoggerService.logger.info({ status: true, data: transcriptions })
            }
            return res.json({ message: AdminMessages.GET, data: transcriptions });
        } catch (err) {
            let error = new Error(err.message);
            LoggerService.logger.error({ message: err, stack: error.stack })
            next(err)
        }
    },
    getQueries: async (req, res, next) => {
        try {
            const { module, personType } = req.query;

            const { start, limit } = CommonFun.pagination(req.query.currentPage ?? 1, req.query.pageSize ?? 10)
            const userId = req.user._id;
            let match = {
                userId: new ObjectId(userId),
                module: module
            }

            if (personType) {
                match['personType'] = personType
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
                        }
                    }
                },
                {
                    $sort: {
                        createdAt: -1
                    }
                },
                CommonAggService.facet(start, limit, "queries")
            ];
            const queries = await DbService.aggregate(Queries, agg)
            if (queries) {
                LoggerService.logger.info({ status: true, data: queries })
            }

            return res.json({ message: AdminMessages.GET, data: { queries: queries[0].queries ?? [], count: queries[0].totalCount[0]?.count ?? 0 } });
        } catch (err) {
            let error = new Error(err.message);
            LoggerService.logger.error({ message: err, stack: error.stack })
            next(err)
        }
    },
    getTranscriptionForQueries: async (req, res, next) => {
        try {
            const { fileKey, fileId, module } = req.body;
            const body = req.body;
            let query = {
                productType: '',
                concernedDepartment: '',
                address: '',
                Message: '',
                userId: req.user._id,
                fileId: fileId,
                module: module,
                instruction: '',
                jobType: '',
                category: '',
                personType: ''
            }
            let content;
            if (module == 'Jobs') {
                content = await TransribedServices.getTranscription(fileKey, 'Jobs');
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
                body['instruction'] = query.instruction = body['Important Instruction']
                body['jobType'] = query.jobType = body['Job Type'];
                body['address'] = query.address = body['Address mentioned'];
                body['Message'] = query.Message = body['Message derived'];
                body['category'] = query.category = body['Category'];
                body['personType'] = query.personType = body["Person Type"]
                body['userId'] = req.user._id;
                body['module'] = module
            } else {
                content = await TransribedServices.getTranscription(fileKey, '');
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
                body['concernedDepartment'] = query.concernedDepartment = body['Concerned Department']
                body['address'] = query.address = body['Address mentioned'];
                body['Message'] = query.Message = body['Message derived'];
                body['userId'] = req.user._id;
                body['module'] = module
            }

            console.log('======================> ', content)

            const user = await DbService.findOne(UserModel, { _id: req.user._id });
            let coinsUsed = user.totalCredits - user.creditsUsed
            if (coinsUsed > 0) {
                await DbService.create(Queries, query);
                let transcriptedRecord = await DbService.create(TranscribedFiles, body);
                if (transcriptedRecord) {
                    let updateCoins = { "$inc": { "creditsUsed": 1 } }
                    let totalCredits = req.user.totalCredits;
                    if (totalCredits > 0 && req.user) {
                        let userUpdate = await DbService.update(UserModel, { _id: req.user._id }, updateCoins);
                        if (userUpdate) {
                            let recordUpdate;
                             if (module == 'Finance') {
                                recordUpdate = await DbService.update(Finance, { userId: req.user._id, "_id": fileId }, { status: 'Processed' })
                            }
                            else if (module == 'Ecommerce') {
                                recordUpdate = await DbService.update(Ecommerce, { userId: req.user._id, "_id": fileId }, { status: 'Processed' })
                            } else {
                                recordUpdate = await DbService.update(Jobs, { userId: req.user._id, "_id": fileId }, { status: 'Processed' })
                            }
                            if (userUpdate) {
                                LoggerService.logger.info({ status: true, data: userUpdate })
                            }
                            return res.json({ status: true, message: AdminMessages.ADD, data: recordUpdate });

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
            LoggerService.logger.error({ message: err, stack: error.stack })
            next(err)
        }
    },
    deleteContent: async (req, res, next) => {
        try {
            const { fileId, fileKey, module,personType } = req.body;
            if (!ObjectId.isValid(fileId)) throw badReqErr({ message: AdminMessages.INVALID_OBJECT_ID });
            let deleteUploadedRecord;
             if (module == 'Jobs') {
                deleteUploadedRecord = await DbService.delete(Jobs, { _id: fileId });
            } else if (module == 'Finance') {
                deleteUploadedRecord = await DbService.delete(Finance, { _id: fileId });
            } else if (module == 'Ecommerce') {
                await DbService.delete(Order, { fileId });
                await DbService.deleteMany(OrderItems, { fileId });
                deleteUploadedRecord = await DbService.delete(Ecommerce, { _id: fileId });
            } else {
                deleteUploadedRecord = await DbService.delete(General, { _id: fileId });
            }
            const deleteTranscribedContent = await DbService.delete(TranscribedFiles, { fileId: fileId });
            const deleteQuery = await DbService.delete(Queries, { fileId: fileId });
            const deleteFile = await CommonFun.deleteFile(fileKey)
            if (deleteQuery && deleteTranscribedContent && deleteUploadedRecord && deleteFile) {
                LoggerService.logger.info({ status: true, message: AdminMessages.DELETE })
                return res.json({ status: true, message: AdminMessages.DELETE })
            } else {
                return res.json({ status: true, message: 'Something went wrong!' })
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
            const { module } = req.query
            let associatedCustomer;
            if (!ObjectId.isValid(fileId)) throw badReqErr({ message: AdminMessages.INVALID_OBJECT_ID });
            const content = await DbService.findOne(TranscribedFiles, { fileId: fileId })
            const addtionalContent = await DbService.findOne(Queries, { fileId: fileId })
            let uploadedFile;
             if (module == 'Finance') {
                uploadedFile = await DbService.findOne(Finance, { _id: fileId })
            } else if (module == 'Jobs') {
                uploadedFile = await DbService.findOne(Jobs, { _id: fileId })
            } else if (module == 'Ecommerce') {
                uploadedFile = await DbService.findOne(Ecommerce, { _id: fileId })
            } else {
                uploadedFile = await DbService.findOne(General, { _id: fileId })
            }
            const fileContent = uploadedFile.file
            let additionalContent = await DbService.findOne(Queries, { fileId }, ['customer']);
            if (uploadedFile && content && module == 'Ecommerce') {
                let orderItems = await DbService.find(OrderItems, { fileId, userId: req.user._id });
                let associatedOrder = await DbService.findOne(Order, { fileId })
                associatedOrder ? associatedCustomer = await DbService.findOne(Customer, { _id: associatedOrder.customerId }) : associatedCustomer = ''
                LoggerService.logger.info({ status: true, data: { content, fileContent, orderItems } })
                return res.json({ message: AdminMessages.GET, data: { content, fileContent, orderItems, associatedCustomer, associatedOrder } });
            } else if(uploadedFile && content && module == 'Jobs'){
                LoggerService.logger.info({ status: true, data: { content, fileContent, additionalContent } });
                if(uploadedFile.personType=="Candidate"){
                    additionalContent=await DbService.findOne(CandidateModel, { fileId })
                }else if(uploadedFile.personType=="Employer"){
                    additionalContent=await DbService.findOne(EmployerModel, { fileId })
                }else if(uploadedFile.personType=="Others"){
                    additionalContent=await DbService.findOne(OthersModel, { fileId })
                }else{
                    additionalContent=await DbService.findOne(Queries, { fileId }, ['customer']);
                }
              
                let matchedCandidates=await JobsService.getMatchedCandidates(fileId);
                let matchedJobs=await JobsService.getMatchingJobs(fileId);
                return res.json({ message: AdminMessages.GET, data: { content, fileContent, additionalContent,matchedCandidates:matchedCandidates,matchedJobs:matchedJobs } });
            }else{
                LoggerService.logger.info({ status: true, data: { content, fileContent, additionalContent } })
                return res.json({ message: AdminMessages.GET, data: { content, fileContent, additionalContent } });
            }
        } catch (err) {
            let error = new Error(err.message);
            LoggerService.logger.error({ message: err, stack: error.stack })
            next(err)
        }
    },
    getGeneralTranscription: async (req, res, next) => {
        try {
            const { fileKey, fileId, module } = req.body;
            const body = req.body;
            let result,coinsDeducted,output;
            const user = await DbService.findOne(UserModel, { _id: req.user._id });
            let coinsUsed = user.totalCredits - user.creditsUsed
            if (coinsUsed > 0) {
                if(req.user._id==="65267f97c9d8e8f21d03b2b6"){
                    output = await TransribedServices.generalTranscriptionByPrompt(fileKey,user);
                }else{
                    output  = await TransribedServices.getGeneralTranscription(fileKey,user);
                }
                result=output.result;
                coinsDeducted=output.coinsDeducted;
                if(!result || result.length==0)  return res.json({ status: false, message: "Kindly purchase more coins!" });
                body['userId'] = user._id;
                body['module'] = module;
                body['content'] = result
                let transcriptedRecord = await DbService.create(TranscribedFiles, body);
                if (transcriptedRecord) {
                    let totalCredits = user.totalCredits;
                    if (totalCredits > 0 && user) {
                        let coinsReduced = await CommonFun.reduceCoins(coinsDeducted, user) 
                        if (coinsReduced) {
                            let recordUpdate = await DbService.update(General, { userId: req.user._id, "_id": fileId }, { status: 'Processed' })
                            if (recordUpdate) {
                                LoggerService.logger.info({ status: true, data: {recordUpdate,coinsReduced} })
                            }
                            return res.json({ status: true, message: AdminMessages.ADD, data: recordUpdate });
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
            LoggerService.logger.error({ message: err, stack: error.stack })
            next(err)
        }
    },
    update: async (req, res, next) => {
        try {
            const { fileId } = req.params;
            const body = req.body
            let updatedFields = {}
            updatedFields[body.key] = body.value;

            let transcriptions = await DbService.update(Queries, { fileId: fileId }, updatedFields)

            return res.json({ message: 'Success', data: transcriptions });
        } catch (err) {
            let error = new Error(err.message);
            LoggerService.logger.error({ message: err, stack: error.stack })
        }
    },
    getImageTranscription: async (req, res, next) => {
        try {
            const { fileKey, fileId } = req.body;
            const body = req.body;
            let content;
            content = await TransribedServices.getImageTranscription(`${env.S3_OBJECT_URL}${fileKey}`);
            body['userId'] = req.user._id;
            body['module'] = 'Ecommerce';
            body['content'] = content
            const user = await DbService.findOne(UserModel, { _id: req.user._id });
            let coinsUsed = user.totalCredits - user.creditsUsed
            if (coinsUsed > 0) {
                let transcriptedRecord = await DbService.create(TranscribedFiles, body);
                if (transcriptedRecord) {
                    let updateCoins = { "$inc": { "creditsUsed": 1 } }
                    let totalCredits = req.user.totalCredits;
                    if (totalCredits > 0 && req.user) {
                        let userUpdate = await DbService.update(UserModel, { _id: req.user._id }, updateCoins);
                        if (userUpdate) {
                            let recordUpdate = await DbService.update(Ecommerce, { userId: req.user._id, "_id": fileId }, { status: 'Processed' })
                            if (userUpdate) {
                                LoggerService.logger.info({ status: true, data: userUpdate })
                            }
                            return res.json({ status: true, message: AdminMessages.ADD, data: recordUpdate });
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
            LoggerService.logger.error({ message: err, stack: error.stack })
            next(err)
        }
    }
}

