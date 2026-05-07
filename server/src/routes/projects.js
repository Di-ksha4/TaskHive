const express = require('express');
const Project = require('../models/Project');
const Task = require('../models/Task');
const { verifyToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.post('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { title, description, deadline, members = [] } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Project title is required' });
    }

    // Always include the creator (admin) as a member so they can manage tasks within the project
    const memberSet = new Set([req.userId, ...members.map(String)]);

    const project = await Project.create({
      title: title.trim(),
      description: description || '',
      deadline,
      createdBy: req.userId,
      members: Array.from(memberSet),
    });
    await project.populate('createdBy members', 'name email role');
    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/', verifyToken, async (req, res) => {
  try {
    const filter = req.userRole === 'admin' ? {} : { members: req.userId };
    const projects = await Project.find(filter)
      .populate('createdBy', 'name email')
      .populate('members', 'name email role')
      .sort({ createdAt: -1 });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:projectId', verifyToken, async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId)
      .populate('createdBy', 'name email')
      .populate('members', 'name email role');
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const isMember = project.members.some((m) => m._id.toString() === req.userId);
    if (req.userRole !== 'admin' && !isMember) {
      return res.status(403).json({ error: 'Access denied' });
    }
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:projectId', verifyToken, requireAdmin, async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(
      req.params.projectId,
      req.body,
      { new: true },
    ).populate('createdBy members', 'name email role');
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:projectId', verifyToken, requireAdmin, async (req, res) => {
  try {
    await Project.findByIdAndDelete(req.params.projectId);
    await Task.deleteMany({ projectId: req.params.projectId });
    res.json({ message: 'Project and its tasks deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:projectId/members', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.body;
    const project = await Project.findByIdAndUpdate(
      req.params.projectId,
      { $addToSet: { members: userId } },
      { new: true },
    ).populate('members', 'name email role');
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:projectId/members/:memberId', verifyToken, requireAdmin, async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(
      req.params.projectId,
      { $pull: { members: req.params.memberId } },
      { new: true },
    ).populate('members', 'name email role');
    // Reassign or unset tasks of removed member? Keep it simple: leave the tasks, admin can reassign manually.
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
