const mongoose = require("mongoose");
const User = require("../models/userModel");
const Product = require("../models/productModel");
const OTPmodel = require("../models/OTP");
const Category = require("../models/categoryModel");
const bcrypt = require("bcrypt");
const otpGenerator = require("otp-generator");
const Cart = require("../models/cartModel");
const Order = require("../models/orderModel");
const flash = require("express-flash");
const dotenv = require("dotenv");
dotenv.config();

const accountSid = process.env.accountSid;
const authToken = process.env.authToken;
const twilioNumber = process.env.twilioNumber;
const verifySid = process.env.verifySid;
const client = require("twilio")(accountSid, authToken);
const verifyServiceSid = verifySid;

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

    if (!isValidEmail(email)) {
      return res.render("signup", { message: "Invalid email format" });
    }
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
    req.session.mobile = user.mobile;

    sendOtp(user.mobile);
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
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
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
    const password = req.body.password;
    const userData = await User.findOne({ email: email });
    if (userData) {
      const passwordMatch = await bcrypt.compare(password, userData.password);
      if (passwordMatch) {
        if (userData.is_blocked === true) {
          return res.render("login", {
            message: "Your account is blocked. Please contact customer care!!!",
          });
        } else {
          req.session.user_id = userData._id;
          return res.redirect("/home");
        }
      } else {
        return res.render("login", { message: " password is not found" });
      }
    } else {
      return res.render("login", { message: "Email not found" });
    }
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const loadVerifyOTP = async (req, res) => {
  try {
    res.render("verifyOtp");
  } catch (error) {
    console.log(error.message);
  }
};

const sendOtp = async (mobileNumber) => {
  try {
    await client.verify.v2.services(verifyServiceSid).verifications.create({
      to: `+91${mobileNumber}`,
      channel: "sms",
    });
  } catch (error) {
    console.log(error.message);
    throw new Error("Failed to send verification code");
  }
};

const verifyCode = async (mobileNumber, code) => {
  try {
    const verification = await client.verify.v2
      .services(verifyServiceSid)
      .verificationChecks.create({
        to: `+91${mobileNumber}`,
        code: code,
      });

    if (verification.status === "approved") {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.log(error.message);
    throw new Error("Failed to verify code");
  }
};

const verifyOtp = async (req, res) => {
  try {
    const otp = req.body.otp;
    const storedMobile = req.session.mobile;
    const isCodeValid = await verifyCode(storedMobile, otp);
    if (!isCodeValid) {
      return res.render("verifyotp", { message: "Invalid OTP" });
    }
    const userData = req.session.user;
    const user = new User({
      firstname: userData.firstname,
      lastname: userData.lastname,
      email: userData.email,
      mobile: userData.mobile,
      password: userData.password,
      is_admin: userData.is_admin,
    });

    await user.save();
    return res.render("login", { message: "Registration successful" });
  } catch (error) {
    console.error("An error occurred:", error.message);
    return res.render("verifyotp", { message: "An error occurred" });
  }
};

const loadHome = async (req, res) => {
  try {
    const product = await Product.find();
    let cartCount = 0;
    const userId = req.session.user_id;
    let username = await User.findById(userId);

    if (userId) {
      let cart = await Cart.findOne({ userId });
      if (cart) {
        let cartProduct = cart.product;
        cartCount = cartProduct.length;
      }
    }

    res.render("home", {
      username: username ? username.firstname : null,
      product,
      cartCount,
    });
  } catch (error) {
    console.log(error.message);
  }
};

const userLogout = async (req, res) => {
  try {
    console.log("working logout");
    req.session.destroy();

    res.redirect("/");
  } catch (error) {
    console.log(error.message);
  }
};

// const searchCategories = async (req, res) => {
//   const searchTerm = req.query.q;
//   try {
//     const searchResults = await Category.find({
//       name: { $regex: searchTerm, $options: "i" }, // Case-insensitive search
//     });
//     res.status(200).json(searchResults);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "An error occurred while searching:Internal Server Error" });
//   }
// };

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
  const userFound = await User.findOne({ mobile: mobile });
  if (!userFound) {
    return res.render("forgetPassword", {
      message: "Invalid Login credential",
    });
  }
  if (userFound) {
    sendOtp(mobile);
    req.session.mobile = mobile; // Store the mobile in the session
    return res.render("sendOtp");
  }
};

