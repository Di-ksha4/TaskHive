const express = require('express');
const Task = require('../models/Task');
const Project = require('../models/Project');
const User = require('../models/User');
const { verifyToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/dashboard', verifyToken, requireAdmin, async (req, res) => {
  try {
    const [totalProjects, totalUsers, totalTasks, completedTasks, overdueTasks] = await Promise.all([
      Project.countDocuments(),
      User.countDocuments({ role: 'member' }),
      Task.countDocuments(),
      Task.countDocuments({ status: 'completed' }),
      Task.countDocuments({ dueDate: { $lt: new Date() }, status: { $ne: 'completed' } }),
    ]);

    const tasksByStatus = await Task.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const tasksByPriority = await Task.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } },
    ]);

    const memberWorkload = await Task.aggregate([
      {
        $group: {
          _id: '$assignedTo',
          total: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        },
      },
      {
        $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' },
      },
      { $unwind: '$user' },
      {
        $project: {
          _id: 0,
          name: '$user.name',
          total: 1,
          completed: 1,
        },
      },
      { $sort: { total: -1 } },
    ]);

    const completionRate = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

    res.json({
      totals: { projects: totalProjects, members: totalUsers, tasks: totalTasks, completedTasks, overdueTasks, completionRate },
      tasksByStatus,
      tasksByPriority,
      memberWorkload,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/overdue-tasks', verifyToken, requireAdmin, async (req, res) => {
  try {
    const tasks = await Task.find({
      dueDate: { $lt: new Date() },
      status: { $ne: 'completed' },
    })
      .populate('assignedTo', 'name email')
      .populate('projectId', 'title');
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
