const Admin = require("../models/adminModel");
const User = require("../models/userModel");
const Order = require("../models/orderModel");
const adminHelper = require("../helpers/adminHelper");

const loadLogin = async (req, res) => {
  try {
    res.render("login", { message: "" });
  } catch (error) {
    res.status(500).send(error.message);
  }
};
const verifyLogin = async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;
    const adminData = await Admin.findOne({ email: email });
    if (adminData.password === password) {
      if (adminData) {
        req.session.userId = adminData._id;
        res.redirect("/admin/dashboard");
      } else {
        res.render("login", { message: " Password are Incorrect" });
      }
    } else {
      res.render("login", { message: "admin is not found" });
    }
  } catch (error) {
    res.status(500).send(error.message);
  }
};

const loadDashboard = async (req, res) => {
  try {
    let totalSales = await Order.aggregate([
      {
        $match: {
          status: { $ne: "returned" },
        },
      },
      {
        $count: "totalCount",
      },
    ]);

    totalSales = totalSales[0].totalCount;
    console.log("totalsales", totalSales);
    let totalRevenue = await Order.aggregate([
      {
        $match: {
          status: { $ne: "returned" },
        },
      },
      { $group: { _id: null, total: { $sum: "$grandTotal" } } },
    ]);

    totalRevenue = totalRevenue[0].total;
    console.log("totalRevenue", totalRevenue);
    let orginalPrice = await Order.aggregate([
      {
        $match: {
          status: { $ne: "returned" },
        },
      },
      { $unwind: "$orderItems" },
      {
        $lookup: {
          from: "products",
          localField: "orderItems.productId",
          foreignField: "_id",
          as: "productData",
        },
      },
      {
        $unwind: "$productData",
      },
      {
        $project: {
          price: "$productData.price",
          kg: "$orderItems.quantity",
          total: { $multiply: ["$productData.price", "$orderItems.quantity"] },
        },
      },
      {
        $group: {
          _id: null,
          Total: { $sum: "$total" },
        },
      },
    ]);
    const paymentMethod = await Order.aggregate([
      {
        $match: {
          status: { $ne: "returned" },
        },
      },
      {
        $group: {
          _id: "$paymentMethod",
          totalGrandTotal: { $sum: "$grandTotal" },
        },
      },
    ]);

    var series = encodeURIComponent(
      JSON.stringify(paymentMethod.map((item) => item.totalGrandTotal))
    );

    var labels = encodeURIComponent(
      JSON.stringify(paymentMethod.map((item) => item._id))
    );
    var currentMonth = new Date().getMonth() + 1;
    const salesPerMonthx = await Order.aggregate([
      {
        $match: {
          status: { $ne: "returned" },
          dateOrdered: {
            $lt: new Date(new Date().getFullYear(), currentMonth, 1),
          },
        },
      },
      {
        $group: {
          _id: { $month: "$dateOrdered" },
          totalGrandTotal: { $sum: "$grandTotal" },
        },
      },
      {
        $group: {
          _id: null,
          months: {
            $push: {
              month: { $ifNull: ["$_id", currentMonth] },
              totalGrandTotal: { $ifNull: ["$totalGrandTotal", 0] },
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          months: {
            $map: {
              input: { $range: [1, 13] },
              as: "month",
              in: {
                month: {
                  $let: {
                    vars: {
                      monthNames: [
                        null,
                        "Jan",
                        "Feb",
                        "Mar",
                        "Apr",
                        "May",
                        "Jun",
                        "Jul",
                        "Aug",
                        "Sep",
                        "Oct",
                        "Nov",
                        "Dec",
                      ],
                    },
                    in: {
                      $arrayElemAt: ["$$monthNames", "$$month"],
                    },
                  },
                },
                totalGrandTotal: {
                  $let: {
                    vars: {
                      monthData: {
                        $arrayElemAt: [
                          {
                            $filter: {
                              input: "$months",
                              cond: { $eq: ["$$this.month", "$$month"] },
                            },
                          },
                          0,
                        ],
                      },
                    },
                    in: { $ifNull: ["$$monthData.totalGrandTotal", 0] },
                  },
                },
              },
            },
          },
        },
      },
    ]);

    const numberOfOrders = await Order.countDocuments();
    var month = encodeURIComponent(
      JSON.stringify(salesPerMonthx[0].months.map((item) => item.month))
    );
    var monthlySales = encodeURIComponent(
      JSON.stringify(
        salesPerMonthx[0].months.map((item) => item.totalGrandTotal)
      )
    );

    console.log(typeof month);
    res.render("dashboard", {
      currentPage: "dashboard",
      paymentData: "",
      totalSales,
      totalRevenue,
      lastProfit: 1,
      loss: 1,
      cost: 1,
      series,
      labels,
      month,
      monthlySales,
      numberOfOrders,
    });
  } catch (error) {
    res.status(500).send(error.message);
  }
};

const loadUsers = async (req, res) => {
  try {
    const search = "";
    if (req.query.search) {
      search = req.query.search;
    }
    const usersData = await User.find({
      $or: [
        { fname: { $regex: ".*" + search + ".*" } },
        { lname: { $regex: ".*" + search + ".*" } },
        { email: { $regex: ".*" + search + ".*" } },
        { mobile: { $regex: ".*" + search + ".*" } },
      ],
    });

    res.render("user2", { user: usersData });
  } catch (error) {
    res.status(500).send(error.message);
  }
};

const blockUser = async (req, res) => {
  try {
    const id = req.query.id;
    await User.findByIdAndUpdate({ _id: id }, { $set: { is_blocked: true } });
    res.redirect("/admin/loadUsers");
  } catch (error) {
    res.status(500).send(error.message);
  }
};

const unBlockUser = async (req, res) => {
  try {
    const id = req.query.id;
    await User.findByIdAndUpdate({ _id: id }, { $set: { is_blocked: false } });
    res.redirect("/admin/loadUsers");
  } catch (error) {
    res.status(500).send(error.message);
  }
};
const loadEditUser = async (req, res) => {
  try {
    const id = req.query.id;
    const userData = await User.findById({ _id: id });
    if (userData) {
      res.render("editUser", { user: userData });
    } else {
      res.redirect("/admin/loadUsers");
    }
  } catch (error) {
    res.status(500).send(error.message);
  }
};
const updateUser = async (req, res) => {
  try {
    const userData = await User.findByIdAndUpdate(
      { _id: req.body.id },
      {
        $set: {
          fname: req.body.fname,
          lname: req.body.lname,
          email: req.body.email,
          mobile: req.body.mobile,
        },
      }
    );
    res.redirect("/admin/users");
  } catch (error) {
    res.status(500).send(error.message);
  }
};
const logout = (req, res) => {
  req.session.destroy(() => {
    res.redirect("/admin/adminLogin");
  });
};

const ordersLoad = async (req, res) => {
  try {
    const order = await Order.find()
      .populate("orderItems.productId")
      .sort({ dateOrdered: -1 })
      .exec();
    res.render("order", { order });
  } catch (error) {
    res.status(500).send(error.message);
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const status = req.body.statuss;
    const date = Date.now();
    if (status == "delivered") {
      const order = await Order.updateOne(
        { _id: req.body.orderId },
        { status: status, deliveredDate: date }
      );
      res.redirect("/admin/ordersList");
    } else if (status == "returned") {
      const order = await Order.updateOne(
        { _id: req.body.orderId },
        { status: status }
      );
      res.redirect("/admin/ordersList");
    } else if (status == "shipped") {
      const order = await Order.updateOne(
        { _id: req.body.orderId },
        { status: status }
      );
      res.redirect("/admin/ordersList");
    } else {
      const order = await Order.updateOne(
        { _id: req.body.orderId },
        { status: status }
      );
      res.redirect("/admin/ordersList");
    }
  } catch (error) {
    res.status(500).send(error.message);
  }
};

const salesreport = async (req, res) => {
  try {
    const preDate = "";
    const postDate = "";
    const order_data = await Order.find()
      .populate("userId")
      .populate("orderItems.productId")
      .populate("orderItems.quantity");

    console.log("this is my", order_data, "order Data");
    res.render("salesreport", { order_data, preDate, postDate });
  } catch (err) {
    res.status(500).send(err.message);
  }
};

const filterorder = async (req, res) => {
  try {
    const preDate = new Date(req.body.preDate);
    const postDate = new Date(req.body.postDate);
    const order_data = await Order.find({
      dateOrdered: { $gte: preDate, $lte: postDate },
    })
      .populate("userId")
      .populate("orderItems.productId")
      .populate("orderItems.quantity");

    res.render("salesreport", {
      order_data,
      preDate: req.body.preDate,
      postDate: req.body.postDate,
    });
  } catch (error) {
    res.status(500).send(error.message);
  }
};

const refund = async (req, res) => {
  try {
    const orderID = req.query.id;
    const userId = req.session.user_id;
    const userDatas = await User.findById(userId);
    const orderDataS = await Order.findById(orderID);
    await User.findOneAndUpdate(
      { _id: userId },
      { $set: { wallet: userDatas.wallet + orderDataS.grandTotal } }
    );

    await Order.findOneAndUpdate(
      { _id: orderID },
      { $set: { status: 'refunded' } }
    );
    
    res.redirect("/admin/ordersList")
  } catch (error) {
    res.status(500).send(error.message);
  }
};

module.exports = {
  loadLogin,
  verifyLogin,
  loadDashboard,
  loadUsers,
  blockUser,
  loadEditUser,
  updateUser,
  unBlockUser,
  logout,
  ordersLoad,
  updateOrderStatus,
  salesreport,
  filterorder,
  refund,
};
