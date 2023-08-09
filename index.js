const mongoose=require("mongoose")
const path=require("path");

const express =require("express"); 
const session=require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const app=express();
mongoose.connect("mongodb://127.0.0.1:27017/KidzFashion");


const dotenv=require('dotenv');
dotenv.config({path:"./.env"})

const userRoute=require('./routes/userRoute');
//global middlewares
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());

const store = new MongoDBStore({
  uri: 'mongodb://127.0.0.1:27017/KidzFashion',
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




app.listen(process.env.PORT,()=>{
    console.log(`server started at http://localhost:${process.env.PORT}`);
})  
