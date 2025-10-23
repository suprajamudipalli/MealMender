const express = require('express');
const router = express.Router();
const User = require('../models/user');
const jwt = require('jsonwebtoken');

// Generate JWT
const generateToken = (user) => {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: '1h',
  });
};

// @route   POST /api/auth/signup
// @desc    Register a new user
// @access  Public
router.post('/signup', async (req, res) => {
  const { firstName, lastName, dob, gender, email, username, password, role } = req.body;
  
  try {
    console.log('Signup attempt:', { firstName, lastName, email, username, role });

    // Validate required fields
    if (!firstName || !lastName || !email || !username || !password) {
      console.log('Signup failed: Missing required fields');
      return res.status(400).json({ 
        message: 'Please provide all required fields: firstName, lastName, email, username, and password' 
      });
    }

    const userExists = await User.findOne({ $or: [{ email }, { username }] });

    if (userExists) {
      console.log('Signup failed: User already exists');
      return res.status(400).json({ message: 'A user with that email or username already exists' });
    }

    const user = await User.create({
      firstName,
      lastName,
      email,
      username,
      password,
      dob,
      gender,
      role: role || 'user', // Default to 'user' if no role provided
    });

    if (user) {
      console.log('Signup successful for user:', user.username);
      res.status(201).json({
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        token: generateToken(user),
      });
    } else {
      console.log('Signup failed: Could not create user');
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    console.log('Login attempt:', { username, email, hasPassword: !!password });

    // Validate input
    if (!password) {
      console.log('Login failed: No password provided');
      return res.status(400).json({ message: 'Password is required' });
    }

    if (!username && !email) {
      console.log('Login failed: No username or email provided');
      return res.status(400).json({ message: 'Username or email is required' });
    }

    // Allow login with either username or email
    const user = await User.findOne({ 
      $or: [{ email: email || username }, { username: username || email }] 
    });

    console.log('User found:', user ? `Yes (${user.username})` : 'No');

    if (!user) {
      console.log('Login failed: User not found');
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const isPasswordMatch = await user.matchPassword(password);
    console.log('Password match:', isPasswordMatch);

    if (!isPasswordMatch) {
      console.log('Login failed: Password mismatch');
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    // Update last login timestamp
    user.lastLogin = new Date();
    await user.save();

    console.log('Login successful for user:', user.username);

    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      token: generateToken(user),
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});


module.exports = router;