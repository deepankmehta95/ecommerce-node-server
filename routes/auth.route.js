const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const {
    check,
    validationResult
} = require('express-validator');
const gravatar = require('gravatar');

const auth = require('../middleware/auth');

const User = require('../models/User');

// POST api/user
router.post('/', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password').lean();
        res.json(user);
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Server error');
    }
});

// POST api/user/register
router.post('/register', [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid email address').isEmail(),
    check('password', 'Please enter a password which is atleast 6 characters long').isLength({
        min: 6
    })
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            errors: errors.array()
        });
    }

    // Fetch form data
    const {
        name,
        email,
        password
    } = req.body;

    try {
        // Check if user already exists
        let user = await User.findOne({
            email
        });

        // If user exists
        if (user) {
            return res.status(400).json({
                errors: [{
                    msg: 'User already exists'
                }]
            });
        }

        // If no user exists
        const avatar = gravatar.url({
            s: '200',
            r: 'pg',
            d: 'mm'
        });

        // Creates new user
        user = new User({
            name,
            email,
            password,
            avatar
        });

        // Encrypts the password
        const salt = await bcrypt.genSalt(12);
        // save password
        user.password = await bcrypt.hash(password, salt);
        // save user
        await user.save();

        // Payload
        const payload = {
            user: {
                id: user.id
            }
        }

        jwt.sign(
            payload,
            process.env.JWT_SECRET, {
                expiresIn: 360000 // for development purpose only
            }, (err, token) => {
                if (err) throw err;
                res.json({
                    token
                });
            }
        )

    } catch (error) {
        console.log(error.message);
        res.status(500).send('Server error');
    }
});

// POST api/user/login
router.post('/login', [
    check('email', 'Please include a valid email address').isEmail(),
    check('password', 'Password is required').exists()
], async (req, res) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            errors: errors.array()
        });
    }

    // If no error
    const {
        email,
        password
    } = req.body;

    try {
        let user = await User.findOne({
            email
        });

        // If no user
        if (!user) {
            return res.status(400).json({
                errors: [{
                    msg: 'Invalid credentials'
                }]
            });
        }

        // If user found
        const isMatch = await bcrypt.compare(password, user.password);

        // Passwords don't match
        if (!isMatch) {
            return res.status(400).json({
                errors: [{
                    msg: 'Invalid credentials'
                }]
            });
        }

        // If password matches
        const payload = {
            user: {
                id: user.id
            }
        }

        console.log(payload);

        jwt.sign(payload,
            process.env.JWT_SECRET, {
                expiresIn: 360000
            }, (err, token) => {
                if (err) throw err;
                res.json({
                    token
                });
            });
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;