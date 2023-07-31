const Admin=require("../models/adminModel");
 const User=require("../models/userModel");

//load login page

const loadLogin = async (req, res) => {

 
    try {
      res.render("login", { message: "" });
    } catch (error) {
      console.log(error.message);
    }
  };
//verify login

  const verifyLogin = async (req, res) => {
    try {
      const email = req.body.email;
      const password = req.body.password;
      const adminData = await Admin.findOne({ email: email });
  console.log(adminData);
      if (adminData.password === password) {
        // Authentication successful
        if (adminData) {
          // Create session and store user ID in the session data
          req.session.userId = adminData._id;
          res.redirect("/admin/dashboard");
        } else {
          res.render("login", { message: " Password are Incorrect" });
        }
      } else {
        res.render("login", { message: "admin is not found" });
      }
    } catch (error) {
      console.log(error.message);
    }
  };
  
  //load dashboard

const loadDashboard = async (req, res) => {
  try {
    res.render("dashboard");
  } catch (error) {
    console.log(error);
  }
};

const loadUsers = async (req, res) => {
  try {
    const search = "";
    if (req.query.search) {
      search = req.query.search;
    }
    const usersData = await User.find({
      $or: [
        { fname: { $regex: ".*" + search + ".*" } },
        { lname: { $regex: ".*" + search + ".*" } },
        { email: { $regex: ".*" + search + ".*" } },
        { mobile: { $regex: ".*" + search + ".*" } },
      ],
    });
    console.log(usersData);

    res.render("user2", { user: usersData });
  } catch (error) {
    console.log(error.message);
  }
};

//delete user

// const deleteUser = async (req, res) => {
//   try {
//     const id = req.query.id;
//     await User.deleteOne({ _id: id });
//     res.redirect("/admin/loadUsers");
//   } catch (error) {
//     console.log(error.message);
//   }
// };

 //block user

const blockUser = async (req, res) => {
  try {
    const id = req.query.id;
    await User.findByIdAndUpdate({ _id: id }, { $set: { is_blocked: true } });
    res.redirect("/admin/loadUsers");
  } catch (error) {
    console.log(error);
  }
};

 //unblockuser

const unBlockUser = async (req, res) => {
  try {
    const id = req.query.id;
    await User.findByIdAndUpdate({ _id: id }, { $set: { is_blocked: false } });
    res.redirect("/admin/loadUsers");
  } catch (error) {
    console.log(error);
  }
};
 ///load edit user

const loadEditUser = async (req, res) => {
  try {
    const id = req.query.id;
    const userData = await User.findById({ _id: id });
    if (userData) {
      res.render("editUser", { user: userData });
    } else {
    res.redirect("/admin/loadUsers");
    // res.redirect("");
    }
  } catch (error) {
    console.log(error.message);
  }
};

//update user
const updateUser = async (req, res) => {
  try {
    const userData = await User.findByIdAndUpdate(
      { _id: req.body.id },
      {
        $set: {
          fname: req.body.fname,
          lname: req.body.lname,
          email: req.body.email,
          mobile: req.body.mobile,
        },
      }
    );
    res.redirect("/admin/users");
  } catch (error) {
    console.log(error.message);
  }
};
const logout = (req, res) => {
  req.session.destroy(() => {
  
  res.redirect("/admin/adminLogin");
});
};








module.exports = {
    loadLogin,
    verifyLogin ,
    loadDashboard,
    loadUsers,
    // deleteUser,
    blockUser,
    loadEditUser,
    updateUser,
    unBlockUser,
    logout

}