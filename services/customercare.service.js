const {
  CustomerCare,
  TranscribedFiles,
  Queries,
  UserModel,
  CustomerCareTranscribedFiles,
  Hesaathi,
  Customer,
  CustomerCareQueriesModel,
  DepartmentModel,
  StaffModel,
  InteraktMessageModel,
} = require("../models");
const LoggerService = require("./logger.service");
const DbService = require("./Db.service");
const CommonAggService = require("./commonAgg.service");
const TransribedServices = require("./transcribe.service");
const AwsService = require("./aws.services");
const CommonFun = require("./commonFun");
const ObjectId = require("mongoose").Types.ObjectId;
const LocationService = require("./location.service");
module.exports = {
  getUploadedRecords: async (userId, start, limit) => {
    try {
      let agg = [
        {
          $match: {
            userId: new ObjectId(userId),
          },
        },
        {
          $lookup: {
            from: "customers",
            localField: "customer",
            foreignField: "_id",
            as: "customerInfo",
          },
        },
        {
          $addFields: {
            name: {
              $arrayElemAt: ["$customerInfo.name", 0],
            },
            contact: {
              $arrayElemAt: ["$customerInfo.contact", 0],
            },
            location: {
              $arrayElemAt: ["$customerInfo.location.locationName", 0],
            },
          },
        },
        {
          $sort: {
            createdAt: -1,
          },
        },
        CommonAggService.facet(start, limit, "transcriptions"),
      ];
      const transcriptions = await DbService.aggregate(CustomerCare, agg);
      if (transcriptions) {
        LoggerService.logger.info({ status: true, data: transcriptions });
        return transcriptions;
      }
    } catch (err) {
      let error = new Error(err.message);
      LoggerService.logger.error({ message: err, stack: error.stack });
      throw new Error(err.message);
    }
  },
  processRequest: async (
    fileLink,
    filename,
    content,
    userId,
    phonenumber,
    customerId,
    alreadyUploaded,
    messageId,
    adhaarInfo
  ) => {
    try {
      let fileUrl, adhaarCardInfo;
      let customerInfo = await DbService.findOne(Customer, { _id: customerId });
      if (alreadyUploaded) {
        fileUrl = fileLink;
      } else {
        fileUrl ==
          (await AwsService.uploadFileFromLink(
            fileLink,
            `file/${userId}/CustomerCare`
          ));
      }
      if (adhaarInfo) {
        adhaarCardInfo = adhaarInfo;
        let hesaathiInfo = {
          userId: userId,
          name: adhaarCardInfo.name,
          mobile: customerInfo.contact,
          address: "",
          aadhar: adhaarCardInfo.aadhar,
          gst: false,
          type: "Individual",
        };
        console.log(hesaathiInfo, "hesaathiInfo<<<<<<<<<<<<<<<<<<<<");
        if (adhaarCardInfo.address) {
          hesaathiInfo["address"] = await LocationService.getLocationDetails(
            adhaarCardInfo["address"]
          );
        } else {
          hesaathiInfo["address"] = customerInfo.location;
        }
        await DbService.create(Hesaathi, hesaathiInfo);
      }

      let fileData = {
        file: { name: filename, url: fileUrl },
        customer: customerId,
        userId,
      };

      const customerCare = await DbService.create(CustomerCare, fileData);
      await DbService.findOneAndUpdate(
        InteraktMessageModel,
        { _id: messageId },
        { fileId: customerCare._id, module: "CustomerCare" }
      );
      let queryData = {
        productType: "",
        concernedDepartment: "",
        address: "",
        Message: "",
        userId: userId,
        fileId: customerCare._id,
        module: "CustomerCare",
        customer: customerId,
        instruction: "",
        jobType: "",
        category: "",
        personType: "",
        skills: [],
        staff: [],
      };
      let departments = await DbService.find(DepartmentModel, { userId });
      departments = departments.map((item) => item.name);
      const user = await DbService.findOne(UserModel, { _id: userId });
      let coinsUsed = user.totalCredits - user.creditsUsed;
      if (coinsUsed > 0) {
        let data = await TransribedServices.getFormattedTranscriptionByModule(
          content,
          "CustomerCare",
          departments
        );
        console.log("=============> data is ", data);
        let transcriptedData = {};
        try {
          transcriptedData = JSON.parse(data);
        } catch (error) {
          return res.json({
            status: false,
            message: "Something went wrong with the File while parsing!",
          });
        }

        let bodyData = {};
        for (let key in transcriptedData) {
          queryData[key] = transcriptedData[key];
        }
        console.log("============ here 1", queryData);
        bodyData["content"] = bodyData["editedContent"] = content;
        bodyData["userId"] = userId;
        bodyData["fileId"] = queryData.fileId;
        bodyData["module"] = queryData.module;
        queryData.productType = transcriptedData["Type of Product"];
        queryData.concernedDepartment =
          transcriptedData["Concerned Department"];
        let staffAssociated = [];
        let departmentAssociated = [];
        let validDepartments = queryData.concernedDepartment.split(",");
        for (let item of validDepartments) {
          const escapedName = item
            .trim()
            .replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
          let concernedDepartment = await DbService.findOne(DepartmentModel, {
            name: { $regex: new RegExp(escapedName, "i") },
          });
          departmentAssociated.push(concernedDepartment?._id);
          if (concernedDepartment) {
            let staffConcerned = await DbService.find(StaffModel, {
              department: concernedDepartment._id,
            });
            if (staffConcerned && staffConcerned.length > 0) {
              for (let staff of staffConcerned) {
                staffAssociated.push(staff._id);
              }
            }
          }
        }
        queryData.concernedDepartment = departmentAssociated;
        queryData["staff"] = [
          ...new Set(staffAssociated.map((objId) => objId.toString())),
        ].map((str) => new ObjectId(str));
        queryData.address = transcriptedData["Address mentioned"];
        queryData.Message = transcriptedData["Message derived"]||"We will update, on your request status shortly";

        console.log("============ here 2", queryData);
        // Add coin system

        const query = await DbService.create(
          CustomerCareQueriesModel,
          queryData
        );
        let transcriptedRecord = await DbService.create(
          CustomerCareTranscribedFiles,
          bodyData
        );
        if (transcriptedRecord) {
          recordUpdate = await DbService.update(
            CustomerCare,
            { _id: customerCare._id },
            { status: "Processed" }
          );
          let coinsReduced = recordUpdate
            ? await CommonFun.reduceCoins(1, user)
            : false;

          if (coinsReduced) {
            await DbService.update(
              CustomerCare,
              { userId: user._id, _id: customerCare._id },
              { status: "Processed" }
            );
          }

          return { status: true, query };
        }
      }

      return { status: false };
    } catch (err) {
      console.log(err, "==============> ");
      let error = new Error(err.message);
      LoggerService.logger.error({ message: err, stack: error.stack });
      throw error;
    }
  },
  buildMessageData: async (userId, customer, query) => {
    try {
      let user = await DbService.findOne(UserModel, { _id: userId });
      let bodyValues = [
        customer.name,
        user.name,
        query?.queryId,
        query?.Message,
      ];
      if (customer.location?.locationName) {
        bodyValues.push(customer.location?.locationName);
      }

      let messageData = {
        template: customer.location?.locationName
          ? "thank_you_with_location"
          : "thank_you_without_location",
        contactNumber: customer.contact,
        bodyValues,
        callbackMessage: "Done",
        userId,
      };

      console.log("===========> ", messageData);
      return messageData;
    } catch (err) {
      console.log("=========> err ", err);
      let error = new Error(err.message);
      LoggerService.logger.error({ message: err, stack: error.stack });
      throw error;
    }
  },
};
