const { env } = require('../db/constant')
const axios = require("axios");
const AWS = require('aws-sdk')
const s3 = new AWS.S3({
    accessKeyId: env.S3_accessKeyId,
    secretAccessKey: env.S3_secretAccessKey,
})
const path = require('path');
const fs = require('fs')
module.exports = {
    upload: (file, folderName) => {
        return new Promise(async (resolve, reject) => {
            try{
                const params = {
                    Bucket: env.S3_BucketName,
                    Key: folderName + '/' + `${Date.now()}.${file.mimetype.split('/')[1]}`,
                    Body: file.buffer,
                    ACL: 'public-read',
                    ContentType: file.mimetype
                }
                s3.upload(params, (err, data) => {
                    if (err) {
                        reject(err)
                    } if (data) {
                        resolve(data.Key)
                    }
                })
            } catch (err) {
                reject(err)
            }
        })
    },
    uploadFileFromLink: (fileUrl, folderName) => {
        return new Promise(async (resolve, reject) => {
            try {
                const { data } = await axios.get(fileUrl, { responseType: "stream" });
                let parts = fileUrl.split('?')
                let fileExtention = parts[0].substring(parts[0].lastIndexOf("."));
                const params = {
                    Bucket: env.S3_BucketName,
                    Key: folderName + '/' + `${Date.now()}${fileExtention}`,
                    Body: data,
                    ACL: 'public-read'
                }
                s3.upload(params, (err, data) => {
                    if (err) {
                        reject(err)
                    } if (data) {
                        resolve(data.Key)
                    }
                })
            } catch (err) {
                reject(err)
            }
        })
    },
    delete: (filename) => {
        return new Promise(async (resolve, reject) => {
            try {
                await s3.deleteObject({
                    Bucket: 'aibucketproject',
                    Key: filename
                }, function (err, data) {
                    if (err) {
                        reject(false)
                    } if (data) {
                        resolve(true)
                    }
                })
            } catch (err) {
                reject(false)
            }
        })
    },
    getFileStreamFromS3: async (fileKey) => {
        const params = {
            Bucket: env.S3_BucketName,
            Key: fileKey,
        };

        const localPath = path.join(__dirname, "../public/input.mp3");
        const fileStream = fs.createWriteStream(localPath)
        return new Promise((resolve, reject) => {
            s3.getObject(params)
                .createReadStream()
                .on('end', () => resolve(localPath))
                .on('error', (error) => reject(error))
                .pipe(fileStream);
        });
    },
    getFileStreamFromS3Image: async (fileKey) => {
        const params = {
            Bucket: env.S3_BucketName,
            Key: fileKey,
        };

        const localPath = path.join(__dirname, "../public/image.png");
        const fileStream = fs.createWriteStream(localPath)
        return new Promise((resolve, reject) => {
            s3.getObject(params)
                .createReadStream()
                .on('end', () => resolve(localPath))
                .on('error', (error) => reject(error))
                .pipe(fileStream);
        });
    },
    getInteraktFileTranscription: async () => {
        const url = "related_to_interact_file";    //media url
        const localPath = path.join(__dirname, "../public/input.mp3");
        try {
            const response = await axios.get(url, { responseType: 'arraybuffer' });
            const buffer = Buffer.from(response.data, 'binary');
            fs.writeFileSync(localPath, buffer);
            // const tanscription=await transcribedService.getTranscription();
            // console.log(tanscription,'transcription>>>>>>>>>>>>')
            console.log('Video downloaded successfully!');
        } catch (error) {
            console.error(`Error downloading video: ${error.message}`);
        }
    }
}
