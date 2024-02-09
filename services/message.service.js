const LoggerService = require("./logger.service");
const { env, templates, newtemplates } = require("../db/constant");
const { Customer, UserModel } = require("../models");
const AwsService = require("./aws.services");
const TransribedServices = require("./transcribe.service");
const JobsService = require("./jobs.service");
const CustomerCareService = require("./customercare.service");
const EcommerceService = require("./ecommerce.service");
const DbService = require("./Db.service");
const CommonFun = require("./commonFun");
const sendMessagesService = require("./sendMessages.service");
const RealEstateService = require("./RealEstate.service");
const enrollmentService = require("./enrollment.service");
module.exports = {
  processMessage: async (userId, body, alreadyUploaded, messageId) => {
    let customer;
    let processedOrder, updatedCustomerLoc;
    let realEstateResult;
    let adhaarInfo;
    let customerId = "";
    let customerPhoneNumber;
    let enrollmentResult;
    customerPhoneNumber = body.data.customer.phone_number;


    if (body.data.customer.phone_number) {
      customer = await DbService.findOne(Customer, {
        incomingContact: body.data.customer.phone_number,
      });
      if (customer) {
        customerId = customer._id;
      } else {
        let customerData = {
          name: body.data.customer.traits.name,
          contact: body.data.customer.phone_number,
          userId: userId,
          hesaathiLinking: "No",
          type: "Individual",
          GSTTreatment: "No",
          incomingContact: body.data.customer.phone_number,
        };

        customer = await DbService.create(Customer, customerData);
        customerId = customer._id;
        if (customer) {
          LoggerService.logger.info({
            message: `Customer Added successfully ${customer.contact}`,
          });
        }
      }
    }

    try {
      let template;
      let user = await DbService.findOne(UserModel, { _id: userId });
      if (userId == "65a64dc0df9e04b039f284b5") {
        template = customer.location
          ? newtemplates.process_request
          : newtemplates.thankyou_share_location;
        // await sendMessagesService.sendMessage({ template, contactNumber: customer.contact, bodyValues: [customer.name, user.name],userId })
      } else {
        template = customer.location
          ? templates.process_request
          : templates.thankyou_share_location;
        // await sendMessagesService.sendMessage({ template, contactNumber: customer.contact, bodyValues: [customer.name, user.name],userId })
      }
    } catch (e) {
      console.log("Error while sending Process message");
    }
    if (
      (body.data.message.message_content_type.toLowerCase() === "image" || body.data.message.message_content_type.toLowerCase() === "document" ||
        body.data.message.message_content_type.toLowerCase() === "audio") &&
      body.data.message.media_url
    ) {
      let media_url = body.data.message.media_url;
      let fileDetails = CommonFun.getFileTypeFromUrl(media_url);
      let content = "";
      if (fileDetails.type === "audio" && !alreadyUploaded) {
        let fileUrl = await AwsService.uploadFileFromLink(
          media_url,
          `park/${customerId}`
        );
        content = await TransribedServices.transcribeAudioOnly(fileUrl, false); // change to true when blob stream function ready
      } else if (fileDetails.type === "image" && !alreadyUploaded) {
        content = await TransribedServices.getImageTranscription(media_url);
      } else if (fileDetails.type === "audio" && alreadyUploaded) {
        content = await TransribedServices.transcribeAudioOnly(`${media_url}`);
      } else {
        content = await TransribedServices.getImageTranscription(
          `${env.S3_OBJECT_URL}${media_url}`
        );
      }
      let module = await TransribedServices.getModulenameFromContent(content);

      if (module.toLowerCase() === "customercare") {
        adhaarInfo = await TransribedServices.getAdhaarInfo(content);
        adhaarInfo = JSON.parse(adhaarInfo);
      }
      console.log(module, "module>>>>>>>>>>>>>>>>>>>>");
      switch (module.toLowerCase()) {
        case "ecommerce":
          processedOrder = await EcommerceService.processOrder(
            media_url,
            fileDetails.name,
            content,
            userId,
            customer.contact,
            customerId,
            alreadyUploaded,
            messageId
          );
          break;
        case "customercare":
          let res = await CustomerCareService.processRequest(
            media_url,
            fileDetails.name,
            content,
            userId,
            customer.contact,
            customerId,
            alreadyUploaded,
            messageId,
            adhaarInfo
          );
          processedOrder = res;
          if (res.status && env.NODE_ENV.toLowerCase() !== "development") {
            const messageData = await CustomerCareService.buildMessageData(
              userId,
              customer,
              res.query
            );
            messageData["userId"] = userId;
            await sendMessagesService.sendMessage(messageData);
          }
          break;
        case "enrollment":
          enrollmentResult = await enrollmentService.processRequest(
            content,
            userId,
            messageId,
            customerId,
            body.data.customer.phone_number
          );
          break;
        case "realestate":
          realEstateResult = await RealEstateService.processRequest(
            media_url,
            fileDetails.name,
            content,
            userId,
            customer.contact,
            customerId,
            alreadyUploaded,
            messageId
          );
          break;
        case "jobs":
          let result = await JobsService.processRequest(
            media_url,
            fileDetails.name,
            content,
            userId,
            customer.contact,
            customerId,
            alreadyUploaded,
            messageId
          );
          processedOrder = result;
          if (
            result.status &&
            result.personType.toLowerCase() === "employer" &&
            env.NODE_ENV.toLowerCase() !== "development"
          ) {
            let matchingCandidates = await JobsService.getMatchedCandidates(
              result.newJob._id
            );
            for (let candidate of matchingCandidates) {
              let messageData = await JobsService.buildMessageDataForEmployer(
                customer,
                candidate.Name || "NA",
                candidate.contact || "NA",
                candidate.address?.locationName || "NA",
                candidate.skills?.join(",") || "NA",
                candidate.instruction || "NA"
              );
              messageData["userId"] = userId;
              await sendMessagesService.sendMessage(messageData);
            }
          }
          if (
            result.status &&
            result.personType.toLowerCase() === "candidate" &&
            env.NODE_ENV.toLowerCase() !== "development"
          ) {
            let matchingJobs = await JobsService.getMatchingJobs(
              result.newJob._id
            );
            for (let job of matchingJobs) {
              let messageData = await JobsService.buildMessageDataForCandidate(
                customer,
                job.Name || "NA",
                job.address.locationName,
                job.contact,
                job?.instruction || "NA"
              );
              messageData["userId"] = userId;
              await sendMessagesService.sendMessage(messageData);
            }
          }
          break;
        default:
        // code block
      }
    } else if (
      body.data.message.message_content_type.toLowerCase() === "location"
    ) {
      let loc = JSON.parse(body.data.message.message);
      let location = {};
      if (loc.name || loc.address) {
        location = {
          locationName: `${loc.name || ""} ${loc.address || ""}`,
          locality: {
            type: "Point",
            coordinates: [loc.longitude, loc.latitude],
          },
        };
      } else {
        let locationName = await LocationService.getPlaceName(
          loc.latitude,
          loc.longitude
        );
        location = {
          locationName: locationName,
          locality: {
            type: "Point",
            coordinates: [loc.longitude, loc.latitude],
          },
        };
      }
      customerUpdate = await DbService.findOneAndUpdate(
        Customer,
        { _id: customerId },
        { location }
      );
      updatedCustomerLoc = customerUpdate;
    }
    if (
      processedOrder ||
      updatedCustomerLoc ||
      realEstateResult ||
      enrollmentResult
    ) {
      return {
        status: true,
        result:
          processedOrder ||
          updatedCustomerLoc ||
          realEstateResult ||
          enrollmentResult,
      };
    }
  },
};
