const { ONDCModel, UserModel, ONDCTranscription, ONDCDescriptionModel, ONDCTranscribedProductModel,Category,SubCategory,Item } = require('../../models');
const { DbService, CommonFun, CommonAggService, LoggerService, TransribedServices } = require('../../services')
const AdminMessages = require('../../db/messages/admin.messages');
const commonFun = require('../../services/commonFun');
const { env } = require('../../db/constant');
const { TranscribeService } = require('aws-sdk');
const ObjectId = require('mongoose').Types.ObjectId;

module.exports = {
  getUploadedRecords: async (req, res, next) => {
    try {
      const { start, limit } = CommonFun.pagination(req.query.currentPage ?? 1, req.query.pageSize ?? 10)
      const userId = req.user._id;
      let agg = [
        {
          $match: {
            userId: new ObjectId(userId),
          }
        },
        {
          $sort: {
            createdAt: -1
          }
        },
        CommonAggService.facet(start, limit, "transcriptions")
      ];
      const transcriptions = await DbService.aggregate(ONDCModel, agg)
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
  uploadContent: async (req, res, next) => {
    try {
      let uploadedFiles = [], uploadAudio
      if (req.files['file']) {
        uploadedFiles = await commonFun.uploadMultipleFiles(req.files['file'], "ondc");
      }
      if (req.files['audio']) {
        uploadAudio = await commonFun.singleFileUpload(req.files['audio'][0], "ondc");
      }
      if (uploadAudio) {
        uploadedFiles.push({ name: req.files['audio'][0].originalname, type: "audio", url: uploadAudio });
      }
      if (uploadedFiles.length > 0 && uploadedFiles) {
        let dataUploaded = await DbService.create(ONDCModel, { userId: req.user._id, file: uploadedFiles })
        if (dataUploaded) {
          LoggerService.logger.info({ status: true, data: dataUploaded })
          return res.status(200).send({ status: true, message: "Uploaded Successfully!" })
        } else {
          LoggerService.logger.error({ message: "Error in uploading files!", status: false })
          return res.send({ status: false, message: "Error in uploading files" })
        }
      }
    } catch (err) {
      let error = new Error(err.message);
      LoggerService.logger.error({ message: err, stack: error.stack })
      next(err)
    }
  },
  transcribeContent: async (req, res, next) => {
    try {
      const { ondcId } = req.params;
      if (!ObjectId.isValid(ondcId)) throw badReqErr({ message: AdminMessages.INVALID_OBJECT_ID });
      let imageTranscription = ''
      let coinsToDeduct = 0;
      if (!ObjectId.isValid(ondcId)) throw badReqErr({ message: AdminMessages.INVALID_OBJECT_ID });
      let ondcRecord = await DbService.findOne(ONDCModel, { _id: ondcId });
      let audioContent = '';
      let data = {
        userId: req.user._id,
        ondcId
      }
      let ondcDescData = {
        longDescription: '',
        shortDescription: '',
        userId: req.user._id,
        ondcId
      }
      let user = await DbService.findOne(UserModel, { _id: req.user._id })
      let files = ondcRecord.file[0];
      // let additionalCoinsReduced=2;
      // let productDescCoins=1
      // let enoughCoins=user.totalCredits-(files.length+additionalCoinsReduced);

      // if(enoughCoins>0){
      // coinsToDeduct=files.length+additionalCoinsReduced;
      if (files && files.length > 0) {
        for (let file of files) {
          if (file.type.toLowerCase() == "image") {
            let content = await TransribedServices.getImageTranscription(`${env.S3_OBJECT_URL}${file.url}`);
            imageTranscription += (content + '\n');
          } else {
            audioContent = await TransribedServices.transcribeAudioOnly(file.url);
            data['audioTranscription'] = audioContent;
          }
        }
      }
      if (imageTranscription) {
        data['imageTranscription'] = imageTranscription;
      }
      let insertedRecord = await DbService.create(ONDCTranscription, data);
      let categories=await DbService.find(Category,{});
      let subcategories=await DbService.find(SubCategory,{})
      let content = insertedRecord.audioTranscription + insertedRecord.imageTranscription;
      ondcDescData["longDescription"] = await TransribedServices.getFormattedDescription(content, 'long');
      ondcDescData["shortDescription"] = await TransribedServices.getFormattedDescription(content, 'short');
      let formattedTranscription = await TransribedServices.getFromattedTranscriptionONDCProduct(content,categories,subcategories);
      const transcriptionData = JSON.parse(formattedTranscription);
      let body = { ondcId, userId: req.user._id }
      for (let data in transcriptionData) {
        if (transcriptionData[data]) {
          body[data] = transcriptionData[data];
        }
      }
      console.log(body, 'body>>>>>>>>>>>>>>>>>>>')
      // let updatedUser=await commonFun.reduceCoins(coinsToDeduct, user);
      if (insertedRecord) {
        await DbService.update(ONDCModel, { _id: ondcId }, { "$set": { status: "Processed" } });
        await DbService.create(ONDCDescriptionModel, ondcDescData);
        await DbService.create(ONDCTranscribedProductModel, body);
        LoggerService.logger.info({ status: true, data: { insertedRecord }, message: "transcription done successfully" })
        return res.status(200).send({ status: true, message: "transcription done successfully" })
      } else {
        LoggerService.logger.info({ status: false, message: "Something went wrong!" })
        return res.send({ status: false, message: "Something went wrong!" })
      }
      // }else{
      //   LoggerService.logger.info({status:false,message:"Kindly purchase more coins"})
      //   return res.send({status:false,message:"Kindly purchase more coins"})
      // }
    } catch (err) {
      let error = new Error(err.message);
      LoggerService.logger.error({ message: err, stack: error.stack })
      next(err)
    }
  },
  getTranscribedContent: async (req, res, next) => {
    try {
      let { ondcId } = req.params;
      if (!ObjectId.isValid(ondcId)) throw badReqErr({ message: AdminMessages.INVALID_OBJECT_ID });
      let transcribedRecord = await DbService.findOne(ONDCDescriptionModel, { ondcId });
      let uploadedRecord = await DbService.findOne(ONDCModel, { _id: ondcId });
      let productDesc = await DbService.findOne(ONDCTranscribedProductModel, { ondcId })
      if (transcribedRecord && productDesc && uploadedRecord) {
        LoggerService.logger.info({ status: true, data: { transcribedRecord, uploadedRecord, productDesc }, message: AdminMessages.GET })
        return res.status(200).send({ status: true, message: AdminMessages.GET, data: { transcribedRecord, uploadedRecord, productDesc } })
      } else {
        LoggerService.logger.info({ status: false, message: "Something went wrong!" })
        return res.send({ status: false, message: "Something went wrong!" })
      }
    } catch (err) {
      let error = new Error(err.message);
      LoggerService.logger.error({ message: err, stack: error.stack })
      next(err)
    }
  },
  deleteContent: async (req, res, next) => {
    try {
      let { ondcId } = req.params;
      if (!ObjectId.isValid(ondcId)) throw badReqErr({ message: AdminMessages.INVALID_OBJECT_ID });
      let descRecord = await DbService.delete(ONDCDescriptionModel, { ondcId });
      let transcribedRecord = await DbService.delete(ONDCTranscription, { ondcId });
      let record = await DbService.delete(ONDCModel, { _id: ondcId })
      if (transcribedRecord && record && transcribedRecord) {
        LoggerService.logger.info({ status: true, message: AdminMessages.DELETE })
        return res.status(200).send({ status: true, message: AdminMessages.DELETE })
      } else {
        LoggerService.logger.info({ status: false, message: "Something went wrong!" })
        return res.send({ status: false, message: "Something went wrong!" })
      }
    } catch (err) {
      let error = new Error(err.message);
      LoggerService.logger.error({ message: err, stack: error.stack })
      next(err)
    }
  },
  updateRecord: async (req, res, next) => {
    try {
      const { ondcId } = req.params;
      if (!ObjectId.isValid(ondcId)) throw badReqErr({ message: AdminMessages.INVALID_OBJECT_ID });
      const body = req.body;
      let updateProductRecord = await DbService.update(ONDCTranscribedProductModel, { ondcId: ondcId }, body)
      if (updateProductRecord) {
        await DbService.update(ONDCDescriptionModel, { ondcId: ondcId }, body);
        body['userId']=req.user._id;
        body['ondcId']=ondcId;
        if(body['TotalTaxRate']){
          body['GSTRate']=body['TotalTaxRate']
        }
        await DbService.create(Item,body);
        LoggerService.logger.info({ status: true, message: AdminMessages.UPDATE, data: updateProductRecord })
        return res.json({ status: true, message: AdminMessages.UPDATE, data: updateProductRecord })
      } else {
        LoggerService.logger.info({ status: false, message: "Something went wrong!" })
        return res.json({ status: false, message: "Something went wrong!" })
      }
    } catch (err) {
      let error = new Error(err.message);
      LoggerService.logger.error({ message: err, stack: error.stack });
      next(err);
    }
  },
}
