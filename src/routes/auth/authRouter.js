const express = require('express');
const authRouter = express.Router();
const bcrypt = require('bcrypt');
const User = require('../../models/user');
const userAuth = require('../../middleware/auth');
const {validateSignupData,validateLoginData} = require('../../utils/validation');

authRouter.post('/signup',async(req,res)=>{
    try{
        validateSignupData(req);

        const { firstName, lastName, email, password } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: "Email already exists." });

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            firstName,
            lastName,
            email,
            password: hashedPassword,
        });

        await newUser.save();

        res.status(201).json({ message: "User registered successfully." });

    }catch(err){
        console.error("Signup Error:", err);
        res.status(400).json({ message: "Invalid request." });
    }
});

authRouter.post('/login',async(req,res)=>{
    try{

    }catch(err){
        console.error("Login Error:", err);
        res.status(400).json({ message: "Invalid request." });
    }
});

authRouter.post('/logout',userAuth,async(req,res)=>{
    try{

    }catch(err){
        console.error("Logout Error:", err);
        res.status(400).json({ message: "Invalid request." });
    }
});


module.exports = authRouter;