const cartHelper = require("../helpers/cartHelper");
const Cart = require("../models/cartModel");
const Product = require("../models/productModel");

// const deleteProduct = async(req, res) => {
//     console.log('?//////')
//     const userId=req.session.user_id;
//     const {productId}=req.body

const deleteItem = async (req, res) => {
  const userId = req.session.user_id;
  const { productId } = req.body;

  const cartData = await Cart.findOne({
    userId: userId,
    "product.productId": productId, // Change "product" to "products"
  });

  if (!cartData) {
    return res.status(404).json({ error: "Cart not found" });
  }

  const product = cartData.product.find(
    (item) => item.productId.toString() === productId
  );
  const price = product.price;

  Cart.findOneAndUpdate(
    { userId: userId },
    {
      $pull: { product: { productId: productId } },
      $set: { grandTotal: cartData.grandTotal - price },
    },
    { new: true }
  )
    .then((updatedCart) => {
      if (!updatedCart) {
        return;
      }
      if (updatedCart) {
        return res.json({ cartupdated: true });
      }
      // Send a response or perform any additional actions here
    })
    .catch((error) => {
      console.error("Error:", error);
      // Handle the error or send an error response
    });
};

// Function to update the quantity in the cart
const updateQuantity = async (req, res, next) => {
  try {
    const { productId, quantity } = req.body;
    const productQuantity = parseInt(quantity);
    const userId = req.session.user_id;

    const products = await Product.findOne({ _id: productId });

    const maxQuantity = products.stock;
    console.log(productQuantity, "jhhhhh");
    if (productQuantity > maxQuantity) {
      console.log("hi");
      return res.json({ success: false });
    }

    const quantityUpdate = await Cart.findOneAndUpdate(
      { userId, "product.productId": productId },
      { $set: { "product.$.quantity": productQuantity } },
      { new: true }
    ).then((i) => {
      if (i) {
        console.log(i);
        res.status(200).json({
          success: true,
        });
      } else {
        console.log("Cart or product not found.");
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
//

module.exports = {
  deleteItem,
  updateQuantity,
};
