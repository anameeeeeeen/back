const mongoose = require("mongoose")

// هيتأكد من id هيشوف هو object ولا لا
module.exports = (req,res,next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
       return res.status(400).json({ message: "invalid id"})        
  }
  next()
}