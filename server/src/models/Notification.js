const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: {
    type: String,
    enum: ['task_assigned', 'status_updated', 'project_updated'],
    required: true,
  },
  message: { type: String, required: true },
  relatedTaskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
  relatedProjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now, expires: 60 * 60 * 24 * 30 },
});

module.exports = mongoose.model('Notification', notificationSchema);
