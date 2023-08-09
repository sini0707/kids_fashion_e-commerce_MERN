const mongoose = require("mongoose");
const User = require("../models/userModel");
const Product = require("../models/productModel");
const OTPmodel = require("../models/OTP");
const Category = require("../models/categoryModel");
const bcrypt = require("bcrypt");
const otpGenerator = require("otp-generator");
const Cart = require("../models/cartModel");
const Order = require("../models/orderModel");
const twilio=require("twilio");
const dotenv=require("dotenv");
dotenv.config();

const accountSid = process.env.accountSid;
const authToken =process.env.authToken;
const twilioNumber=process.env.twilioNumber;


const client = twilio(accountSid, authToken); 

const OTPsaveFunction = async (email, otp) => {
  try {
    const existingOTP = await OTPmodel.findOne({ email });
    if (existingOTP) {
      await OTPmodel.deleteOne({ email });
    }

    const saveOTP = new OTPmodel({
      email: email,
      otp: otp,
    });
    const OTPsaved = await saveOTP.save();
    return;
  } catch (error) {
    console.log(error.message);
  }
};

const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {
    console.log(error.message);
  }
};
const loadRegister = async (req, res) => {
  try {
    res.render("signup");
  } catch (error) {
    console.log(error.message);
  }
};

const insertUser = async (req, res) => {
  try {
    const email = req.body.email;
    const existingUser = await User.findOne({ email: email });
    if (existingUser) {
      return res.render("signup", { message: "Email already exists" });
    }

    const spassword = await securePassword(req.body.password);
    const user = new User({
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      email: req.body.email,
      mobile: req.body.mno,
      password: spassword,
      is_admin: 0,
    });

    // Validation
    if (!user.mobile || !user.password) {
      return res.render("signup", {
        message: "Mobile number and password must be filled",
      });
    }

    if (!/^\d{10}$/.test(user.mobile)) {
      return res.render("signup", {
        message: "Mobile number must be 10 digits",
      });
    }

    if (/\d/.test(user.firstname)) {
      return res.render("signup", {
        message: "Name should not contain numbers",
      });
    }
    if (/\d/.test(user.lastname)) {
      return res.render("signup", {
        message: "Name should not contain numbers",
      });
    }
    // Generate a random OTP
    const otp = Math.floor(100000 + Math.random() * 900000);
    console.log(otp);
    // Generate a random OTP
    // Send the OTP to the user's mobile number
    await twilio.messages.create({
      body: `Your OTP: ${otp}`,
      from:twilioNumber,
      to: `+91${user.mobile}`,
    })

    // Store the OTP and user data in the session
    req.session.otp = otp;
    req.session.user = {
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      mobile: user.mobile,
      password: user.password,
      is_admin: user.is_admin,
    };

    res.redirect("/verifyotp");
  } catch (error) {
    console.log(error.message);
    return res.render("signup", { message: "All fields should be filled" });
  }
};

const loginLoad = async (req, res) => {
  try {
    res.render("login");
  } catch (error) {
    console.log(error.message);
  }
};

const verifyLogin = async (req, res) => {
  try {
    const email = req.body.email;
    const { password } = req.body;

    const userData = await User.findOne({ email: email });
    console.log(userData);
    const passwordMatch = await bcrypt.compare(password, userData.password);
    if (userData) {
      if (passwordMatch) {
        if (userData.is_blocked === true) {
          res.render("login", {
            message: "your account blocked.please contact customer care!!!",
          });
        } else {
          req.session.user_id = userData._id;
          res.redirect("/home");
        }
      } else {
        res.render("login", { message: "Email and password incorrect" });
      }
    } else {
    }
  } catch (error) {
    console.log(error.message);
  }
};

const loadVerifyOTP = async (req, res) => {
  try {
    res.render("verifyOtp");
  } catch (error) {
    console.log(error.message);
  }
};

