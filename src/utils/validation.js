const validator = require('validator');

const validateSignupData = (req) => {
    try {
        if (!req || !req.body) throw new Error('Invalid input.');
        const { firstName, lastName, email, password } = req.body;

        if (!firstName || !lastName) throw new Error('Enter Name');
        else if (!firstName.trim() || !email.trim() || !password.trim()) throw new Error('Enter credentials.');
        if (firstName.length < 3 || firstName.length > 50) throw new Error('Name must be 3-50 characters.');
        if (!validator.isEmail(email)) throw new Error('Enter a valid email.');
        if (!validator.isStrongPassword(password)) 
            throw new Error('Password must be at least 8 characters long, containing at least 1 uppercase, 1 lowercase, 1 number, and 1 special character.');
        
    } catch (err) {
        throw new Error(err.message);
    }
};

const validateLoginData = (req) => {
    try {
        if (!req || !req.body) throw new Error('Invalid credentials.');

        const { email, password } = req.body;

        if (typeof email !== 'string' || typeof password !== 'string') throw new Error('Invalid credentials.');
        if (!email.trim() || !password.trim()) throw new Error('Enter credentials.');
        if (!validator.isEmail(email)) throw new Error('Invalid credentials.');
        if (password.length < 8) throw new Error('Invalid credentials.');

    } catch (err) {
        throw new Error('Invalid credentials.'); 
    }
};


module.exports = { 
    validateSignupData,
    validateLoginData
}