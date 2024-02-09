const {  LoggerService, DashBoardService} = require('../../services')
const AdminMessages = require('../../db/messages/admin.messages');

module.exports = {
   getDashboardFields:async(req,res,next)=>{
    try{
        let userId=req.user._id;
        let {result}=await DashBoardService.getDashboardData(userId)
       return res.json({status:true,message:AdminMessages.GET,data:result})
    }catch(err){
        let error = new Error(err.message);
        LoggerService.logger.error({ message: err, stack: error.stack })
        next(err);
    }
   }
}