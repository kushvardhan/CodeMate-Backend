const mongoose = require('mongoose');

const connectDB = async()=>{
    await mongoose.connect(process.env.MONGO_URL);
}

connectDB().then(()=>{
    console.log("DATABASE connected");
}).catch((err)=>{
    console.log("error in connecting to DB: ",err);
})