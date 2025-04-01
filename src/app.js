const express = require('express');
require("dotenv").config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
    res.send("Hey yo");
});

app.listen(4000, () => console.log("Backend Started on port 4000"));
