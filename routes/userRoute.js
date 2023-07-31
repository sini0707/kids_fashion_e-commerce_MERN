const express= require("express")
const user_route=express();
const bodyParser= require('body-parser');
const session=require('express-session');
user_route.use(bodyParser.json());
user_route.use(bodyParser.urlencoded({extended:true}))
const path=require("path");
const jimp = require('jimp');
const wishlistController = require('../controllers/wishlistController');
const cartController = require('../controllers/cartController');


const nocache=require('nocache');
user_route.use(nocache())
const config=require('../config/config');
const auth=require('../middleware/auth');



user_route.set('view engine','ejs');
user_route.set('views','./views/users');



const userController=require('../controllers/userController');

user_route.use(session({
    secret:config.sessionSecret,
    saveUninitialized:true,
    resave:false
}))

user_route.get('/signup',auth.isLogout,userController.loadRegister);
user_route.post('/signup',userController.insertUser);
user_route.get('/',auth.isLogout,userController.loginLoad);
user_route.get('/login',auth.isLogout,userController.loginLoad);
user_route.post('/login',userController.verifyLogin);
user_route.get('/home',userController.loadHome);
user_route.get('/verifyOtp',auth.isLogout,userController.loadVerifyOTP);
user_route.post('/verifyOtp',userController.verifyOtp);
user_route.get('/logout',auth.isLogin,userController.userLogout);



user_route.get('/forgetPassword',userController.loadForgotPassword);
user_route.post('/forgetPassword',userController.forgotPasswordOtp);
user_route.post('/sendOtp',userController.forgotPasswordOtp );
user_route.post('/forgotOtpVerify',userController.forgotResendOtp);
user_route.post('/resetPassword',userController.resetPassword);
user_route.post('/verifyForgetOTP',userController.verifyForgetOTP );

user_route.get('/resendOtp',userController.resendOtp);
user_route.get('/shop',auth.isLogin,userController.getShop);
user_route.get('/getCategory', auth.isLogin,userController.getCategory);
user_route.get('/single-product',userController.singleProductLoad);


user_route.post('/addtocart',userController.addToCart);
user_route.get('/addtocart',userController.addToCart);
user_route.get('/cart',userController.getCart);
// user_route.delete("/delete_item",cartController.deleteProduct);
user_route.delete("/delete_item",cartController.deleteItem);


user_route.post('/search',userController.displayProduct);
user_route.post('/add-to-wishlist',wishlistController.addWishList);
user_route.get('/wishList',wishlistController.getWishList);
user_route.delete('/remove-product-wishlist',wishlistController.removeProductWishlist);

user_route.get('/categoryShop',userController.categoryPage);



module.exports=user_route;