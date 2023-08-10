const Order=require('../models/orderModel');
const Cart=require("../models/cartModel");
const { Redirect } = require('twilio/lib/twiml/VoiceResponse');





const orderDetailsLoad = async (req, res) => {
    try {
        const userId = req.session.user_id;
      
      const orders=await Order.findOne({ userId: userId }).populate("product.productId");
      res.render('orderDetails', { orders: orders })
    } catch (error) {
      console.log(error.message);
      res.render('404');
    }
  }
   const placeOrder = async (req, res) => {
    try {
      const user = req.session.user_id;
      const cart = await Cart.findOne({ userId: user }).populate("product.productId");
      const selectedAddressIndex=req.body.selectedAddressIndex;
      console.log(selectedAddressIndex)

      const newOrder = new Order({
          userId: user,
          orderItems: cart.product.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              total: item.total
          })),
          grandTotal: cart.grandTotal
      });

      await newOrder.save();
      await Cart.findOneAndDelete({ userId: user });

      const orderWithItems = await Order.findById(newOrder._id).populate('orderItems.productId');

      res.render('orderDetails', { orders: orderWithItems,successMessage: 'Order placed successfully!' }); // Pass the order data to the template
     
  } catch (error) {
      console.error(error.message);
      res.status(500).render('error', { error: 'Internal server error' }); // Render an error page
  }
   };



 
 
  module.exports={
    orderDetailsLoad,
    placeOrder,
    
  }
