const { InteraktMessageModel, UserModel } = require("../../models");
const AdminMessages = require("../../db/messages/admin.messages");
const { DbService, AwsService, LoggerService } = require("../../services");
const messageService = require("../../services/message.service");
const { v4: uuidv4 } = require("uuid");
module.exports = {
  addMessageThorughWhatsapp: async (req, res, next) => {
    try {
      const body = req.body;
      const { userId } = req.params;
      if (!body.data) {
        return res
          .status(200)
          .send({ message: AdminMessages.GET, status: true });
      }
      body.data["source"] = "whatsapp";
      body.data["userId"] = userId;
      const message = await DbService.create(InteraktMessageModel, body.data);
      if (!message) {
        LoggerService.logger.info({
          message: "Unable to add message to InteraktMessageModel",
          data: body.data,
        });
      }

      const { status, result } = await messageService.processMessage(
        userId,
        body,
        false,
        message._id
      );
      if (status && result) {
        LoggerService.logger.info({
          status: true,
          data: { body },
          message: "Added Successfully",
        });
        return res
          .status(200)
          .send({ message: AdminMessages.GET, status: true, body });
      } else {
        LoggerService.logger.info({
          status: false,
          message: "Something went wrong!",
        });
        return res.json({ status: false, message: "Something went wrong!" });
      }
    } catch (error) {
      console.log("===============> error ", error);
      let err = new Error(error.message);
      LoggerService.logger.error({ message: err, stack: err.stack });
      return res
        .status(200)
        .send({ status: false, message: `caught error ${error}` });
    }
  },
  addMessageThroughWeb: async (req, res, next) => {
    try {
      const audioBuffer = req.file.buffer;
      const { userId } = req.body;
      if (!ObjectId.isValid(userId))
        throw badReqErr({ message: AdminMessages.INVALID_OBJECT_ID });
      let file = {
        buffer: audioBuffer,
        mimetype: "audio/wav",
      };
      const data = await AwsService.upload(file, "audio");

      let userData = await DbService.findOne(UserModel, { _id: userId });
      let message = {
        customer: {
          id: userData._id,
          channel_phone_number: `91${userData.phoneNo}`,
          phone_number: userData.phoneNo,
          traits: {
            name: userData.name,
          },
        },
        message: {
          id: uuidv4(),
          chat_message_type: "Audio",
          is_template_message: false,
          message_content_type: "Audio",
          media_url: data,
        },
        userId: userData._id,
      };
      let createMessage = await DbService.create(InteraktMessageModel, message);
      let body = {};
      body.data = createMessage;
      const { status, result } = await messageService.processMessage(
        userId,
        body,
        true,
        createMessage._id
      );
      if (status && result) {
        LoggerService.logger.info({
          status: true,
          data: { body },
          message: "Added Successfully",
        });
        return res
          .status(200)
          .send({
            message: `Your request has been submitted to ${userData.name} account`,
            status: true,
            body,
          });
      } else {
        LoggerService.logger.info({
          status: false,
          message: "Something went wrong!",
        });
        return res.json({ status: false, message: "Something went wrong!" });
      }
    } catch (error) {
      console.log("===============> error ", error);
      let err = new Error(error.message);
      LoggerService.logger.error({ message: err, stack: err.stack });
      next(error);
    }
  },
};
