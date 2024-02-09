const { Hesaathi, StaffModel } = require('../../models');
const { DbService, CommonFun, CommonAggService ,LoggerService} = require('../../services')
const AdminMessages = require('../../db/messages/admin.messages');
const hesaathiValidator = require('../../services/validator/hesaathi.validator');
const ObjectId = require('mongoose').Types.ObjectId;
module.exports = {
  getHesaathiList: async (req, res, next) => {
    try {
      const { start, limit } = CommonFun.pagination(req.query.currentPage ?? 1, req.query.pageSize ?? 10)
      const userId = req.user._id;
      let agg = [
        {
          $match: {
            userId: new ObjectId(userId),
          }
        },
        CommonAggService.lookup('staffs','staff','_id','result'),
        {
          $addFields: {
              staffName: { $arrayElemAt: ['$result.name', 0] },
          },
      },
      {
          $project: {
            result: 0,
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
              hesaathi: { $push: '$$ROOT' },
          },
      },
      {
          $project: {
              _id: 0,
              hesaathi: 1,
          },
      },
        CommonAggService.facet(start, limit, "hesaathi")
      ];
      const hesaathi = await DbService.aggregate(Hesaathi, agg)
      if (hesaathi.length>0) {
        LoggerService.logger.info({ status: true, data: hesaathi })
      }
      return res.json({ message: AdminMessages.GET, data: { hesaathi:hesaathi[0]?.hesaathi[0]?.hesaathi ?? [], count: hesaathi[0]?.hesaathi[0]?.hesaathi?.length ?? 0 } });
    } catch (err) {
      let error = new Error(err.message);
      LoggerService.logger.error({ message: err, stack: error.stack })
      next(err)
    }
  },
  getHesaathi: async (req, res, next) => {
    try {
      const userId = req.user._id;
      const { _id } = req.params;

      let hesaathi = await DbService.find(Hesaathi, { _id });
      let staff=await DbService.findOne(StaffModel,{_id:hesaathi[0].staff})
      if (hesaathi) {
        LoggerService.logger.info({ status: true, data: hesaathi, message: `Found single Hesaathi with id ${_id}` })
        return res.json({ status: true, message: AdminMessages.GET, hesaathi,staff })
      } else {
        LoggerService.logger.info({ status: false, message: "Something went wrong!" })
        return res.json({ status: true, message: "Something went wrong" })
      }
    } catch (err) {
      let error = new Error(err.message);
      LoggerService.logger.error({ message: err, stack: error.stack })
      next(err)
    }
  },
  deleteHesaathi: async (req, res, next) => {
    try {
      const { _id } = req.params;
      if (!ObjectId.isValid(_id)) throw badReqErr({ message: AdminMessages.INVALID_OBJECT_ID });
      let deleteHesaathi = await DbService.delete(Hesaathi, { _id });
      if (deleteHesaathi) {
        return res.json({ status: true, message: "Deleted successfully" })
      } else {
        return res.json({ status: false, message: "Something went wrong" })
      }
    } catch (err) {
      next(err)
    }
  },
  addHesaathi: async (req, res, next) => {
    try {
      const { _id } = req.body;

      let body = req.body;

      if (_id && !ObjectId.isValid(_id)) throw badReqErr({ message: AdminMessages.INVALID_OBJECT_ID });
      let hesaathi
      if (_id) {
        const { value, error } = hesaathiValidator.update(body);
        if (error) throw badReqErr(error);
        let checkExistingHesaathi = await DbService.findOne(Hesaathi, { mobile: value.mobile })
        if (checkExistingHesaathi) {
            LoggerService.logger.info({ status: false, message: "This mobile number already exists!" })
            return res.json({ status: false, message: 'This mobile number already exists!' })
        }
        value['userId'] = req.user._id;
        hesaathi = await DbService.findOneAndUpdate(Hesaathi, { _id: _id }, value)
      } else {
        const { value, error } = hesaathiValidator.add(body);
        if (error) throw badReqErr(error);
        let checkExistingHesaathi = await DbService.findOne(Hesaathi, { mobile: value.mobile })
        if (checkExistingHesaathi) {
            LoggerService.logger.info({ status: false, message: "This mobile number already exists!" })
            return res.json({ status: false, message: 'This mobile number already exists!' })
        }
        value['userId'] = req.user._id;
        hesaathi = await DbService.create(Hesaathi, value);
      }
      if (hesaathi) {
        return res.json({ status: true, message: `${_id? 'Updated ': 'Added '} successfully`, data: hesaathi })
      } else {
        return res.json({ status: false, message: "Something went wrong" })
      }
    } catch (err) {
      next(err)
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
      let list = await DbService.find(Hesaathi, searchData)
      return res.json({ message: AdminMessages.GET, data: { list, count: list.length } });
    } catch (err) {
      next(err);
    }

  },

}
