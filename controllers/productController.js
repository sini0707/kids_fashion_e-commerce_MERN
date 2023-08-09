const path = require("path");
const mongoose = require("mongoose");
const Product = require("../models/productModel");
const Category = require("../models/categoryModel");

///load product list

const loadProductList = async (req, res) => {
  try {
    const products = await Product.find({}).populate("category");
    res.render("productList", { products: products });
  } catch (error) {
    console.log(error.message);
  }
};

//load add product

const loadProducts = async (req, res) => {
  try {
    let categories = await Category.find({});

    res.render("addProduct", { category: categories });
  } catch (error) {
    console.log(error.message);
  }
};

///sunmit add product

const createProduct = async (req, res) => {
  const name = req.body.name;
  const description = req.body.description;

  const category = req.body.category;

  const price = req.body.price;

  const filesArray = Object.values(req.files).flat();
  // console.log(filesArray);    
  const images = filesArray.map((file) => file.filename);
  let categories = await Category.find({});

  const newProduct = new Product({
    name,
    description,
    images,
    category,
    price,
  });

  newProduct
    .save()
    .then(() => {
      // res.redirect("/admin/addProduct");
      res.render("addProduct", { message:"product added succesfully",category: categories });
    })
    .catch((err) => {
      console.error("Error adding product:", err);
      res.status(500).send("Error adding product to the database");
    });
};

////editProductList

const editProductList = async (req, res) => {
  try {
    console.log("test");

    const id = req.query.id;
    const productData = await Product.find({ _id: id });
    const category = productData[0].category;
    const productCategory = await Category.find({ _id: category });
    const allCategory = await Category.find();

    res.render("editProductList1", {
      productData,
      productCategory,
      allCategory,
    });
  } catch (error) {
    console.log(error.message);
  }
};

///update product list

const updateProductList = async (req, res) => {
  try {
    console.log("inside update list");
    console.log(req.body);
    const id = req.body.id;
    const name = req.body.name;
    const description = req.body.description;
    const price = req.body.price;
    const category = req.body.category;
    const status = req.body.status === "listed";
    const filesArray = Object.values(req.files).flat();
    const images = filesArray.map((file) => file.filename);
    console.log("me name");
    // Find the existing product data
    const productData = await Product.findById(id);

    // Check if new images are provided
    const updatedImages = images.length > 0 ? images : productData.images;
    console.log(updatedImages);

    const update = await Product.updateOne(
      { _id: id },
      {
        $set: {
          name: name,
          description: description,
          price: price,
          category: category,
          is_listed: status,
          images: updatedImages,
        },
      }
    );
    const updatedProduct = await productData.save();
    if (updatedProduct) {
      res.redirect("/admin/productList");
    } else {
      res.redirect("/admin/errorPage");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const deleteProduct = async (req, res) => {
  try {
    const id = req.query.id;

    const product = await Product.findByIdAndDelete(id);

    res.redirect("/admin/productList");
  } catch (error) {
    console.log(error.message);
  }
};



module.exports = {
  loadProductList,
  loadProducts,
  createProduct,
  editProductList,
  updateProductList,
  deleteProduct,
  
};