const verifyOtp = async (req, res) => {
  try {
    const otp = req.body.otp;

    if (otp == req.session.otp) {
      // OTP is correct, proceed with login
      const userData = req.session.user;
      // req.session.user_id = req.session.user_id;
      req.session.otp = undefined; // Clear OTP after successful verification
      const user = new User({
        firstname: userData.firstname,
        lastname: userData.lastname,
        email: userData.email,
        mobile: userData.mobile,
        password: userData.password,
        is_admin: userData.is_admin,
      });

      await user.save();
      return res.render("login", { message: "Register successful" });
    } else {
      // Incorrect OTP
      return res.render("verifyotp", { message: "Incorrect OTP" });
    }
  } catch (error) {
    console.log(error.message);
    return res.render("verifyotp", { message: "An error occurred" });
  }
};

const loadHome = async (req, res) => {
  try {
    const product = await Product.find();
    let cartCount = 0;
    const userId = req.session.user_id;
    if (userId) {
      let cart = await Cart.findOne({ userId });
      if (cart) {
        let cartProduct = cart.product;
        cartCount = cartProduct.length;
      }
    }
    // const userData = await User.findById({ _id: req.session.user_id });
    // res.render('home', { user: userData });

    res.render("home", { product, cartCount });
  } catch (error) {
    console.log(error.message);
  }
};

const userLogout = async (req, res) => {
  try {
    req.session.destroy();
    res.redirect("/login");
  } catch (error) {
    console.log(error.message);
  }
};

const loadForgotPassword = async (req, res) => {
  try {
    res.render("forgetPassword");
  } catch (error) {
    console.log(error.message);
  }
};

/// forgot password otp verofication

const forgotPasswordOtp = async (req, res) => {
  const mobile = req.body.mobile;
  const userFound = await User.findOne({
    $or: [{ email: mobile }, { mobile: mobile }],
  });
  if (!userFound) {
    console.log("no userFOundMobile");
    return res.render("forgetPassword", {
      message: "Invalid Login credential",
    });
  }
  if (userFound) {
    const otp = Math.floor(100000 + Math.random() * 900000);
    console.log(otp);
    req.session.forgotOtp = otp;
    // Generate a random OTP
    //   Send the OTP to the user's mobile number
    await twilio.messages.create({
      body: `Your OTP: ${otp}`,
      from: twilioNumber,
      to: `+91${User.mobile}`,
    })
    req.session.email = userFound.email;
    const OTPsave = await OTPsaveFunction(userFound.email, otp);

    res.render("sendOtp", { mobile: req.query.mobile, otp: otp });
  }
};

const verifyForgetOTP = async (req, res) => {
  try {
    const otp = req.body.OTP;
    const matchOtp = req.session.forgotOtp; // console.log('test');
    // if (!OTPmatch.otp) {
    //   return res.render("sendOtp", { message: "OTP Expired" });
    // }
    if (matchOtp != otp) {
      return res.render("sendOtp", { message: "invalid OTP" });
    }

    return res.render("resetpassword");
  } catch (error) {
    console.log(error.message);
  }
};

const forgotResendOtp = async (req, res) => {
  try {
    const resendOtp = Math.floor(100000 + Math.random() * 900000);
    console.log(resendOtp);
    req.session.forgotOtp = resendOtp;
    console.log("testing", req.session.forgotOtp);
    res.render("sendOtp", {
      message: "OTP has been resent.",
      otp: req.session.forgotOtp,
    });
  } catch (error) {
    console.log(error.message);
  }
};

const resetPassword = async (req, res) => {
  try {
    console.log("test1");
    const password = req.body.Newpassword;
    const cPassword = req.body.ConfirmPassword;
    const email = req.session.email;
    if (password == cPassword) {
      const spassword = await securePassword(password);
      const newUser = await User.updateOne(
        { email: email },
        { $set: { password: spassword } }
      );
    }
    console.log("Password updated successfully");
    res.redirect("/login");
  } catch (error) {
    console.log(error.message);
  }
};

const resendOtp = async (req, res) => {
  try {
    const otp = Math.floor(100000 + Math.random() * 900000);
    console.log(otp);
    await twilio.messages.create({
        body: `Your OTP: ${otp}`,
        from: twilioNumber,
        to: `+91${user.mobile}`,
      })

    // Store the OTP and user data in the session
    req.session.otp = otp;
    const userData = req.session.user;
    req.session.user = {
      firstname: userData.firstname,
      lastname: userData.lastname,
      email: userData.email,
      mobile: userData.mobile,
      password: userData.password,
      is_admin: userData.is_admin,
    };

    res.redirect("/verifyOtp");
  } catch (error) {
    console.log(error.message);
    return res.render("signup", { message: "All fields should be filled" });
  }
};

