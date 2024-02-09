const {SubCategory } = require('../../models');
const {DbService, CommonFun, CommonAggService,LoggerService} = require('../../services')
const AdminMessages = require('../../db/messages/admin.messages');
const subcategoryValidator = require('../../services/validator/subcategory.validator');
const ObjectId = require('mongoose').Types.ObjectId;

module.exports={
    add:async(req,res,next)=>{
        try{
            const { value, error } = await subcategoryValidator.addOrPatch(req.body);
            if (error) throw badReqErr(error);
            value['userId']=req.user._id;
            let checkExistingSubCategory=await DbService.find(SubCategory,{ name: { $regex: new RegExp(value.name, 'i')},categoryId:value.categoryId })
            if(checkExistingSubCategory&&checkExistingSubCategory.length>0){
              LoggerService.logger.info({status:true,message:"This subCategory already exists!"})
                return res.json({status:false,message:'This subCategory already exists!'})  
            }
            let subCategory=await DbService.create(SubCategory,value);
            if(subCategory){
              LoggerService.logger.info({status:true,data:subCategory,message:"Sub Category added"})
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
            if (!ObjectId.isValid(id)||!ObjectId.isValid(req.body.categoryId)) throw badReqErr({ message: AdminMessages.INVALID_OBJECT_ID });
            const { value, error } = await subcategoryValidator.addOrPatch(req.body);
            if (error) throw badReqErr(error);
            let subCategoryUpdate=await DbService.findOneAndUpdate(SubCategory,{_id:id,userId:req.user._id},value);
            if(subCategoryUpdate){
              LoggerService.logger.info({status:true,data:subCategoryUpdate,message:"Sub Category updated"})
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
            let deleteSubCategory=await DbService.delete(SubCategory,{_id:id});
            if(deleteSubCategory){
              LoggerService.logger.info({status:true,data:deleteSubCategory,message:"Sub Category deleted"})
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
            const agg = [
                {
                  $match: {
                    userId: new ObjectId(userId),
                  },
                },
                CommonAggService.lookup('categories', 'categoryId', '_id', 'category'),
                {
                  $addFields: {
                    categoryName: { $arrayElemAt: ['$category.name', 0] },
                  },
                },
                {
                  $project: {
                    category: 0, 
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
                    subcategories: { $push: '$$ROOT' },
                  },
                },
                {
                  $project: {
                    _id: 0,
                    subcategories: 1,
                  },
                },
                CommonAggService.facet(start, limit, "subcategories"),
              ];
              
            const subcategories = await DbService.aggregate(SubCategory, agg); 
            if(subcategories){
              LoggerService.logger.info({status:true,data:subcategories,message:"Sub Categories"})
              return res.json({ message: AdminMessages.GET, data: { subcategories: subcategories[0]?.subcategories[0]?.subcategories ?? [], count: subcategories[0]?.subcategories[0]?.subcategories?.length ?? 0 } });
            } else{
              LoggerService.logger.info({status:false,message:"Something went wrong!"})
              return res.json({status:false,message:'Something went wrong!'})   
            }           
        }catch(err){
          let error=new Error(err.message);
          LoggerService.logger.error({message: err, stack: error.stack})
          next(err)
        }
    },
    subcategoryByCategory:async(req,res,next)=>{
      try{    
        let {categoryId}=req.params;
        const subcategories=await DbService.find(SubCategory,{categoryId})
        if(subcategories&&subcategories.length>0){
          LoggerService.logger.info({status:true,data:subcategories,message:"Sub Categories by category"})
          return res.json({status:true,message:AdminMessages.GET,subcategories});
        }else{
          LoggerService.logger.info({status:false,message:"Something went wrong!"})
          return res.json({status:false,message:"Something went wrong!"})
        }
      }catch(err){
        let error=new Error(err.message);
        LoggerService.logger.error({message: err, stack: error.stack})
        next(err);
      }
    },
    getAll:async(req,res,next)=>{
      try{
          const subcategories = await DbService.find(SubCategory,{}); 
          if(subcategories){
            LoggerService.logger.info({status:true,data:subcategories,message:"Sub Categories"})
            return res.json({ message: AdminMessages.GET, data: subcategories });
          } else{
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