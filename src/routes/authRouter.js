const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const User = require("../models/user");
const { userAuth } = require("../middleware/auth");
const {
  validateSignupData,
  validateLoginData,
} = require("../utils/validation");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

router.post("/signup", async (req, res) => {
  try {
    console.log("Signup request received:", req.body);
    validateSignupData(req);

    let { firstName, lastName, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    console.log("Creating new user...");
    const newUser = new User({
      firstName,
      lastName: lastName,
      email,
      password: hashedPassword,
    });

    await newUser.save();

    res
      .status(201)
      .json({ message: "User registered successfully.", data: newUser });
  } catch (err) {
    console.error("Signup Error:", err);
    res.status(400).json({ message: err.message || "Invalid request." });
  }
});

router.post("/login", async (req, res) => {
  try {
    validateLoginData(req);

    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials." });
    }

    console.log("Validating password...");
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log(isPasswordValid);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid credentials." });
    }

    const token = await user.getJWT();

    res.cookie("token", token, {
      expires: new Date(Date.now() + 86400000),
    });

    res.status(200).json({ message: "Login successful.", user });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(400).json({ message: err.message || "Invalid request." });
  }
});

router.post("/logout", userAuth, async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      sameSite: "Strict",
      secure: true,
    });
    res.status(200).json({ message: "Logout successful." });
  } catch (err) {
    res.status(400).json({ message: "Invalid request." });
  }
});

router.post("/reset-password/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    console.log("Reset password request received for token:", token);

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token." });
    }

    if (!password || password.trim() === "") {
      return res.status(400).json({ message: "Password is required." });
    }
    if (!validator.isStrongPassword(password)) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters long, containing at least 1 uppercase, 1 lowercase, 1 number, and 1 special character.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    console.log("Password reset successfully for user:", user.email);
    res.status(200).json({ message: "Password reset successfully." });
  } catch (err) {
    console.error("Reset Password Error:", err);
    res
      .status(500)
      .json({ message: "An error occurred. Please try again later." });
  }
});

module.exports = router;
