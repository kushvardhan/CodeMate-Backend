const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        minlength: 12, 
    },
    password: {
        type: String,
        required: true,
        minlength: 5, 
    },
    gender: {
        type: String,
        enum: ['Male', 'Female', 'Other'], 
    },
    age: {
        type: Number,
    },
    desc : {
        type:String
    },
    skills:{
        type: String,
    },
});

module.exports = mongoose.model('User', userSchema);
