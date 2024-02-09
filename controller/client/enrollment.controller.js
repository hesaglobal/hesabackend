const { EnrollmentModel ,Customer} = require('../../models');
const { DbService, CommonFun, CommonAggService ,LoggerService} = require('../../services')
const AdminMessages = require('../../db/messages/admin.messages');
const enrollmentValidator = require('../../services/validator/enrollment.validator');
const ObjectId = require('mongoose').Types.ObjectId;

module.exports = {
    add: async (req, res, next) => {
        try {
            const body = CommonFun.strToObj(req.body)
            const { value, error } = enrollmentValidator.add(body);
            if (error) throw badReqErr(error);
            value['userId'] = req.user._id;
            let checkExistingEnrollment = await DbService.findOne(EnrollmentModel, { phoneNo: value.phoneNo });
            if (checkExistingEnrollment) {
                LoggerService.logger.info({ status: true,  message: 'Enrollment with this contact already exists!'})
                return res.json({ status: false, message: 'Enrollment with this contact already exists!' })
            }
            let enrollment = await DbService.create(EnrollmentModel, value);
            if (enrollment) {
                LoggerService.logger.info({ status: true, data: enrollment, message: "Customer added" })
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
            if (!ObjectId.isValid(id)) throw badReqErr({ message: AdminMessages.INVALID_OBJECT_ID });
            const { value, error } = enrollmentValidator.patch(body);

            if (error) throw badReqErr(error);

            if(!value.referredBy) {
                await DbService.findOneAndUpdate(EnrollmentModel, { _id: id, userId: req.user._id }, {$unset: { referredBy:1 }});            
            }
            if(value?.hasAdhaar?.toLowerCase()==="no"){
                await DbService.findOneAndUpdate(EnrollmentModel, { _id: id, userId: req.user._id }, {$unset: { hasAdhaar : 1, adhaarNumber : 1 }});
            }
            enrollmentUpdate=await DbService.findOneAndUpdate(EnrollmentModel, { _id: id, userId: req.user._id }, value);
            if (enrollmentUpdate) {
                LoggerService.logger.info({ status: true, data: enrollmentUpdate, message: "Enrollment updated" })
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
            let deleteEnrollment = await DbService.delete(EnrollmentModel, { _id: id });
            if (deleteEnrollment) {
                LoggerService.logger.info({ status: true, data: deleteEnrollment, message: "customer deleted" })
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
                CommonAggService.lookup('customers', 'referredBy', '_id', 'result'),
                {
                    $addFields: {
                        customerName: { $arrayElemAt: ['$result.name', 0] },
                        contact:{ $arrayElemAt: ['$result.contact', 0] }
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
                        enrollments: { $push: '$$ROOT' },
                    },
                },
                {
                    $project: {
                        _id: 0,
                        enrollments: 1,
                    },
                },
                CommonAggService.facet(start, limit, "enrollments"),
            ];

            const enrollments = await DbService.aggregate(EnrollmentModel, agg);

            if (enrollments.length>0) {
                LoggerService.logger.info({ status: true, data: enrollments, message: "enrollments got" })
                return res.json({ message: AdminMessages.GET, data: { enrollments: enrollments[0]?.enrollments[0]?.enrollments ?? [], count: enrollments[0]?.enrollments[0]?.enrollments?.length ?? 0 } });
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
    getEnrollment:async(req,res,next)=>{
        try{
            let {id}=req.params;
            if (!ObjectId.isValid(id)) throw badReqErr({ message: AdminMessages.INVALID_OBJECT_ID });
            let enrollment=await DbService.find(EnrollmentModel,{_id:id});
            let referredPerson=await DbService.findOne(Customer,{_id:enrollment[0].referredBy})
            if(enrollment){
              LoggerService.logger.info({status:true,data:enrollment,message:"single customer got"})
                return res.json({status:true,message:AdminMessages.GET,enrollment,referredPerson})
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