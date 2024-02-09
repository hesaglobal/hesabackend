const bcryptjs = require('bcryptjs');
const { UserModel } = require('../../models');
const {DbService,TokenService,LoggerService} = require('../../services')
const AdminMessages = require('../../db/messages/admin.messages');
const commonValidator = require('../../services/validator/commonValidator');
module.exports = {
    signUp: async (req, res, next) => {
        try {
            const {value,error} = commonValidator.signUp(req.body);
            if(error) throw badReqErr(error);
            let createdUser=await DbService.create(UserModel,value)
            if(createdUser){
              LoggerService.logger.info({status:true,data:createdUser})
            }
            return res.json({ message: AdminMessages.ADD, data: createdUser,message:"created user successfully"})
        } catch (err) {
            let error=new Error(err.message);
            LoggerService.logger.error({message: err, stack: error.stack})
            next(err)
        }
    },
    logIn: async (req, res, next) => {
        try {
            const {value,error} = commonValidator.logIn(req.body);
            if(error) throw badReqErr(error);
            let user = await DbService.findOne(UserModel,{email:value.email});
            if(user == null) throw badReqErr({message:AdminMessages.INVALID_CREDENTIAL});
            if(!await bcryptjs.compare(value.password,user.password)) throw badReqErr({message:AdminMessages.INVALID_CREDENTIAL});
            user = JSON.parse(JSON.stringify(user)); delete user.password;
            if(user){
                LoggerService.logger.info({status:true,data:user,message:"Logged in successfully"})
            }
            return res.json({ message: AdminMessages.AUTH_LOGIN, data: user,token:await TokenService.create({_id:user._id},{}) });
        } catch (err) {
            let error=new Error(err.message);
            LoggerService.logger.error({message: err, stack: error.stack})
            next(err)
        }
    },
    verify: async (req, res, next) => {
        try {
            const { value, error } = commonValidator.verify(req.body)
            if(error) throw badReqErr(error);
            const tokenData = await TokenService.decodedToken(value.token);
            const isExist = await DbService.findOne(UserModel, { email: tokenData.email });
            if(!isExist) throw badReqErr({message:AdminMessages.USER_NOT_EXIST});
            const update = await DbService.update(UserModel, { email: isExist.email }, { token: "", isVerified: true })
            if(update){
                LoggerService.logger.info({status:true,data:update,message:"Updated user"})
            }
            return res.status(200).json({message: AdminMessages.AUTH_VERIFY, data: update });
        } catch (err) {
            let error=new Error(err.message);
            LoggerService.logger.error({message: err, stack: error.stack})
            next(err)
        }
    }
}