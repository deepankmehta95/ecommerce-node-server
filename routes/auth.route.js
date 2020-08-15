const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const {check, validationResult} = require('express-validator');
const gravatar = require('gravatar');

const User = require('../models/User');
const { response } = require('express');

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
    const {name, email, password} = req.body;

    try {
        // Check if user already exists
        let user = await User.findOne({email});

        // If user exists
        if (user) {
            return res.status(400).json({
                errors: [
                    {
                        msg: 'User already exists'
                    }
                ]
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
            name, email, password, avatar
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
                res.json({token});
            }
        )

    } catch (error) {
        console.log(error.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;