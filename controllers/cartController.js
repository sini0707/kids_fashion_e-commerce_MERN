
const cartHelper = require('../helpers/cartHelper')
const Cart = require('../models/cartModel');
const Product = require('../models/productModel');

// const deleteProduct = async(req, res) => {
//     console.log('?//////')
//     const userId=req.session.user_id;
//     const {productId}=req.body


const deleteItem = async (req, res) => {

    const userId = req.session.user_id;
    const { productId } =  req.body;
    
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


// Function to update the quantity in the cart
const updateQuantity = async (req, res, next) => {
  try {
    const { productId, quantity } = req.body;
    const productQuantity = parseInt(quantity);
    const userId = req.session.user_id;
   
    const quantityUpdate=await Cart.findOneAndUpdate(
      { userId, 'product.productId': productId },
      { $set: { 'product.$.quantity': productQuantity } },
      { new: true }
    )
      .then(i => {
        if (i) {
          console.log(i);
          res.status(200).json({
            success: true
          });
        } else {
          console.log('Cart or product not found.');
        }
      })

    } catch (err) {
      res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  };
      //    

//  if (quantityUpdate.nModified === 1) {
//       res.send({ redirect: '/cart' }); // Success: Redirect to the cart page or another desired location.
//     } else {
//       res.sendStatus(404); // Not Found: The product or user was not found in the cart.
//     }
//   } 
//   catch (error) {
//     console.error('Failed to update quantity:', error);
//     res.status(500).send('An error occurred while updating the quantity.'); // Server Error: Something went wrong during the update process.
//   }
// };


    // Find the product based on proId to get its price
    // const product = await Product.findOne({ _id: proId });

    // // if (!product) {
    // //   return res.status(404).json({ status: false, message: 'Product not found!' });
    // }

  //   if (count === -1 && product.quantity === 1) {
  //     // If count is -1 and current quantity is 1, remove the product from the cart
  //     Cart.findOneAndUpdate(
  //       { _id: cartId, "product.productId": proId },
  //       {
  //         $pull: { product: { productId: proId } },
  //         $inc: { grandTotal: -product.price }
  //       },
  //       { new: true }
  //     )
  //       .then(() => {
  //         return res.json({ status: true, message: 'Product removed from the cart!' });
  //       })
  //       .catch((error) => {
  //         console.log(error);
  //         return res.status(500).json({ status: false, message: 'Something went wrong!' });
  //       });
  //   } else {
  //     // If count is not -1, update the quantity and total price of the product in the cart
  //     Cart.updateOne(
  //       { _id: cartId, "product.productId": proId },
  //       {
  //         $inc: {
  //           "product.$.quantity": count,
  //           "product.$.total": product.price * count,
  //           grandTotal: product.price * count
  //         }
  //       }
  //     )
  //       .then(() => {
  //         return res.json({ status: true, message: 'Quantity updated successfully!' });
  //       })
  //       .catch((error) => {
  //         console.log(error);
  //         return res.status(500).json({ status: false, message: 'Something went wrong!' });
  //       });
  //   }
  // } catch (error) {
  //   console.log(error);
  //   return res.status(500).json({ status: false, message: 'Something went wrong!' });
  // }
// };



  


module.exports = {
   
  deleteItem,
  updateQuantity
};
