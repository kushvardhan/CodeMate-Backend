const mongoose = require('mongoose');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');


const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        maxLength:20,
    },lastName: {
        type: String,
    },
    email: {
        type: String,
        required: true,
        minlength: 12, 
        unique:true,
        trim:true,
        validate(value){
            if(!validator.isEmail(value)){
                throw new Error ("Enter a valid Email.");
            }
        }
    },
    password: {
        type: String,
        required: true,
        minlength: 5, 
        validate(value){
            if(!validator.isStrongPassword(value)){
                throw new Error ("Enter a strong password");
            }
        }
    },
    gender: {
        type: String,
        enum: ['Male', 'Female', 'Other']
    },
    age: {
        type: Number,
        min : 16,
    },
    about : {
        type:String
    },
    skills:{
        type: [String],
    },
    photoUrl : {
        type:String,
        default:"https://png.pngitem.com/pimgs/s/508-5087236_tab-profile-f-user-icon-white-fill-hd.png",
        validate(value){
            if(!validator.isURL(value)){
                throw new Error ("Enter a valid URL");
            }
        }
    }
});

userSchema.methods.getJWT = async function(){
    try{
        const token = await jwt.sign({_id:this._id},process.env.JWT_SECRET,{expiresIn:'1d'});
        return token;
    }catch(err){
        throw new Error(err.message);
    }
}

userSchema.methods.validatePassword = async function(passwordfromloginpage){
    try{
        const isValidPassword = await bcrypt.compare(passwordfromloginpage,this.password);
        
        return isValidPassword;
    }catch(err){
        throw new Error(err.message);
    }
}

module.exports = mongoose.model('User', userSchema);
