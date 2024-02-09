const {env} = require('../db/constant') 
module.exports.configure = (mongoose) => {
    let url = `${env.DB_URL}`
    console.log('url:', url)
    let connect = function () {
        mongoose.connect(url, { useUnifiedTopology: true, useNewUrlParser: true})
    }
    connect();
    let db = mongoose.connection;
    db.once('open', () => { console.log(`Connected to db \nenv ${env.NODE_ENV}`); })
    db.on('disconnected', connect)
    db.on('error', console.log)
};