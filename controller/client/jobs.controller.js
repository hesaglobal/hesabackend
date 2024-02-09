const { Jobs,UserModel,CandidateModel,EmployerModel,OthersModel,TranscribedFiles } = require('../../models');
const {DbService, CommonFun, CommonAggService,LoggerService,TransribedServices,JobsService} = require('../../services')
const AdminMessages = require('../../db/messages/admin.messages');
const ObjectId = require('mongoose').Types.ObjectId;

module.exports = {
    getUploadedRecords:async(req,res,next)=>{
        try{
          const {start,limit} =CommonFun.pagination(req.query.currentPage ?? 1,req.query.pageSize ?? 10)
          const userId=req.user._id;
         
            let agg = [
                {
                  $match: {
                    userId:new ObjectId(userId)
                  }
                },
                {
                    $sort: {
                      createdAt: -1
                    }
                  },
                  CommonAggService.facet(start,limit,"transcriptions")
              ];
            const transcriptions=await DbService.aggregate(Jobs,agg)
            if(transcriptions){
              LoggerService.logger.info({status:true,data:transcriptions})
            }
            return res.json({ message: AdminMessages.GET, data: {transcriptions:transcriptions[0].transcriptions ?? [] ,count:transcriptions[0].totalCount[0]?.count ?? 0} });
        }catch(err){
          let error=new Error(err.message);
          LoggerService.logger.error({message: err, stack: error.stack})
          next(err)
        }
    },
    getTranscription: async (req, res, next) => {
      try {
        const { fileKey, fileId ,alreadyUploaded} = req.body;
        if (!ObjectId.isValid(fileId)) throw badReqErr({ message: AdminMessages.INVALID_OBJECT_ID });
        let saveTranscription,content,fileDetails;
        const user = await DbService.findOne(UserModel, { _id: req.user?._id });
        let coinsUsed = user.totalCredits - user.creditsUsed
        if (coinsUsed > 0) {
          if(fileKey)  {
            fileDetails  = CommonFun.getFileTypeFromUrl(fileKey)
          }
          let record=await DbService.findOne(TranscribedFiles,{fileId:fileId})
          if(!record){
              content = await TransribedServices.transcribeAudioOnly(fileKey, false);
          }else{       
             content=record.content;
          }
      
          let {status,query ,personType}=await JobsService.processRequest(fileId,fileDetails?.name,content,req.user._id,'','',alreadyUploaded)

          if (status) {
            LoggerService.logger.info({ status: true, data:{query,personType} });
            return res.json({ status: true, message: AdminMessages.ADD, data: query });
          }else{
            LoggerService.logger.info({ status: false, message:"Something went wrong!" });
            return res.json({ status: false, message:"Something went wrong!" });
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
    deleteTranscribedContent:async(req,res,next)=>{
      try{
        const { fileId, fileKey } = req.body;
        if (!ObjectId.isValid(fileId)) throw badReqErr({ message: AdminMessages.INVALID_OBJECT_ID });
            let deleteContent=await JobsService.deleteContent(fileKey,fileId);
            if(deleteContent){
            LoggerService.logger.info({ status: true, message: AdminMessages.DELETE });
            return res.json({ status: true, message: AdminMessages.DELETE })
            } else {
             return res.json({ status: true, message: 'Something went wrong!' })
            }
      }catch(err){
        let error = new Error(err.message);
        LoggerService.logger.error({ message: err, stack: error.stack })
        next(err)
      }
    },
    getQueriesCandidate:async(req,res,next)=>{
      try {
        const { start, limit } = CommonFun.pagination(req.query.currentPage ?? 1, req.query.pageSize ?? 10)
        const userId = req.user._id;
        let match = {
            userId: new ObjectId(userId),
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
        const queries = await DbService.aggregate(CandidateModel, agg)
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
    getQueriesEmployer:async(req,res,next)=>{
      try {
        const { start, limit } = CommonFun.pagination(req.query.currentPage ?? 1, req.query.pageSize ?? 10)
        const userId = req.user._id;
        let match = {
            userId: new ObjectId(userId),
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
        const queries = await DbService.aggregate(EmployerModel, agg)
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
    getQueriesOthers:async(req,res,next)=>{
      try {
        const { start, limit } = CommonFun.pagination(req.query.currentPage ?? 1, req.query.pageSize ?? 10)
        const userId = req.user._id;
        let match = {
            userId: new ObjectId(userId),
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
        const queries = await DbService.aggregate(OthersModel, agg)
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
}