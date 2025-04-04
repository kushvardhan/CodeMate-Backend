const express = require("express");
require("dotenv").config();
const cors = require("cors");
const cookieParser = require("cookie-parser");
const {connectDB} = require('./config/database');
const router = require('./routes/authRouter');

const app = express();

app.use(cors());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/", router);

connectDB()
  .then(() => {
    console.log("Database connected successfully.");
    app.listen(4000, () => {
      console.log("Backend started on port 4000.");
    });
  })
  .catch((err) => {
    console.error("Error connecting to the database:", err.message);
  });
