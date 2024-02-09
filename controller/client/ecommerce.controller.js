const { Ecommerce, Order, OrderItems, UserModel, TranscribedFiles, Customer, Item } = require('../../models');
const { DbService, CommonFun, CommonAggService, TransribedServices, LoggerService, PDFService, AwsService,PublisherService } = require('../../services')
const AdminMessages = require('../../db/messages/admin.messages');
const ecommerceValidator = require('../../services/validator/ecommerce.validator');
const customerValidator = require('../../services/validator/customer.validator');
const ecommerceService = require('../../services/ecommerce.service');
const { env } = require('../../db/constant');
const sendMessagesService = require('../../services/sendMessages.service');
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
      const transcriptions = await DbService.aggregate(Ecommerce, agg)
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
  processOrder: async (req, res, next) => {
    try {
      const { value, error } = await ecommerceValidator.processOrder(req.body);
      if (error) throw badReqErr(error);
      let userId = req.user._id;
      if (!ObjectId.isValid(value.fileId)) throw badReqErr({ message: AdminMessages.INVALID_OBJECT_ID });
      const { orderUpdate, matchedContent } = await ecommerceService.processOrderUtility(req.user, value.content, value.fileId);
      let { itemCount, totalAmount } = await ecommerceService.createOrderItems(matchedContent, { userId, fileId: orderUpdate.fileId, orderId: orderUpdate._id })
      let orderRecord=await DbService.findOne(Order, { fileId: value.fileId });
      let totalBalance =totalAmount- orderRecord.amountpaid || 0 ;
      let updateQuery = { "$inc": { "itemCount": itemCount }, totalamount: totalAmount, matched: true ,balance: totalBalance }
      let updateOrder = await DbService.findOneAndUpdate(Order, { fileId: value.fileId }, updateQuery)
      if (orderUpdate && updateOrder) {
        let orders = await DbService.find(OrderItems, { userId, orderId: orderUpdate._id, fileId: value.fileId })
        return res.json({ message: AdminMessages.GET, data: orders, status: true });
      } else {
        return res.json({ message: "Something went wrong!", status: false });
      }
    } catch (err) {
      let error = new Error(err.message);
      LoggerService.logger.error({ message: err, stack: error.stack })
      next(err)
    }
  },
  processOrderById: async (req, res, next) => {
    try {
      if (!ObjectId.isValid(req.params.orderId)) throw badReqErr({ message: AdminMessages.INVALID_OBJECT_ID });
      let order = await DbService.findOne(Order, { _id: req.params.orderId })
      const orderDetails = await DbService.findOne(TranscribedFiles, { fileId: order.fileId })
      const { orderUpdate, matchedContent } = await ecommerceService.processOrderUtility(req.user, orderDetails.content, order.fileId);
      let { itemCount, totalAmount } = await ecommerceService.createOrderItems(matchedContent, { userId: req.user._id, fileId: order.fileId, orderId: order._id })
      let totalBalance =totalAmount- order.amountpaid || 0 ;
      let updateQuery = { "$inc": { "itemCount": itemCount }, totalamount: totalAmount, matched: true ,balance: totalBalance}
      let updateOrder = await DbService.findOneAndUpdate(Order, { fileId: order.fileId }, updateQuery)
      if (orderUpdate && updateOrder) {
        return res.json({ message: AdminMessages.GET, status: true });
      } else {
        return res.json({ message: "Something went wrong!", status: false });
      }
    } catch (err) {
      let error = new Error(err.message);
      LoggerService.logger.error({ message: err, stack: error.stack })
      next(err)
    }
  },
  deleteOrderItem: async (req, res, next) => {
    try {
      const { _id } = req.body;
      let { fileId } = req.params;
      if (!ObjectId.isValid(_id) || !ObjectId.isValid(fileId)) throw badReqErr({ message: AdminMessages.INVALID_OBJECT_ID });
      let deletedOrderItem = await DbService.delete(OrderItems, { _id });
      let order = await DbService.findOne(Order, { fileId })
      if (deletedOrderItem) {
        let updateQuery = { "$inc": { "itemCount": -1 } }
        await DbService.findOneAndUpdate(Order, { fileId }, updateQuery)
        return res.json({ status: true, message: "Deleted successfully" })
      } else {
        return res.json({ status: false, message: "Something went wrong" })
      }
    } catch (err) {
      next(err)
    }
  },
  patchOrderItem: async (req, res, next) => {
    try {
      const { _id } = req.body;
      let { fileId } = req.params
      let body = req.body;
      body['fileId'] = fileId
      const { value, error } = await ecommerceValidator.patchItem(body);
      if (error) throw badReqErr(error);
      value['userId'] = req.user._id;
      delete value['_id'];
      let order = await DbService.findOne(Order, { fileId: fileId })
      if (_id && !ObjectId.isValid(_id) || !ObjectId.isValid(fileId)) throw badReqErr({ message: AdminMessages.INVALID_OBJECT_ID });
      let OrderItem
      if (_id) {
        OrderItem = await DbService.findOneAndUpdate(OrderItems, { _id: _id }, value)
      } else {
        OrderItem = await DbService.create(OrderItems, value);
        let updateQuery = { "$inc": { "itemCount": 1 } }
        await DbService.findOneAndUpdate(Order, { fileId }, updateQuery)
      }
      if (OrderItem) {
        return res.json({ status: true, message: "Added successfully", data: OrderItem })
      } else {
        return res.json({ status: false, message: "Something went wrong" })
      }
    } catch (err) {
      next(err)
    }
  },
  getOrders: async (req, res, next) => {
    try {
      const { start, limit } = CommonFun.pagination(req.query.currentPage ?? 1, req.query.pageSize ?? 10)
      const userId = req.user._id;
      let agg = [
        {
          $match: {
            userId: new ObjectId(userId),
          },
        },
        CommonAggService.lookup('orderitems', 'fileId', 'fileId', 'orderItems'),
        {
          $addFields: {
            total: {
              $reduce: {
                input: "$orderItems",
                initialValue: 0,
                in: {
                  $add: [
                    "$$value",
                    {
                      $cond: {
                        if: {
                          $and: [
                            { $ifNull: ["$$this.displayPrice", null] },
                            { $ifNull: ["$$this.quantity", null] }
                          ],
                        },
                        then: {
                          $multiply: [
                            { $toInt: { $ifNull: ["$$this.displayPrice", 0] } },
                            { $toInt: { $ifNull: ["$$this.quantity", 0] } }
                          ],
                        },
                        else: 0,
                      },
                    },
                  ],
                },
              },
            },
          },
        }
        ,
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
            order: 1,
            fileId: 1,
            orderId: 1,
            orderStatus: 1,
            matched: 1,
            amountpaid: 1,
            createdAt: 1,
            name: 1,
            contact: 1,
            total: 1,
          }
        }
        , CommonAggService.facet(start, limit, "orders")
      ];
      const orders = await DbService.aggregate(Order, agg)
      if (orders) {
        LoggerService.logger.info({ status: true, data: orders })
      }
      return res.json({ message: AdminMessages.GET, data: { orders: orders[0].orders ?? [], count: orders[0].totalCount[0]?.count ?? 0 } });
    } catch (err) {
      let error = new Error(err.message);
      LoggerService.logger.error({ message: err, stack: error.stack })
      next(err)
    }
  },
  addCustomerForOrder: async (req, res, next) => {
    try {
      const body = CommonFun.strToObj(req.body)
      const { value, error } = customerValidator.add(body);
      let customer;
      if (error) throw badReqErr(error);
      value['userId'] = req.user._id;
      if (value.hesaathiLinking.toLowerCase()==="no") {
       value["$unset"]= { hesaathi: 1 };
      } 
      if(value.GSTTreatment.toLowerCase()==="no"){
        value["$unset"]= { GSTTreatmentType: 1 ,GSTIN:1};
      }
      let checkExistingCustomer = await DbService.findOne(Customer, { incomingContact: value.incomingContact });
      if (checkExistingCustomer && value.orderId) {
        await DbService.findOneAndUpdate(Customer,{_id:checkExistingCustomer._id},value)
        await DbService.findOneAndUpdate(Order, { _id: value.orderId }, { customerId: checkExistingCustomer._id })
        return res.json({ status: true, message: 'Updated Successfully' })
      } else {
        customer = await DbService.create(Customer, value);
      }
      if (customer) {
        await DbService.findOneAndUpdate(Order, { _id: value.orderId }, { customerId: customer._id })
        LoggerService.logger.info({ status: true, data: customer, message: "Customer added" })
        return res.json({ status: true, message: AdminMessages.ADD })
      } else {
        LoggerService.logger.info({ status: false, message: "Something went wrong!" })
        return res.json({ status: false, message: 'Something went wrong!' })
      }
    } catch (err) {
      let error = new Error(err.message);
      LoggerService.logger.error({ message: err, stack: error.stack })
      next(err);
    }
  },
  updateCustomerForOrder: async (req, res, next) => {
    try {
      const { id } = req.params
      const body = CommonFun.strToObj(req.body)
      let customerUpdate
      if (!ObjectId.isValid(id)) throw badReqErr({ message: AdminMessages.INVALID_OBJECT_ID });
      const { value, error } = customerValidator.patch(body);

      if (error) throw badReqErr(error);

      if (!value.hesaathi) {
        await DbService.findOneAndUpdate(Customer, { _id: id, userId: req.user._id }, { $unset: { hesaathi: 1 } });
      }
      if (value.orderId) {
        LoggerService.logger.info({ status: true, message: "Order updated" })
        await DbService.findOneAndUpdate(Order, { _id: value.orderId }, { customerId: id })
      }
      customerUpdate = await DbService.findOneAndUpdate(Customer, { _id: id, userId: req.user._id }, value);
      if (customerUpdate) {
        LoggerService.logger.info({ status: true, data: customerUpdate, message: "Customer updated" })
        return res.json({ status: true, message: AdminMessages.UPDATE })
      } else {
        LoggerService.logger.info({ status: false, message: "Something went wrong!" })
        return res.json({ status: false, message: 'Something went wrong!' })
      }
    } catch (err) {
      let error = new Error(err.message);
      LoggerService.logger.error({ message: err, stack: error.stack })
      next(err);
    }
  },
  addPayment: async (req, res, next) => {
    try {
      const { id } = req.params
      const body = CommonFun.strToObj(req.body);
      let orderUpdate;
      let userId=req.user._id
      let order = await DbService.findOne(Order, { _id: id })
      if (!ObjectId.isValid(id)) throw badReqErr({ message: AdminMessages.INVALID_OBJECT_ID });
      const { value, error } = ecommerceValidator.updatePayment(body);
      if (error) throw badReqErr(error);

      if (req?.files?.receipt) {
        const data = await CommonFun.singleFileUpload(req.files.receipt[0], "order")
        value['receipt'] = data;
      }
      if (value.orderStatus && value.orderStatus.toLowerCase() === "accepted") {
        const html = await ecommerceService.pdfResult(id, req.user._id);
        if(!order.pdfResult){
          const pdf = await PDFService.generatePdf(html);
          let file = {
            buffer: Buffer.from(pdf, 'base64'),
            mimetype: "application/pdf"
          }
          const data = await AwsService.upload(file, "order");
          if (data) {
            value['pdfResult'] = data
          }
        }
        if (order.customerId&&!order.sentReceipt) {
          const messageData = await ecommerceService.buildMessageData(value.pdfResult||order.pdfResult, order.customerId, order.orderId,userId);
          value['sentReceipt']=true
          await sendMessagesService.sendMessage(messageData)
        } 
      }
      
      orderUpdate = await DbService.findOneAndUpdate(Order, { _id: id, userId: req.user._id }, value);
      if (orderUpdate) {
        LoggerService.logger.info({ status: true, data: orderUpdate, message: "order updated" })
        return res.json({ status: true, message: AdminMessages.UPDATE })
      } else {
        LoggerService.logger.info({ status: false, message: "Something went wrong!" })
        return res.json({ status: false, message: 'Something went wrong!' })
      }
    } catch (err) {
      let error = new Error(err.message);
      LoggerService.logger.error({ message: err, stack: error.stack })
      next(err);
    }
  },
  transcribeImage: async (req, res, next) => {
    try {
      const { fileKey, fileId } = req.body;
      const user = await DbService.findOne(UserModel, { _id: req.user?._id });
      let coinsUsed = user.totalCredits - user.creditsUsed
      if (coinsUsed > 0) {
        let content = await TransribedServices.getImageTranscription(`${env.S3_OBJECT_URL}${fileKey}`);
        let saveTranscription = await TransribedServices.updateTranscribedContents({ userId: user._id, module: 'Ecommerce', content, fileKey, fileId })
        if (!saveTranscription) {
          return res.json({ status: false, message: "Something went wrong!" });
        }
        let coinsReduced = saveTranscription ? await CommonFun.reduceCoins(1, user) : false
        if (coinsReduced) {
          let recordUpdate = await DbService.update(Ecommerce, { userId: req.user._id, "_id": fileId }, { status: 'Processed' })
          return res.json({ status: true, message: AdminMessages.ADD, data: recordUpdate });
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
  transcribeAudio: async (req, res, next) => {
    try {
      const { fileKey, fileId } = req.body;
      let content;

      const user = await DbService.findOne(UserModel, { _id: req.user?._id });
      let coinsUsed = user.totalCredits - user.creditsUsed
      if (coinsUsed > 0) {
        content = await TransribedServices.transcribeAudioOnly(fileKey);
        let saveTranscription = await TransribedServices.updateTranscribedContents({ userId: user._id, module: 'Ecommerce', content, fileKey, fileId })
        if (!saveTranscription) {
          return res.json({ status: false, message: "Something went wrong!" });
        }
        let coinsReduced = saveTranscription ? await CommonFun.reduceCoins(1, user) : false
        if (coinsReduced) {
          let recordUpdate = await DbService.update(Ecommerce, { userId: req.user._id, "_id": fileId }, { status: 'Processed' })
          return res.json({ status: true, message: AdminMessages.ADD, data: recordUpdate });
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
  generateReceipt: async (req, res, next) => {
    try {
      const { id } = req.params
      const userId = req.user._id
      if (!ObjectId.isValid(id))
        throw badReqErr({ message: AdminMessages.INVALID_OBJECT_ID });
      let order = await DbService.findOne(Order, { _id: id });
      if (order && order.pdfResult) {
        let pdfURL = `${env.S3_OBJECT_URL}${order.pdfResult}`
        LoggerService.logger.info({ status: true, message: pdfURL })
        return res.send({ pdfURL: pdfURL, status: true })
      }
      let html = await ecommerceService.pdfResult(id, userId)
      if (!html) {
        return res.status(400).send({ status: false, message: 'No Data Found' })
      } else {
        const pdf = await PDFService.generatePdf(html)
        let file = {
          buffer: Buffer.from(pdf, 'base64'),
          mimetype: "application/pdf"
        }
        const data = await AwsService.upload(file, "order");
        await DbService.findOneAndUpdate(Order, { _id: id }, { pdfResult: data })
        let pdfURL = `${env.S3_OBJECT_URL}${data}`
        LoggerService.logger.info({ status: true, message: pdfURL })
        return res.send({ pdfURL: pdfURL, status: true })
      }
    } catch (err) {
      let error = new Error(err.message);
      LoggerService.logger.error({ message: err, stack: error.stack })
      next(err);
    }
  },
  message: async (req, res, next) => {
    const data = await PublisherService.publishMessages(req.body)
  }
}
