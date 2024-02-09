module.exports = {
    find : (TableName,findQuery) => {
        return new Promise(async (resolve, reject) => {
            try {
                resolve(await TableName.find(findQuery,{__v:0}));
            } catch (err) {
                reject(err);
            }
        })
    },
    findOne : (TableName,findQuery,populatePaths=[]) => {
        return new Promise(async (resolve, reject) => {
            try {
                resolve(await TableName.findOne(findQuery,{__v:0}).populate(populatePaths));
            } catch (err) {
                reject(err);
            }
        })
    },
    create : (TableName,body) => {
        return new Promise(async (resolve, reject) => {
            try {
                let data = await TableName.create(body);
                data = JSON.parse(JSON.stringify(data));delete data.__v;
                resolve(data);
            } catch (err) {
                reject(err);
            }
        })
    },
    insertMany : (TableName, body) => {
        return new Promise(async (resolve, reject) => {
            try {
                resolve(await TableName.insertMany(body));
            } catch (err) {
                reject(err);
            }
        })
    },
    update:(TableName, findQuery, updateQuery) => {
        return new Promise(async (resolve, reject) => {
            try {
                resolve(await TableName.updateOne(findQuery, updateQuery));
            } catch (err) {
                reject(err);
            }
        })
    },
    updateMany : (TableName, findQuery, updateQuery) => {
        return new Promise(async (resolve, reject) => {
            try {
                resolve(await TableName.updateMany(findQuery, updateQuery));
            } catch (err) {
                reject(err);
            }
        })
    },
    delete :(TableName, findQuery) => {
        return new Promise(async (resolve, reject) => {
            try {
                resolve(await TableName.deleteOne(findQuery));
            } catch (err) {
                reject(err);
            }
        })
    },
    deleteMany:(TableName, findQuery) => {
        return new Promise(async (resolve, reject) => {
            try {
                resolve(await TableName.deleteMany(findQuery));
            } catch (err) {
                reject(err);
            }
        })
    },
    aggregate:(TableName, aggregation) => {
        return new Promise(async (resolve, reject) => {
            try {                
                resolve(await TableName.aggregate(aggregation));
            } catch (err) {
                reject(err);
            }
        })
    },
    count(TableName, findQuery) {
        return new Promise((resolve, reject) => {
            TableName.countDocuments(findQuery, (err, data) => {
                if (err) reject(err);
                else resolve(data);
            })
        })
    },
    findOneAndUpdate: (TableName, findQuery, updateQuery) => {
      return new Promise(async (resolve, reject) => {
        try {
          resolve(await TableName.findOneAndUpdate(findQuery, updateQuery,{new:true,upsert:true}))
        } catch (err) {
          reject(err)
        }
      })
    }
}