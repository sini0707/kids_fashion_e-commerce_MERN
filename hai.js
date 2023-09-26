const cart = require("../model/cartmodel");
const User = require("../model/usermodel");
const Product = require("../model/productmodel");
const useraddress = require("../model/addressmodel");
const { Schema } = require("mongoose");
const { json } = require("body-parser");
const { login } = require("./usercontroller");
const order = require("../model/ordersmodel");
const Razorpay = require("razorpay");

const orderhelper = require("../helpers/orderhelper");

const confirmorder = async (req, res) => {
  try {
    const userid = req.session.user_id;
    const data = req.body;

    const payment = data.paymentOption;
    const total = parseFloat(data.total);
    // console.log(total, 'poppppp');

    let deliveryadress = {
      name: data.name,
      adress: data.address,
      town: data.town,
      mobile: data.mobile,
      pincode: data.pincode,
      state: data.state,
    };

    const usercart = await cart
      .findOne({ user: userid })
      .populate("cartitems.product");

    let usercarts = usercart.cartitems;

    const items = usercarts.map((item) => {
      const product = item.product;
      const price = item.product.price;
      const quantity = item.quantity;

      return { product, price, quantity };
    });
    if (
      !deliveryadress.name ||
      !deliveryadress.adress ||
      !deliveryadress.mobile ||
      !deliveryadress.pincode ||
      !deliveryadress.state ||
      !deliveryadress.town
    ) {
      return res.json({ error: "Invalid address" });
    }

    if (!deliveryadress || !total || !items || !userid) {
      return res.json({
        error: "something went wrong",
      });
    }

   
   
    await usercart.cartitems.map(async (product) => {
      const stocks = product.product.stock - product.quantity;

      await Product.findOneAndUpdate(
        { _id: product.product },
        { $set: { stock: stocks } }
      );
    });

    if (payment === "cod") {
      //    console.log("hii")
      const status = "placed";

      const neworder = new order({
        user: userid,
        items: items,
        total: Number(total),
        status: status,
        paymentmethod: payment,
        createdAt: new Date(),
        address: deliveryadress,
      });
      const newid = await neworder.save();


      res.json({ codStatus: true, orderid: newid._id });
    } else if (payment === "razorpay") {
      const orderid = newid._id;
      // console.log(orderid,'generate');
      const order = await orderhelper.generateRazorpay(orderid, total);

      if (order) {
        const status = "placed";

        const neworder = new order({
          user: userid,
          items: items,
          total: Number(total),
          status: status,
          paymentmethod: payment,
          createdAt: new Date(),
          address: deliveryadress,
        });
        const newid = await neworder.save();

        res.json({ order: order, orderstatus: true });
      } else {
        return res.status(500).json({ message: "Internal Sever Error" });
      }
    } else {
      const user = await User.findOne({ _id: userid });

      if (user.wallet >= total) {
        (user.wallet -= total), await user.save();
        await User.findOneAndUpdate(
          { _id: userid },
          {
            $push: {
              walletTransactions: {
                message: "Debited",
                amount: total,
                createdAt: Date.now(),
              },
            },
          }
        );
        const status = "placed";

        const neworder = new order({
          user: userid,
          items: items,
          total: Number(total),
          status: status,
          paymentmethod: payment,
          createdAt: new Date(),
          address: deliveryadress,
        });
        const newid = await neworder.save();

        res.json({ walletstatus: true, orderid: newid._id });
      } else {
        return res.json({ walletstatus: false });
      }
    }
    await cart.deleteOne({ user: userid });

    //  items.forEach((item) => {
    //     console.log(item.productid,'ji');
    //     console.log(item.price,'ji');
    //     console.log(item.quantity,'ji');
    //   });
    //   console.log(items,'ji');
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};

const verifypayment = async (req, res) => {
  try {
    const orderid = req.body.order.receipt;
    await orderhelper
      .verifypayment(req.body.response)
      .then(async () => {
        await order.findOneAndUpdate(
          { _id: orderid },
          { $set: { status: "placed" } }
        );
      })
      .catch((error) => {})
      .then(() => {
        res.json({ success: true, orderid: orderid });
      });

    //   if(result){
    //     console.log("testing");

    //     if(update){

    //     }
    //   }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error " });
  }
};

const vieworder = async (req, res) => {
  try {
    const id = req.query.id;

    const userorder = await order
      .findOne({ _id: id })
      .populate("items.product");

    res.render("quickorderview", { userorder });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};
const vieworders = async (req, res) => {
  try {
    const userid = req.session.user_id;
    const user = req.session.user;

    const usercart = await order
      .find({ user: userid })
      .populate("items.product");

    if (usercart) {
      res.render("ordersdetials", { usercart, user });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};
const cancelorder = async (req, res) => {
  try {
    const userid = req.session.user_id;
    const orderid = req.body.orderid;
    const status = req.body.status;

    const userorder = await order.findOneAndUpdate(
      { _id: orderid },
      { $set: { status: status } }
    );
    if (userorder) {
      res.json({
        success: true,
        message: "order status updated successfully",
      });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "updation failed oops!1" });
  }
};
const cancelstatus = async (req, res) => {
  const userid = req.session.user_id;
  const orderid = req.body.orderid;
  const status = req.body.status;

  const updateorder = await order.findOneAndUpdate(
    { _id: orderid },
    { $set: { status: status } }
  );
  if (status === "cancelled") {
    try {
      const orderid = req.body.orderid;
      const status = req.body.status;
      const product = await order
        .findOne({ _id: orderid })
        .populate("items.product");
      if (status === "cancelled") {
        product.items.forEach(async (items) => {
          const prodcutstock = items.product.stock + items.quantity;
          prodcutid = items.product._id;

          const update = await Product.findOneAndUpdate(
            { _id: prodcutid },
            { $set: { stock: prodcutstock } }
          );
        });

        const userwallet = await User.findOne({ _id: userid });

        userwallet.wallet += product.total;

        userwallet.save();
      }
    } catch (error) {
      console.log(error);
      res.status(500).send("Internal Server Error");
    }

    const updateorder = await order.findOneAndUpdate(
      { _id: orderid },
      { $set: { status: status } }
    );
  }
};
const returnstatus = async (req, res) => {
  try {
    const userid = req.session.user_id;
    const orderid = req.body.orderid;
    const status = req.body.status;
    const userorders = await order
      .findOne({ _id: orderid })
      .populate("items.product");

    let refundamount = 0;
    refundamount += userorders.total;

    if (status === "return accepted") {
      await User.findOneAndUpdate(
        { _id: userid },
        { $set: { wallet: refundamount } }
      );

      userorders.items.forEach(async (items) => {
        const prodcutstock = items.product.stock + items.quantity;
        prodcutid = items.product._id;

        const update = await Product.findOneAndUpdate(
          { _id: prodcutid },
          { $set: { stock: prodcutstock } }
        );
      });
    }
    await order.findOneAndUpdate(
      { _id: orderid },
      { $set: { status: status } }
    );
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};
const orderslist = async (req, res) => {
  try {
    const userid = req.session.user_id;
    const userorder = await order
      .find({})
      .populate("items.product")
      .populate("user");

    res.render("orderlist", { userorder });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};
const orderview = async (req, res) => {
  try {
    const id = req.query.id;

    const userorder = await order
      .findOne({ _id: id })
      .populate("items.product");

    res.render("quickorderview", { userorder });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};
const orderstatus = async (req, res) => {
  try {
    const orderid = req.body.orderid;
    // console.log("hiiiiiii");
    const userid = req.session.user_id;
    const status = req.body.status;

    const update = await order.findOneAndUpdate(
      { _id: orderid },
      { $set: { status: status } }
    );
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};
const invoice = async (req, res) => {
  try {
    const orderid = req.query.id;
    const invoicedata = await orderhelper.invoicedetials(orderid);

    orderhelper.generateInvoice(invoicedata, res);
  } catch (error) {
    console.log(error, "here");
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = {
  confirmorder,
  vieworder,
  vieworders,
  cancelorder,
  orderslist,
  orderstatus,
  cancelstatus,
  returnstatus,
  verifypayment,
  invoice,
  orderview,
};