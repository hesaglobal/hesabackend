const moment=require('moment');
const DbService = require('./Db.service');
const { Order, CustomerCareQueriesModel} = require('../models');
const { weekDays,categories } = require('../db/constant');
module.exports={
    getDashboardData:async(userId)=>{
        let categoryData = {};
        const orderLatestWeek = Array(7).fill(0);
        const orderPreviousWeek = Array(7).fill(0);
        const totalCustomerCareQueries=await DbService.find(CustomerCareQueriesModel,{userId});
        const totalComplaintQueries=totalCustomerCareQueries.filter((item)=>item.Nature.toLowerCase().trim()==="complaint").length;
        const totalOthersQueries=totalCustomerCareQueries.filter((item)=>item.Nature.toLowerCase().trim()==="others").length;
        const totalFeedbackQueries=totalCustomerCareQueries.filter((item)=>item.Nature.toLowerCase().trim()==="feedback").length;
        const totalPartnerShipQueries=totalCustomerCareQueries.filter((item)=>item.Nature.toLowerCase().trim()==="partnerships").length;
        const totalOrders=await DbService.find(Order,{userId});
        const totalDueOrders=totalOrders.filter((order)=>order.orderStatus.toLowerCase().trim()==="due").length;
        const totalAcceptedOrders=totalOrders.filter((order)=>order.orderStatus.toLowerCase().trim()==="accepted").length;
        const totalShippedOrders=totalOrders.filter((order)=>order.orderStatus.toLowerCase().trim()==="shipped").length;
        const totalDeliveredOrders=totalOrders.filter((order)=>order.orderStatus.toLowerCase().trim()==="delivered").length;
        const totalRejectedOrders=totalOrders.filter((order)=>order.orderStatus.toLowerCase().trim()==="rejected").length;
        const totalCustomerCareWeekly=await DbService.find(CustomerCareQueriesModel,{
            createdAt: {$gte : moment().utcOffset('+05:30').startOf('week').toDate(),
             $lte : moment().utcOffset('+05:30').endOf('week').toDate()}
        });
        const ordersLatestWeekQuery= await DbService.find(Order, {
            createdAt: {
                $gte: moment().utcOffset('+05:30').startOf('week').subtract(7, 'days').toDate(),
                $lte: moment().utcOffset('+05:30').endOf('week').subtract(7, 'days').toDate()
            }
        });
        const ordersPreviousWeekQuery= await DbService.find(Order, {
            createdAt: {
                $gte: moment().utcOffset('+05:30').startOf('week').toDate(),
                $lte: moment().utcOffset('+05:30').endOf('week').toDate()
            }
        });
        ordersLatestWeekQuery.forEach(order => {
            const orderDayOfWeek = moment(order.createdAt).utcOffset('+05:30').day() - 1; 
            orderLatestWeek[orderDayOfWeek]++;
        });
        ordersPreviousWeekQuery.forEach(order => {
            const orderDayOfWeek = moment(order.createdAt).utcOffset('+05:30').day() - 1; 
            orderPreviousWeek[orderDayOfWeek]++;
        });
       
        totalCustomerCareWeekly.forEach(query => {
            let category=query.Nature
            const day = moment(query.createdAt).utcOffset('+05:30').format('dddd');
            categoryData[category] = categoryData[category] || { name: category, data: Array(7).fill(0) ,type:"bar"};
            categoryData[category].data[weekDays.find(weekDay => weekDay.dayName === day).day] += 1;
        });
        categories.forEach(category => {
            if (!categoryData[category]) {
                categoryData[category] = { name: category, data: Array(7).fill(0) ,type:"bar"};
            }
        });
         
        const queriesPerWeek = Array.from(categories).map((category) => {
            if (categoryData[category]) {
                return categoryData[category]
            }
        });
        const totalCustomerCareYearly= await DbService.find(CustomerCareQueriesModel, {
            createdAt: {
                $gte: moment().utcOffset('+05:30').startOf('year').toDate(),
                $lte: moment().utcOffset('+05:30').endOf('year').toDate()
            }
        });
        categoryData = {};
        totalCustomerCareYearly.forEach(query => {
         const category = query.Nature;
         const month = moment(query.createdAt).utcOffset('+05:30').month();
         categoryData[category] = categoryData[category] || { name: category, data: Array(12).fill(0) };
         categoryData[category].data[month] += 1;
        });
        categories.forEach(category => {
            if (!categoryData[category]) {
                categoryData[category] = { name: category, data: Array(12).fill(0) };
            }
        });
        const queriesPerYear = Array.from(categories).map((category) => {
            if (categoryData[category]) {
                return categoryData[category]
            }
        });
        let result={
            totalComplaintQueries,
            totalCustomerCareQueries:totalCustomerCareQueries.length,
            totalFeedbackQueries,
            totalOthersQueries,
            totalPartnerShipQueries,
            totalDueOrders,
            totalAcceptedOrders
            ,totalDeliveredOrders,
            totalShippedOrders,
            totalRejectedOrders,
            queriesPerWeek,
            queriesPerYear,
            orderPreviousWeek,
            orderLatestWeek
        }
        return {result}
    }
}