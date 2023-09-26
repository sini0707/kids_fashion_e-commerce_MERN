const mongoose = require('mongoose');

// Extend the existing cartScheme
const cartScheme = new mongoose.Schema({
  // Include the existing properties from the cartScheme
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',
  },
  product: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
    },
    quantity:{
      type:Number,
      required:true
    },
    price: {
      type: Number,
      required: true,
    },
   
    
  }],
  grandTotal: {
    type: Number,
    default: 0,
  },
  subTotal:{
    type: Number,
    default: 0,
  }
  

  // Add dress-specific properties
  // size: {
  //   type: String,
  //   required: true,
  // },
  // color: {
  //   type: String,
  //   required: true,
  // },
});

// Create the DressCart model using the extended schema
const DressCart = mongoose.model('Cart', cartScheme);

module.exports = DressCart;

