const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const User = require("../models/user"); 
const {userAuth} = require("../middleware/auth"); 
const {
  validateSignupData,
  validateLoginData,
} = require("../utils/validation"); 



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
      lastName: lastName ,
      email,
      password: hashedPassword,
    });

    await newUser.save();

    res.status(201).json({ message: "User registered successfully.",data:newUser });
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
    if (isPasswordValid) {
      console.log("Invalid password for user:",password , " ", user.password);
      return res.status(400).json({ message: "Invalid credentials." });
    }

    const token = await user.getJWT();

    console.log("Setting cookie with token...");
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 24 * 60 * 60 * 1000,
    });

    console.log("Login successful for user:", email);
    res.status(200).json({ message: "Login successful.", token });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(400).json({ message: err.message || "Invalid request." });
  }
});

router.post("/logout", userAuth, async (req, res) => {
  try {
    console.log("Logout request received for user:", req.user._id);
    res.clearCookie("token");
    console.log("User logged out successfully:", req.user._id);
    res.status(200).json({ message: "Logout successful." });
  } catch (err) {
    console.error("Logout Error:", err);
    res.status(400).json({ message: "Invalid request." });
  }
});

module.exports = router;
