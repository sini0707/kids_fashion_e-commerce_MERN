const express = require('express');
const admin_route = express();

const {upload,multipleUpload} = require('../multer/multer');


// const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//       cb(null, path.join(__dirname, "../public/product-images"));
//     },
//     filename: function (req, file, cb) {
//       cb(null, Date.now() + "-" + file.originalname);
//     },
//   });
//   const upload = multer({ storage: storage });
//   const multipleUpload = upload.fields([
//     { name: 'image1', maxCount: 1 },
//     { name: 'image2', maxCount: 1 },
//     { name: 'image3', maxCount: 1 }
//   ]);
  
const session = require('express-session');
const config = require('../config/config');
// admin_route.use(session({
//     secret: config.sessionSecret,
//     resave: false, // or true, depending on your use case
//     saveUninitialized: false // or true, depending on your use case
//   }));


const bodyParser = require('body-parser');
admin_route.use(bodyParser.json());
admin_route.use(bodyParser.urlencoded({extended:true}));

admin_route.set('view engine', 'ejs');
admin_route.set('views', './views/admin');


const path = require('path');

admin_route.use(express.static('public'));
 const auth= require('../middleware/adminAuth');

const adminController = require('../controllers/adminController');
const categoryController = require('../controllers/categoryController');
const productController = require("../controllers/productController");



admin_route.get('/adminLogin',adminController.loadLogin);
admin_route.post('/adminLogin',adminController.verifyLogin); 
admin_route.get('/dashboard',adminController.loadDashboard);


admin_route.get('/categories',categoryController.loadCategory);
admin_route.post('/addCategory',categoryController.createCategory);
admin_route.get('/addCategory',categoryController.showCategory);
admin_route.get('/editCategory',categoryController.loadUpdateCategory);
admin_route.post('/editCategory',categoryController.updateCategory);
admin_route.get('/changeStatus',categoryController.changeStatus);

admin_route.get('/addProduct',productController.loadProducts);
admin_route.post(
    "/addProduct",
    upload.array('images', 3),
    productController.createProduct
  )
 admin_route.get('/productList',productController.loadProductList); 
//  admin_route.get('editProductList',productController.editProductList);
 

 admin_route.get('/loadUsers',adminController.loadUsers);
//  admin_route.get('/deleteUser',adminController.deleteUser);
 admin_route.get('/blockUser',adminController.blockUser);
 admin_route.get('/unblockUser',adminController.unBlockUser);
 admin_route.get('/editUser',adminController.loadEditUser);
 admin_route.post('/editUser',adminController.loadEditUser);
 admin_route.get('/user1',adminController.loadUsers);

 admin_route.get('/editProductList1', productController.editProductList);
admin_route.post('/editProductList1', multipleUpload, productController.updateProductList);
// admin_route.get('/deleteProduct',productController.deleteProduct);

admin_route.get('/UnList', productController.UnListProduct);
admin_route.get('/AddList', productController.AddListProduct);
admin_route.get('/ordersList',adminController.ordersLoad);



  admin_route.get('/logout',adminController.logout);

  





module.exports=admin_route;