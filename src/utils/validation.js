const validator = require('validator');

const validateSignupData = (req) => {
    try {
        const { firstName, lastName, email, password } = req.body;

        if (!firstName || !lastName) throw new Error('Enter Name');
        if (firstName.length < 3 || firstName.length > 50) throw new Error('Name must be 3-50 characters.');
        if (!validator.isEmail(email)) throw new Error('Enter a valid email.');
        if (!validator.isStrongPassword(password)) 
            throw new Error('Password must be at least 8 characters long, containing at least 1 uppercase, 1 lowercase, 1 number, and 1 special character.');
        
    } catch (err) {
        throw new Error(err.message);
    }
};

module.exports = { 
    validateSignupData,
    
}