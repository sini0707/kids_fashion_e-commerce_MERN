const Admin=require("../models/adminModel");
 const User=require("../models/userModel");
 const Order = require('../models/orderModel');
 const adminHelper = require('../helpers/adminHelper')

//load login page

const loadLogin = async (req, res) => {

 
    try {
      res.render("login", { message: "" });
    } catch (error) {
      console.log(error.message);
    }
  };
//verify login

  const verifyLogin = async (req, res) => {
    try {
      const email = req.body.email;
      const password = req.body.password;
      const adminData = await Admin.findOne({ email: email });
  console.log(adminData);
      if (adminData.password === password) {
        // Authentication successful
        if (adminData) {
          // Create session and store user ID in the session data
          req.session.userId = adminData._id;
          res.redirect("/admin/dashboard");
        } else {
          res.render("login", { message: " Password are Incorrect" });
        }
      } else {
        res.render("login", { message: "admin is not found" });
      }
    } catch (error) {
      console.log(error.message);
    }
  };
  
  //load dashboard

const loadDashboard = async (req, res) => {
 
    try {
  
      //totalSales
  
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
      console.log('totalsales',totalSales);
      // totalRevenue
      let totalRevenue = await Order.aggregate([
        {
          $match: {
            status: { $ne: "returned" },
          },
        },
        { $group: { _id: null, total: { $sum: "$grandTotal" } } },
      ]);
  
      totalRevenue = totalRevenue[0].total;
      console.log('totalRevenue',totalRevenue)
      //totalprofit
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
            kg: "$orderItems.kg",
            total: { $multiply: ["$productData.price", "$orderItems.kg"] },
          },
        },
        {
          $group: {
            _id: null,
            Total: { $sum: "$total" },
          },
        },
      ]);
     console.log('gggggggggg',orginalPrice[0]);
      // orginalPrice = orginalPrice[0].Total;
      // // console.log('original price',orginalPrice);
      // let loss = orginalPrice - totalRevenue;
      // // console.log('loss',loss)
      // let originalProfit = (orginalPrice * 30) / 100;
      // // console.log('originalProfit',originalProfit);
      // let lastProfit = originalProfit - loss;
      // // console.log('lastProfit',lastProfit);
      // let cost = (orginalPrice * 70) / 100;
      
      // console.log('cost',cost);
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
      // console.log('payment method',paymentMethod);
      var series = encodeURIComponent(
        JSON.stringify(paymentMethod.map((item) => item.totalGrandTotal))
      );
   
      var labels = encodeURIComponent(
        JSON.stringify(paymentMethod.map((item) => item._id))
      );
  
  
      // Get the current month
      // Get the current month
      var currentMonth = new Date().getMonth() + 1; // JavaScript months are zero-based, so add 1
  // console.log('currentMonth',currentMonth)
      const salesPerMonthx = await Order.aggregate([
        {
          $match: {
            status: { $ne: "returned"},
            dateOrdered: {
              // $gt: new Date(new Date().getFullYear(), currentMonth - 1, 1),
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
      // console.log("salesPerMonthx",salesPerMonthx);
   const numberOfOrders=await Order.countDocuments()
  //  console.log('what is this',numberOfOrders)
      
    //   if(salesPerMonthx){
    //    var salesPerMonth = salesPerMonthx[0].months;
  
    //  }
  // console.log(salesPerMonthx[0].months)
      var month = encodeURIComponent(
        JSON.stringify(salesPerMonthx[0].months.map((item) => item.month))
      );
      var monthlySales = encodeURIComponent(
        JSON.stringify(salesPerMonthx[0].months.map((item) => item.totalGrandTotal))
      );
     
      console.log(typeof month)
      res.render("dashboard", {
        currentPage: "dashboard",
        paymentData: "",
        totalSales,
        totalRevenue,
        lastProfit:1,
        loss:1,
        cost:1,
        series,
        labels,
        month,
        monthlySales,
        numberOfOrders
      });
    } catch (error) {
      console.log(error.message);
      res.render('404')
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
    console.log(usersData);

    res.render("user2", { user: usersData });
  } catch (error) {
    console.log(error.message);
  }
};


//delete user

// const deleteUser = async (req, res) => {
//   try {
//     const id = req.query.id;
//     await User.deleteOne({ _id: id });
//     res.redirect("/admin/loadUsers");
//   } catch (error) {
//     console.log(error.message);
//   }
// };

 //block user

const blockUser = async (req, res) => {
  try {
    const id = req.query.id;
    await User.findByIdAndUpdate({ _id: id }, { $set: { is_blocked: true } });
    res.redirect("/admin/loadUsers");
  } catch (error) {
    console.log(error);
  }
};

 //unblockuser

const unBlockUser = async (req, res) => {
  try {
    const id = req.query.id;
    await User.findByIdAndUpdate({ _id: id }, { $set: { is_blocked: false } });
    res.redirect("/admin/loadUsers");
  } catch (error) {
    console.log(error);
  }
};
 ///load edit user

const loadEditUser = async (req, res) => {
  try {
    const id = req.query.id;
    const userData = await User.findById({ _id: id });
    if (userData) {
      res.render("editUser", { user: userData });
    } else {
    res.redirect("/admin/loadUsers");
    // res.redirect("");
    }
  } catch (error) {
    console.log(error.message);
  }
};

//update user
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
    console.log(error.message);
  }
};
const logout = (req, res) => {
  req.session.destroy(() => {
  
  res.redirect("/admin/adminLogin");
});
};



//to display the page of order list
const ordersLoad = async (req, res) => {
  try {
    const order = await Order.find()
      .populate('orderItems.productId')
      .sort({ dateOrdered: -1 })
      .exec();
      // console.log(order[0].grandTotal,'sini')

    res.render("order", { order });
  } catch (error) {
    console.log(error.message);
   
  }
};


const updateOrderStatus=async(req,res)=>{
  try{
  

    const status = req.body.statuss

    // console.log(typeof req.body.orderId)
    const date=Date.now()
    if(status=='delivered'){

      const order=await Order.updateOne({_id:req.body.orderId},{status:status,deliveredDate:date})
      res.redirect('/admin/ordersList')
    }else if(status=='returned'){
      const order=await Order.updateOne({_id:req.body.orderId},{status:status})
      res.redirect('/admin/ordersList')
    }else if(status=='shipped'){
      const order=await Order.updateOne({_id:req.body.orderId},{status:status})
      res.redirect('/admin/ordersList')
    }else{
      const order=await Order.updateOne({_id:req.body.orderId},{status:status})
      res.redirect('/admin/ordersList')
    }
  }catch(error){
    console.log(error.message);
    res.render('404')
  }

}



const salesreport = async (req, res) => {
  try {
    const preDate = "";
    const postDate = "";
    const order_data = await Order.find()
      .populate("userId")
      .populate("orderItems.productId")
      .populate("orderItems.quantity");

      console.log("this is my",order_data,"order Data")
    res.render("salesreport", { order_data, preDate, postDate });
  } catch (err) {
    res.status(500).send(err.message); // Send error response with status code 500
  }
};

const filterorder = async (req, res) => {
  try {
    const preDate = new Date(req.body.preDate);
    const postDate = new Date(req.body.postDate);

    // Find orders that fall within the date range
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
    console.error(error);
    res.status(500).send(error.message); // Send error response with status code 500
  }
};












module.exports = {
    loadLogin,
    verifyLogin ,
    loadDashboard,
    loadUsers,
    blockUser,
    loadEditUser,
    updateUser,
    unBlockUser,
    logout,
    ordersLoad ,
     updateOrderStatus,
     salesreport,
     filterorder
    


}