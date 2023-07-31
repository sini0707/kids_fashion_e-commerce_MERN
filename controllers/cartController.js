
const cartHelper = require('../helpers/cartHelper')
const Cart = require('../models/cartModel');

// const deleteProduct = async(req, res) => {
//     console.log('?//////')
//     const userId=req.session.user_id;
//     const {productId}=req.body
    
const deleteItem = async (req, res) => {

    const userId = req.session.user_id;
    const { productId } = req.body;
    
    Cart.findOneAndUpdate(
      { userId: userId },
      { $pull: { product: { productId: productId } } },
      { new: true }
    )
      .then((updatedCart) => {
        if (!updatedCart) {
          return;
        }
        if(updatedCart){
            return res.json({cartupdated:true})
        }
        // Send a response or perform any additional actions here
      })
      .catch((error) => {
        console.error('Error:', error);
        // Handle the error or send an error response
      });
    
}

module.exports = {
  deleteItem,
};
