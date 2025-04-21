const express = require("express");
const router = express.Router();
const {userAuth} = require("../middleware/auth"); 
const User = require("../models/user"); 
const {
  validateProfileData,
} = require("../utils/validation"); 

const crypto = require("crypto");
const nodemailer = require("nodemailer");



router.get("/", userAuth ,async (req, res) => {
    try{
        const user = req.user;
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }
        const { password, ...userData } = user._doc; 
        res.status(200).json({ message: "User profile fetched successfully.", data: userData });
    }catch(err){
        res.status(400).json({ message: "Unauthorized User, "+err.message });
    }
})

router.patch("/edit", userAuth ,async (req, res) => { 
    try{
        if(!validateProfileData(req)){
            throw new Error("Email and password cant be changed."); 
        }

        const loggedInUser = req.user;
        if (!loggedInUser) {
            return res.status(404).json({ message: "User not found." });
        }
        Object.keys(req.body).forEach((key) => loggedInUser[key] = req.body[key]);
        await loggedInUser.save();

        res.json({ message: `${loggedInUser.firstName}, your profile updated successfully.`, data: loggedInUser});
    }catch(err){
        return res.status(400).json({ message: "Invalid profile data." + err.message});
    }
})

router.post("/forgot-password",userAuth, async (req, res) => {
    try {
      const { email } = req.body;
  
      console.log("Forgot password request received for email:", email);
  
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: "User not found." });
      }
  
      const resetToken = crypto.randomBytes(32).toString("hex");
      const resetTokenExpiry = Date.now() + 3600000; 
  
      user.resetPasswordToken = resetToken;
      user.resetPasswordExpires = resetTokenExpiry;
      await user.save();

      console.log("EMAIL_USER:", process.env.EMAIL_USER);
console.log("EMAIL_PASS:", process.env.EMAIL_PASS);
  
      const resetLink = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
  
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
  
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Password Reset Request",
        html: `<p>You requested a password reset. Click the link below to reset your password:</p>
               <a href="${resetLink}">${resetLink}</a>
               <p>If you did not request this, please ignore this email.</p>`,
      };
  
      await transporter.sendMail(mailOptions);
  
      console.log("Password reset email sent to:", email);
      res.status(200).json({ message: "Password reset email sent." });
    } catch (err) {
      console.error("Forgot Password Error:", err);
      res
        .status(500)
        .json({ message: "An error occurred. Please try again later." });
    }
  });

        


module.exports = router;