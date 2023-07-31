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
    }
    // is_admin:{
    //     type:Number,
    //     required:true
    // },
    // is_varified:{
    //     type:Number,
    //     default:0
    // }
   
});

module.exports = mongoose.model('User',userSchema);
