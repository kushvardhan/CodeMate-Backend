const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log("Database Connected Successfully.");
    } catch (err) {
        console.error("❌ Error Connecting to Database:", err.message);
        process.exit(1); // Stop the app if DB connection fails
    }
};

module.exports = { connectDB };
