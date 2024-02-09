const { General } = require('../../models');
const {DbService, CommonFun, CommonAggService,LoggerService} = require('../../services')
const AdminMessages = require('../../db/messages/admin.messages');
const ObjectId = require('mongoose').Types.ObjectId;

module.exports = {
    getUploadedRecords:async(req,res,next)=>{
        try{
          const {start,limit} =CommonFun.pagination(req.query.currentPage ?? 1,req.query.pageSize ?? 10)
            const userId=req.user._id;
            let agg = [
                {
                  $match: {
                    userId:new ObjectId(userId),
                  }
                },
                {
                    $sort: {
                      createdAt: -1
                    }
                  },
                  CommonAggService.facet(start,limit,"transcriptions")
              ];
            const transcriptions=await DbService.aggregate(General,agg)
            if(transcriptions){
              LoggerService.logger.info({status:true,data:transcriptions})
            }
            return res.json({ message: AdminMessages.GET, data: {transcriptions:transcriptions[0].transcriptions ?? [] ,count:transcriptions[0].totalCount[0]?.count ?? 0} });
        }catch(err){
          let error=new Error(err.message);
          LoggerService.logger.error({message: err, stack: error.stack})
          next(err)
        }
    }
}