const verifyForgetOTP = async (req, res) => {
  try {
    const verification = await client.verify.v2
      .services(verifyServiceSid)
      .verificationChecks.create({
        to: `+91${req.session.mobile}`,
        code: req.body.OTP,
      });

    if (verification.status === "approved") {
      return res.render("resetpassword");
    } else {
      return res.render("sendOtp", { message: "Invalid OTP" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const forgotResendOtp = async (req, res) => {
  try {
    await client.verify.v2.services(verifyServiceSid).verifications.create({
      to: `+91${req.session.mobile}`,
      channel: "sms",
    });
    res.render("sendOtp", {
      message: "OTP has been resent.",
    });
  } catch (error) {
    console.log(error.message);
  }
};

const resetPassword = async (req, res) => {
  try {
    const password = req.body.Newpassword;
    const cPassword = req.body.ConfirmPassword;
    const userToUpdate = await User.findOne({ mobile: req.session.mobile });
    console.log(req.body);

    if (password === cPassword) {
      const spassword = await securePassword(password);
      const newUser = await User.findOneAndUpdate(
        { email: userToUpdate.email },
        { $set: { password: spassword } },
        { new: true }
      );

      if (!newUser) {
        return res.redirect("/login");
      }

      console.log("Password updated successfully");
      req.session.mobile = null;

      return res.redirect("/login");
    } else {
      console.log("Passwords do not match");
      return res.redirect("/reset-password");
    }
  } catch (error) {
    console.log(error.message);
    return res.redirect("/reset-password");
  }
};

const resendOtp = async (req, res) => {
  try {
  
    await client.verify.v2.services(verifyServiceSid).verifications.create({
      to: `+91${req.session.mobile}`,
      channel: "sms",
    });
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
  }

const getShop = async (req, res) => {
  try {
    let cartCount = 0;
    const userId = req.session.user_id;

    let sortQuery;

    if (req.query.low) {
      sortQuery = { price: 1 };
    }

    if (req.query.high) {
      sortQuery = { price: -1 };
    }

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
    if (req.query.category) {
      filter.category = req.query.category;
    }

    // Query the total count of products based on the filter
    const totalCount = await Product.countDocuments(filter);
    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

    // Fetch products based on the filter, skip, and limit
    const allProducts = await Product.find(filter)
      .sort(sortQuery)
      .skip(skipItems)
      .limit(ITEMS_PER_PAGE);

    const paginationLinks = [];
    for (let i = 1; i <= totalPages; i++) {
      // Include the sorting query parameter in the pagination links

      const sortQuery = req.query.low
        ? { price: 1 }
        : req.query.high
        ? { price: -1 }
        : "";
      if (sortQuery.price === 1) {
        sortBy = "low";
      } else {
        sortBy = "high";
      }
      const link = `?page=${i}&${sortBy}=${sortQuery}`;
      paginationLinks.push(link);
    }

    const allcategory = await Category.find({});

    res.render("shop", {
      allProducts,
      cartCount,
      allcategory: allcategory,
      currentPage: page,
      totalPages: totalPages,
      paginationLinks,
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
    const allcategory = await Category.find({});
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

    const singleProduct = await Product.findOne({ _id: productId });

    let cartCount = 0;
    if (userId) {
      let cart = await Cart.findOne({ userId });
      if (cart) {
        let cartProduct = cart.product;
        cartCount = cartProduct.length;
      }
    }

    const allProducts = await Product.find({});

    res.render("single-product", {
      cartCount,
      singleProduct: singleProduct,
      allProducts: allProducts,
    });
  } catch (error) {
    res.render("500", "Internal Server Error");
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
      } else {
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
    let cartCount = 0;
    if (userId) {
      let cart = await Cart.findOne({ userId });
      if (cart) {
        let cartProduct = cart.product;
        cartCount = cartProduct.length;
      }
    }
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
    res.render("cart", { data, userdata, totalPrice, cartCount });
  } catch (error) {
    console.log(error);
  }
};
const getCartTotal = async (userid) => {
  try {
    const userId = userid;
    const userdata = await User.findOne({
      _id: userId,
    });

    let cartCount = 0;
    if (userId) {
      let cart = await Cart.findOne({ userId });
      if (cart) {
        let cartProduct = cart.product;
        cartCount = cartProduct.length;
      }
    }
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
    return totalPrice;
  } catch (error) {
    console.log(error);
  }
};

const displayProduct = async (req, res) => {
  try {
    const category = await Category.find({});
    const page = parseInt(req.query.page) || 1;
    const limit = 6;
    const skip = (page - 1) * limit;
    const searchQuery = req.body.search || "";

    const searchFilter = {
      $and: [
        { is_listed: true },
        {
          $or: [{ name: { $regex: new RegExp(searchQuery, "i") } }],
        },
      ],
    };
    const totalProducts = await Product.countDocuments(searchFilter);
    const totalPages = Math.ceil(totalProducts / limit);
    const products = await Product.find(searchFilter)
      .skip(skip)
      .limit(limit)
      .populate("category");
    const paginationLinks = [];
    for (let i = 1; i <= totalPages; i++) {
      const link = `?page=${i}&search=${searchQuery}`;
      paginationLinks.push(link);
    }
console.log(products)
    res.render("shop", {
      allcategory: category,
      allProducts: products,
      currentPage: page,
      totalPages,
      paginationLinks,
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

const sortProducts = async (req, res) => {
  try {
    const sortOption = req.query.sort || "lowToHigh";
    let allProducts = await Product.find().sort({ price: -1 });
    console.log(allProducts)
    const allcategory = await Category.find({});
    console.log(allcategory)

    res.render("shop", { allProducts, allcategory });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};



const loadCheckout = async (req, res) => {
  try {
    const userId = req.session.user_id;

    const user = await User.findOne({ _id: userId });
    const cart = await Cart.findOne({ userId: userId })
      .populate("product.productId")
      .exec();

    if (!cart || !cart.product) {
      return res.render("404");
    }
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
      userId: req.session.user_id,
      name: req.body.name,
      email: req.body.email,
      address: req.body.address,
      phone: req.body.phone,
      paymentMethod: req.body.payment,
      status: req.body.status,
      dateOrdered: req.body.dateOrdered,
      deliveredDate: req.body.deliveredDate,
      orderItems: cart.product,
      grandTotal: grandTotal,
    });

    await newOrder.save();
    const orderId = newOrder._id;

    // const deleteCart = await Cart.deleteOne({ userId:req.session.user_id});

    // res.redirect(`/viewOrderDetails?id=${orderId}`);
    res.send("sucess");
  } catch (error) {
    res.render("500", "Internal Server Error");
  }
};
const userProfile = async (req, res) => {
  try {
    const userId = req.session.user_id;
    console.log(userId);

    const userData = await User.findOne({ _id: userId });

    res.render("profile");
  } catch (error) {
    console.log(error.message);
  }
};
const profileAddressAdd = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const user = await User.findOne({ _id: userId });
    console.log(
      req.body.name,
      req.body.mobileNumber,
      req.body.address,
      req.body.locality,
      req.body.city,
      req.body.pincode,
      req.body.state,
      "hiiii"
    );

    user.addresses.push({
      name: req.body.name,
      mobileNumber: req.body.mobileNumber,
      address: req.body.address,
      locality: req.body.locality,
      city: req.body.city,
      pincode: req.body.pincode,
      state: req.body.state,
    });

    await user.save();
    res.redirect("/profile");
  } catch (error) {
    console.log(error);

    res.status(500).json({ error: "Failed to add address." });
  }
};

const profileEdit = async (req, res) => {
  try {
    const address1 = req.query.address;
    const parts = address1.split(",");
    const [
      name,
      mobileNumber,
      addressLine1,
      locality,
      city,
      state,
      pincode,
      _id,
    ] = parts;
    const nameParts = name.split(" ");
    const Name = nameParts[0];

    if (address1) {
      res.render("edit-address", {
        _id: _id,
        name: name,
        address1: addressLine1,
        locality: locality,
        city: city,
        state: state,
        pincode: pincode,
        mobileNumber: mobileNumber,
      });
    } else {
      res.redirect("/checkOut");
    }
  } catch (error) {
    console.log("error/:500");
  }
};

const editAddress = async (req, res) => {
  try {
    const userid = req.session.user_id;
    const addressIdToEdit = req.body.addressId;

    const userData = {
      name: req.body.name,
      address: req.body.address,
      locality: req.body.locality,
      city: req.body.city,
      state: req.body.state,
      mobileNumber: req.body.mobileNumber,
      pincode: req.body.pincode,
    };
    const user = await User.findOne({ _id: userid });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const indexToEdit = user.addresses.findIndex(
      (address) => address._id.toString() === addressIdToEdit
    );
    if (indexToEdit === -1) {
      return res
        .status(404)
        .json({ error: "Address not found in user addresses" });
    }
    user.addresses[indexToEdit] = userData;
    await user.save();
    res.redirect("/checkOut");
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const deleteAddress = async (req, res) => {
  try {
    const userid = req.session.user_id;
    const addressIdToDelete = req.query.address;
    const regex = /\b[0-9a-f]{24}\b/;
    const match = addressIdToDelete.match(regex);
    if (!match) {
      return res.status(400).json({ error: "Invalid address ID" });
    }
    const extractedValue = match[0];
    const addressId = extractedValue;
    const user = await User.findOne({ _id: userid });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    user.addresses = user.addresses.filter(
      (address) => address._id.toString() !== addressId
    );
    await user.save();
    res.redirect("/checkOut");
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const saveAddress = (req, res) => {
  req.session.userAddress = req.query.address;
  res.json({ message: "address saved" });
};

const changePassword = async (req, res) => {
  try {
    const { oldpassword, newpassword } = req.body;
    const userId = req.session.user_id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    if (!(await bcrypt.compare(oldpassword, user.password))) {
      return res.status(401).json({ error: "Invalid old password" });
    }
    const hashedNewPassword = await bcrypt.hash(newpassword, 10);
    user.password = hashedNewPassword;
    await user.save();

    res.redirect("/profile");
  } catch (error) {
    req.flash("error", "Failed to change password");
    res.redirect("/profile", { messages });
  }
};

// const loadOrder = async (req, res) => {
//   try {
//     const userId = req.session.user_id;

//     const cart = await Cart.findOne({ userId: userId }).populate(
//       "product.productId"
//     );
//     res.render("checkOut", { cart });
//   } catch (error) {
//     console.log(error.message);
//   }
// };

const loadMyOrder = async (req, res) => {
  try {
    const userId = req.session.user_id;
    console.log(userId, "");
    const orders = await Order.find({ userId: req.session.user_id })
      .populate("orderItems.productId")
      .sort({ dateOrdered: -1 })
      .exec();

    res.render("myOrder", { orders });
  } catch (error) {
    res.render("500");
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
  // searchCategories,
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
  sortProducts,
 
  loadCheckout,
  Checkout,
  getCartTotal,
  userProfile,
  profileAddressAdd,
  profileEdit,
  editAddress,
  deleteAddress,
  saveAddress,
  changePassword,
  // loadOrder,
  loadMyOrder,
  
};
