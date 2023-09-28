const Order = require("../models/orderModel");
const Cart = require("../models/cartModel");
const { Redirect } = require("twilio/lib/twiml/VoiceResponse");
const User = require("../models/userModel");
const orderHelper = require("../helpers/orderHelper");

const couponHelper = require("../helpers/couponHelper");
const razorpay = require("razorpay");
const { set } = require("mongoose");

require("dotenv").config();

const razorpayInstance = new razorpay({
  key_id: process.env.key_id,
  key_secret: process.env.key_secret,
});

const orderDetailsLoad = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const orderid = req.query.orderid;
    console.log(orderid, "hjdd");
    const userDetails = await User.findOne({ _id: userId });
    const orders = await Order.findOne({ _id: orderid })
      .populate({
        path: "orderItems.productId",
        model: "Product",
      })
      .sort({ dateOrdered: -1 })
      .limit(1);
    console.log(orders, "looooo");
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
  } catch (error) {
    console.log(error.message);
  }
};

const viewOrderDetails = async (req, res) => {
  try {
    const userId = req.session.user_id;
    console.log(userId);
    const orderId = req.query.id;
    if (!orderId) {
      return res.status(400).send("Invalid orderid");
    }
    const userDetails = await User.findOne({ _id: userId });

    const orders = await Order.findOne({ _id: orderId })
      .populate({
        path: "orderItems.productId",
        model: "Product", // Adjust the model name to match your Product model
      })
      .sort({ dateOrdered: -1 });

    // Check if the order exists
    if (!orders) {
      return res.status(404).send("Order not found");
    }

    // Render the order details view
    res.render("viewOrderDetails", { orders });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

const placeOrder = async (req, res) => {
  try {
    const user = req.session.user_id;
    const userDetails = await User.findOne({ _id: user });
    const paymentMethod = req.body.selectedPaymentOption; // Fixed variable name

    const cart = await Cart.findOne({ userId: user }).populate(
      "product.productId"
    );

    if (paymentMethod === "Cash On Delivery") {
      // Fixed typo and added strict comparison
      const newOrder = new Order({
        userId: user,
        name: req.body.name,
        phone: req.body.mobileNumber,
        pincode: req.body.pincode,
        paymentMethod: paymentMethod, // Use the variable
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

      if (newOrder.grandTotal < 0) {
        return res.json({ invalid: true });
      }

      await newOrder.save();
      const orderWithItems = await Order.findById(newOrder._id).populate(
        "orderItems.productId"
      );
      await Cart.findOneAndDelete({ userId: user });
      console.log("this is COD");

      return res.status(200).json({ status: true, orderid: newOrder._id });
    } else if (paymentMethod === "razor") {
      // Fixed typo and added strict comparison
      // Assuming you have a function generateRazorpay that returns an order object
      const order = await orderHelper.generateRazorpay(user, cart.grandTotal);
      if (order) {
        const newOrder = new Order({
          userId: user,
          name: req.body.name,
          phone: req.body.mobileNumber,
          pincode: req.body.pincode,
          status: "placed",
          paymentMethod: paymentMethod, // Use the variable
          address: req.body.address, // Fixed key name
          orderItems: cart.product.map((item) => {
            return {
              productId: item.productId,
              quantity: item.quantity,
              total: item.price * item.quantity,
            };
          }),
          grandTotal: cart.grandTotal,
        });

        // Store the newOrder object in the session if needed
        req.session.newOrder = newOrder;

        return res.status(200).json({ order: order, orderstatus: true });
      } else {
        // Handle error when generateRazorpay fails
        return res
          .status(500)
          .json({ error: "Razorpay order creation failed" });
      }
    } else if (paymentMethod === "Wallet") {
      if (userDetails.wallet < cart.grandTotal) {
        return res.status(500).json({ error: "Insufficient Amount" });
      } else {
        const newOrder = new Order({
          userId: user,
          name: req.body.name,
          phone: req.body.mobileNumber,
          pincode: req.body.pincode,
          paymentMethod: paymentMethod, // Use the variable
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

        if (newOrder.grandTotal < 0) {
          return res.json({ invalid: true });
        }
        await User.findOneAndUpdate(
          { _id: user },
          { $set: { wallet: userDetails.wallet - cart.grandTotal } }
        );
        await newOrder.save();
        const orderWithItems = await Order.findById(newOrder._id).populate(
          "orderItems.productId"
        );

        await Cart.findOneAndDelete({ userId: user });
        console.log("this is wallet");
        return res.status(200).json({ status: true, orderid: newOrder._id });
      }
    } else {
      // Handle unsupported payment method
      return res.status(400).json({ error: "Unsupported payment method" });
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).render("error", { error: "Internal server error" });
  }
};

const verifyPayment = async (req, res) => {
  try {
    const newOrder = new Order(req.session.newOrder);
    const savedOrder = await newOrder.save();

    // Clear the order from the session
    req.session.newOrder = null;
    await Cart.findOneAndDelete({ userId: req.session.user_id });
    console.log(savedOrder._id, "hjdkifdhf");

    // Send a success response
    res
      .status(200)
      .json({
        success: true,
        message: "Order placed successfully",
        orderid: savedOrder._id,
      });
  } catch (error) {
    console.error(error.message);

    // Send a failure response with an error message
    res
      .status(500)
      .json({ success: false, message: "Failed to place the order" });
  }
};

const paymentFailed = async (req, res) => {
  try {
    res.status(200).json({ success: true, message: "Order Failed" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Some error" });

    console.log(error.message);
  }
};

module.exports = {
  orderDetailsLoad,
  placeOrder,

  verifyPayment,
  paymentFailed,
  viewOrderDetails,
};
