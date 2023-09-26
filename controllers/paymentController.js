const Order = require("../models/orderModel");
const Cart = require("../models/cartModel");
const { Redirect } = require("twilio/lib/twiml/VoiceResponse");
const User = require("../models/userModel");
const orderHelper = require("../helpers/orderHelper");

const couponHelper = require("../helpers/couponHelper");
const razorpay = require("razorpay");

require("dotenv").config();

const razorpayInstance = new razorpay({
  key_id: process.env.key_id,
  key_secret: process.env.key_secret,
});

const orderDetailsLoad = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const orderid = req.query.orderid;
    console.log(orderid,'hjdd')
    const userDetails = await User.findOne({ _id: userId });
    const orders = await Order.findOne({_id:orderid}).populate({
      path: "orderItems.productId",
      model: "Product",
    }).sort({dateOrdered:-1})
    .limit(1);
   console.log(orders,'looooo')
  //  if (orders && orders.orderItems.length > 0 && orders.grandTotal >= 0) {
  
    const successMessage = "Order placed successfully!";
    res.render("orderDetails", {
      orders: orders,
      userAddress: req.session.userAddress,
      successMessage: successMessage,
    });
  // }  else {
  //   const errorMessage = "Invalid order.";
  //     return res.render("orderDetails", {
  //       orders: orders,
  //       errorMessage: errorMessage,
  //     });
  //   }
  
  }catch (error) {
    console.log(error.message);
  }
};


// const viewOrderDetails = async (req, res) => {
//   try {
//     const userId = req.session.user_id;
//     const orderId = req.query.orderid;
//  if (!orderId) {
//       return res.status(400).send('Invalid orderid');
//     }
// const userDetails = await User.findOne({ _id: userId });

// const order = await Order.findOne({ _id: orderId })
//       .populate({
//         path: 'orderItems.productId',
//         model: 'Product', // Adjust the model name to match your Product model
//       })
//       .sort({ dateOrdered: -1 });

//     // Check if the order exists
//     if (!order) {
//       return res.status(404).send('Order not found');
//     }

//     // Render the order details view
//     res.render('viewOrderDetails', { order });
//   } catch (error) {
//     console.error(error);
//     res.status(500).send('Internal Server Error');
//   }
// };



const placeOrder = async (req, res) => {
  try {
    const user = req.session.user_id;
    const userDetails = await User.findOne({ _id: user });
    let paymenmethod = req.body.selectedPaymentOption;
    const cart = await Cart.findOne({ userId: user }).populate(
      "product.productId"
    );
    // console.log(req.body.address,'helloddfhdfidhf')
    // if(!req.body.address){
    //   return res.json({status:false})
    // }

    console.log(paymenmethod, "hello");
    if (paymenmethod == "Cash On Delivery") {
      const newOrder = new Order({
        userId: user,
        name: req.body.name,
        phone: req.body.mobileNumber,
        pincode: req.body.pincode,
        paymentMethod: req.body.selectedPaymentOption,
        address: req.body.address,
        orderItems: cart.product.map((item) => {
          return {
            productId: item.productId,
            quantity: item.quantity,
            total: item.price * item.quantity, 
          };
        }),
        grandTotal: cart.grandTotal,
      });

      console.log(cart,"this is the cart")
  if(newOrder.grandTotal<0){
    console.log("hiooooooooooooo")
    return res.json({invalid:true})
  }
      await newOrder.save();
      console.log(newOrder._id,'Albert Se')
      const orderWithItems = await Order.findById(newOrder._id).populate(
        "orderItems.productId"
      );
      const successMessage = "Order placed successfully!";
       await Cart.findOneAndDelete({ userId: user });

      return res.status(200).json({status:true,orderid:newOrder._id});


    } else if (paymenmethod == "razor") {
      const order = await orderHelper.generateRazorpay(user, cart.grandTotal);
      if (order) {
        const newOrder = new Order({
          userId: user,
          name: req.body.name,
          phone: req.body.mobileNumber,
          pincode: req.body.pincode,
          status: "placed",
          paymentMethod: req.body.selectedPaymentOption,
          deliveryaddress: req.body.address,
          orderItems: cart.product.map((item) => {
            return {
              productId: item.productId,
              quantity: item.quantity,
              total: item.price * item.quantity, 
            };
          }),
          grandTotal: cart.grandTotal
        });

        req.session.newOrder = newOrder
   
        return res.status(200).json({ order: order, orderstatus: true });
      }
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).render("error", { error: "Internal server error" }); // Render an error page
  }
};

const verifyPayment = async (req, res) => {
  try {
    const newOrder = new Order(req.session.newOrder);
    const savedOrder = await newOrder.save();
    
    // Clear the order from the session
    req.session.newOrder = null;
    await Cart.findOneAndDelete({ userId: req.session.user_id });
    console.log(savedOrder._id,'hjdkifdhf')
    
    // Send a success response
    res.status(200).json({ success: true, message: 'Order placed successfully',orderid:savedOrder._id });
  } catch (error) {
    console.error(error.message);
    
    // Send a failure response with an error message
    res.status(500).json({ success: false, message: 'Failed to place the order' });
  }
};



const paymentFailed = async (req, res) => {
  try {
    res.status(200).json({ success: true, message: 'Order Failed' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Some error' });

    console.log(error.message)
  }
};



module.exports = {
  orderDetailsLoad,
  placeOrder,

  verifyPayment,
  paymentFailed,
  // viewOrderDetails 
 
};
