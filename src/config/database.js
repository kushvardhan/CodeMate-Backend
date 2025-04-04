const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
  } catch (err) {
    console.error("❌ Error Connecting to Database:", err.message);
    process.exit(1);
  }
};

module.exports = { connectDB };
