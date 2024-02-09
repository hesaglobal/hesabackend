const { env} = require('../db/constant');
const { Translate } = require('@google-cloud/translate').v2;
const translate = new Translate({ projectId: env.translateProjectId, key: env.translateKey });
module.exports={
    getTranslation:(content,lang)=>{
        return new Promise(async (resolve, reject) => {
            try {
                let translatedContent;
                await translate.translate(content, lang).then(result => {
                    translatedContent=result[0];
                    resolve(translatedContent)
                })
            } catch (err) {
                reject(err)
            }
        })
    }
}