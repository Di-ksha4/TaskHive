const express = require('express');
const Task = require('../models/Task');
const Project = require('../models/Project');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { verifyToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Simple rule-based default priority. Admin can always override.
const suggestPriority = (title = '', description = '', dueDate) => {
  const text = `${title} ${description}`.toLowerCase();
  const urgentWords = ['urgent', 'asap', 'critical', 'bug', 'fix', 'blocker'];
  if (urgentWords.some((w) => text.includes(w))) return 'high';
  if (dueDate) {
    const hoursAway = (new Date(dueDate) - Date.now()) / (1000 * 60 * 60);
    if (hoursAway > 0 && hoursAway < 48) return 'high';
  }
  return 'medium';
};

// Admin: create task
router.post('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { title, description, assignedTo, projectId, priority, dueDate } = req.body;
    if (!title || !projectId || !assignedTo) {
      return res.status(400).json({ error: 'Title, project, and assignee are required' });
    }

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const isMember = project.members.some((m) => m.toString() === assignedTo.toString());
    if (!isMember) {
      return res.status(400).json({ error: 'Assignee must be a member of the project' });
    }

    const assignee = await User.findById(assignedTo);
    if (!assignee) return res.status(404).json({ error: 'Assigned user not found' });

    const finalPriority = priority || suggestPriority(title, description, dueDate);

    const task = await Task.create({
      title,
      description,
      assignedTo,
      projectId,
      priority: finalPriority,
      dueDate,
    });
    await task.populate(['assignedTo', 'projectId']);

    await Notification.create({
      userId: assignedTo,
      type: 'task_assigned',
      message: `You were assigned a new task: "${title}"`,
      relatedTaskId: task._id,
      relatedProjectId: projectId,
    });

    res.status(201).json({ task, suggestedPriority: finalPriority });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// List tasks. Admin sees all; member sees only their own.
router.get('/', verifyToken, async (req, res) => {
  try {
    const filter = req.userRole === 'admin' ? {} : { assignedTo: req.userId };
    const tasks = await Task.find(filter)
      .populate('assignedTo', 'name email role')
      .populate('projectId', 'title')
      .sort({ createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:taskId', verifyToken, async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId)
      .populate('assignedTo', 'name email role')
      .populate('projectId', 'title members')
      .populate('comments.userId', 'name');
    if (!task) return res.status(404).json({ error: 'Task not found' });

    if (req.userRole !== 'admin' && task.assignedTo._id.toString() !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update task. Admin can change anything. Member can only change status on own tasks.
router.put('/:taskId', verifyToken, async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const isOwner = task.assignedTo.toString() === req.userId;
    const isAdmin = req.userRole === 'admin';
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ error: 'Access denied' });
    }

    let updates = req.body;
    if (!isAdmin) {
      // members can only flip status
      updates = { status: req.body.status };
    }

    // if reassigning, validate the new assignee belongs to the project
    if (isAdmin && updates.assignedTo) {
      const project = await Project.findById(updates.projectId || task.projectId);
      if (!project) return res.status(404).json({ error: 'Project not found' });
      const ok = project.members.some((m) => m.toString() === updates.assignedTo.toString());
      if (!ok) return res.status(400).json({ error: 'Assignee must be a member of the project' });
    }

    const updated = await Task.findByIdAndUpdate(req.params.taskId, updates, { new: true })
      .populate('assignedTo', 'name email role')
      .populate('projectId', 'title');

    // if a member changed status, leave a notification for the admin who created the project
    if (!isAdmin && req.body.status) {
      const project = await Project.findById(task.projectId);
      if (project) {
        await Notification.create({
          userId: project.createdBy,
          type: 'status_updated',
          message: `${updated.assignedTo.name} marked "${updated.title}" as ${updated.status}`,
          relatedTaskId: updated._id,
          relatedProjectId: updated.projectId,
        });
      }
    }

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:taskId', verifyToken, requireAdmin, async (req, res) => {
  try {
    await Task.findByIdAndDelete(req.params.taskId);
    res.json({ message: 'Task deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:taskId/comments', verifyToken, async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const isOwner = task.assignedTo.toString() === req.userId;
    if (req.userRole !== 'admin' && !isOwner) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const text = (req.body.text || '').trim();
    if (!text) return res.status(400).json({ error: 'Comment cannot be empty' });

    task.comments.push({ userId: req.userId, text });
    await task.save();
    await task.populate('comments.userId', 'name');
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
