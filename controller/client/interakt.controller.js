const {  LoggerService,InteraktService } = require('../../services')
const AdminMessages = require('../../db/messages/admin.messages');
module.exports = {
  getUploadedRecords: async (req, res, next) => {
    try {
      let userId=req.user._id
      const interaktmessages = await InteraktService.getRecords(req.query.currentPage ?? 1, req.query.pageSize ?? 10,userId)
      if (interaktmessages) {
        LoggerService.logger.info({ status: true, data:interaktmessages})
      }
      return res.json({ message: AdminMessages.GET, data: { interaktmessages: interaktmessages[0].interaktmessages ?? [], count: interaktmessages[0].totalCount[0]?.count ?? 0 } });
    } catch (err) {
      let error = new Error(err.message);
      LoggerService.logger.error({ message: err, stack: error.stack })
      next(err)
    }
  }
}
