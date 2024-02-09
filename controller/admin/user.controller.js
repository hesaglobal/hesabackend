const { UserModel } = require('../../models');
const { DbService, CommonFun, CommonAggService,LoggerService } = require('../../services')
const AdminMessages = require('../../db/messages/admin.messages');
const AdminValidator = require('../../services/validator/adminValidator');

module.exports = {
    add: async (req, res, next) => {
        try {
            const body = CommonFun.strToObj(req.body)
            const { value, error } = await AdminValidator.user(body);
            if (error) throw badReqErr(error);
            if (req.files.pic) {
                const data = await CommonFun.singleFileUpload(req.files.pic[0], "uploads")
                value['pic'] = data;
            }
            if (req.files.logo) {
                const data = await CommonFun.singleFileUpload(req.files.logo[0], "logos")
                value['logo'] = data;
            }
            if (req.files.qr) {
                const data = await CommonFun.singleFileUpload(req.files.qr[0], "qrs")
                value['qr'] = data;
            }
            let userCreated=await DbService.create(UserModel, value);
            if(userCreated){
                LoggerService.adminLogger.info({status:true,data:userCreated,message: AdminMessages.ADD})
            }
            return res.json({ message: AdminMessages.ADD, data: userCreated });
        } catch (err) {
            let error=new Error(err.message);
            LoggerService.adminLogger.error({message: err, stack: error.stack})
            next(err);
        }
    },
    getAll: async (req, res, next) => {
        try {
            const { start, limit } = CommonFun.pagination(req.query.currentPage ?? 1, req.query.pageSize ?? 10)
            const filter = {
                $or: [
                  { role: "Client" },
                  { role: "Staff" }
                ]
            };
            const agg = [
                { $match: filter },
                CommonAggService.facet(start, limit, "users")
            ]
            let users = await DbService.aggregate(UserModel, agg)
            if(users){
                LoggerService.adminLogger.info({status:true,data:users,message: AdminMessages.ADD})
            }
            return res.json({ message: AdminMessages.ADD, data: { users: users[0].users ?? [], count: users[0].totalCount[0]?.count ?? 0 } });
        } catch (err) {
            let error=new Error(err.message);
            LoggerService.adminLogger.error({message: err, stack: error.stack})
            next(err);
        }
    },
    get: async (req, res, next) => {
        try {
            const { id } = req.params;
            if (!ObjectId.isValid(id)) throw badReqErr({ message: AdminMessages.INVALID_OBJECT_ID });
            let getUser=await DbService.findOne(UserModel, { _id: id })
            if(getUser){
                LoggerService.adminLogger.info({status:true,data:getUser,message: AdminMessages.ADD})
            }
            return res.json({ message: AdminMessages.GET, data:getUser });
        } catch (err) {
            let error=new Error(err.message);
            LoggerService.adminLogger.error({message: err, stack: error.stack})
            next(err);
        }
    },
    update: async (req, res, next) => {
        try {
            const { id } = req.params;
            if (!ObjectId.isValid(id)) throw badReqErr({ message: AdminMessages.INVALID_OBJECT_ID });
            const body = CommonFun.strToObj(req.body)
            const { value, error } = AdminValidator.updateuser(body);
            if (error) throw error;
            if (value.allocateCoins > 0) value['$inc'] = { totalCredits: value.allocateCoins };
            if (req.files.pic) {
                const data = await CommonFun.singleFileUpload(req.files.pic[0], "uploads")
                value['pic'] = data;
            }

            if (req.files.logo) {
                const data = await CommonFun.singleFileUpload(req.files.logo[0], "logos")
                value['logo'] = data;
            } 

            if (req.files.qr) {
                const data = await CommonFun.singleFileUpload(req.files.qr[0], "qr")
                value['qr'] = data;
            } 
            
            let updatedUser=await DbService.update(UserModel, { _id: id }, value)
            if(updatedUser){
                LoggerService.adminLogger.info({status:true,data:updatedUser,message: AdminMessages.ADD})
            }
            return res.json({ message: AdminMessages.ADD, data:updatedUser  });
        } catch (err) {
            let error=new Error(err.message);
            LoggerService.adminLogger.error({message: err, stack: error.stack})
            next(err);
        }
    },
    delete: async (req, res, next) => {
        try {
            const { id } = req.params;
            if (!ObjectId.isValid(id)) throw badReqErr({ message: AdminMessages.INVALID_OBJECT_ID });
            let deleteUser=await DbService.delete(UserModel, { _id: id });
            if(deleteUser){
                LoggerService.adminLogger.info({status:true,data:deleteUser,message: AdminMessages.ADD})
            }
            return res.json({ message: AdminMessages.ADD, data: deleteUser});
        } catch (err) {
            let error=new Error(err.message);
            LoggerService.adminLogger.error({message: err, stack: error.stack})
            next(err);
        }
    },
    changeStatus: async (req, res, next) => {
        try {
            const { id } = req.params;
            const { status } = req.body;
            if (!ObjectId.isValid(id)) throw badReqErr({ message: AdminMessages.INVALID_OBJECT_ID });
            let updateUser=await DbService.update(UserModel, { _id: id }, { status: status });
            if(updateUser){
                LoggerService.adminLogger.info({status:true,data:updateUser,message: AdminMessages.ADD})
            }
            return res.json({ message: AdminMessages.ADD, data:updateUser  });

        } catch (err) {
            let error=new Error(err.message);
            LoggerService.adminLogger.error({message: err, stack: error.stack})
            next(err)
        }
    }
}