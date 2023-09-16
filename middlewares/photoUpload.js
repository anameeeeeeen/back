const path = require("path")
const multer = require("multer")

// photo storage 
const photoStorage = multer.diskStorage({
  destination: function(req,file,cb) {
    // __dirname === المسار (الروت)
     cb(null, path.join(__dirname, "../images"))
  } ,
  filename : function(req,file,cb) {
    if (file) {
      cb(null, new Date().toISOString().replace(/:/g,"-") + file.originalname)
    } else {
      cb(null, false)
    }
  }
})


// photo upload middleware
const photoUpload = multer({
  storage: photoStorage,
  filefilter: function(req,file,cb) {
    if (file.mimetype.startWith("image")) {
      cb(null, true)
    } else {
      cb({ message: "Unsupported file format" }, false)
    }
  },
  limits: { fileSize: 1024 * 1024 } // 1 megabyte
})

module.exports = photoUpload