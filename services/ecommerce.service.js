const { Ecommerce, UserModel, TranscribedFiles, Item, OrderItems, Order, Customer,InteraktMessageModel } = require('../models');
const { env,templates } = require('../db/constant')
const LoggerService = require('./logger.service')
const DbService = require('./Db.service')
const TransribedServices = require('./transcribe.service')
const fs = require('fs');
const commonAggService = require('./commonAgg.service');
const ejs = require('ejs')
const path = require('path');
const moment = require('moment')
const CommonFun = require('./commonFun')
const AwsService = require('./aws.services');
const customer = require('../models/customer');
const loggerService = require('./logger.service');
const { ToWords } = require('to-words');

module.exports = {
    transcribeAudio: async (fileKey, fileId, userId) => {
        try {
            let body

            let content;

            content = await TransribedServices.transcribeAudioOnly(fileKey);

            body['content'] = body['Transcripted Text'] = content;

            body['userId'] = userId;

            body['module'] = 'Ecommerce';

            const user = await DbService.findOne(UserModel, { _id: userId });
            let coinsUsed = user.totalCredits - user.creditsUsed
            if (coinsUsed > 0) {
                let transcriptedRecord = await DbService.create(TranscribedFiles, body);
                if (transcriptedRecord) {
                    let updateCoins = { "$inc": { "creditsUsed": 1 } }
                    let totalCredits = user.totalCredits;
                    if (totalCredits > 0) {
                        let userUpdate = await DbService.update(UserModel, { _id: userId }, updateCoins);
                        if (userUpdate) {
                            LoggerService.logger.info({ status: true, data: userUpdate })
                            const recordUpdate = await DbService.update(Ecommerce, { userId: req.user._id, "_id": fileId }, { status: 'Processed' })
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
    saveTranscription: async (TranscribedFiles, body) => {
        try {
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
        } catch (err) {
            let error = new Error(err.message);
            LoggerService.logger.error({ message: err, stack: error.stack })
            next(err)
        }
    },
    pdfResult: async (order_id, userId) => {
        const toWords = new ToWords({
            localeCode: 'en-IN',
            converterOptions: {
              currency: true,
              ignoreDecimal: false,
              ignoreZeroCurrency: false,
              doNotAddOnly: false,
              currencyOptions: { // can be used to override defaults for the selected locale
                name: 'Rupee',
                plural: 'Rupees',
                symbol: '₹',
                fractionalUnit: {
                  name: 'Paisa',
                  plural: 'Paise',
                  symbol: '',
                },
              }
            }
          });
        const agg = [
            {
                $match: {
                    _id: new ObjectId(order_id),
                }
            },
            commonAggService.lookup('orderitems', '_id', 'orderId', 'orderItems', [{ $match: { 'itemName': { $ne: '' } } }]),
            {
                $lookup: {
                    from: "customers",
                    localField: "customerId",
                    foreignField: "_id",
                    as: "customerInfo",
                }
            },
            {
                $addFields: {
                    name: {
                        $arrayElemAt: ["$customerInfo.name", 0]
                    },
                    contact: {
                        $arrayElemAt: ["$customerInfo.contact", 0]
                    },
                    location: {
                        $arrayElemAt: ["$customerInfo.location.locationName", 0]
                    },
                    customergstin:{
                        $arrayElemAt: ["$customerInfo.GSTIN", 0]
                    }

                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "userId",
                    foreignField: "_id",
                    as: "userInfo",
                }
            },
            {
                $addFields: {
                    gstin: {
                        $arrayElemAt: ["$userInfo.gstin", 0]
                    },
                    qr: {
                        $arrayElemAt: ["$userInfo.qr", 0]
                    },
                    invoiceaddress: {
                        $arrayElemAt: ["$userInfo.invoiceaddress", 0]
                    },
                    displayName:{
                        $arrayElemAt: ["$userInfo.displayName", 0]
                    }
                }
            },
            {
                $sort: {
                    createdAt: -1,
                },
            },
            {
                $project: {
                    _id: 1,
                    fileId: 1,
                    orderId: 1,
                    orderStatus: 1,
                    totalamount: 1,
                    amountpaid: 1,
                    balance:1,
                    orderItems: 1,
                    createdAt: 1,
                    name: 1,
                    contact: 1,
                    location: 1,
                    qr:1,
                    invoiceaddress: 1,
                    gstin:1,
                    customergstin:1,
                    displayName:1
                }
            }
        ]
        let report = await DbService.aggregate(
            Order,
            agg
        );

        const user = await DbService.findOne(UserModel, { _id: userId });

        const logo =
            user.logo
                ? `${env.S3_OBJECT_URL}${user.logo}`
                : `${env.S3_OBJECT_URL}public/assets/logo1.png`;
                
        if (report.length == 0) {
            return false;
        }
        console.log(user.gstin,report,'report')
        report = report[0]
        const compile = ejs.compile(fs.readFileSync(path.join(__dirname, '../templates/pdf/receipt.html'), 'utf8'))
        const html = compile({
            userName:user.name,
            usergstin:user.gstin,
            customergstin: report.customergstin,
            orderItems: report.orderItems,
            displayName:report.displayName,
            customerName: report.name,
            customerContact: report.contact,
            totalAmount: report.totalamount,
            amountpaid: report.amountpaid,
            balance: report.balance,
            totalAmountWords: toWords.convert(report.totalamount, { currency: true }),
            customerLocation: report.location,
            receiptId: report.orderId,
            date: moment(report.createdAt).format('MMM DD YY'),
            logo: logo,
            invoiceaddress:report.invoiceaddress || 'NA',
            qr: `${env.S3_OBJECT_URL}${report.qr}`
        });
        return html;
    },
    processOrder: async (fileLink, filename, content, userId, phonenumber, customerId,alreadyUploaded,messageId) => {
        try {
            let fileUrl;
            if(alreadyUploaded){
                fileUrl=fileLink;
            }else{
                fileUrl= await AwsService.uploadFileFromLink(fileLink, `order/${phonenumber}`)
            }
            
            let data = {
                file: { name: filename, url: fileUrl },
                userId
            }

            const file = await DbService.create(Ecommerce, data);
            await DbService.findOneAndUpdate(InteraktMessageModel,{_id:messageId},{fileId:file._id,module:"Ecommerce"})
            let orderData = {
                fileId: file._id,
                customerId: customerId,
                userId
            }

            orderCreation = await DbService.create(Order, orderData);

                
            const user = await DbService.findOne(UserModel, { _id: userId });
            let coinsUsed = user.totalCredits - user.creditsUsed
            if (coinsUsed > 0) {
                let saveTranscription = await TransribedServices.updateTranscribedContents({ userId: user._id, module: 'Ecommerce', content, fileKey: fileUrl, fileId: file._id })
                if (!saveTranscription) {
                    res.status(500).send({ status: false })
                }

                let coinsReduced = saveTranscription ? await CommonFun.reduceCoins(1, user) : false
                if (coinsReduced) {
                    await DbService.update(Ecommerce, { userId: user._id, "_id": file._id }, { status: 'Processed' })
                }

                return true
            }
        } catch (err) {
            console.log('================ err ', err)
            let error = new Error(err.message);
            LoggerService.logger.error({ message: err, stack: error.stack })
            throw error
        }
    },
    processOrderUtility: async (user, content, fileId) => {
        let orderUpdate, matchedContent;
        let order = {
            name: user.name,
            userId: user._id,
            fileId: fileId,
            matched: true
        }
        let existingOrder = await DbService.findOne(Order, { fileId: fileId })
        let itemsPresent = await DbService.find(Item, { userId: user._id });
        catalog = itemsPresent.map((item) => item.name).join(",")
        if (content) {
            matchedContent = await TransribedServices.matchCatalog(content, catalog);
            await DbService.update(UserModel, { _id: user._id }, { "$inc": { "creditsUsed": 1 } });
            console.log('=================> matched Content', matchedContent)
        }

        if (!existingOrder) {
            orderUpdate = await DbService.create(Order, order)
        } else {
            await DbService.deleteMany(OrderItems, { fileId: fileId })
            orderUpdate = existingOrder
        }

        return { orderUpdate, matchedContent }
    },
    createOrderItems: async (matchedContent, { userId, fileId, orderId }) => {
        let itemCount = 0;
        let totalAmount = 0;
        if (matchedContent && matchedContent.items.length > 0) {
            for (let item of matchedContent.items) {
                let itemPresent = await DbService.findOne(Item, { name: { $regex: new RegExp(item['itemName'], 'i') }, userId: userId });
                if (itemPresent && item['itemName'] !== '') {
                    item['salePrice'] = itemPresent.salePrice;
                    item['displayPrice'] = itemPresent.displayPrice;
                    item['purchasePrice'] = itemPresent.purchasePrice;
                    item['HSNCode'] = itemPresent.HSNCode;
                    item['GSTRate'] = itemPresent.GSTRate;
                    item['itemunit'] = itemPresent.units;
                }
                item['userId'] = userId;
                item['fileId'] = fileId;
                item['orderId'] = orderId;
                item['amount'] = (parseFloat(item['quantity'] || 0) * parseFloat(item['displayPrice'] || 0)).toFixed(2)
                totalAmount += parseFloat(item['amount'])
                await DbService.create(OrderItems, item)
                itemCount++;
            }

            return { itemCount, totalAmount };
        }
    },
    buildMessageData: async (pdfResultURL, customer, orderId,userId) => {
        try {
            let customerVal = await DbService.findOne(Customer, { _id: customer })
            let bodyValues = [ orderId, customerVal.location.locationName];
            let headerValues = [`${env.S3_OBJECT_URL}${pdfResultURL}`];
            let messageData = {
                template: templates.order_confirmation,
                contactNumber: customerVal.contact,
                bodyValues,
                callbackMessage: 'Done',
                headerValues,
                languageCode: "en",
                userId
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
