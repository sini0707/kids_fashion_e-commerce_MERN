const couponHelper = require('../helpers/couponHelper')
const orderHelper = require('../helpers/orderHelper.js')
const {getCartTotal}=require('../controllers/userController')
const User = require("../models/userModel");

const easyinvoice=require('easyinvoice')
const customTemplate=require('../models/invoice')
const Order = require('../models/orderModel');

const verifyCoupon = (req, res) => {
    const couponCode =req.params.couponCode;
    const userId = req.session.user_id;
    console.log(couponCode,userId)
    couponHelper.verifyCoupon(userId, couponCode).then((response) => {
        res.send(response)
    })
  }
  
  const applyCoupon =  async (req, res) => {
    const couponCode = req.params.couponCode
    const userId = req.session.user_id;
    const total = await getCartTotal(userId) 
    console.log(total,'hhh')
    couponHelper.applyCoupon(couponCode, total).then((response) => {
      console.log(response.total,'kjjj')
        res.send(response)
    }) 
  }
         

  const cancelOrder = async(req,res)=>{
    const ProductId = req.body.prdctId
    const orderId = req.body.orderId
    const status = req.body.status
    const quantity=req.body.qty
    const userId=req.session.userId
    console.log(status,'KI');
    orderHelper.cancelOrder(orderId, status,ProductId,quantity,userId).then((response) => {
      console.log(response,'hjiiidxvc');
      res.send(response);
    });
  }
  
  const returnOrder = async (req, res) => {
    try {
      const orderId = req.body.orderId;
      const orderData = await Order.findOne({ _id: orderId });
  
      if (!orderData) {
        return res.status(404).json({ error: 'Order not found' });
      }
  
      orderData.status = "return requested";
      orderData.markModified('orderItems');
  
      const savedStatus = await orderData.save();
  
      console.log(savedStatus, 'Order status updated successfully');

      if(orderData.paymentMethod==="online"){
        if(userData.cashback!==undefined && orderData.orderItems.length==1){
            const updatedUser = await User.findByIdAndUpdate({_id: Id}, {$inc: {wallet: prdctStat.sub_total-userData.cashback}}, { new: true });
            updatedUser.cashback = null;
            await updatedUser.save();  
        }else{
            const updatedUser = await User.findByIdAndUpdate({_id: Id}, {$inc: {wallet: prdctStat.sub_total}}, { new: true });
            updatedUser.cashback = null;
            await updatedUser.save();
        }
        
    }
    res.json({message:'Return requested'})
  } catch(err){
      res.json({message:'somthing went wrong'})
  }
}

  //     res.status(200).json({ message: 'Order status updated successfully' });
  //   } catch (error) {
  //     console.error(error);
  //     res.status(500).json({ error: 'Internal server error' });
  //   }
  // };
  



  const invoice = async (req, res) => {
    try{
      let USER=await User.findById(req.session.user_id) 
      const orderId=req.params.id
      const address=req.session.userAddress 
      const orders=await Order.findOne({_id:orderId}).populate({
          path: 'orderItems.productId',
          model: 'Product'
        })
      const products=[]
    
    for(let i=0;i<orders.orderItems.length;i++){
     const productDetails= {
    
        "quantity": orders.orderItems[i].quantity,
       
        "price": orders.orderItems[i]. productId.price,
        "description":orders.orderItems[i].productId.description   
       
    }
     products.push(productDetails)
    }
    
    console.log("this is", orders, "you are looking")
      const data = {
        
        

        "client": { 

          "Name":USER.firstname + " " + USER.lastname,
          "Address":address,

      
       
          
    
          

          
        },
    
        
        "sender": {
            "company": "KidZ Fashion",
            "address": "Sample Street 123",
            "zip": "683594",
            "city": "Maradu",
            "country": "India"
        },
    
    
       
        "information": {
        
          "number": orders._id,
        
          "date": orders.dateOrdered
          ,
        
          
      },
    "products": products,
      
    "bottom-notice": "This is a computer generated invoice.It doesnt require a physical signature",
        "settings": {
            "currency": "INR", 
            "tax-notation": "gst"
           
        },
     
       
       
            customize: {
              template: btoa(customTemplate), 
            },
    };
      
       
    let file="KidZ FASHION_"+orders._id+".pdf"
    
    easyinvoice.createInvoice(data, function (result) {
     
      res.setHeader('Content-Disposition', `attachment; filename="${file}"`);
      res.setHeader('Content-Type', 'application/pdf');
    
      
      res.send(Buffer.from(result.pdf, 'base64'));
    });
    } catch (error) {
     
      console.error("An error occurred:", error);
      res.status(500).send("Internal server error");
    }
    
    }
     

  
  
  module.exports = {
    verifyCoupon,
    applyCoupon,
    cancelOrder,
    invoice,
    returnOrder

  }