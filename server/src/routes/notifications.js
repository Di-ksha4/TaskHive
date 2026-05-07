const express = require('express');
const Notification = require('../models/Notification');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', verifyToken, async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/:notificationId/read', verifyToken, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.notificationId);
    if (!notification) return res.status(404).json({ error: 'Notification not found' });
    if (notification.userId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    notification.isRead = true;
    await notification.save();
    res.json(notification);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/read-all', verifyToken, async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.userId, isRead: false }, { isRead: true });
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
