const { createLogger, format } = require("winston");
const DailyRotateFile = require("winston-daily-rotate-file");

module.exports = {
  logger:{
    error:(error)=>{
     console.log(error,'error user')
    },
    info:(info)=>{
      console.log(info,'info user')
    }
  },
  //  createLogger({
  //   transports: [
  //     new DailyRotateFile({
  //       filename: "logs/users/error-%DATE%.log",
  //       level: "error",
  //       format: format.combine(format.timestamp(), format.json()),
  //       datePattern: "YYYY-MM-DD",
  //       zippedArchive: true,
  //       maxFiles: "7d"
  //     }),
  //     new DailyRotateFile({
  //       filename: "logs/users/info-%DATE%.log",
  //       level: "info",
  //       format: format.combine(format.timestamp(), format.json()),
  //       datePattern: "YYYY-MM-DD",
  //       zippedArchive: true,
  //       maxFiles: "7d"
  //     }),
  //   ],
  // }),
  adminLogger:{
    error:(error)=>{
      console.log(error,'error admin')
     },
     info:(info)=>{
       console.log(info,'info admin')
     }
  }
  // createLogger({
  //   transports: [
  //     new DailyRotateFile({
  //       filename: "logs/admin/error-%DATE%.log",
  //       level: "error",
  //       format: format.combine(format.timestamp(), format.json()),
  //       datePattern: "YYYY-MM-DD",
  //       zippedArchive: true,
  //       maxFiles: "7d"
  //     }),
  //     new DailyRotateFile({
  //       filename: "logs/admin/info-%DATE%.log",
  //       level: "info",
  //       format: format.combine(format.timestamp(), format.json()),
  //       datePattern: "YYYY-MM-DD",
  //       zippedArchive: true,
  //       maxFiles: "7d"
  //     }),
  //   ],
  // }),
};
