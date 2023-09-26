const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  name: {
    type: String,
  },
  phone: {
    type: Number,
  },
  address: {
    type: String,
  },

  orderItems: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
      quantity: {
        type: Number,
        required: true,
      },
      total: {
        type: Number,
        required: true,
      },
    },
  ],
  grandTotal: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    default: "pending",
  },
  paymentMethod: {
    type: String,
    required: false,
  },
  dateOrdered: {
    type: Date,
    default: Date.now(),
  }
  
});

module.exports = mongoose.model("Order", orderSchema);
