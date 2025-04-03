const express = require('express');
const authRouter = express.Router();
const bcrypt = require('bcrypt');
const User = require('../../models/user');
const userAuth = require('../../middleware/auth');
const {validateSignupData,validateLoginData} = require('../../utils/validation');

authRouter.post('/signup',async(req,res)=>{
    try{
        validateSignupData(req);
        
        const {firstName,lastName,email,password} = req.body;

    }catch(err){
        throw new Error(err.message);
    }
});

authRouter.post('/login',async(req,res)=>{
    try{

    }catch(err){
        throw new Error(err.message);
    }
});

authRouter.post('/logout',userAuth,async(req,res)=>{
    try{

    }catch(err){
        throw new Error(err.message);
    }
});


module.exports = authRouter;