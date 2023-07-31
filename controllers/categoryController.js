const path=require("path");
const multer = require("multer");
const Category=require("../models/categoryModel");

//load category

const loadCategory = async (req, res) => {
    try {
      const categories = await Category.find();
  
      res.render("categories", { categories });
    } catch (error) {
      console.log(error);
    }
  };

  //Create/add  category

const createCategory = async (req, res) => {
    try {
  
      const name = req.body.name;
      const existingCategory = await Category.findOne({ name: name.toLowerCase() });
      console.log(existingCategory);
      if (existingCategory) {
        const categories = await Category.find();
         res.render("categories",{message:"name already exist",categories})
    
    } 
    
    else{
      const category = new Category({
        name: req.body.name.toLowerCase(),
        description: req.body.description,
      });
      const savedCategory = await category.save();
      res.redirect("/admin/categories");
    }
  }catch (error) {
      console.log(error.message);
    }
  };

  const showCategory=async(req,res)=>{
    try {
      res.redirect("/admin/loadCategory");
      
    } catch (error) {
  
      console.log(error.messgae);
      
    }
  };
  const loadUpdateCategory = async (req, res) => {
    try {
      const id = req.query.id
  
      const Categorydata = await Category.findById({ _id: id })
      console.log(Categorydata);
  
      res.render('editCategories', { category: Categorydata })
    } catch (error) {
      console.log(error.message)
    }
  };

  // Update a category
  // async function updateCategory(req, res) {

  //   try {
  //     const categoryId = req.body.id;
  //     const existingCategory = await Category.findOne({ _id:id.toLowerCase() });
  //     console.log(existingCategory);
  //     if (existingCategory) {
  //       const categories = await Category.find();
  //        return res.render("categories",{message:"name already exist",categories})
  //   } 
    
  //   // else{
  //   //   const category = new Category({
  //   //     name: req.body.name.toLowerCase(),
  //   //     description: req.body.description,
  //   //   });
  //   else{
  //     const updatedCategory = await Category.findByIdAndUpdate({ _id: categoryId }, { $set: { name: req.body.category, description: req.body.description } });
  //     const savedCategory = await category.save();
  //     res.redirect("/admin/categories");
  //   }
      
  //   } catch (error) {
  //     console.log(error.message)
  //     res.status(500).json({ error: 'Failed to update category' });
  //   }
  // };
  async function updateCategory(req, res) {

    try {
    
      const categoryName = req.body.category;
      const categoryId = req.body.id;
      const existingCategory = await Category.findOne({_id:categoryId});
      console.log(existingCategory);
      
      
      const dup = await Category.find({name:categoryName,
        _id: { $ne: req.body.id }
      });


    if (dup.length>0) {
        console.log('duplicate value')
        return res.render("editCategories", { message: "name already exists", category: existingCategory });
    } else {
    console.log("else block")
        const updatedCategory = await Category.findByIdAndUpdate({ _id: req.body.id }, { $set: { name: req.body.category, description: req.body.description } });

      console.log(updatedCategory)
      res.redirect("/admin/categories");
    
      }
    } catch (error) {
      console.log(error.message)
      res.status(500).json({ error: 'Failed to update category' });
    }
  };

  

  //change status

const changeStatus = async (req, res) => {
    try {
  
      const category_id = req.query.id;
  const category = await Category.findById(category_id);
  
  if (category) {
    const updatedList = !category.isListed; // Toggle the value
    const result=await Category.updateOne({_id:category.id},{$set:{isListed:updatedList}})
    await category.save();
  }
  

  
      res.redirect("/admin/categories");
    } catch (error) {
      console.log(error.message);
    }
  };
  //delete category

// async function deleteCategory(req, res) {

//   try {
//     const categoryId = req.query.id;
//     console.log(categoryId);
//     const updatedCategory = await Category.findByIdAndDelete(categoryId)
//     res.redirect('/admin/categories');
//   } catch (error) {
//     console.log(error.message)
//     res.status(500).json({ error: 'Failed to update category' });
//   }
// }
  
  

  
  

  module.exports = {
    loadCategory,
    createCategory,
    showCategory,
    loadUpdateCategory ,
    updateCategory,
    changeStatus,
    
  }