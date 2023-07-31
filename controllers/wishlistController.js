const wishListHelper = require('../helpers/wishlistHelper')

const getWishList = async (req, res) => {
    let user = res.locals.user;
    // let count = await cartHelper.getCartCount(user._id);
    const wishlistCount = await wishListHelper.getWishListCount(user);
    wishListHelper.getWishListProducts(user).then((wishlistProducts) => {

      res.render("wishList", {
        user,
        // count,
        wishlistProducts,
        wishlistCount,
      });
    });
  }

  const addWishList = async (req, res) => {

    let prodId = req.body.proId;
    let userId = res.locals.userid;
    console.log(prodId,userId);
    wishListHelper.addWishList(userId, prodId).then((response) => {
    res.send(response);
    });
  }

  const removeProductWishlist = async (req, res) => {


    const userId=res.locals.userid

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