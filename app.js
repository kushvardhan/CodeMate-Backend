const express = require('express');
require('dotenv').config();
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { connectDB } = require('./src/config/database');
const authRouter = require('./src/routes/auth/authRouter');

const app = express();

app.use(cors({
    origin: process.env.CLIENT_URL, 
    credentials: true 
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/', authRouter);

const startServer = async () => {
    try {
        await connectDB();
        console.log('Database Connected.');
        app.listen(4000, () => console.log('Backend Started on port 4000'));
    } catch (err) {
        console.error('Error connecting with DB:', err);
        process.exit(1);
    }
};

startServer();
