const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const generateToken  = (userId) => {
    return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '1h' });

};

// Register a new user
exports.register = async (req, res, next) => {
  const { name, email, password, role } = req.body;

  try {
    // Check if user already exists
    const [existing] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    await db.execute(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, role || 'cashier']
    );

    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    next(err);
  }
};

// Login user
exports.login = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    // Find user
    const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = users[0];

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, name: user.name, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    next(err);
  }
};

// Optional: Get current logged-in user
exports.getMe = async (req, res) => {
    try {
      const [userRows] = await db.execute('SELECT id, name, email FROM users WHERE id = ?', [req.user.id]);
      const user = userRows[0];
  
      if (!user) return res.status(404).json({ message: 'User not found' });
  
      res.json(user);
    } catch (err) {
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  };


  // Change user password
  exports.changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;
  
    try {
      // Ensure currentPassword and newPassword are provided
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'Please provide both current and new passwords.' });
      }
  
      // Fetch the user from the database
      const [users] = await db.execute('SELECT * FROM users WHERE id = ?', [req.user.id]);
      const user = users[0];
  
      // If user doesn't exist
      if (!user) {
        return res.status(404).json({ message: 'User not found.' });
      }
  
      // Check if the current password is correct
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Current password is incorrect.' });
      }
  
      // Hash the new password before saving it
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
  
      // Update the password in the database
      await db.execute('UPDATE users SET password = ? WHERE id = ?', [hashedNewPassword, req.user.id]);
  
      res.status(200).json({ message: 'Password updated successfully.' });
    } catch (err) {
      console.error(err); // Log the error for debugging purposes
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  };
  

  
