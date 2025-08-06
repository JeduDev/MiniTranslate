const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { client } = require('../config/db');
const { JWT_SECRET } = require('../middleware/auth');

// Register a new user
async function register(req, res) {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, password, push_token } = req.body;

  try {
    console.log(`Attempting to register user with email: ${email}`);
    console.log(`Push token received: ${push_token || 'None'}`);
    console.log(`Push token type: ${typeof push_token}`);
    console.log(`Push token length: ${push_token ? push_token.length : 0}`);
    
    // Check if user already exists
    const existingUser = await client.execute({
      sql: 'SELECT * FROM users WHERE email = ?',
      args: [email]
    });

    console.log(`Query result for existing user: ${JSON.stringify(existingUser)}`);
    console.log(`Found ${existingUser.rows.length} existing users with this email`);

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    console.log('Inserting new user into database');
    
    // Insert user into database with push token if provided
    const currentDate = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD
    const insertResult = await client.execute({
      sql: 'INSERT INTO users (name, email, password, push_token, fecha) VALUES (?, ?, ?, ?, ?)',
      args: [name, email, hashedPassword, push_token || null, currentDate]
    });
    
    console.log(`Insert result: ${JSON.stringify(insertResult)}`);
    console.log(`Push token provided: ${push_token ? 'Yes' : 'No'}`);

    // Get the newly created user
    const newUser = await client.execute({
      sql: 'SELECT id, name, email, push_token, role FROM users WHERE email = ?',
      args: [email]
    });

    if (newUser.rows.length === 0) {
      console.error('User was not found after insertion');
      return res.status(500).json({ error: 'Failed to create user' });
    }

    console.log(`New user retrieved: ${JSON.stringify(newUser.rows[0])}`);
    console.log(`Push token stored: ${newUser.rows[0].push_token || 'None'}`);

    // Create and assign token
    const token = jwt.sign(
      { id: newUser.rows[0].id, email: newUser.rows[0].email },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: newUser.rows[0].id,
        name: newUser.rows[0].name,
        email: newUser.rows[0].email,
        role: newUser.rows[0].role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error during registration', details: error.message });
  }
}

// Login user
async function login(req, res) {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password, push_token } = req.body;

  try {
    console.log(`Attempting to login user with email: ${email}`);
    console.log(`Push token received: ${push_token || 'None'}`);
    console.log(`Push token type: ${typeof push_token}`);
    console.log(`Push token length: ${push_token ? push_token.length : 0}`);
    
    // Check if user exists
    const user = await client.execute({
      sql: 'SELECT * FROM users WHERE email = ?',
      args: [email]
    });

    console.log(`Found ${user.rows.length} users with this email`);

    if (user.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.rows[0].password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    // Update push token if provided
    if (push_token) {
      console.log(`Updating push token for user ${user.rows[0].id}`);
      console.log(`Old push token: ${user.rows[0].push_token || 'None'}`);
      console.log(`New push token: ${push_token}`);
      
      await client.execute({
        sql: 'UPDATE users SET push_token = ? WHERE id = ?',
        args: [push_token, user.rows[0].id]
      });
      
      console.log('Push token updated successfully');
    } else {
      console.log('No push token provided, skipping update');
    }

    // Create and assign token
    const token = jwt.sign(
      { id: user.rows[0].id, email: user.rows[0].email },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.rows[0].id,
        name: user.rows[0].name,
        email: user.rows[0].email,
        role: user.rows[0].role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
}

// Get user profile
async function getProfile(req, res) {
  try {
    const user = await client.execute({
      sql: 'SELECT id, name, email, role FROM users WHERE id = ?',
      args: [req.user.id]
    });

    if (user.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({
      user: {
        id: user.rows[0].id,
        name: user.rows[0].name,
        email: user.rows[0].email,
        role: user.rows[0].role
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Server error while fetching profile' });
  }
}

// Update push token
async function updatePushToken(req, res) {
  const { push_token } = req.body;

  if (!push_token) {
    return res.status(400).json({ error: 'Push token is required' });
  }

  try {
    await client.execute({
      sql: 'UPDATE users SET push_token = ? WHERE id = ?',
      args: [push_token, req.user.id]
    });

    res.status(200).json({ message: 'Push token updated successfully' });
  } catch (error) {
    console.error('Update push token error:', error);
    res.status(500).json({ error: 'Server error while updating push token' });
  }
}

// Logout user and clear push token
async function logout(req, res) {
  try {
    // Clear the push token for the user
    await client.execute({
      sql: 'UPDATE users SET push_token = NULL WHERE id = ?',
      args: [req.user.id]
    });

    res.status(200).json({ message: 'Logged out successfully and push token cleared' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Server error during logout' });
  }
}

module.exports = {
  register,
  login,
  getProfile,
  updatePushToken,
  logout
};