const axios = require("axios");
const { env } = require('../db/constant')
const LoggerService = require('./logger.service')
module.exports={
    sendMessage: async (params) => {
        try {
            let response
            let data = {
                countryCode: "+91",
                phoneNumber: params.contactNumber,
                callbackData: params.callbackMessage,
                type: "Template",
                template: {
                    name: params.template,
                    languageCode: params.languageCode  ||"en",
                    bodyValues: params.bodyValues      
                }
            }
            if(params.headerValues){
                data.template.headerValues=params.headerValues  
            }
            console.log('=======================> here ', data);
            if(params.userId=="65a64dc0df9e04b039f284b5"){
                response= await axios.post(env.Interakt_Url, data, { headers: { 'Authorization': `Basic ${env.Interakt_New_Auth_Key}` } });
            }else{
                response= await axios.post(env.Interakt_Url, data, { headers: { 'Authorization': `Basic ${env.Interakt_Auth_Key}` } });
            }
            console.log(response.data, '=====================> response')
            console.log(data.template.name,'template>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>')
        } catch (err) {
            console.log('=========> err ', err)
            let error = new Error(err.message);
            LoggerService.logger.error({ message: err, stack: error.stack })
            throw error
        }
}
}