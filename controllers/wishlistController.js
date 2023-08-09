const wishListHelper = require('../helpers/wishlistHelper')

const getWishList = async (req, res) => {
  const userId = req.session.user_id;
  console.log(userId)
  
    // console.log(user)
    // let count = await cartHelper.getCartCount(user._id);
    const wishlistCount = await wishListHelper.getWishListCount(userId);


    wishListHelper.getWishListProducts(userId)
    .then((wishlistProducts) => {
      console.log(wishlistProducts,'iiiiiiiiiiiii')
      // console.log(test,'iiiiiiiiiiiii')

      res.render("wishList", {
        userId,
        // count,
        wishlistProducts,
        wishlistCount,
      });
    });
  }

  const addWishList = async (req, res) => {

    let prodId = req.query.id;
    console.log(prodId)
    const userId = req.session.user_id;
  
    console.log(prodId,userId);
    wishListHelper.addWishList(userId, prodId).then((response) => {
    res.send(response);
    });
  }

  const removeProductWishlist = async (req, res) => {


    const userId = req.session.user_id;
  
    const proId = req.body.proId;

    wishListHelper
      .removeProductWishlist(proId, userId)
      .then((response) => {
        res.send(response);
      });
  }

  module.exports = {
    getWishList,
    addWishList,
    removeProductWishlist


  }