const getShop = async (req, res) => {
  try {
    let cartCount = 0;
    const userId = req.session.user_id;
    if (userId) {
      let cart = await Cart.findOne({ userId });
      if (cart) {
        let cartProduct = cart.product;
        cartCount = cartProduct.length;
      }
    }
    const ITEMS_PER_PAGE = 6;
    const page = parseInt(req.query.page) || 1;
    const skipItems = (page - 1) * ITEMS_PER_PAGE;

    // Retrieve query parameters for filtering (dress size and color)
    const { size, color } = req.query;

    // Build the filter object based on the provided query parameters
    const filter = {};
    if (size) {
      filter.size = size;
    }
    if (color) {
      filter.color = color;
    }

    // Query the total count of products based on the filter
    const totalCount = await Product.countDocuments(filter);
    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

    // Fetch products based on the filter, skip, and limit
    const allProducts = await Product.find(filter)
      .skip(skipItems)
      .limit(ITEMS_PER_PAGE);

    const allcategory = await Category.find({});

    res.render("shop", {
      allProducts,
      cartCount,
      allcategory: allcategory,
      currentPage: page,
      totalPages: totalPages,
    });
  } catch (error) {
    console.log(error);
  }
};

const getCategory = async (req, res) => {
  try {
    const ITEMS_PER_PAGE = 6;
    const categoryname = req.query.name;
    const page = parseInt(req.query.page) || 1;
    const skipItems = (page - 1) * ITEMS_PER_PAGE;

    // Retrieve query parameters for filtering (dress size and color)
    const { size, color } = req.query;

    // Build the filter object based on the provided query parameters
    const filter = { categoryName: categoryname };
    if (size) {
      filter.size = size;
    }
    if (color) {
      filter.color = color;
    }

    // Query the total count of products based on the filter
    const totalCount = await Product.countDocuments(filter);
    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

    // Fetch products based on the filter, skip, and limit
    const allProducts = await Product.find(filter)
      .skip(skipItems)
      .limit(ITEMS_PER_PAGE);

    // Fetch all categories for navigation
    const allcategory = await Category.find({});

    // Fetch the selected category for display
    const selectedCategory = await Category.findOne({
      categoryName: categoryname,
    });

    res.render("category", {
      allProducts,
      allcategory,
      selectedCategory,
      currentPage: page,
      totalPages,
    });
  } catch (error) {
    console.log(error);
  }
};

const singleProductLoad = async (req, res) => {
  try {
    const productId = req.query.id;
    const userId = req.session.user_id;

    // console.log('its me product id',productId);
    const singleProduct = await Product.findOne({ _id: productId });
    // console.log(singleProduct)
    let cartCount = 0;
    if (userId) {
      let cart = await Cart.findOne({ userId });
      if (cart) {
        let cartProduct = cart.product;
        cartCount = cartProduct.length;
      }
    }
    // if (!singleProduct) {
    //   // Product not found, render 404 page
    //   return res.render("404");
    // }

    const allProducts = await Product.find({});

    res.render("single-product", {
      cartCount,
      singleProduct: singleProduct,
      allProducts: allProducts,
    });
  } catch (error) {
    console.log(error.message);
    res.render("404");
  }
};

