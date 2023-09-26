const cart = require('../model/cartmodel')
const User = require('../model/usermodel')
const product = require('../model/productmodel')
const useraddress = require('../model/addressmodel')
const { Schema } = require('mongoose')
const { json } = require('body-parser')
const Razorpay = require('razorpay');
const order =require('../model/ordersmodel')
const PDFDocument = require('pdfkit');
var instance = new Razorpay({
  key_id: process.env.key_id,
  key_secret: process.env.key_secret,
});


const placeorder = async (data, user) => {
  try {
    const productdetials = await cart.aggregate([
      {
        $match: {
          user: user._id.toString()
        },
      },
      {
        $unwind: '$cartitems'
      },
      {
        $project: {
          item: "$cartitems.product",
          quantity: "$cartitems.quantity",
        },
      },
      {
        $lookup: {
          from: "poducts",
          localField: "item",
          foreignField: "_id",
          as: "productDetials",
        },
      },
      {
        $unwind: "$productDetials",


      },
      {
        $project: {
          productId: "productDetials._id",
          productName: "$productDetials.name",
          produtPrice: "$productDetials.price",
          category: "$productDetials.category",
          image: "$productDetials.image"
        },
      },


    ]);

  } catch (error) {
    console.log(error);
  }

}
const generateRazorpay = async (orderid, total) => {
  try {

    var options = {
      amount: parseInt(total * 100), // amount in the smallest currency unit
      currency: "INR",
      receipt: orderid.toString(),

    };
    return new Promise((resolve, reject) => {
      instance.orders.create(options, function (err, order) {
        if (err) {

          reject(err)
        } else {

          resolve(order)
        }
      })
    })
  } catch (error) {
    console.log(error);
    return error
  }
}
const crypto = require("crypto");
const verifypayment = async (detials) => {
  try {
    return new Promise((resolve, reject) => {
      let hmac = crypto.createHmac("sha256", process.env.key_secret);
      const orderid = detials.razorpay_order_id
      const paymentid = detials.razorpay_payment_id
      const signature = detials.razorpay_signature
      hmac.update(orderid + "|" + paymentid);
      hmac = hmac.digest("hex")

    

      if (hmac == signature) {
        resolve();
      } else {
        reject();
      }

    })

  } catch (error) {
    console.log(error);
    return error

    

  }
}
const invoicedetials= async(orderid)=>{
  try{
 let  orderdetials= await order.findOne({_id:orderid}).populate('items.product')
 if(orderdetials){
  for (const item of orderdetials.items) {
}
  return {status:true,orderdetials}
 }else{
  return{status:false}
 }
  }catch(error){
    console.log(error)
    return error
  }
}

function generateInvoice (orderdetials,res){
  const doc = new PDFDocument({ margin: 50 });
	generateInvoiceHeader(doc);
	generateCustomerInformation(doc, orderdetials)
	const tableTop = generateInvoiceTable(doc, orderdetials);
	generateSubtotal(doc, orderdetials, tableTop)
	res.setHeader('Content-Type', 'application/pdf');
	res.setHeader('Content-Disposition', 'attachment; filename=order-Invoice.pdf');
  
	doc.pipe(res);
	doc.end();

}
function generateInvoiceHeader(doc) {
	doc
	  // .image('public/user/assets/imgs/theme/redLogo.png', 50, 57, { width: 115, height:30 })
	  .fillColor('#444444')
	  .fontSize(20)
	  .fontSize(10)
	  .text(' Timezy, D N Marg', 200, 65, { align: 'right' })
	  .text('Majestic , Bengaluru, India', 200, 80, { align: 'right' })
	  .moveDown();
  }
  function formatDate(date) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString(undefined, options);
}
  function generateCustomerInformation(doc, invoice) {
    const shipping = invoice.orderdetials;
    
    doc
      .text(`Invoice Number: 1509`, 50, 200)
      .text(`Invoice Date: ${formatDate(new Date())}`, 50, 215)
      .text('Ship To:', 250, 200)
      .text(shipping.address.name, 250, 215)
      .text(shipping.address.adress, 250, 230)
      .text(`${shipping.address.town}, ${shipping.address.state}, ${shipping.address.pincode}`,
      250,
      245,
      )
      .text(shipping.mobile, 250, 260)
     
      .moveDown();
    }

    function generateInvoiceTable(doc, orderDetail) {
      let i;
      const tableTop = 330;
      doc.font('Helvetica-Bold');
      generateTableRow(doc, tableTop, 'Date', 'Product', 'Quantity', 'Price', 'Total');
      doc.font('Helvetica');
      
      const orderData = orderDetail.orderdetials;
      const items = orderData.items;
      for (i = 0; i < items.length; i++) {
        let item = items[i];
        const position = tableTop + (i + 1) * 30;
        generateInvoiceTableRow(
        doc,
        position,
        item,
        orderData
        );
      }
      return tableTop;
      }
      function generateInvoiceTableRow(doc, y, item, orderData) {
        const product = item.product.name;
        const quantity = item.quantity;
        let  price =0
        if(item.product.discountpercentage&&item.product.offervalidity>Date.now()){
          price = Math.round((item.product.price*(100-item.product.discountpercentage))/100)
        }else{
          price= item.product.price
        }
        doc
          .fontSize(10)
          .text(formatDate(orderData.createdAt), 50, y)
          .text(product, 150, y, { width: 170, align: 'left' })
          .text(quantity.toString(), 350, y, { width: 90, align: 'centre' })
          .text(price, 435, y, { width: 90, align: 'centre' })
          .text((quantity * price).toString(), 525, y, { width: 90, align: 'centre' })
        doc.moveDown(0.5);
        }

        function generateTableRow(doc, y, date, product, quantity, price, total) {
          doc
              .fontSize(10)
              .text(date, 50, y)
              .text(product, 150, y)
              .text(quantity, 280, y, { width: 90, align: 'right' })
              .text(price, 370, y, { width: 90, align: 'right' })
              .text(total, 0, y, { align: 'right' });
      }


        function generateSubtotal(doc, orderDetail, tableTop) {
          const subtotal = orderDetail.orderdetials.total

          const items = orderDetail.orderdetials.items;
          
          // Display the subtotal row
          const ySubtotal = tableTop + (items.length + 1) * 30; // Adjust the vertical position for the subtotal row
          doc
            .fontSize(10)
            .text('Subtotal    :', 435, ySubtotal)
            .text(subtotal.toString(), 495, ySubtotal, { width: 90, align: 'center' });
          
          }
module.exports = { generateRazorpay, verifypayment,invoicedetials, generateInvoice }