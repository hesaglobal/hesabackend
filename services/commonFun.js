const { UserModel } = require('../models');
const AwsService = require('./aws.services');
const DbService = require('./Db.service')
const LoggerService = require('./logger.service')
const util = require('util');
const { exec } = require('child_process');
const ffmpeg = require('fluent-ffmpeg');
module.exports = {
  pagination: (pageNo, limit) => {
    limit = parseInt(limit);
    pageNo = pageNo ? + limit * (parseInt(pageNo) - 1) : 0;
    return { start: pageNo, limit }
  },
  removeNullValFromObj: async (body) => {
    const fbody = {};

    for (const field in body) {
      if (body[field] != null) fbody[field] = body[field];
    }
    return fbody
  },
  strToObj: (body) => {
    if (body.modules != undefined && body.modules != 'undefined' && typeof body.modules == 'string') body.modules = JSON.parse(body.modules);
    if (body.pic != undefined && body.pic != 'undefined' && typeof body.pic == 'string' && body.pic != "") body.pic = JSON.parse(body.pic);
    if (body.receipt != undefined && body.receipt != 'undefined' && typeof body.receipt == 'string' && body.receipt != "") body.receipt = JSON.parse(body.receipt);
    if (body.location != undefined && body.location != 'undefined' && typeof body.location == 'string' && body.location != "") body.location = JSON.parse(body.location);
    if (body.content != undefined && body.content != 'undefined' && typeof body.content == 'string' && body.content != "") body.content = JSON.parse(body.content);
    return body;
  },
  singleFileUpload: async (file, folderName) => {
    return await AwsService.upload(file, folderName)
  },
  deleteFile: async (file) => {
    return await AwsService.delete(file)
  },
  reduceCoins: async (numberofCoins, user) => {
    let updateCoins = { "$inc": { "creditsUsed": numberofCoins } }
    let totalCredits = user.totalCredits;
    if (totalCredits > 0) {
      let userUpdate = await DbService.update(UserModel, { _id: user._id }, updateCoins);
      if (userUpdate) {
        LoggerService.logger.info({ status: true, data: userUpdate })
        return true
      }
      return false
    }
  },
  getFileType(fileName) {
    const fileExtension = fileName.split('.').pop().toLowerCase();
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp'];
    const audioExtensions = ['mp3', 'wav', 'flac', 'ogg', 'mp4', 'webm', 'mpeg', 'mpga'];
    if (imageExtensions.includes(fileExtension)) {
      return 'image';
    } else if (audioExtensions.includes(fileExtension)) {
      return 'audio';
    } else {
      return 'unknown';
    }
  },
  getFileTypeFromUrl(url) {
    let parts = url.split('?')
    let filename = parts[0].substring(parts[0].lastIndexOf("/") + 1)
    return { type: this.getFileType(filename), name: filename }
  },
  timeToSeconds(time) {
    const [hours, minutes, seconds] = time.split(':');
    return parseInt(hours, 10) * 3600 + parseInt(minutes, 10) * 60 + parseFloat(seconds);
  },
  getAudioDuration(audioFilePath) {
    return new Promise((resolve, reject) => {
      const command = `ffmpeg -i ${audioFilePath} 2>&1 | grep "Duration"`;

      exec(command, (error, stdout, stderr) => {
        if (error) {
          reject(`Error: ${error.message}`);
          return;
        }

        const durationMatch = stdout.match(/Duration: (\d{2}:\d{2}:\d{2}.\d{2})/);

        if (durationMatch) {
          const durationString = durationMatch[1];
          const durationInSeconds = this.timeToSeconds(durationString);
          resolve(durationInSeconds);
        } else {
          reject('Failed to extract audio duration.');
        }
      });
    });
  },
  getCoinsStatus(user) {
    let coinsLeft = user.totalCredits - user.creditsUsed;
    return coinsLeft;
  },
  getAddressComponent(type, addressComponents){
    const component = addressComponents.find(component => component.types.includes(type));
    return component ? component.long_name : null;
  },
  uploadMultipleFiles: async(filesArr,folderName)=>{
    let uploadedFiles=[]
    for(let file of filesArr){
      const name=file.originalname;
      const fileType='image'
      const url=await AwsService.upload(file, folderName);
      uploadedFiles.push({name,url,type:fileType});
    }
   return uploadedFiles;
  },
   getImageMimeType:async (fileName) =>{
    const extensionMap = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
    };
    const ext = fileName.slice(fileName.lastIndexOf('.')).toLowerCase();
    return extensionMap[ext] || null; 
  }
  
}