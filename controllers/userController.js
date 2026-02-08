const User = require('../models/User');

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({
      message: 'Profile retrieved',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      }
    });
    
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { username, email } = req.body;
    
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }
    
    if (username) user.username = username;
    if (email) user.email = email;
    
    await user.save();
    
    res.json({
      message: 'Profile updated',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
    
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { getProfile, updateProfile };