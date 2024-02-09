const { CustomerCare, Jobs, Finance, General, Ecommerce,Grievances,RealEstate } = require('../../models');
const { DbService,LoggerService } = require('../../services')
const AdminMessages = require('../../db/messages/admin.messages');
const commonFun = require('../../services/commonFun');
module.exports = {
    uploadFiles: async (req, res, next) => {
        try {
            const body = req.body;
            const { module } = req.body;
            let checkFileDuplicacy
            body.userId = req.user._id
            let recordCount = 0;
            let fileName
            let userId = req.user._id;
            let alreadyUploadedFiles = []
            if (req.files['file']&&module!='Ecommerce') {
                for (let file of req.files['file']) {
                    if (module == 'CustomerCare') {
                        checkFileDuplicacy = await DbService.findOne(CustomerCare, { "file.name": req.files.file[recordCount].originalname, userId })
                        fileName = checkFileDuplicacy ? checkFileDuplicacy?.file?.name : ''
                        if (fileName) {
                            alreadyUploadedFiles.push(fileName)
                        } else {
                            let data = await commonFun.singleFileUpload(file, `file/${body['userId']}/CustomerCare`)
                            body['file'] = { name: req.files.file[recordCount].originalname, url: data }
                            await DbService.create(CustomerCare, body);
                        }
                    } else if (module == 'Jobs') {
                        checkFileDuplicacy = await DbService.findOne(Jobs, { "file.name": req.files.file[recordCount].originalname, userId })
                        fileName = checkFileDuplicacy ? checkFileDuplicacy?.file?.name : ''
                        if (fileName) {
                            alreadyUploadedFiles.push(fileName)
                        } else {
                            let data = await commonFun.singleFileUpload(file, `file/${body['userId']}/${body['module']}`)
                            body['file'] = { name: req.files.file[recordCount].originalname, url: data }
                            await DbService.create(Jobs, body);
                        }

                    } else if (module == 'Finance') {
                        checkFileDuplicacy = await DbService.findOne(Finance, { "file.name": req.files.file[recordCount].originalname, userId })
                        fileName = checkFileDuplicacy ? checkFileDuplicacy?.file?.name : ''
                        if (fileName) {
                            alreadyUploadedFiles.push(fileName)
                        } else {
                            let data = await commonFun.singleFileUpload(file, `file/${body['userId']}/${body['module']}`)
                            body['file'] = { name: req.files.file[recordCount].originalname, url: data }
                            await DbService.create(Finance, body);
                        }
                    } else if(module=="PublicGrievance"){
                        checkFileDuplicacy = await DbService.findOne(Grievances, { "file.name": req.files.file[recordCount].originalname, userId })
                        fileName = checkFileDuplicacy ? checkFileDuplicacy?.file?.name : ''
                        if (fileName) {
                            alreadyUploadedFiles.push(fileName)
                        } else {
                            let data = await commonFun.singleFileUpload(file, `file/${body['userId']}/${body['module']}`)
                            body['file'] = { name: req.files.file[recordCount].originalname, url: data }
                            await DbService.create(Grievances, body);
                        }
                    }else if(module=="RealEstate"){
                        checkFileDuplicacy = await DbService.findOne(RealEstate, { "file.name": req.files.file[recordCount].originalname, userId })
                        fileName = checkFileDuplicacy ? checkFileDuplicacy?.file?.name : ''
                        if (fileName) {
                            alreadyUploadedFiles.push(fileName)
                        } else {
                            let data = await commonFun.singleFileUpload(file, `file/${body['userId']}/${body['module']}`)
                            body['file'] = { name: req.files.file[recordCount].originalname, url: data }
                            await DbService.create(RealEstate, body);
                        }
                    }
                    else {
                        checkFileDuplicacy = await DbService.findOne(General, { "file.name": req.files.file[recordCount].originalname, userId })
                        fileName = checkFileDuplicacy ? checkFileDuplicacy?.file?.name : ''
                        if (fileName) {
                            alreadyUploadedFiles.push(fileName)
                        } else {
                            let data = await commonFun.singleFileUpload(file, `file/${body['userId']}/${body['module']}`)
                            body['file'] = { name: req.files.file[recordCount].originalname, url: data }
                            await DbService.create(General, body);
                        }
                    }
                    recordCount++;
                }
            } else {
                checkFileDuplicacy = await DbService.findOne(Ecommerce, { "file.name": req.files.file[recordCount].originalname, userId })
                fileName = checkFileDuplicacy ? checkFileDuplicacy?.file?.name : ''
                if (fileName) {
                    alreadyUploadedFiles.push(fileName)
                } else {
                    let data = await commonFun.singleFileUpload(req.files.file[0], `file/${body['userId']}/${body['module']}`)
                    body['file'] = { name: req.files.file[recordCount].originalname, url: data }
                    await DbService.create(Ecommerce, body);
                }
                recordCount = 1;
            }
            if (req.files['file'] && recordCount == req.files['file'].length) {
                if (alreadyUploadedFiles.length > 0) {
                    LoggerService.logger.info({ status: true, message: `${alreadyUploadedFiles.length} files already exists` })
                    return res.json({ status: false, message: `${alreadyUploadedFiles.length} files already exists` })
                } else {
                    LoggerService.logger.info({ status: true, message: "Files uploaded successfully!" })
                    return res.json({ status: true, message: AdminMessages.ADD, status: true });
                }
            } else if (req.files['file'] && recordCount == 1) {
                if (alreadyUploadedFiles.length > 0) {
                    LoggerService.logger.info({ status: true, message: `${alreadyUploadedFiles.length} files already exists` })
                    return res.json({ status: false, message: `${alreadyUploadedFiles.length} files already exists` })
                } else {
                    LoggerService.logger.info({ status: true, message: "Files uploaded successfully!" })
                    return res.json({ status: true, message: AdminMessages.ADD, status: true });
                }
            } else {
                return res.json({ status: false, message: `Something went wrong!` })
            }
        } catch (err) {
            let error = new Error(err.message);
            LoggerService.logger.error({ message: err, stack: error.stack })
            next(err)
        }
    }
}  
