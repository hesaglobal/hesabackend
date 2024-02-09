const jwt = require('jsonwebtoken')
const {env} = require('../db/constant')
module.exports = {
    create:(data,expireTime) => {
        return new Promise(async (resolve, reject) => {
            try {
                const token = await jwt.sign(data, env.JWT_SECRET,expireTime)
                resolve(token);
            } catch (err) {
                reject(err);
            }
        })
    },
    decodedToken:(token) =>{
        return new Promise(async (resolve, reject) => {
            try {
                const data = jwt.verify(token,env.JWT_SECRET)
                resolve(data);
            } catch (err) {
                reject(err);
            }
        })
    }
}