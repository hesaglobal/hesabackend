const OpenAI = require('openai');
const { TranscribedFiles } = require('../models');

const { env, dev_system_prompt, prompt_for_ondc_long_description,prompt_for_adhaar_card, prompt_for_ondc,prompt_for_ondc_short_description,prompt_for_jobs, matchcatalog_prompt,prompt_for_real_estate, prompt_for_jobs_match,prompt_for_customer_care,prompt_for_grievance, prompt, GET_MODULE_PROMPT, audioNormalDuration, segmentDuration, prompt_for_candidates_match, prompt_for_enrollment, prompt_for_ondchack } = require('../db/constant')
const openAI = new OpenAI({
    apiKey: env.OPENAI_KEY,
});
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const vision = require('@google-cloud/vision');
const path = require('path');
const AwsService = require('./aws.services')
const LoggerService = require('./logger.service')
const DbService = require('./Db.service')
const client = new vision.ImageAnnotatorClient({
    keyFilename: path.join(__dirname, "../ai.key.json")
});
const fs = require('fs');
const commonFun = require('./commonFun');
module.exports = {
    getTranscription: async (fileKey, module,departments=[]) => {
        
        await AwsService.getFileStreamFromS3(fileKey);
        const localPath = path.join(__dirname, "../public/input.mp3");
        let fileStream = fs.createReadStream(localPath);
        const response = await openAI.audio.transcriptions.create({
            file: fileStream,
            model: 'whisper-1',
        });
        let system_prompt;
        if (module == "Jobs") {
            system_prompt = prompt_for_jobs;
        } else if (module == "PublicGrievance") {
            system_prompt = prompt_for_grievance;
        } else if(module==="CustomerCare"){
            system_prompt = prompt_for_customer_care;
            response.text=`${response.text} ,find the Concerned Department that relates to following departments ${departments}`
        }else if(module==="RealEstate"){
            system_prompt=prompt_for_real_estate
        }else{
            system_prompt=dev_system_prompt;
        }
        console.log('==================> ', response.text)
        const final = await openAI.chat.completions.create({
            messages: [
                { role: 'system', content: system_prompt },
                { role: 'user', content: response.text }],
            temperature: 0,
            model: 'gpt-4',
        });

        const extractedInfo = final.choices[0].message;
        return extractedInfo.content;
    },
    transcribeAudioOnly: async (fileKey, interaktUrl = false) => {
        await AwsService.getFileStreamFromS3(fileKey)
        const localPath = path.join(__dirname, "../public/input.mp3");
        let fileStream = fs.createReadStream(localPath)
        const response = await openAI.audio.transcriptions.create({
            file: fileStream,
            model: 'whisper-1',
            language: "en"
        });

        return response.text
    },
    getGeneralTranscription: async (fileKey, user) => {
        await AwsService.getFileStreamFromS3(fileKey)
        const localPath = path.join(__dirname, "../public/input.mp3");
        let fileStream = fs.createReadStream(localPath)
        let audioDuration = await commonFun.getAudioDuration(localPath)
        const outputPattern = path.join(__dirname, '../public/output');
        let coinsDeducted = 1;
        let result = '';
        let coinsStatus = commonFun.getCoinsStatus(user)
        let totalChunksStatus = Math.ceil(audioDuration / segmentDuration);
        if (audioDuration > audioNormalDuration && coinsStatus >= totalChunksStatus) {
            try {
                const command = `ffmpeg -i ${localPath} -f segment -segment_time ${segmentDuration} -c copy -map a -segment_format mp3 ${outputPattern}%d.mp3`;
                const { stdout, stderr } = await exec(command);
                console.log('Audio file divided into chunks successfully.');
                coinsDeducted = totalChunksStatus
                for (let i = 0; i < totalChunksStatus; i++) {
                    const filePath = path.join(__dirname, `../public/output${i}.mp3`)
                    const fileStream = fs.createReadStream(filePath);
                    const content = await openAI.audio.transcriptions.create({
                        file: fileStream,
                        model: 'whisper-1',
                        language: "hi"
                    });
                    let extractedInfo;
                    extractedInfo = content.text;
                    result += extractedInfo;

                    if (extractedInfo && result) {
                        fs.unlink(filePath, err => {
                            if (err) {
                                console.error(`Error deleting file ${filePath}:`, err);
                            } else {
                                console.log(`Deleted file: ${filePath}`);
                            }
                        });
                    }
                }
            } catch (error) {
                console.error('Error: ', error);
            }
        } else if (audioDuration < audioNormalDuration) {
            const content = await openAI.audio.transcriptions.create({
                file: fileStream,
                model: 'whisper-1',
                language: "hi"
            });
            let extractedInfo;
            extractedInfo = content.text;
            result += extractedInfo;
        }
        return { result, coinsDeducted };
    },
    getImageTranscription: async (fileUrl) => {
        console.log('================= Filekey is ', fileUrl)
        const [result] = await client.textDetection(fileUrl, {
            features: [{ type: 'TEXT_DETECTION' }],
            imageContext: {
                languageHints: ['en'],
            },
            maxResults: 10,
            model: 'builtin/stable',
        });

        const detections = result.textAnnotations;
        detections.sort((a, b) => a.boundingPoly.vertices[0].y - b.boundingPoly.vertices[0].y);
        detections.map(text => text?.description).join(', ');
        console.log(detections[0]?.description, 'description>>>>>>>>>>>>>>>>>>>>>>>>')
        return detections[0]?.description
    },
    matchCatalog: async (content, catalog) => {
        let system_prompt = matchcatalog_prompt.replace(`<<<cataloglist>>>`, catalog)
        const response = await openAI.chat.completions.create({
            messages: [
                { role: 'system', content: system_prompt },
                { role: 'user', content }],
            temperature: 0,
            model: 'gpt-3.5-turbo',
        });
        const extractedInfo = response.choices[0].message;
        let extractedContent = ''
        try {
            extractedContent = JSON.parse(extractedInfo.content)
        } catch (error) {
            return { error: 'Error while parsing content' }
        }
        return extractedContent
    },
    updateTranscribedContents: async (data) => {
        try {
            let transcriptedRecord = await DbService.create(TranscribedFiles, data);
            return transcriptedRecord ? true : false
        } catch (err) {
            let error = new Error(err.message);
            LoggerService.logger.error({ message: err, stack: error.stack })
            throw badReqErr(error);
        }
    },
    getModulenameFromContent: async (content) => {
        try {
            if (!content) {
                console.log('Content MIssing')
                return ''
            }

            let system_prompt = GET_MODULE_PROMPT
            const response = await openAI.chat.completions.create({
                messages: [
                    { role: 'system', content: system_prompt },
                    { role: 'user', content }],
                temperature: 0,
                model: 'gpt-4',
            });
            const extractedInfo = response.choices[0].message;
            let extractedContent = ''
            extractedContent = extractedInfo.content
            console.log('============> module is ', extractedContent)
            return extractedContent
        } catch (err) {
            let error = new Error(err.message);
            LoggerService.logger.error({ message: err, stack: error.stack })
            throw badReqErr(error);
        }
    },
    getFormattedTranscriptionByModule: async (content, moduleName,departments=[]) => {
        if (!content) {
            return { status: false }
        }

        let system_prompt = ''
        switch (moduleName.toLowerCase()) {
            case 'customercare':
                content=`${content} ,find the Concerned Department that relates to following departments ${departments}`
                system_prompt = prompt_for_customer_care
                break;
            case 'jobs':
                system_prompt = prompt_for_jobs
                break;
            case 'realestate':
                system_prompt = prompt_for_real_estate
                break;
            case 'enrollment':
                system_prompt=prompt_for_enrollment;
                break;
            default:
                system_prompt = ''
        }
        console.log(system_prompt,'prompt>>>>>>>>>>>>>>>>>>>>>>>')
        if (!system_prompt) {
            console.log('====> missing system prompt')
            return { status: false }
        }

        const final = await openAI.chat.completions.create({
            messages: [
                { role: 'system', content: system_prompt },
                { role: 'user', content: content }],
            temperature: 0,
            model: 'gpt-4',
        });

        const extractedInfo = final.choices[0].message;
        
        return extractedInfo.content
    },
    getMatchingCandidates: async (candidates, searchCriteria) => {
        if (!candidates) {
            return { status: false };
        }
        let content = `Search Criteria:\nSkills: ${searchCriteria.skills.join(', ') || ''}\nLocation: ${searchCriteria.location || ''}\nCategory: ${searchCriteria.category || ''}\n\nCandidates to Search:\n${candidates.map(candidate => `- ${candidate.Name || ''}: Skills - ${candidate.skills.join(', ') || ''}, Location - ${candidate.address || ''}, Category - ${candidate.category || ''},candidateId:${candidate._id}`).join('\n')}`
        console.log(content, 'search criteria content>>>>>>>>>>>>>>>>>>>>>>>>>>')
        const final = await openAI.chat.completions.create({
            messages: [
                { role: 'system', content: prompt_for_candidates_match },
                { role: 'user', content: content }],
            temperature: 0,
            model: 'gpt-4',
        });
        const extractedInfo = final.choices[0].message;
        return extractedInfo.content;
    },
    generalTranscriptionByPrompt: async (fileKey, user) => {
        await AwsService.getFileStreamFromS3(fileKey)
        const localPath = path.join(__dirname, "../public/input.mp3");
        let fileStream = fs.createReadStream(localPath)
        let audioDuration = await commonFun.getAudioDuration(localPath)
        const outputPattern = path.join(__dirname, '../public/output');
        let coinsDeducted = 1;
        let result = '';
        let coinsStatus = commonFun.getCoinsStatus(user)
        let totalChunksStatus = Math.ceil(audioDuration / segmentDuration);
        if (audioDuration > audioNormalDuration && coinsStatus >= totalChunksStatus) {
            try {
                const command = `ffmpeg -i ${localPath} -f segment -segment_time ${segmentDuration} -c copy -map a -segment_format mp3 ${outputPattern}%d.mp3`;
                const { stdout, stderr } = await exec(command);
                console.log('Audio file divided into chunks successfully.');
                coinsDeducted = totalChunksStatus
                for (let i = 0; i < totalChunksStatus; i++) {
                    const filePath = path.join(__dirname, `../public/output${i}.mp3`)
                    const fileStream = fs.createReadStream(filePath);
                    const content = await openAI.audio.transcriptions.create({
                        file: fileStream,
                        model: 'whisper-1',
                        language: "hi"
                    });
                    let extractedInfo;
                    const response = await openAI.chat.completions.create({
                        messages: [
                            { role: 'system', content: prompt },
                            { role: 'user', content: content.text }],
                        temperature: 0,
                        model: 'gpt-4',
                    });
                    extractedInfo = response.choices[0].message;
                    extractedInfo = extractedInfo.content.replace(/[{}]/g, '');
                    result += extractedInfo;


                    if (extractedInfo && response) {
                        fs.unlink(filePath, err => {
                            if (err) {
                                console.error(`Error deleting file ${filePath}:`, err);
                            } else {
                                console.log(`Deleted file: ${filePath}`);
                            }
                        });
                    }
                }
            } catch (error) {
                console.error('Error: ', error);
            }
        } else if (audioDuration < audioNormalDuration) {
            const content = await openAI.audio.transcriptions.create({
                file: fileStream,
                model: 'whisper-1',
                language: "hi"
            });
            let extractedInfo;

            const response = await openAI.chat.completions.create({
                messages: [
                    { role: 'system', content: prompt },
                    { role: 'user', content: content.text }],
                temperature: 0,
                model: 'gpt-4',
            });
            extractedInfo = response.choices[0].message;
            extractedInfo = extractedInfo.content.replace(/[{}]/g, '');
            result += extractedInfo;
        }
        return { result, coinsDeducted };
    },
    getMatchingJobs:async (jobs, searchCriteria) => {
        if (!jobs) {
            return { status: false };
        }
        let content = `Search Criteria:\nSkills: ${searchCriteria.skills.join(', ') || ''}\nLocation: ${searchCriteria.location || ''}\nCategory: ${searchCriteria.category || ''}\n\Jobs to Search:\n${jobs.map(job => `- ${job.Name || ''}: Skills - ${job.skills.join(', ') || ''}, Location - ${job.address || ''}, Category - ${job.category || ''},jobId:${job._id}`).join('\n')}`
        console.log(content, 'search criteria content for jobs>>>>>>>>>>>>>>>>>>>>>>>>>>')
        const final = await openAI.chat.completions.create({
            messages: [
                { role: 'system', content: prompt_for_jobs_match },
                { role: 'user', content: content }],
            temperature: 0,
            model: 'gpt-4',
        });
        const extractedInfo = final.choices[0].message;
        return extractedInfo.content;
    },
    getFormattedDescription:async(content,type)=>{
        let prompt_for_description
        if(type==="long"){
            prompt_for_description=prompt_for_ondc_long_description
        }else{
            prompt_for_description=prompt_for_ondc_short_description
        }
        const final = await openAI.chat.completions.create({
            messages: [
                { role: 'system', content: prompt_for_description },
                { role: 'user', content: content }],
            temperature: 0,
            model: 'gpt-4',
        });
        const extractedInfo = final.choices[0].message;
        return extractedInfo.content;
    },
    getFromattedTranscriptionONDCProduct:async(content,categories,subcategories)=>{
        let newContent=`${content},find the category and subcategory related to item in the mentioned ${categories} array and ${subcategories} array`
        console.log(newContent,'content<<<<<<<<<<<<<<<<<<<<<<<<')
        let system_prompt=prompt_for_ondc
        const final = await openAI.chat.completions.create({
            messages: [
                { role: 'system', content: system_prompt },
                { role: 'user', content: newContent }],
            temperature: 0,
            model: 'gpt-4',
        });
        const extractedInfo = final.choices[0].message;
        return extractedInfo.content;
    },
    getFromattedTranscriptionONDC:async(content,categories,subcategories)=>{
        let newContent=`${content},find the category and subcategory related to item in the mentioned ${categories} array and ${subcategories} array`
        console.log(newContent,'content<<<<<<<<<<<<<<<<<<<<<<<<')
        let system_prompt=prompt_for_ondchack
        const final = await openAI.chat.completions.create({
            messages: [
                { role: 'system', content: system_prompt },
                { role: 'user', content: newContent }],
            temperature: 0,
            model: 'gpt-4',
        });
        const extractedInfo = final.choices[0].message;
        console.log('============> extractedInfo is ', extractedInfo)
        return extractedInfo.content;
    },
    getAdhaarInfo:async(content)=>{
        let system_prompt=prompt_for_adhaar_card
        const final = await openAI.chat.completions.create({
            messages: [
                { role: 'system', content: system_prompt },
                { role: 'user', content: content }],
            temperature: 0,
            model: 'gpt-4',
        });
        const extractedInfo = final.choices[0].message;
        return extractedInfo.content;
    }
}
