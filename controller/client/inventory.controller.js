const { DbService, LoggerService } = require('../../services')
const AdminMessages = require('../../db/messages/admin.messages');
const commonFun = require('../../services/commonFun');
const PublisherService = require('../../services/message/publisher.service')
const AdmZip = require('adm-zip');
const {UploadRecords}=require('../../models')
module.exports = {
    uploadFiles: async (req, res, next) => {
        try {
            const zipFilePath = req.files.zipFile[0];
            const zip = new AdmZip(zipFilePath.buffer);
            const zipEntries = zip.getEntries();
            await DbService.deleteMany(UploadRecords,{userId:req.user._id});
            zipEntries.forEach(async zipEntry => {
                if (!zipEntry.isDirectory) {
                    const fileName = zipEntry.entryName;
                    const fileContent = zipEntry.getData();
                    const data=await commonFun.singleFileUpload({
                        buffer:fileContent,
                        mimetype:await commonFun.getImageMimeType(fileName)
                    },"inventory");
                    let body={userId:req.user._id,file:{name:fileName,url:data}};
                    await DbService.create(UploadRecords,body);   
                }
            });
            if(zipEntries.length>0&&zipEntries){
                return res.json({status:true,message:"Files Uploaded Sucessfully"})
            }else{
                return res.json({status:false,message:"Something went wrong!"})
            }
        } catch (err) {
            let error = new Error(err.message);
            LoggerService.logger.error({ message: err, stack: error.stack })
            next(err)
        }
    },
    processFiles: async (req, res, next) => {
        try {    
            let message = {userId: req.user._id, process: 'UPLOAD_INVENTORY'}
            await PublisherService.publishMessages(message)
            return res.json({status:true,message:"Files in queue"})
        } catch (err) {
            let error = new Error(err.message);
            LoggerService.logger.error({ message: err, stack: error.stack })
            next(err)
        }
    }
}  
