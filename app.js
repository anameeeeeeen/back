const express = require("express");
const connectDB = require("./config/connectDB");
const xss = require("xss-clean")
const rateLimiting = require("express-rate-limit");
const helmet = require("helmet");
const hpp = require("hpp");
const { errorHandler, notFound } = require("./middlewares/error");
const cors = require("cors");
require("dotenv").config();

//connect to DB
connectDB();

// init app
const app = express();

//middlewares
app.use(express.json());

// Security Headers (helmet) == يضيف بعض ريكوست هيدر مع الريسبونس (للحمايه)
app.use(helmet());

// Prevent Http Param Pollution 
app.use(hpp());

// Prevent XSS Attacks
// XSS == يحمي api  من اي مدخلات مثلا ب جافاسكربت
// مش هيحفظ اي html element
app.use(xss());

// Rate Limiting == اي يوزر مينفعش يرسل اكتر من 200 ريكويس كل 10 دقايق
app.use(rateLimiting({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max:200,
}));



// Cors Policy
// app.use(cors({
//   origin: "http://localhost:3000"
// }))
const corsOptions = {
  origin: true,
  credentials: true
 }
app.use(cors(corsOptions))


// routes
app.use("/api/auth", require("./routes/authRoute"))
app.use("/api/users", require("./routes/usersRoute"))
app.use("/api/posts", require("./routes/postsRoute"))
app.use("/api/comments", require("./routes/commentsRoute"))
app.use("/api/categories", require("./routes/categoriesRoute"))
app.use("/api/password",require("./routes/passwordRoute"));


// Error Handler Middleware
app.use(notFound);
app.use(errorHandler);

//running server 
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => 
  console.log(
    `http://localhost:${process.env.PORT}`
  )
);
