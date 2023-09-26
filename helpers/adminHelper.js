// const Order = require('../models/orderModel');
// const { ObjectId } = require("mongodb");
// const User = require('../models/userModel');

// const changeOrderStatus = (orderId, status) => {
//     try {
//       return new Promise((resolve, reject) => {
//         Order.updateOne(
//           { "orders._id": new ObjectId(orderId) },
//           {
//             $set: { "orders.$.orderStatus": status },
//           }
//         ).then((response) => {
//           resolve({status:true,orderStatus:status});
//         });
//       });
//     } catch (error) {
//       console.log(error.message);
//     }
//   }



//   module.exports = {
//     changeOrderStatus 
//   }