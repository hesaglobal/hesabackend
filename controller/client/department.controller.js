const { DepartmentModel } = require('../../models');
const { DbService, CommonFun, CommonAggService,LoggerService } = require('../../services')
const AdminMessages = require('../../db/messages/admin.messages');
const departmentValidator = require('../../services/validator/department.validator');
module.exports = {
    add: async (req, res, next) => {
        try {
            const { value, error } = await departmentValidator.add(req.body);
            if (error) throw badReqErr(error);
            value['userId']=req.user._id;
            const escapedName = value.name.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
            let checkExistingDepartment=await DbService.find(DepartmentModel, { name: { $regex: new RegExp(escapedName, 'i') } })
            if(checkExistingDepartment&&checkExistingDepartment.length>0){
              LoggerService.logger.info({status:false,message:"This department name already exists!"})
              return res.json({status:false,message:'This department name already exists!'})  
            }
            let departmentCreated=await DbService.create(DepartmentModel, value);
            if(departmentCreated){
                LoggerService.logger.info({status:true,data:departmentCreated,message: AdminMessages.ADD})
                return res.json({ message: AdminMessages.ADD, data: departmentCreated ,status:true});
            }else{
                LoggerService.logger.info({status:false,message:"Something went wrong!"})
                return res.json({ message:"Something went wrong!",status:false});
            }
        } catch (err) {
            let error=new Error(err.message);
            LoggerService.logger.error({message: err, stack: error.stack})
            next(err);
        }
    },
    get: async (req, res, next) => {
        try {
            const { id } = req.params;
            if (!ObjectId.isValid(id)) throw badReqErr({ message: AdminMessages.INVALID_OBJECT_ID });
            let department=await DbService.findOne(DepartmentModel, { _id: id })
            if(department){
                LoggerService.logger.info({status:true,data:department,message: AdminMessages.ADD})
                return res.json({ message: AdminMessages.GET, data:department,status:true });
            }else{
                LoggerService.logger.info({status:false,message:"Something went wrong!"})
                return res.json({ message:"Something went wrong!",status:false});
            }
        } catch (err) {
            let error=new Error(err.message);
            LoggerService.logger.error({message: err, stack: error.stack})
            next(err);
        }
    },
    getAll: async (req, res, next) => {
            try {
                let start, limit;
        
                if (req.query.currentPage && req.query.pageSize) {
                    const paginationResult = CommonFun.pagination(req.query.currentPage, req.query.pageSize);
                    start = paginationResult.start;
                    limit = paginationResult.limit;
                }
            
                const matchCriteria = {
                    userId: new ObjectId(req.user._id)
                };
            
                const agg = [
                    {
                        $match: matchCriteria
                    },
                    CommonAggService.facet(start, limit, "departments")
                ];
            
                let departments = await DbService.aggregate(DepartmentModel, agg);
            
                if (departments) {
                    LoggerService.logger.info({ status: true, data: departments, message: AdminMessages.ADD });
                }
            
                const responseData = {
                    message: AdminMessages.ADD,
                    data: {
                        departments: departments[0]?.departments ?? [],
                        count: departments[0]?.totalCount[0]?.count ?? 0
                    }
                };
            
                return res.json(responseData);
            } catch (err) {
                let error = new Error(err.message);
                LoggerService.logger.error({ message: err, stack: error.stack });
                next(err);
            }
    },
    update: async (req, res, next) => {
        try {
            const { id } = req.params;
            if (!ObjectId.isValid(id)) throw badReqErr({ message: AdminMessages.INVALID_OBJECT_ID });
            const { value, error } = await departmentValidator.update(req.body);
            if (error) throw error;
            if(value.name){
                const escapedName = value.name.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
                let checkExistingDepartment=await DbService.find(DepartmentModel, { name: { $regex: new RegExp(escapedName, 'i') } })
                if(checkExistingDepartment&&checkExistingDepartment.length>0){
                  LoggerService.logger.info({status:false,message:"This department name already exists!"})
                  return res.json({status:false,message:'This department name already exists!'})  
                }
            }
            let updatedDepartment=await DbService.update(DepartmentModel, { _id: id }, value)
            if(updatedDepartment){
                LoggerService.logger.info({status:true,data:updatedDepartment,message: AdminMessages.ADD})
                return res.json({ message: AdminMessages.ADD, data:updatedDepartment ,status:true });
            }else{
                LoggerService.logger.info({status:false,message:"Something went wrong!"})
                return res.json({ message:"Something went wrong!",status:false});
            }
        } catch (err) {
            let error=new Error(err.message);
            LoggerService.logger.error({message: err, stack: error.stack})
            next(err);
        }
    },
    delete: async (req, res, next) => {
        try {
            const { id } = req.params;
            if (!ObjectId.isValid(id)) throw badReqErr({ message: AdminMessages.INVALID_OBJECT_ID });
            let deleteDepartment=await DbService.delete(DepartmentModel, { _id: id });
            if(deleteDepartment){
                LoggerService.logger.info({status:true,data:deleteDepartment,message:"deleted department successfully!"})
                return res.json({ message: AdminMessages.DELETE, data: deleteDepartment,status:true});
            }else{
                LoggerService.logger.info({status:false,message:"Something went wrong!"})
                return res.json({ message:"Something went wrong!",status:false});
            }
           
        } catch (err) {
            let error=new Error(err.message);
            LoggerService.logger.error({message: err, stack: error.stack})
            next(err);
        }
    }
}