const Order=require('../models/orderModel');
const Cart=require("../models/cartModel")





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
      const user=req.session.user_id;
      console.log(req.body)
      const cart=await Cart.findOne({ userId:user }).populate("product.productId");
      console.log(cart)

        
        const newOrder = new Order({
          userId:user,
          orderItems:cart.product.map(item=>({
            productId:item.productId,
            quantity:item. quantity,
            total:item.total

          })),
           grandTotal:cart.grandTotal
        });

        await newOrder.save();
        await Cart.findOneAndDelete({userId:user})

        res.render({ 'orderDetails': 'Order placed successfully!', order: newOrder });
    } catch (error) {
        console.error(error.message);
        res.status(500).render({ error: 'Internal server error' });
    }
};



 
 
  module.exports={
    orderDetailsLoad,
    placeOrder,
    
  }