const addToCart = async (req, res) => {
  const productId = req.query.id;
  const userId = req.session.user_id;
  const product = await Product.findOne({ _id: productId });
  const productObj = {
    productId: productId,
    quantity: 1,
    price: product.price,
  };

  try {
    const cart = await Cart.findOne({ userId: userId });
    if (cart) {
      const productExist = await Cart.findOne({
        userId: userId,
        "product.productId": productId,
      });
      if (productExist) {
        const addValue = await Cart.updateOne(
          { userId: userId, "product.productId": productId },
          {
            $inc: { "product.$.quantity": 1, "product.$.price": product.price },
            $set: {
              grandTotal: cart.grandTotal + product.price,
            },
          }
        );
        console.log(" product exist");
        console.log(addValue);
      } else {
        console.log("new Product");
        const newProduct = await Cart.updateOne(
          { userId: userId },
          {
            $push: { product: productObj },
            $inc: { grandTotal: product.price },
          }
        );
      }
    } else {
      const newCart = new Cart({
        userId: userId,
        product: productObj,
        grandTotal: product.price,
      });
      await newCart.save();

      // await newCart.save()
      console.log(newCart);
    }

    res.redirect("/shop");
  } catch (error) {
    console.log(error.message);
  }
};
const getCart = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const userdata = await User.findOne({
      _id: new mongoose.Types.ObjectId(userId),
    });

    // const userCart = await Cart.findOne({userId})

    const data = await Cart.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
        },
      },

      {
        $unwind: "$product",
      },
      {
        $lookup: {
          from: "products",
          localField: "product.productId",
          foreignField: "_id",
          as: "carted",
        },
      },
      {
        $unwind: "$carted",
      },
      {
        $project: {
          carted: 1,
          quantity: "$product.quantity",
        },
      },
    ]);
    const totalPrice = data.reduce(
      (total, item) => total + item.carted.price * item.quantity,
      0
    );
    res.render("cart", { data, userdata, totalPrice });
  } catch (error) {
    console.log(error);
  }
};


const displayProduct = async (req, res) => {
  try {
    const category = await Category.find({});
    const page = parseInt(req.query.page) || 1;
    const limit = 6;
    const skip = (page - 1) * limit; // Calculate the number of products to skip
    const searchQuery = req.body.search || ""; // Get the search query from request query parameters
    // Build the search filter
    console.log(searchQuery);
    const searchFilter = {
      $and: [
        { is_listed: true },
        {
          $or: [{ name: { $regex: new RegExp(searchQuery, "i") } }],
        },
      ],
    };
    const totalProducts = await Product.countDocuments(searchFilter); // Get the total number of products matching the search query
    const totalPages = Math.ceil(totalProducts / limit); // Calculate the total number of pages
    const products = await Product.find(searchFilter)
      .skip(skip)
      .limit(limit)
      .populate("category");
    console.log(products);
    res.render("shop", {
      allcategory: products,
      allProducts:products,
      currentPage: page,
      totalPages,
    });
  } catch (error) {
    console.log(error.message);
    res.redirect("/error-500");
  }
};
const categoryPage = async (req, res) => {
  try {
    const categoryId = req.query.id;
    const category = await Category.find({});
    const page = parseInt(req.query.page) || 1;
    const limit = 6;
    const skip = (page - 1) * limit;
    const totalProducts = await Product.countDocuments({
      category: categoryId,
      is_listed: true,
    });
    // Get the total number of products
    const totalPages = Math.ceil(totalProducts / limit);

    const product = await Product.find({
      category: categoryId,
      is_listed: true,
    })
      .skip(skip)
      .limit(limit)
      .populate("category");

    res.render("categoryShop", {
      product,
      category,
      currentPage: page,
      totalPages,
    });
  } catch (err) {
    console.log("category page error", err);
    res.redirect("/error-500");
  }
};


const loadCheckout = async (req, res) => {
  try {
    const userId = req.session.user_id;

    console.log("test1");
    console.log(userId);

    const user = await User.findOne({ _id: userId });
    console.log(user);

    const cart = await Cart.findOne({ userId: userId }).populate("product.productId").exec();
    console.log("testing");
    console.log(cart);

    if (!cart || !cart.product) {
      // If cart is null or cart.product is not available, redirect to 404 page or any other appropriate action
      return res.render("404");
    }

    console.log("test");

    let subTotal = 0;
    for (let i = 0; i < cart.product.length; i++) {
      subTotal += cart.product[i].total;
    }

    res.render("checkout", {
      user: user,
      cart,
      grandTotal: subTotal, // Use the subTotal directly as the grandTotal
      subTotal,
      address: user.addresses,
    });
  } catch (error) {
    console.log(error.message);
    res.render("404");
  }
};

