const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true }],
  deadline: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Project', projectSchema);
