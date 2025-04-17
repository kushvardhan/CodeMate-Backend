const mongoose = require("mongoose");
const validator = require("validator");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    maxLength: 20,
  },
  lastName: {
    type: String,
  },
  email: {
    type: String,
    required: true,
    minlength: 12,
    unique: true,
    trim: true,
    validate(value) {
      if (!validator.isEmail(value)) {
        throw new Error("Enter a valid Email.");
      }
    },
  },
  password: {
    type: String,
    required: true,
    minlength: 5,
    validate(value) {
      if (!validator.isStrongPassword(value)) {
        throw new Error("Enter a strong password");
      }
    },
  },
  gender: {
    type: String,
    enum: {
      values: ["male", "female", "other"],
      message: "{VALUE} is not supported",
    },
  },
  age: {
    type: Number,
    min: 16,
  },
  about: {
    type: String,
  },
  skills: {
    type: [String],
  },
  photoUrl: {
    type: String,
    default: "https://i.imgur.com/6YQ1Zzt.png", // Clean, geometric profile avatar without text
    validate(value) {
      if (!validator.isURL(value)) {
        throw new Error("Enter a valid URL");
      }
    },
  },
  resetPasswordToken: {
    type: String,
  },
  resetPasswordExpires: {
    type: Date,
  },
});

userSchema.methods.getJWT = async function () {
  try {
    console.log("Generating JWT for user:", this._id);
    const token = await jwt.sign({ _id: this._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });
    console.log("JWT generated successfully:", token);
    return token;
  } catch (err) {
    console.error("Error generating JWT:", err.message);
    throw new Error(err.message);
  }
};

module.exports = mongoose.model("User", userSchema);