const Checkout = async (req, res) => {
  try {
    
   
    const cart = await Cart.findOne({ userId: req.session.user_id })
      .populate("product.productId")
      .exec();
    
    var grandTotal = 0;
    for (let i = 0; i < cart.product.length; i++) {
      grandTotal += cart.product[i].productId.price * cart.product[i].quantity;
    }

    const newOrder = new orderId({
      userId:req.session.user_id,
      name: req.body.name,
      email: req.body.email,
      address: req.body.address,
      phone: req.body.phone,
      paymentMethod: req.body.payment,
      orderItems: cart.product,
      grandTotal: grandTotal,
    });
   
    await newOrder.save();
    const orderId = newOrder._id;
   
    // const deleteCart = await Cart.deleteOne({ userId:req.session.user_id});

    res.redirect(`/viewOrderDetails?id=${orderId}`);
  } catch (error) {
    console.log(error.message);
    res.render("404");
  }
};


// to load user profile
const userProfile = async (req, res) => {
  try {
    const userId = req.session.user_id;
console.log(userId,'......');
    const userData = await User.findOne({ _id: userId });

  console.log( userData);

      
      res.render("profile", );
    
  } catch (error) {
    console.log(error.message);
    // res.render('404')
  }
};


//to add address for user profile
const profileAddressAdd = async (req, res) => {
  try {
    console.log("hiii")
   
    const userId = req.session.user_id;
    const user = await User.findOne({ _id: userId });
    console.log(req.body.name,
     req.body.mobileNumber,
     req.body.address,
      req.body.locality,
      req.body.city,
      req.body.pincode,
      req.body.state,"hiiii");

    user.addresses.push({
      name: req.body.name,
      mobileNumber:req.body.mobileNumber,
      address: req.body.address,
      locality:req.body.locality,
      city:req.body.city,
      pincode:req.body.pincode,
      state:req.body.state,


    });

    await user.save();
    // res.redirect("/profile?message=Address added successfully....");
    res.status(200).json({ message: "Address added successfully." });
  } catch (error) {
    console.log(error);
    // Redirect with an error message
    // res.redirect("/profile?message=Failed to add address....");
    res.status(500).json({ error: "Failed to add address." });
  }
};

//to profile edit
const profileEdit = async (req, res) => {
  try {
    const name = req.body.name;
    const updationData = {
      name:req.body.name,
     mobileNumber:req.body.mobileNumber,
    address:req.body.address,
     locality: req.body.locality,
      city:req.body.city,
      pincode:req.body.pincode,
      state:req.body.state
      // name: req.body.name,
      // email: req.body.email,
      // phone: req.body.mobile,
    };

    const user = await User.updateOne(
      {userId:req.session.user_id},
      { $set: updationData }
    );

    res.redirect("/profile");
  } catch (error) {
    console.log(error);
   
  }
};
const editAddress = async (req, res) => {
  try {
    const name = req.body.name;
    const userData = {
      name: req.body.name,
      address: req.body.address,
      city: req.body.city,
      locality:req.body.locality,
      state:req.body.state,
      phone:req.body.phone
    };
    const updateProfile = User.updateOne({ name: name }, { $set: userData });
    res.redirect("/profile");
  } catch (error) {
    console.log(error);
    
  }
};

const loadOrder = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const cart = await Cart.findOne({ userId: userId }).populate("product.productId");
      // await User.save();

    res.render("checkOut", {cart});
  } catch (error) {
    console.log(error.message);
    
  }
};

const loadMyOrder = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.session.user_Id })
      .populate("orderItems.productId")
      .sort({ dateOrdered: -1 }) // Sort by dateOrdered in descending order
      .exec();

    res.render("myOrder", { orders });
  } catch (error) {
    console.log(error.message);
    res.render("404");
  }
};





module.exports = {
  loadRegister,
  insertUser,
  loginLoad,
  verifyLogin,
  loadVerifyOTP,
  verifyOtp,
  loadHome,
  userLogout,
  loadForgotPassword,
  forgotPasswordOtp,
  resetPassword,
  resendOtp,
  verifyForgetOTP,
  forgotResendOtp,
  getShop,
  getCategory,
  singleProductLoad,
  addToCart,
  getCart,
  displayProduct,
  categoryPage,
  loadCheckout,
  Checkout,
  userProfile,
  profileAddressAdd,
  profileEdit,
  editAddress ,
  loadOrder,
  loadMyOrder
  


};
