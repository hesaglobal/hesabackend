const { Category,SubCategory } = require('../../models');
const {DbService, CommonFun, CommonAggService,LoggerService} = require('../../services')
const AdminMessages = require('../../db/messages/admin.messages');
const categoryValidator = require('../../services/validator/category.validator');
const ObjectId = require('mongoose').Types.ObjectId;

module.exports={
    add:async(req,res,next)=>{
        try{
            const { value, error } = await categoryValidator.add(req.body);
            if (error) throw badReqErr(error);
            value['userId']=req.user._id;
            let checkExistingCategory=await DbService.find(Category, { name: { $regex: new RegExp(value.name, 'i') }})
            if(checkExistingCategory&&checkExistingCategory.length>0){
                LoggerService.logger.info({status:true,data:checkExistingCategory,message:"category already exist"})
                return res.json({status:false,message:'This Category already exists!'})  
            }
            let category=await DbService.create(Category,value);
            if(category){
                LoggerService.logger.info({status:true,data:category,message:"added categories"})
                return res.json({status:true,message:AdminMessages.ADD})
            }else{
                LoggerService.logger.info({status:false,message:"Something went wrong!"})
                return res.json({status:false,message:'Something went wrong!'})    
            }
        }catch(err){
            let error=new Error(err.message);
            LoggerService.logger.error({message: err, stack: error.stack})
            next(err);
        }
    },
    update:async(req,res,next)=>{
        try{
            const {id}=req.params
            if (!ObjectId.isValid(id)) throw badReqErr({ message: AdminMessages.INVALID_OBJECT_ID });
            const { value, error } = await categoryValidator.patch(req.body);
            if (error) throw badReqErr(error);
            let categoryUpdate=await DbService.findOneAndUpdate(Category,{_id:id,userId:req.user._id},value);
            if(categoryUpdate){
                LoggerService.logger.info({status:true,data:categoryUpdate,message:"updated categories"})
                return res.json({status:true,message:AdminMessages.UPDATE})
            }else{
               LoggerService.logger.info({status:false,message:"Something went wrong!"})
               return res.json({status:false,message:'Something went wrong!'}) 
            }
        }catch(err){
            let error=new Error(err.message);
            LoggerService.logger.error({message: err, stack: error.stack})
            next(err);
        }
    },
    delete:async(req,res,next)=>{
        try{
            const {id}=req.params
            if (!ObjectId.isValid(id)) throw badReqErr({ message: AdminMessages.INVALID_OBJECT_ID });
            let deleteCategory=await DbService.delete(Category,{_id:id});
            let deleteSubCategories=await DbService.delete(SubCategory,{categoryId:id});
            if(deleteCategory&&deleteSubCategories){
                LoggerService.logger.info({status:true,data:deleteCategory,message:"deleted categories"})
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
    get:async(req,res,next)=>{
        try{
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
              CommonAggService.facet(start, limit, "categories")
            ];
            const categories = await DbService.aggregate(Category, agg)
            if(categories){
                LoggerService.logger.info({status:true,data:categories,message:"got categories"})
                return res.json({ message: AdminMessages.GET, data: { categories: categories[0].categories ?? [], count: categories[0].totalCount[0]?.count ?? 0 } });
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
    getAll:async(req,res,next)=>{
        try{
            
            const categories = await DbService.find(Category, {})
            if(categories){
                LoggerService.logger.info({status:true,data:categories,message:"got categories"})
                return res.json({ message: AdminMessages.GET, data: categories });
            }else{
                LoggerService.logger.info({status:false,message:"Something went wrong!"})
                return res.json({status:false,message:'Something went wrong!'}) 
            }
        }catch(err){
            let error=new Error(err.message);
            LoggerService.logger.error({message: err, stack: error.stack})
            next(err)
        }
    }
}