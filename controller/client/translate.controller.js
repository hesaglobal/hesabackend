const { TranscribedFiles,Ecommerce,Finance,Jobs,CustomerCare,General } = require('../../models');
const { DbService,LoggerService} = require('../../services')
const AdminMessages = require('../../db/messages/admin.messages');
const translateService = require('../../services/translate.service');
module.exports = {
    getTranslation: async (req, res, next) => {
        try {
            const {module,lang}=req.query;
            const { fileId } = req.params;
            if (!ObjectId.isValid(fileId)) throw badReqErr({ message: AdminMessages.INVALID_OBJECT_ID });
            let content = await DbService.findOne(TranscribedFiles, { fileId: fileId })
            let uploadedFile;
            if(module=='CustomerCare'){
                uploadedFile = await DbService.findOne(CustomerCare, { _id: fileId })
            }else if(module=='Finance'){
                uploadedFile = await DbService.findOne(Finance, { _id: fileId })
            }else if(module=='Jobs'){
                uploadedFile = await DbService.findOne(Jobs, { _id: fileId })
            }else if(module =='Ecommerce'){
                uploadedFile = await DbService.findOne(Ecommerce, { _id: fileId })
            }else{
                uploadedFile = await DbService.findOne(General, { _id: fileId })
            }
            const fileContent = uploadedFile.file
            const translatedContent = await translateService.getTranslation(content.content, lang);
            if (translatedContent) {
                let transcribedContentUpdate = await DbService.update(TranscribedFiles, { fileId: fileId }, { editedContent: translatedContent ,editedLang:lang})
                content = await DbService.findOne(TranscribedFiles, { fileId: fileId })
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


}

