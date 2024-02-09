module.exports = {
    lookup:(from, localField, foreignField, as, pipeline=[])=>{
        return {
            $lookup:{
                from: from,
                localField: localField,
                foreignField: foreignField,
                as: as,
                pipeline
            }
        }
    },
    unwindEmptyArr:(path)=>{ 
        return { 
            $unwind: {
                path:"$"+path,
                preserveNullAndEmptyArrays :true 
            },
        }
    },
    facet:(start,limit,fieldName)=>{ 
        return {
            $facet: {
                [fieldName]: (start>=0 && limit  ? [{ $skip: start }, { $limit: limit }] : []),
                totalCount: [
                    {
                        $count: 'count'
                    }
                ]
            }
        }
    },
    match:(key, value)=>{
        return { 
            $match: {
                [key]: value,
            },
        }
    },
}