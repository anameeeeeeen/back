const asynHandler = require("express-async-handler");
const { User, validationUpdateUser } = require("../Models/user")
const bcrypt = require("bcryptjs")
const path = require("path")
const fs = require("fs");
const { cloudinaryUploadImage, cloudinaryRemoveImage, cloudinaryRemoveMultipleImage } = require("../utils/coundinary")
const { Comment } = require("../Models/Comment")
const { Post } = require("../Models/Post")


/**----------------------------------------------
 * @desc  Get All Users Profile
 * @route /api/users/profile
 * @method Get
 * @access private (only admin)
 -------------------------------------------------*/

 module.exports.getAllUsersCtrl = asynHandler(async (req, res) => {
   const users = await User.find().select("-password").populate("posts");
   res.status(200).json(users)
 })


 /**----------------------------------------------
 * @desc  Get Users Profile
 * @route /api/users/profile/:id
 * @method Get
 * @access public
 -------------------------------------------------*/

 module.exports.getUserProfileCtrl = asynHandler(async (req, res) => {
  // .select("-password") === متجبش الباسورد
  const user = await User.findById(req.params.id).select("-password").populate("posts");
  if (!user) {
    return res.status(400).json({ message: "User Not Found"})
  }
  res.status(200).json(user)
})

 /**----------------------------------------------
 * @desc  update Users Profile
 * @route /api/users/profile/:id
 * @method Put
 * @access public(only user himself)
 -------------------------------------------------*/

 module.exports.UpdateUserProfileCtrl = asynHandler(async (req, res) => {
  // validation
   const { error } = validationUpdateUser(req.body)
  if (error) {
    return res.status(400).json({ message: error.details[0].message})
  }

  
  if (req.body.password) {
    const salt = await bcrypt.genSalt(10)
    req.body.password = await bcrypt.hash(req.body.password, salt)
  }

  // update user
  const updateUser = await User.findByIdAndUpdate(req.params.id, {
    $set: {
      username: req.body.username,
      password: req.body.password,
      bio: req.body.bio
    }
    // new == رجعلي الاوبجت الجديد
    // هيبعت posts
  }, { new: true }).select("-password").populate("posts")
    res.status(200).json(updateUser)
})


/**----------------------------------------------
 * @desc  Get Users count
 * @route /api/users/count
 * @method Get
 * @access private (only admin)
 -------------------------------------------------*/

 module.exports.getUsersCountCtrl = asynHandler(async (req, res) => {
  // هيعد اليوزر
  const count = await User.count();
  res.status(200).json(count)
})


/**----------------------------------------------
 * @desc  profile photo upload
 * @route /api/users/profile-photo-upload
 * @method Post
 * @access private (only logged in user)
 -------------------------------------------------*/

 module.exports.profilePhotoUploadCtrl = asynHandler(async (req, res) => {
  // 1. validation
  if (!req.file) {
    return res.status(400).json({ message: "no file provided"})
  }

  // 2.Get the path to the image
  const imagePath = path.join(__dirname, `../images/${req.file.filename}`);

 // 3. Upload to cloudinary
 const result = await cloudinaryUploadImage(imagePath);
 console.log(result)

 // 4. Get the user from DB
 const user = await User.findById(req.user.id);

 // 5. Delete the old profile photo if exist
 if (user.profilePhoto?.publicId !== null) {
   await cloudinaryRemoveImage(user.profilePhoto.publicId);
 }

 // 6. Change the profilePhoto field in the DB
 user.profilePhoto = {
   url: result.secure_url,
   publicId: result.public_id,
 };
 await user.save();

 // 7. Send response to client
 res.status(200).json({
   message: "your profile photo uploaded successfully",
   profilePhoto: { url: result.secure_url, publicId: result.public_id },
 });

 // 8. Remvoe image from the server
 fs.unlinkSync(imagePath);
  res.status(200).json({ message : "your profile photo uploaded successfuly"})
 })

 /**-----------------------------------------------
 * @desc    Delete User Profile (Account)
 * @route   /api/users/profile/:id
 * @method  DELETE
 * @access  private (only admin or user himself)
 ------------------------------------------------*/
module.exports.deleteUserProfileCtrl = asynHandler(async (req, res) => {
  // 1. Get the user from DB
  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ message: "user not found" });
  }

  // 2. Get all posts from DB
  const posts = await Post.find({ user: user._id });

  // 3. Get the public ids from the posts
  const publicIds = posts?.map((post) => post.image.publicId);

  // 4. Delete all posts image from cloudinary that belong to this user
  if(publicIds?.length > 0) {
    await cloudinaryRemoveMultipleImage(publicIds);
  }

  // 5. Delete the profile picture from cloudinary
  if(user.profilePhoto.publicId !== null) {
    await cloudinaryRemoveImage(user.profilePhoto.publicId);
  }
  
  // 6. Delete user posts & comments
  await Post.deleteMany({ user: user._id });
  await Comment.deleteMany({ user: user._id });

  // 7. Delete the user himself
  await User.findByIdAndDelete(req.params.id);

  // 8. Send a response to the client
  res.status(200).json({ message: "your profile has been deleted" });
});