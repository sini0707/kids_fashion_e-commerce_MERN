const Razorpay = require('razorpay')
const Order = require('../models/orderModel');
const Cart = require('../models/cartModel');
const { ObjectId } = require("mongodb");
const User = require('../models/userModel')
const Product = require('../models/productModel')





const generateRazorpay = (userid, total)=> {
    try {
      return new Promise(async (resolve, reject) => {
        var instance = new Razorpay({ key_id: process.env.key_id, key_secret: process.env.key_secret })
        console.log(total)
        var options = {
          amount: total * 100, 
          currency: "INR",
          receipt: "" + userid,
        };
        console.log(options);
        instance.orders.create(options, function (err, order) {
          if (err) {
            console.log(err);
          } else {
            resolve(order);
          }
        });
      });
    } catch (error) { 
      console.log(error.message);
    }
  }

  
  const verifyPayment =  async(details) => {
    try {
      await Order.updateOne({})
  
      let key_secret = process.env.RAZORPAY_SECRET;
      return new Promise((resolve, reject) => {
        const crypto = require("crypto");
        let hmac = crypto.createHmac("sha256", key_secret);
        hmac.update(
          details.payment.razorpay_order_id +
            "|" +
            details.payment.razorpay_payment_id
        );
        hmac = hmac.digest("hex");
        if (hmac == details.payment.razorpay_signature) {
  
          resolve();
        } else {
          
          reject("not match");
        }
      });
    } catch (error) {
      console.log(error.message);
    }
  }
  
  // change payment status
  const changePaymentStatus =  (userId, orderId,razorpayId) => {
    try {
      return new Promise(async (resolve, reject) => {
        await Order.updateOne(
          { "orders._id": new ObjectId(orderId) },
          {
            $set: {
              "orders.$.orderStatus": "Placed",
              "orders.$.paymentStatus": "Success",
              "orders.$.razorpayId": razorpayId
            },
          }
        ),
          Cart.deleteMany({ user: userId }).then(() => {
            resolve();
          });
      });
    } catch (error) { 
      console.log(error.message);
    }
  }
  const cancelOrder = async(orderId,status,ProductId,quantity,userId)=>{
    try {
      console.log(status);
      // return new Promise((resolve, reject) => {

        const orderData = await Order.findOne({_id:orderId})
        console.log(orderData,'orderdata')
            const userData = await User.findOne({_id:userId})
            // orderHelper.cancelOrder(orderId, status,ProductId,quantity,userId).then((response) => {)
            // const prdctStat=orderData.orderItems.find(data=> data.orderItems._id==ProductId)
           
            orderData.status="cancel requested"
            orderData.markModified('orderItems')
            const savedStatus = await orderData.save()
            console.log(savedStatus,'hgfhhgg')
            const data = await Product.findOne({_id:ProductId})
            const changd_qty = data.stock + parseInt(quantity);
            data.stock=changd_qty
        // Order.updateOne(
        //   { _id: orderId },
        //   {
        //     $set: { status: status },
        //   }
        
        // ).then((response) => {
          
        //   resolve(response);
        //   console.log("hjj")
        // });
      // });
    } catch (error) {
      console.log(error.message);
    }
  }
  

  // const getOrderList = (page, limit) => {
  //   return new Promise((resolve, reject) => {
  //     Order.aggregate([
  //       { $unwind: "$orders" },
  //       { $group: { _id: null, count: { $sum: 1 } } },
  //     ])
  //       .then((totalOrders) => {
  //         const count = totalOrders.length > 0 ? totalOrders[0].count : 0;
  //         const totalPages = Math.ceil(count / limit);
  //         const skip = (page - 1) * limit;
  
  //         Order.aggregate([
  //           { $unwind: "$orders" },
  //           { $sort: { "orders.createdAt": -1 } },
  //           { $skip: skip },
  //           { $limit: limit },
  //         ])
  //           .then((orders) => {
  //             resolve({ orders, totalPages, page, limit });
  //           })
  //           .catch((error) => reject(error));
  //       })
  //       .catch((error) => reject(error));
  //   });
  // };
  
  
  
  

  module.exports = {
    
    generateRazorpay,
    verifyPayment,
    changePaymentStatus,
    // getOrderList
    cancelOrder,
    

}