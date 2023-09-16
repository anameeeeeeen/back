const mongoose = require("mongoose")

module.exports = async () => {
  try {
    await mongoose.connect(process.env.MONOGO_URL)
    console.log("connected to mongoDB")
  } catch (err) {
    console.log("connection failed to mongoDB?", err)
  }
}