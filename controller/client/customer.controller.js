const { Customer ,Hesaathi, Order} = require('../../models');
const { DbService, CommonFun, CommonAggService ,LoggerService} = require('../../services')
const AdminMessages = require('../../db/messages/admin.messages');
const customerValidator = require('../../services/validator/customer.validator');
const ObjectId = require('mongoose').Types.ObjectId;

module.exports = {
    add: async (req, res, next) => {
        try {
            const body = CommonFun.strToObj(req.body)
            const { value, error } = customerValidator.add(body);
            if (error) throw badReqErr(error);
            value['userId'] = req.user._id;
            if(!value.hesaathi) delete value['hesaathi'];
            let checkExistingCustomer = await DbService.findOne(Customer, { contact: value.contact });
            if (checkExistingCustomer&&value.orderId) {
                await DbService.findOneAndUpdate(Order,{_id:value.orderId},{customerId:checkExistingCustomer._id})
                return res.json({ status: true, message: 'Updated Successfully' })
            }
            if(value&&value.contact) {
                value['incomingContact']=value.contact;
            }
             let customer = await DbService.create(Customer, value);
            if (customer) {
                await DbService.findOneAndUpdate(Order,{_id:value.orderId},{customerId:customer._id})
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
    update: async (req, res, next) => {
        try {
            const { id } = req.params
            const body = CommonFun.strToObj(req.body)
            let customerUpdate
            if (!ObjectId.isValid(id)) throw badReqErr({ message: AdminMessages.INVALID_OBJECT_ID });
            const { value, error } = customerValidator.patch(body);

            if (error) throw badReqErr(error);

            if(!value.hesaathi) {
                await DbService.findOneAndUpdate(Customer, { _id: id, userId: req.user._id }, {$unset: { hesaathi:1 }});            
            }
            if(value.GSTTreatment.toLowerCase()==="no"){
                await DbService.findOneAndUpdate(Customer, { _id: id, userId: req.user._id }, {$unset: { GSTTreatmentType : 1, GSTIN : 1 }});
            }
            customerUpdate=await DbService.findOneAndUpdate(Customer, { _id: id, userId: req.user._id }, value);
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
    delete: async (req, res, next) => {
        try {
            const { id } = req.params
            if (!ObjectId.isValid(id)) throw badReqErr({ message: AdminMessages.INVALID_OBJECT_ID });
            let deleteCustomer = await DbService.delete(Customer, { _id: id });
            if (deleteCustomer) {
                LoggerService.logger.info({ status: true, data: deleteCustomer, message: "customer deleted" })
                return res.json({ status: true, message: AdminMessages.DELETE })
            } else {
                LoggerService.logger.info({ status: false, message: "Something went wrong!" })
                return res.json({ status: false, message: 'Something went wrong!' })
            }
        } catch (err) {
            let error = new Error(err.message);
            LoggerService.logger.error({ message: err, stack: error.stack })
            next(err)
        }
    },
    get: async (req, res, next) => {
        try {
            const { start, limit } = CommonFun.pagination(req.query.currentPage ?? 1, req.query.pageSize ?? 10)
            const userId = req.user._id;
            const agg = [
                {
                    $match: {
                        userId: new ObjectId(userId),
                    },
                },
                CommonAggService.lookup('hesaathis', 'hesaathi', '_id', 'hesaathi'),
                {
                    $addFields: {
                        hesaathiName: { $arrayElemAt: ['$hesaathi.name', 0] },
                    },
                },
                {
                    $project: {
                        hesaathi: 0,
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
                        customers: { $push: '$$ROOT' },
                    },
                },
                {
                    $project: {
                        _id: 0,
                        customers: 1,
                    },
                },
                CommonAggService.facet(start, limit, "customers"),
            ];

            const customers = await DbService.aggregate(Customer, agg);

            if (customers.length>0) {
                LoggerService.logger.info({ status: true, data: customers, message: "customers got" })
                return res.json({ message: AdminMessages.GET, data: { customers: customers[0]?.customers[0]?.customers ?? [], count: customers[0]?.customers[0]?.customers?.length ?? 0 } });
            } else {
                LoggerService.logger.info({ status: false, message: "Something went wrong!" })
                return res.json({ status: false, message: 'Something went wrong!' })
            }
        } catch (err) {
            let error = new Error(err.message);
            LoggerService.logger.error({ message: err, stack: error.stack })
            next(err)
        }
    },
    getCustomer:async(req,res,next)=>{
        try{
            let {id}=req.params;
            if (!ObjectId.isValid(id)) throw badReqErr({ message: AdminMessages.INVALID_OBJECT_ID });
            let customer=await DbService.find(Customer,{_id:id});
            let hesaathi=await DbService.findOne(Hesaathi,{_id:customer[0].hesaathi})
            if(customer){
              LoggerService.logger.info({status:true,data:customer,message:"single customer got"})
                return res.json({status:true,message:AdminMessages.GET,customer,hesaathi})
            }else{
              LoggerService.logger.info({status:false,message:"Something went wrong!"})
              return res.json({status:false,message:"Something went wrong"})
            }
        }catch(err){
          let error=new Error(err.message);
          LoggerService.logger.error({message: err, stack: error.stack})
          next(err)
        }
    },
    search: async (req, res, next) => {
        try {
          let { value } = req.query
          if(!value){
            return res.json({ message: AdminMessages.GET, data: { list: [], count: 0 } });
          }
          let regex = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      
          let searchData = {
            $or: [
              {
                name: {
                  "$regex": regex,
                  "$options": "i"
                }
              },
              {
                contact: regex
              }
            ]
          }
          let list = await DbService.find(Customer, searchData)
          return res.json({ message: AdminMessages.GET, data: { list, count: list.length } });
        } catch (err) {
          next(err);
        }
    
      }
}