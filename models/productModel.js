const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,  
  },
  images: {
    type: Array,
    required:true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
  },
  price:{
    type:Number,
    required:true
  }, 
//  size:{
//     type:String,
//     required:true
//   },
//   productOffer:{
//     type:Number,
//    default:0
   
//   }, 
//   offerPrice:{
//     type:Number,
    
//   },

//   stock: {
//     type: Number,
//     default: 1,
//     required:true
//   },
  is_listed:{

    type:Boolean,
    default:true

  }
}); 

const Product = mongoose.model('Product', productSchema);

module.exports = Product;

