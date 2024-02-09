const { LoggerService } = require('../../services');

module.exports = {
    getCoinsLeft: async (req, res, next) => {
        try {
            let user=req.user
            let coinsleft= user.totalCredits - user.creditsUsed
            if(coinsleft){
                LoggerService.logger.info({status:true,message:"Got icons",coinsleft})
            }
            return res.json({ coinsleft: coinsleft });
        } catch (err) {
            let error=new Error(err.message);
            LoggerService.logger.error({message: err, stack: error.stack})
            next(err)
        }
    }
}