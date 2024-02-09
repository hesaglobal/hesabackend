const { StaffModel,UserModel } = require('../../models')
const {DbService, CommonFun, CommonAggService,LoggerService} = require('../../services')
const AdminMessages = require('../../db/messages/admin.messages');
const { StaffValidator } = require('../../services')

module.exports = {
    add : async(req,res,next) => {
        try{
            const { value, error } = StaffValidator.add(req.body);
            if (error) throw badReqErr(error);
            let searchData = {
              $or: [
                {
                  email : value.email
                },
                {
                  phoneNo : value.phoneNo
                }
              ]
            }
            let checkStaffExist=await DbService.find(StaffModel,searchData)
            if(checkStaffExist&&checkStaffExist.length>0){
              LoggerService.logger.info({status:true,message:"This Staff already exists!"})
              return res.json({status:false,message:'This Staff already exists!'})  
            }
            value['userId']=req.user._id;
            let staff=await DbService.create(StaffModel,value);
            value['role']='Staff';
            value['modules']=["Inventory", "Hesaathi"]
            let createUser=await DbService.create(UserModel,value)

            if(staff&&createUser){
              LoggerService.logger.info({status:true,data:{staff,createUser},message:"item added"})
              return res.json({status:true,message:AdminMessages.ADD})
            }else{
              LoggerService.logger.info({status:false,message:"Something went wrong!"})
              return res.json({status:false,message:'Something went wrong!'})   
            }
        }
        catch(err){
            let error=new Error(err.message);
            LoggerService.logger.error({message: err, stack: error.stack})
            next(err);
        }
    },
    getStaffs : async(req,res,next) => {
        try{
            const { start, limit } = CommonFun.pagination(req.query.currentPage ?? 1, req.query.pageSize ?? 10)
            const agg = [
              {
                $match:{
                  userId:new ObjectId(req.user._id)
                },
              },
              CommonAggService.lookup("departments","department","_id","result"),
              {
                $project: {
                  "createdAt":1,
                  "name":1,
                  "email":1,
                  "phoneNo":1,
                  "designation":1,
                  departmentNames: "$result.name",
                },
              },
              CommonAggService.facet(start, limit, "staffs")
            ]
            let staffs = await DbService.aggregate(StaffModel, agg)
            if(staffs){
                LoggerService.adminLogger.info({status:true,data:staffs,message: AdminMessages.GET})
            }
            return res.json({ message: AdminMessages.ADD, data: { staffs: staffs[0].staffs ?? [], count: staffs[0].totalCount[0]?.count ?? 0 } });
        }
        catch(err){
            let error=new Error(err.message);
            LoggerService.logger.error({message: err, stack: error.stack})
            next(err);
        }
    },
    updateStaff : async(req,res,next) =>{
        try{
            const { value, error } = StaffValidator.update(req.body);
            if (error) throw badReqErr(error);
            delete value.isEdit
            const { id } = req.params;
            if (!ObjectId.isValid(id))
            throw badReqErr({ message: AdminMessages.INVALID_OBJECT_ID });
            let getStaff=await DbService.findOne(StaffModel, { _id: id })
            if(!getStaff){
                throw badReqErr({ message: "No such staff exists" });
            }
            let updateStaff = await DbService.findOneAndUpdate(StaffModel, { _id: id },value)
            if(updateStaff){
                LoggerService.adminLogger.info({status:true,data:updateStaff,message: AdminMessages.UPDATE})
            }
            return res.json({ message: AdminMessages.UPDATE, data:updateStaff,status:true  });
        }
        catch(err){
            let error=new Error(err.message);
            LoggerService.logger.error({message: err, stack: error.stack})
            next(err);
        }
    },
    deleteStaff:async(req,res,next)=>{
        try{
            const {id}=req.params
            if (!ObjectId.isValid(id)) throw badReqErr({ message: AdminMessages.INVALID_OBJECT_ID });
            let deleteStaff=await DbService.delete(StaffModel,{_id:id});
            if(deleteStaff){
              LoggerService.logger.info({status:true,data:deleteStaff,message:"staff deleted"})
              return res.json({status:true,message:AdminMessages.DELETE})
            }else{
              LoggerService.logger.info({status:false,message:"Something went wrong!"})
              return res.json({status:false,message:'Something went wrong!'})   
            }
        }catch(err){
          let error=new Error(err.message);
          LoggerService.logger.error({message: err, stack: error.stack})
          next(err)
        }
    },
    getStaffById : async(req,res,next) =>{
        try{
            const { id } = req.params;
            if (!ObjectId.isValid(id))
            throw badReqErr({ message: AdminMessages.INVALID_OBJECT_ID });
            let getStaff=await DbService.findOne(StaffModel, { _id: id })
            if(!getStaff){
                throw badReqErr({ message: "No such staff exists" });
            }
            LoggerService.logger.info({status:true,data:getStaff,message: AdminMessages.GET})
            return res.json({ message: AdminMessages.GET, data:getStaff  });
        }
        catch(err){
            let error=new Error(err.message);
            LoggerService.logger.error({message: err, stack: error.stack})
            next(err);
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
                phoneNo: regex
              }
            ]
          }
          let list = await DbService.find(StaffModel, searchData)
          return res.json({ message: AdminMessages.GET, data: { list, count: list.length } });
        } catch (err) {
          next(err);
        }
    
      },
}