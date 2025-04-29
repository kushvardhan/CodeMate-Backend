const validator = require("validator");

const validateSignupData = (req) => {
  try {
    if (!req || !req.body) throw new Error("Invalid input.");
    const { firstName, lastName, email, password } = req.body;

    if (!firstName || !firstName.trim()) throw new Error("First name is required.");
    if (firstName.length < 3 || firstName.length > 20)
      throw new Error("First name must be between 3 and 20 characters.");
    if (!lastName || !lastName.trim()) throw new Error("Last name is required.");
    if (!validator.isEmail(email)) throw new Error("Enter a valid email.");
    if (!validator.isStrongPassword(password))
      throw new Error(
        "Password must be at least 8 characters long, containing at least 1 uppercase, 1 lowercase, 1 number, and 1 special character."
      );
  } catch (err) {
    throw new Error(err.message);
  }
};

const validateLoginData = (req) => {
  try {
    const { email, password } = req.body;

    if (!email.trim() || !password.trim())
      throw new Error("Enter credentials.");
    if (!validator.isEmail(email))
      throw new Error("Invalid email credentials.");
    if (!validator.isStrongPassword(password))
      throw new Error(
        "Password must be at least 8 characters long, containing at least 1 uppercase, 1 lowercase, 1 number, and 1 special character."
      );
  } catch (err) {
    throw new Error("Invalid credentials.:" + err.message);
  }
};

const validateProfileData = (req) => {
  try {
    if (!req || !req.body) throw new Error("Invalid input.");
    const allowedEditFields = [
      "firstName",
      "lastName",
      "photoUrl",
      "gender",
      "age",
      "skills",
      "about",
      "location",
    ];

    const hasInvalidFields = Object.keys(req.body).some(
      (field) => !allowedEditFields.includes(field)
    );

    if (hasInvalidFields) {
      throw new Error("Invalid fields in profile update.");
    }

    const { firstName, lastName, photoUrl, gender, age, skills, about, location } = req.body;

    if (firstName && (firstName.length < 3 || firstName.length > 20))
      throw new Error("First name must be between 3 and 20 characters.");
    if (lastName && (lastName.length < 3 || lastName.length > 20))
      throw new Error("Last name must be between 3 and 20 characters.");
    if (photoUrl && !validator.isURL(photoUrl)) throw new Error("Invalid photo URL.");
    if (gender && !["male", "female", "other"].includes(gender))
      throw new Error("Invalid gender value.");
    if (age && (isNaN(age) || age < 16))
      throw new Error("Age must be a number and at least 16.");
    if (skills && !Array.isArray(skills))
      throw new Error("Skills must be an array.");
    if (about && about.length > 500)
      throw new Error("About section must not exceed 500 characters.");
    if (location && location.length > 100)
      throw new Error("Location must not exceed 100 characters.");
  } catch (err) {
    throw new Error(err.message);
  }
};

module.exports = {
  validateSignupData,
  validateLoginData,
  validateProfileData,
};
