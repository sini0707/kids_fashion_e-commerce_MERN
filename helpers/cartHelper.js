const cartModel = require('../models/cartModel');
const product = require('../models/productModel');




const deleteProduct =  async (data) => {
    const cartId = data.cartId;
    const proId = data.proId;
    console.log('its me data',data);
    const product = await product.findOne({_id:proId})
    const cart = await cartModel.findOne({ _id: cartId, "product.productId": data.proId });
    
    return new Promise((resolve, reject) => {
      try {
        
        const product= cart. product.find(item => item.productId.equals(data.proId));
        const quantityToRemove =  product.quantity;
        cart.updateOne( 
          { _id: cartId ," product.productId":proId},
          { $inc: {cartTotal: product.price* quantityToRemove * -1 },
          $pull: {  product: { productId: proId } },
           }
        ).then(() => {
          resolve({ status: true });
        });
      } catch (error) { 
        throw error;
      }
    });
  }

  





  module.exports ={


    deleteProduct,
    // updateQuantity
  }