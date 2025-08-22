const express = require("express");
require("dotenv").config();
const cors = require("cors");
const http = require("http");
const cookieParser = require("cookie-parser");
const { connectDB } = require("./config/database");
const profileRouter = require("./routes/profileRouter");
const requestRouter = require("./routes/requestRouter");
const appRouter = require("./routes/authRouter");
const userRouter = require("./routes/userRouter");
const chatRouter = require("./routes/chatRouter");
const initialzeSocket = require("./utils/Socket");

const app = express();

app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/", appRouter);
app.use("/profile", profileRouter);
app.use("/request", requestRouter);
app.use("/user", userRouter);
app.use("/chat", chatRouter);

const server = http.createServer(app);
const io = initialzeSocket(server);

// Make io instance available to routes
app.set("io", io);

connectDB()
  .then(() => {
    console.log("Database connected successfully.");
    server.listen(4000, () => {
      console.log("Backend started on port 4000.");
    });
  })
  .catch((err) => {
    console.error("Error connecting to the database:", err.message);
  });
