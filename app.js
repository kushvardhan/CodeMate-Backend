const express = require('express');
require("dotenv").config();
const {connectDB}=require("./src/config/database");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
    res.send("Hey yo");
});

connectDB().then(()=>{
    console.log("DataBase Connected.");
    app.listen(4000, () => console.log("Backend Started on port 4000"));
}).catch((err)=>{
    console.log("Error connecting with DB: ",err);
})