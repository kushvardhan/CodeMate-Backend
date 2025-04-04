const validator = require('validator');

const validateSignupData = (req) => {
    try {
        if (!req || !req.body) throw new Error('Invalid input.');
        const { firstName, lastName, email, password } = req.body;

        if (!firstName || !lastName) throw new Error('Enter Name');
        else if (!firstName.trim() || !email.trim() || !password.trim()) throw new Error('Enter credentials.');
        if (firstName.length < 3 || firstName.length > 20) throw new Error('Name must be 3-20 characters.');
        if (!validator.isEmail(email)) throw new Error('Enter a valid email.');
        if (!validator.isStrongPassword(password)) 
            throw new Error('Password must be at least 8 characters long, containing at least 1 uppercase, 1 lowercase, 1 number, and 1 special character.');
        
    } catch (err) {
        throw new Error(err.message);
    }
};

const validateLoginData = (req) => {
    try {

        const { email, password } = req.body;

        if (!email.trim() || !password.trim()) throw new Error('Enter credentials.');
        if (!validator.isEmail(email)) throw new Error('Invalid email credentials.');
        if (!validator.isStrongPassword(password)) 
            throw new Error('Password must be at least 8 characters long, containing at least 1 uppercase, 1 lowercase, 1 number, and 1 special character.');
    } catch (err) {
        throw new Error('Invalid credentials.:'+err.message); 
    }
};


module.exports = { 
    validateSignupData,
    validateLoginData
}