const { templates } = require('../db/constant');
const { Jobs, TranscribedFiles, Queries, UserModel, MatchingStatusModel, EmployerModel, CandidateModel, InteraktMessageModel,OthersModel, MatchingJobsStatusModel } = require('../models');
const DbService = require('./Db.service');
const awsServices = require('./aws.services');
const commonAggService = require('./commonAgg.service')
const commonFun = require('./commonFun');
const loggerService = require('./logger.service');
const TransribedServices = require('./transcribe.service')
module.exports = {
    updateTranscribedFile: async (content, userId, fileId) => {
        let value = {}
        let transcriptedData = {}
        transcriptedData = JSON.parse(content);
        for (let key in transcriptedData) {
            value[key] = transcriptedData[key];
        }
        value['userId'] = userId;
        value['module'] = 'Jobs';
        value['fileId'] = fileId
        let updateQuery = await DbService.create(Queries, value);
        let updateTranscribedFiles = await DbService.create(TranscribedFiles, value);
        return updateQuery && updateTranscribedFiles ? true : false
    },
    deleteContent: async (fileKey, fileId) => {
        let record = await DbService.findOne(Jobs, { _id: fileId });
        if (record.personType.toLowerCase() === "employer") {
            await DbService.delete(EmployerModel, { fileId: fileId })
            await DbService.delete(MatchingStatusModel, { jobId: fileId })
        } else if (record.personType.toLowerCase() === "candidate") {
            await DbService.delete(CandidateModel, { fileId: fileId })
            await DbService.delete(MatchingJobsStatusModel, { candidateId: fileId })
        } else {
            await DbService.delete(OthersModel, { fileId: fileId })
        }
        let deleteUploadedRecord = await DbService.delete(Jobs, { _id: fileId });
        const deleteTranscribedContent = await DbService.delete(TranscribedFiles, { fileId: fileId });
        const deleteFile = await commonFun.deleteFile(fileKey)
        return deleteTranscribedContent && deleteUploadedRecord && deleteFile ? true : false
    },
    processRequest: async (fileLink, filename, content, userId, phonenumber, customerId, alreadyUploaded,messageId) => {
        try {
            let newJob, personType, query, bodyData;
    
            if (!alreadyUploaded) {
                let fileUrl = await awsServices.uploadFileFromLink(fileLink, `file/${userId}/Jobs`)
                let fileData = {
                    file: { name: filename, url: fileUrl },
                    customer: customerId,
                    userId
                }
                newJob = await DbService.create(Jobs, fileData);
            } else {
                if(ObjectId.isValid(fileLink)){
                    newJob = await DbService.findOne(Jobs, { _id: fileLink })
                    if (newJob.personType&&newJob) {
                        personType = newJob.personType;
                    }
                }else{
                    let fileUrl = fileLink
                    let fileData = {
                        file: { name: filename, url: fileUrl },
                        customer: customerId,
                        userId
                    }
                    newJob = await DbService.create(Jobs, fileData);
                }
             }
             await DbService.findOneAndUpdate(InteraktMessageModel,{_id:messageId},{fileId:newJob._id,module:"Jobs"})
            let queryData = {
                productType: '',
                address: '',
                Message: '',
                userId: userId,
                fileId: newJob._id,
                module: 'Jobs',
                customer: customerId,
                instruction: '',
                jobType: '',
                category: '',
                personType: '',
                contact: ''
            }
  
            if (!customerId) delete queryData['customer']
            const user = await DbService.findOne(UserModel, { _id: userId });
            let coinsUsed = user.totalCredits - user.creditsUsed
            if (coinsUsed > 0) {
                if (!personType) {
                    let data = await TransribedServices.getFormattedTranscriptionByModule(content, 'Jobs')
                    let transcriptedData = {}
                    try {
                        transcriptedData = JSON.parse(data);
                    } catch (error) {
                    
                        return { status: false }
                    }

                    bodyData = {}
                    for (let key in transcriptedData) {
                        queryData[key] = transcriptedData[key];
                    }

                    bodyData['content'] = bodyData['editedContent'] = content;
                    bodyData['userId'] = userId
                    bodyData['fileId'] = queryData.fileId
                    bodyData['module'] = queryData.module


                    // Add coin system
                    personType = queryData.personType;
                }
              
                if (personType.toLowerCase() === "candidate") {
                    if (!newJob.personType) {
                        let record = await DbService.findOneAndUpdate(Jobs, { _id: newJob._id }, { personType: queryData.personType })
                        query = await DbService.create(CandidateModel, queryData);
                    }
                } else if (personType.toLowerCase() === "employer") {
                    if (!newJob.personType) {
                        let record = await DbService.findOneAndUpdate(Jobs, { _id: newJob._id }, { personType: queryData.personType })
                        query = await DbService.create(EmployerModel, queryData);
                    }
                } else {
                    if (!newJob.personType) {
                        let record = await DbService.findOneAndUpdate(Jobs, { _id: newJob._id }, { personType: queryData.personType })
                        query = await DbService.create(OthersModel, queryData);
                    }
                }
                if (personType.toLowerCase() === "employer") {
                    let selectionCriteria
                    if (newJob.personType) {
                        let queryData = await DbService.findOne(EmployerModel, { fileId: newJob._id });
                
                        selectionCriteria = {
                            skills: queryData.skills,
                            location: queryData.address,
                            category: queryData.category
                        }
                    } else {
                        selectionCriteria = {
                            skills: queryData.skills,
                            location: queryData.address,
                            category: queryData.category
                        }
                    }
                    let candidates = await DbService.find(CandidateModel, { userId: userId });
                    const matchedRecords = await TransribedServices.getMatchingCandidates(candidates, selectionCriteria);
                    matchedCandidates = JSON.parse(matchedRecords);
                    if (matchedCandidates.length < 0) {
                        return { status: false };
                    }
                    if (newJob.personType) {
                        await DbService.delete(MatchingStatusModel, { jobId: newJob._id })
                    }
                    console.log(matchedCandidates, 'candidates<<<<<<<<<<<<<<<<<<<<<<<<<<')
                    for (let candidate of matchedCandidates) {
                        if (candidate.matchingscore && candidate.matchingscore > 0) {
                            await DbService.findOneAndUpdate(MatchingStatusModel, { jobId: newJob._id }, {
                                jobId: newJob._id,
                                $push: {
                                    matchedStatus: {
                                        candidateId: candidate.candidateId,
                                        matchingScore: candidate.matchingscore
                                    }
                                }
                            })
                        }
                    }
                } else {
                    let selectionCriteria
                    if (newJob.personType) {
                        let queryData = await DbService.findOne(CandidateModel, { fileId: newJob._id });
                       
                        selectionCriteria = {
                            skills: queryData.skills,
                            location: queryData.address,
                            category: queryData.category
                        }
                    } else {
                        selectionCriteria = {
                            skills: queryData.skills,
                            location: queryData.address,
                            category: queryData.category
                        }
                    }
                    let employers = await DbService.find(EmployerModel, { userId: userId });
                    const matchedRecords = await TransribedServices.getMatchingJobs(employers, selectionCriteria);
                    matchedJobs = JSON.parse(matchedRecords);
                    console.log(matchedJobs, 'matchedJobs<<<<<<<<<<<<<<<<<<<<<<<<<<')
                    if (newJob.personType) {
                        await DbService.delete(MatchingJobsStatusModel, { candidateId: newJob._id })
                    }
                    if (matchedJobs.length < 0) {
                        return { status: false };
                    }
                    for (let job of matchedJobs) {
                        if (job.matchingscore && job.matchingscore > 0) {
                            await DbService.findOneAndUpdate(MatchingJobsStatusModel, { candidateId: newJob._id }, {
                                candidateId: newJob._id,
                                $push: {
                                    matchedStatus: {
                                        jobId: job.jobId,
                                        matchingScore: job.matchingscore
                                    }
                                }
                            })
                        }
                    }
                }
                let transcriptedRecord;
                if (!newJob.personType) {
                    transcriptedRecord = await DbService.create(TranscribedFiles, bodyData);
                } else {
                    transcriptedRecord = await DbService.findOne(TranscribedFiles, { fileId: newJob._id })
                }
              
                if (transcriptedRecord) {
                    recordUpdate = await DbService.update(Jobs, { "_id": newJob._id }, { status: 'Processed' })
                    let coinsReduced = recordUpdate ? await commonFun.reduceCoins(1, user) : false;
                    if (coinsReduced) {
                        await DbService.update(Jobs, { userId: user._id, "_id": newJob._id }, { status: 'Processed' })
                    }
                    return { status: true, query, personType, newJob }
                }
            }

            return { status: false }
        } catch (err) {
            console.log(err, '==============> ')
            let error = new Error(err.message);
            loggerService.logger.error({ message: err, stack: error.stack })
            throw error
        }
    },
    buildMessageData: async (userId, customer, query, personType) => {
        try {
            let user = await DbService.findOne(UserModel, { _id: userId })
            let bodyValues = [customer.name]
            let messageData = {
                template: templates.best_match_candidate_initial_message,
                contactNumber: customer.contact,
                bodyValues,
                callbackMessage: 'Done',
                userId
            }
            return messageData
        } catch (err) {
            console.log('=========> err ', err)
            let error = new Error(err.message);
            loggerService.logger.error({ message: err, stack: error.stack })
            throw error
        }
    },
    getMatchedCandidates: async (jobId) => {
        let agg = [
            {
                $match: {
                    "jobId": new ObjectId(jobId)
                }
            },
            {
                $lookup: {
                    from: 'candidates',
                    localField: 'matchedStatus.candidateId',
                    foreignField: '_id',
                    as: 'candidateDetails'
                }
            },
            {
                $unwind: "$matchedStatus"
            },
            {
                $sort: {
                    "matchedStatus.matchingScore": -1
                }
            },
            {
                $addFields: {
                    matchingDetails: {
                        $filter: {
                            input: "$candidateDetails",
                            as: "candidates",
                            cond: {
                                $eq: ["$$candidates._id", "$matchedStatus.candidateId"]
                            }
                        }
                    }
                }
            },
            {
                $unwind: "$matchingDetails"
            },
            {
                $lookup: {
                    from: 'customers',
                    localField: 'matchingDetails.customer',
                    foreignField: '_id',
                    as: 'customerDetails'
                }
            },
            {
                $unwind: {
                    path: "$customerDetails",
                    preserveNullAndEmptyArrays: true 
                }
            },
            {
                $project: {
                    _id: 1,
                    matchingScore: "$matchedStatus.matchingScore",
                    Name: "$matchingDetails.Name",
                    instruction: "$matchingDetails.instruction",
                    category: "$matchingDetails.category",
                    personType: "$matchingDetails.address",
                    Message: "$matchingDetails.Message",
                    createdAt: "$matchingDetails.createdAt",
                    address: "$customerDetails.location",
                    contact: "$customerDetails.contact",
                    skills:"$matchingDetails.skills"
                }
            },
            {
                $limit: 5
            }
        ];

        let matchedCandidates = await DbService.aggregate(MatchingStatusModel, agg);
        return matchedCandidates.length > 0 ? matchedCandidates : []
    },
    getMatchingJobs: async (jobId) => {
        let agg = [
            {
                $match: {
                    "candidateId": new ObjectId(jobId)
                }
            },
            {
                $lookup: {
                    from: 'employers',
                    localField: 'matchedStatus.jobId',
                    foreignField: '_id',
                    as: 'employersDetails'
                }
            },
            {
                $unwind: "$matchedStatus"
            },
            {
                $sort: {
                    "matchedStatus.matchingScore": -1
                }
            },
            {
                $addFields: {
                    matchingDetails: {
                        $filter: {
                            input: "$employersDetails",
                            as: "employers",
                            cond: {
                                $eq: ["$$employers._id", "$matchedStatus.jobId"]
                            }
                        }
                    }
                }
            },
            {
                $unwind: "$matchingDetails"
            },
            {
                $lookup: {
                    from: 'customers',
                    localField: 'matchingDetails.customer',
                    foreignField: '_id',
                    as: 'customerDetails'
                }
            },
            {
                $unwind: {
                    path: "$customerDetails",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    _id: 1,
                    matchingScore: "$matchedStatus.matchingScore",
                    Name: "$matchingDetails.Name",
                    instruction: "$matchingDetails.instruction",
                    category: "$matchingDetails.category",
                    personType: "$matchingDetails.address",
                    Message: "$matchingDetails.Message",
                    createdAt: "$matchingDetails.createdAt",
                    address: "$customerDetails.location",
                    contact: "$customerDetails.contact",

                }
            },
            {
                $limit: 5
            }
        ];

        let matchedJobs = await DbService.aggregate(MatchingJobsStatusModel, agg);
        return matchedJobs.length > 0 ? matchedJobs : []
    },
    buildMessageDataForCandidate: async (customer, name, location, contact, instruction) => {
        try {
            let bodyValues = [name, location, contact, instruction]
            let messageData = {
                template: templates.best_job_match,
                contactNumber: customer.contact,
                bodyValues,
                callbackMessage: 'Done'
            }
            return messageData
        } catch (err) {
            console.log('=========> err ', err)
            let error = new Error(err.message);
            loggerService.logger.error({ message: err, stack: error.stack })
            throw error
        }
    },
    buildMessageDataForEmployer:async(customer,name,location,contact,skills,instruction)=>{
        try {
            let bodyValues = [name, location, contact,skills,instruction]
            let messageData = {
                template: templates.best_candidate_match,
                contactNumber: customer.contact,
                bodyValues,
                callbackMessage: 'Done'
            }
            return messageData
        } catch (err) {
            console.log('=========> err ', err)
            let error = new Error(err.message);
            loggerService.logger.error({ message: err, stack: error.stack })
            throw error
        }
    }

}