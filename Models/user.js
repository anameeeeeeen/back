const mongoose = require("mongoose")
const Joi = require("joi")
const jwt = require("jsonwebtoken")
const passwordComplexity = require("joi-password-complexity");


// USer Schema
const UserSchema = new mongoose.Schema({
  username:{
    type: String,
    require: true,
    // trim == يحذف الفراغات
    trim:true,
    minlength:2,
    maxlength:100,
  },
  email:{
    type: String,
    require: true,
    trim:true,
    minlength:5,
    maxlength:100,
    unique: true,
  },
  password:{
    type: String,
    require: true,
    trim:true,
    minlength:8,
  },
  profilePhoto:{
    type: Object,
    default:{
      url: "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460__480.png",
      publicId: null,
    }
  },
  bio: {
    type: String,
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
  isAccountVerified: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})


// Populate Posts That Belongs To This User When he/she Get his/her Profile
UserSchema.virtual("posts", {
  ref: "Post",
  foreignField: "user",
  localField: "_id",
});


// Generate Auth Token
UserSchema.methods.generateAuthToken = function() {
  return jwt.sign({id: this._id, isAdmin: this.isAdmin}, process.env.JWT_SECRET);
}

//user Model
const User = mongoose.model("User", UserSchema)

  // validation register user
  function validationRegisterUser(obj) {
     const schema = Joi.object({
      username: Joi.string().trim().min(2).max(100).required(),
      email: Joi.string().trim().min(5).max(100).required().email(),
      password: passwordComplexity().required(),
     })
     return schema.validate(obj)
  }

  // validation login user
  function validationLoginUser(obj) {
     const schema = Joi.object({
      email: Joi.string().trim().min(5).max(100).required().email(),
      password: Joi.string().trim().min(8).required(),
     })
     return schema.validate(obj)
  }

  // validation update user
  function validationUpdateUser(obj) {
     const schema = Joi.object({
      username: Joi.string().trim().min(2).max(100),
      password: passwordComplexity(),
      bio: Joi.string()
     })
     return schema.validate(obj)
  }

  // Validate Email
function validateEmail(obj) {
  const schema = Joi.object({
      email: Joi.string().trim().min(5).max(100).required().email(),
  });
  return schema.validate(obj);
}

// Validate New Password
function validateNewPassword(obj) {
  const schema = Joi.object({
    password: passwordComplexity().required(),
  });
  return schema.validate(obj);
}

module.exports = {
  User,
  validationRegisterUser,
  validationLoginUser,
  validationUpdateUser,
  validateEmail,
  validateNewPassword
}