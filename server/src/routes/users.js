const express = require('express');
const User = require('../models/User');
const { verifyToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Admin-only list of all users (used to pick members and assignees in the UI)
router.get('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const role = req.query.role;
    const filter = role ? { role } : {};
    const users = await User.find(filter).select('-password').sort({ name: 1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
