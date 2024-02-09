const { Grievances, GrievancesFileModel,grievancesQueriesModel,UserModel} = require('../../models');
const { DbService, TransribedServices, CommonFun, CommonAggService,LoggerService } = require('../../services')
const AdminMessages = require('../../db/messages/admin.messages');
const transcriptionValidator = require('../../services/validator/transcriptionValidator');
const translateService = require('../../services/translate.service');
const { env } = require('../../db/constant');
const ObjectId = require('mongoose').Types.ObjectId;

module.exports = {
  getUploadedRecords: async (req, res, next) => {
    try {
      const { start, limit } = CommonFun.pagination(req.query.currentPage ?? 1, req.query.pageSize ?? 10)
      const userId = req.user._id;
      let agg = [
        {
          $match: {
            userId: new ObjectId(userId)
          }
        },
        {
          $sort: {
            createdAt: -1
          }
        },
        CommonAggService.facet(start, limit, "transcriptions")
      ];
      const transcriptions = await DbService.aggregate(Grievances, agg)
      if (transcriptions) {
        LoggerService.logger.info({ status: true, data: transcriptions })
      }
      return res.json({ message: AdminMessages.GET, data: { transcriptions: transcriptions[0].transcriptions ?? [], count: transcriptions[0].totalCount[0]?.count ?? 0 } });
    } catch (err) {
      let error = new Error(err.message);
      LoggerService.logger.error({ message: err, stack: error.stack })
      next(err)
    }
  },
  getTranscriptionForGrievance: async (req, res,next) => {
    try {
      const { fileKey, fileId, module } = req.body;
      const body = req.body;
      let query = {
        concernedDepartment: '',
        address: '',
        Name: '',
        userId: req.user._id,
        fileId: fileId,
        module: module,
        queryType: '',
        queryAsk: '',
        Category: '',
        querySummary: ''
      }
      let content;
      content = await TransribedServices.getTranscription(fileKey, 'PublicGrievance');
      let transcriptedData = {}
      try {
        transcriptedData = JSON.parse(content);
      } catch (error) {
        return res.json({ status: false, message: "Something went wrong with the Audio!" });
      }
      for (let key in transcriptedData) {
        body[key] = query[key] = transcriptedData[key];
      }
      query.Name = body['Name']
      query.Category=body['Category']
      body['content'] = body['Transcripted Text'];
      body['queryType'] = query.queryType = body['Query Type'];
      body['concernedDepartment'] = query.concernedDepartment = body['Concerned Department'];
      body['address'] = query.address = body['Location'];
      body['querySummary'] = query.querySummary = body['Query Summary'];
      body['queryAsk'] = query.queryAsk = body['Query ask'];
      body['userId'] = req.user._id;
      body['module'] = module

      console.log('======================> ', content)


      const user = await DbService.findOne(UserModel, { _id: req.user._id });
      let coinsUsed = user.totalCredits - user.creditsUsed
      if (coinsUsed > 0) {
        await DbService.create(grievancesQueriesModel, query);
        let transcriptedRecord = await DbService.create(GrievancesFileModel, body);
        if (transcriptedRecord) {
          let updateCoins = { "$inc": { "creditsUsed": 1 } }
          let totalCredits = req.user.totalCredits;
          if (totalCredits > 0 && req.user) {
            let userUpdate = await DbService.update(UserModel, { _id: req.user._id }, updateCoins);
            if (userUpdate) {
              let recordUpdate = await DbService.update(Grievances, { userId: req.user._id, "_id": fileId }, { status: 'Processed' })
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
  getContent: async (req, res,next) => {
    try {
      const { fileId } = req.params;
      if (!ObjectId.isValid(fileId)) throw badReqErr({ message: AdminMessages.INVALID_OBJECT_ID });
      const content = await DbService.findOne(GrievancesFileModel, { fileId: fileId })
      let uploadedFile = await DbService.findOne(Grievances, { _id: fileId })
      const fileContent = uploadedFile.file
      if (fileContent && uploadedFile) {
        LoggerService.logger.info({ status: true, data: { content, fileContent } })
        return res.json({ message: AdminMessages.GET, data: { content, fileContent } });
      }
    } catch (err) {
      let error = new Error(err.message);
      LoggerService.logger.error({ message: err, stack: error.stack })
      next(err)
    }
  },
  getGrievances:async(req,res,next)=>{
    try {

      const { start, limit } =CommonFun.pagination(req.query.currentPage ?? 1, req.query.pageSize ?? 10)
      const userId = req.user._id;
      let match = {
          userId: new ObjectId(userId)
      }
      let agg = [
          {
              $match: match
          },
          CommonAggService.lookup("grievances","fileId","_id","result"),
          {
            $addFields: {
                status: { $arrayElemAt: ['$result.status', 0] },
            },
        },
        {
            $project: {
              result: 0,
            },
        },
        {
            $sort: {
                createdAt: -1,
            },
        },
        {
            $group: {
                _id: null,
                grievances: { $push: '$$ROOT' },
            },
        },
        {
            $project: {
                _id: 0,
                grievances: 1,
            },
        },
          CommonAggService.facet(start, limit, "grievances")
      ];
      const grievances = await DbService.aggregate(grievancesQueriesModel, agg)
      if (grievances) {
          LoggerService.logger.info({ status: true, data: grievances })
      }
      return res.json({ message: AdminMessages.GET, data: { grievances: grievances[0]?.grievances[0]?.grievances ?? [], count: grievances[0]?.grievances[0]?.grievances?.length ?? 0 } });
  } catch (err) {
      let error = new Error(err.message);
      LoggerService.logger.error({ message: err, stack: error.stack })
      next(err)
  }
  },
  deleteGrievance:async(req,res,next)=>{
    try {
      const { fileId, fileKey } = req.body;
      if (!ObjectId.isValid(fileId)) throw badReqErr({ message: AdminMessages.INVALID_OBJECT_ID });
      let deleteUploadedRecord=await DbService.delete(Grievances, { _id: fileId });
      const deleteTranscribedContent = await DbService.delete(GrievancesFileModel, { fileId: fileId });
      const deleteQuery = await DbService.delete(grievancesQueriesModel, { fileId: fileId });
      const deleteFile = await CommonFun.deleteFile(fileKey)
      if (deleteQuery&&  deleteTranscribedContent && deleteUploadedRecord && deleteFile) {
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
  updateTranscribedContent: async (req, res, next) => {
    try {
        const { fileId } = req.params;
        if (!ObjectId.isValid(fileId)) throw badReqErr({ message: AdminMessages.INVALID_OBJECT_ID });
        const body = CommonFun.strToObj(req.body)
        const { value, error } = await transcriptionValidator.updateTranscription(body);
        if (error) throw badReqErr(error);
        let updatedFields = {}
        if (value.content) {
            updatedFields['editedContent'] = value.content;
        }
        let transcriptions = await DbService.update(GrievancesFileModel, { fileId: fileId }, updatedFields)
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
getTranslation: async (req, res, next) => {
  try {
      const {lang}=req.query;
      const { fileId } = req.params;
      if (!ObjectId.isValid(fileId)) throw badReqErr({ message: AdminMessages.INVALID_OBJECT_ID });
      let content = await DbService.findOne(GrievancesFileModel, { fileId: fileId })
      let uploadedFile=await DbService.findOne(Grievances, { _id: fileId })
      const fileContent = uploadedFile.file
      const translatedContent = await translateService.getTranslation(content.content, lang);
      if (translatedContent) {
          let transcribedContentUpdate = await DbService.update(GrievancesFileModel, { fileId: fileId }, { editedContent: translatedContent ,editedLang:lang})
          content = await DbService.findOne(GrievancesFileModel, { fileId: fileId })
          LoggerService.logger.info({status:true,data:content})
          return res.json({ message: AdminMessages.GET, data: { content } })
      } else {
          return res.json({ message: "Something went wrong", status: false })
      }
  } catch (err) {
      let error=new Error(err.message);
      LoggerService.logger.error({message: err, stack: error.stack})
      next(err)
  }
},
updateGrievance:async(req, res, next)=>{
    try {
        const { fileId } = req.params;
        const body = req.body
        let updatedFields = {}
        updatedFields[body.key] = body.value;

        let transcriptions = await DbService.update(GrievancesFileModel, { fileId: fileId }, updatedFields)

        return res.json({ message: 'Success', data: transcriptions });
    } catch (err) {
        let error = new Error(err.message);
        LoggerService.logger.error({ message: err, stack: error.stack })
    }
}
}