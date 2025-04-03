const mongoose = require('mongoose');
const validator = require('validator');

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
                throw new Error ("Enter correct Email.");
            }
        }
    },
    password: {
        type: String,
        required: true,
        minlength: 5, 
        validate(value){
            if(!validator.isStrongPassword(value)){
                throw new Error ("Enter strong password");
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
                throw new Error ("Enter right URL");
            }
        }
    }
});

module.exports = mongoose.model('User', userSchema);
