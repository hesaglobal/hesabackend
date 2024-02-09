const jwt = require('jsonwebtoken');
const {env} = require('../db/constant')
const { UserModel } = require('../models');
const { DbService } = require('../services');
module.exports = (...args) => async (req, res, next) => {
    try {
        if (!args.length) { throw "Invalid Role" }
        const token = req.headers.authorization.split(" ")[1]
        const {_id} = jwt.verify(token, env.JWT_SECRET); //TODO: Add expiry
        switch (args[0]) {
            case 'Admin':
               
                req.user = await DbService.findOne(UserModel,{_id});
                if(req.user == null /* || !req.user.roles.includes('Admin') */) throw '';
                req.user = JSON.parse(JSON.stringify(req.user));
                next();
                break;
            default:
                throw ''
            
            case 'Client':
            req.user = await DbService.findOne(UserModel,{_id});
            if(!req.user.role=='Client') throw '';
            req.user = JSON.parse(JSON.stringify(req.user));
            next();
            break;
                throw '';
        }
    } catch (error) {
        res.status(401).json({
            message: "Auth Failed!"
        })
    }
}