const LoggerService = require("./logger.service");
const TransribedServices = require("./transcribe.service");
const DbService = require("./Db.service");
const { UploadRecords, Category, SubCategory, Item } = require("../models");
const { env } = require('../db/constant');
module.exports = {
  processRequest: async (userId) => {
    try {
      const entry = await DbService.find(UploadRecords, {
        userId,
      });

      let imageTranscription
      entry.forEach(async (entry) => {
        console.log('================> entry ', entry)
        let content = await TransribedServices.getImageTranscription(
          `${env.S3_OBJECT_URL}${entry.file.url}`
        );
       imageTranscription += content + "\n";
        let categories = await DbService.find(Category, {});
        let subcategories = await DbService.find(SubCategory, {});

        let formattedTranscription =
          await TransribedServices.getFromattedTranscriptionONDC(
            content,
            categories,
            subcategories
          );
          let body = {
            userId
          }
        const transcriptionData = JSON.parse(formattedTranscription);
        for (let data in transcriptionData) {
          if (transcriptionData[data]) {
            body[data] = transcriptionData[data];
          }
        }

        if (body["TotalTaxRate"]) {
          body["GSTRate"] = body["TotalTaxRate"];
        }

        body["image"] = entry.file.url
        console.log('============> Adding to DB with details ', body)
        await DbService.create(Item, body);
        
      });

    } catch (err) {
        console.log('=====================> Error ', err)
      let error = new Error(err.message);
      LoggerService.logger.error({ message: err, stack: error.stack });
      // throw error;
    }
  },
};
