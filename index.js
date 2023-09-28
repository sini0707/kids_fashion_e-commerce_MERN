const mongoose=require("mongoose")
const path=require("path");

const express =require("express"); 
const session=require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
// const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const app=express();
mongoose.connect("mongodb+srv://sinij7:RBaoo2YFIvTLxQl5@cluster0.zcot8rt.mongodb.net/?retryWrites=true&w=majority");


var easyinvoice = require('easyinvoice');
var fs = require('fs');

var data = {};


const dotenv=require('dotenv');
//dotenv.config({path:"./.env"})
   


const userRoute=require('./routes/userRoute');
//global middlewares
+

app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());       

const store = new MongoDBStore({
  uri: 'mongodb+srv://sinij7:RBaoo2YFIvTLxQl5@cluster0.zcot8rt.mongodb.net/?retryWrites=true&w=majority',
  collection: 'sessions'
});
app.use(
  session({
    store,
    secret:'my-secret',   
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
    },
  })
);
//view engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use('/',userRoute);
// //for admin route
 const adminRoute=require('./routes/adminRoute');
 app.use('/admin',adminRoute);
 
 const errorRoute=require('./routes/errorRoute');
 app.use(errorRoute)
//  app.listen(process.env.PORT,()=>{
//   console.log('server started at http://localhost:${process.env.PORT}');
//  });



 easyinvoice.createInvoice(data, function (result) {

  fs.writeFileSync("invoice.pdf", result.pdf, 'base64');
});




app.listen(process.env.PORT,()=>{
    console.log(`server started at http://localhost:${process.env.PORT}`);
})  
