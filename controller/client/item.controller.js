const { Item } = require('../../models');
const {DbService, CommonFun, CommonAggService,LoggerService } = require('../../services')
const AdminMessages = require('../../db/messages/admin.messages');
const itemValidator = require('../../services/validator/item.validator');
const ObjectId = require('mongoose').Types.ObjectId;

module.exports={
    add:async(req,res,next)=>{
        try{
            const { value, error } = itemValidator.add(req.body);
            if (error) throw badReqErr(error);
            value['userId']=req.user._id;
            let checkExistingItem=await DbService.find(Item, { name: { $regex: new RegExp(value.name, 'i')},category:value.category,subCategory:value.subCategory })
            if(checkExistingItem&&checkExistingItem.length>0){
              LoggerService.logger.info({status:true,message:"This Item already exists!"})
                return res.json({status:false,message:'This Item already exists!'})  
            };
            let item=await DbService.create(Item,value);
            if(item){
              LoggerService.logger.info({status:true,data:item,message:"item added"})
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
            const { value, error } =itemValidator.patch(req.body);
            if (error) throw badReqErr(error);
            let inventoryUpdate=await DbService.findOneAndUpdate(Item,{_id:id,userId:req.user._id},value);
            if(inventoryUpdate){
              LoggerService.logger.info({status:true,data:inventoryUpdate,message:"item updated"})
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
            let deleteItem=await DbService.delete(Item,{_id:id});
            if(deleteItem){
              LoggerService.logger.info({status:true,data:deleteItem,message:"item deleted"})
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
                  },
                },
                CommonAggService.lookup('categories', 'category', '_id', 'category'),
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
                    createdAt: -1
                  }
                },
                CommonAggService.facet(start, limit, "items"),
              ];
              
              const items = await DbService.aggregate(Item, agg);
              
              if(items){
                LoggerService.logger.info({status:true,data:items,message:"item got"})
                return res.json({ message: AdminMessages.GET, data: { items: items[0].items ?? [],count: items[0].totalCount[0]?.count ?? 0  } });
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
    getItem:async(req,res,next)=>{
        try{
            let {id}=req.params;
            if (!ObjectId.isValid(id)) throw badReqErr({ message: AdminMessages.INVALID_OBJECT_ID });
            let item=await DbService.find(Item,{_id:id});
            if(item){
              LoggerService.logger.info({status:true,data:item,message:"single item got"})
                return res.json({status:true,message:AdminMessages.GET,item})
            }else{
              LoggerService.logger.info({status:false,message:"Something went wrong!"})
              return res.json({status:true,message:"Something went wrong"})
            }
        }catch(err){
          let error=new Error(err.message);
          LoggerService.logger.error({message: err, stack: error.stack})
          next(err)
        }
    }
}