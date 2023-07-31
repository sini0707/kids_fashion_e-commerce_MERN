const mongoose = require("mongoose");
const User = require("../models/userModel");
const Product = require("../models/productModel");
const OTPmodel = require("../models/OTP");
const Category = require("../models/categoryModel");
const bcrypt = require("bcrypt");
const otpGenerator = require("otp-generator");
const Cart = require("../models/cartModel");

const accountSid = "ACfa9e3512a75cb21f56f758eaee7f7057";
const authToken = "8c28095e53d62d3a13fa7d9e0cb24117";

const twilio = require("twilio")(accountSid, authToken);

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
    // await twilio.messages.create({
    //   body: `Your OTP: ${otp}`,
    //   from: '+15417033702',
    //   to: `+91${user.mobile}`,
    // })

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
    // await twilio.messages.create({
    //   body: `Your OTP: ${otp}`,
    //   from: '+15417033702',
    //   to: `+91${user.mobile}`,
    // })
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
    // await twilio.messages.create({
    //     body: `Your OTP: ${otp}`,
    //     from: '+15417033702',
    //     to: `+91${user.mobile}`,
    //   })

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
      allProducts: products,
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
};
