const asynHandler = require("express-async-handler");
const bcrypt = require("bcryptjs");
const { User } = require("../Models/user");
const {
  user,
  validationRegisterUser,
  validationLoginUser,
} = require("../Models/user");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");
const VerificationToken = require("../Models/VerificationToken");


/**----------------------------------------------
 * @desc  register new users
 * @route /api/auth/register
 * @method post
 * @access public
 -------------------------------------------------*/


// =================== register ===============================
module.exports.registerUserCtrl = asynHandler(async (req, res) => {
  // validation
  const { error } = validationRegisterUser(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  // is user already exists
  let user = await User.findOne({ email: req.body.email });
  if (user) {
    return res.status(400).json({ message: "User already exist" });
  }

  // hash the password
  const salt = await bcrypt.genSalt(10);
  const hashPassword = await bcrypt.hash(req.body.password, salt);

  // new user and save it to DB
  user = new User({
    username: req.body.username,
    email: req.body.email,
    password: hashPassword,
  });
  await user.save();


    // Creating new VerificationToken & save it toDB
    const verifictionToken = new VerificationToken({
      userId: user._id,
      token: crypto.randomBytes(32).toString("hex"),
    });
    await verifictionToken.save();
  
           // ################## verify email ########################

    // Making the link
    const link = `${process.env.CLIENT_DOMAIN}/users/${user._id}/verify/${verifictionToken.token}`;
  
    // Putting the link into an html template
    const htmlTemplate = `
      <div>
        <p>Click on the link below to verify your email</p>
        <a href="${link}">Verify</a>
      </div>`;
  
    // Sending email to the user
    await sendEmail(user.email, "Verify Your Email", htmlTemplate);
  
    // Response to the client
    res.status(201).json({
      message: "We sent to you an email, please verify your email address",
    });
  });


// =================== login ===============================

module.exports.loginUserCtrl = asynHandler(async (req, res) => {
  // validation
  const { error } = validationLoginUser(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  // user exist
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return res.status(400).json({ message: "invalid email or password" });
  }

  // check the password
    const isPasswordMatch = await bcrypt.compare(req.body.password, user.password)
    if (!isPasswordMatch) {
      return res.status(400).json({ message: "invalid email or password" });
    }

            // ################## verify email ########################

            // sending email (verify account if not verified)
  if (!user.isAccountVerified) {
    let verificationToken = await VerificationToken.findOne({
      userId: user._id,
    });

    if (!verificationToken) {
      verificationToken = new VerificationToken({
        userId: user._id,
        token: crypto.randomBytes(32).toString("hex"),
      });
      await verificationToken.save();
    }

    const link = `${process.env.CLIENT_DOMAIN}/users/${user._id}/verify/${verifictionToken.token}`;

    const htmlTemplate = `
    <div>
      <p>Click on the link below to verify your email</p>
      <a href="${link}">Verify</a>
    </div>`;

    await sendEmail(user.email, "Verify Your Email", htmlTemplate);

    return res.status(400).json({
      message: "We sent to you an email, please verify your email address",
    });
  }


  // generate token (jwt)
  //$ npm i jsonwebtoken
    const token = user.generateAuthToken();

  // response to client
  res.status(200).json({ 
    _id: user._id,
    isAdmin: user.isAdmin,
    profilePhoto: user.profilePhoto,
    token,
    username: user.username,
  });
});




/**-----------------------------------------------
 * @desc    Verify User Account
 * @route   /api/auth/:userId/verify/:token
 * @method  GET
 * @access  public
 ------------------------------------------------*/
 module.exports.verifyUserAccountCtrl = asynHandler(async (req, res) => {
  const user = await User.findById(req.params.userId);
  if (!user) {
    return res.status(400).json({ message: "invalid link" });
  }

  const verificationToken = await VerificationToken.findOne({
    userId: user._id,
    token: req.params.token,
  });

  if (!verificationToken) {
    return res.status(400).json({ message: "invalid link" });
  }

  user.isAccountVerified = true;
  await user.save();

  await verificationToken.remove();

  res.status(200).json({ message: "Your account verified" });
});