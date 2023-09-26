const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    firstname:{
        type:String,
        required:true,
    },
    lastname:{
        type:String,
        required:true,
    },
    email:{
        type:String,
        required:true

    },
    mobile:{
        type:String,
        required:true
    },
    
    password:{
        type:String,
        required:true
    },
    is_blocked:{
        type:Boolean,
        default:false,
    },


    addresses: [
        {
          name: {
            type: String,
            required: true,
          },
          mobileNumber: {
            type: String,
            required: true,
          },
          address: {
            type: String,
            required: true,
          },
          locality: {
            type: String,
            required: true,
          },
          city: {
            type: String,
            required: true,
          },
          pincode: {
            type: String,
            required: true,
          },
          state: {
            type: String,
            required: true,
          },
        },
      ],
      wallet:{
        type:Number,
        default:0
    },
    });
    
   
    // is_admin:{
    //     type:Number,
    //     required:true
    // },
    // is_varified:{
    //     type:Number,
    //     default:0
    // }
   


module.exports = mongoose.model('User',userSchema);
