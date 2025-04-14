const jwt = require("jsonwebtoken");
const User = require("../models/user"); // Corrected path

const userAuth = async (req, res, next) => {
  try {
    const { token } = req.cookies;
    if (!token) throw new Error("Token not valid!");
    const decodedObj = await jwt.verify(token, process.env.JWT_SECRET); 
    const { _id } = decodedObj;

    const user = await User.findById(_id);
    if (!user) throw new Error("User not found");

    req.user = user;

    next();
  } catch (err) {
    res.json({ message: err.message });
  }
};

module.exports = {
  userAuth,
};
