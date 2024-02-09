const {InteraktMessageModel } = require('../models');
const DbService = require('./Db.service');
const CommonAggService = require('./commonAgg.service');
const commonFun = require('./commonFun');
module.exports = {
  getRecords: async (currentPage,pageSize,userId) => {
      const { start, limit } = commonFun.pagination(currentPage, pageSize)
      let agg = [
        {
          $match: {
            userId: new ObjectId(userId)
          }
        },
        CommonAggService.lookup("customercarequeries", "fileId", "fileId", "result"),
        {
          $unwind: {
            path: "$result.concernedDepartment",
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $lookup: {
            from: "departments",
            localField: "result.concernedDepartment",
            foreignField: "_id",
            as: "result.associatedDepartment"
          }
        },
        {
          $unwind: {
            path: "$result.associatedDepartment",
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $group: {
            _id: "$_id",
            customer: { $first: "$customer" },
            source: { $first: "$source" },
            userId: { $first: "$userId" },
            message: { $first: "$message" },
            createdAt: { $first: "$createdAt" },
            updatedAt: { $first: "$updatedAt" },
            __v: { $first: "$__v" },
            fileId: { $first: "$fileId" },
            replayedOn:{$first:"$replayedOn"},
            module: { $first: "$module" },
            departmentNames: { $push: "$result.associatedDepartment.name" } 
          }
        },
        {
          $sort: {
            createdAt: -1
          }
        },
        CommonAggService.facet(start, limit, "interaktmessages")
      ];
      
      
      const interaktmessages = await DbService.aggregate(InteraktMessageModel, agg)
      return interaktmessages;
  }
}
