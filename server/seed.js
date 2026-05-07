const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

const User = require('./src/models/User');
const Project = require('./src/models/Project');
const Task = require('./src/models/Task');
const Notification = require('./src/models/Notification');

dotenv.config();

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/taskhive');
    console.log('Connected. Clearing old data...');

    await Promise.all([
      User.deleteMany({}),
      Project.deleteMany({}),
      Task.deleteMany({}),
      Notification.deleteMany({}),
    ]);

    const adminHash = await bcrypt.hash('admin123', 10);
    const memberHash = await bcrypt.hash('member123', 10);

    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@taskhive.com',
      password: adminHash,
      role: 'admin',
    });

    const john = await User.create({
      name: 'John Doe',
      email: 'john@taskhive.com',
      password: memberHash,
      role: 'member',
    });

    const jane = await User.create({
      name: 'Jane Smith',
      email: 'jane@taskhive.com',
      password: memberHash,
      role: 'member',
    });

    const project1 = await Project.create({
      title: 'Website Redesign',
      description: 'Refresh the marketing site with a new layout and copy.',
      createdBy: admin._id,
      members: [admin._id, john._id, jane._id],
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    const project2 = await Project.create({
      title: 'Mobile App MVP',
      description: 'Ship the first usable build of the iOS/Android app.',
      createdBy: admin._id,
      members: [admin._id, john._id],
    });

    await Task.insertMany([
      {
        title: 'Fix login crash on Safari',
        description: 'Reported by 3 users; reproduce and patch.',
        assignedTo: john._id,
        projectId: project1._id,
        priority: 'high',
        status: 'in-progress',
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      },
      {
        title: 'Design new homepage hero',
        description: 'High-fidelity mockup, two variants.',
        assignedTo: jane._id,
        projectId: project1._id,
        priority: 'medium',
        status: 'todo',
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      },
      {
        title: 'Set up CI for the mobile build',
        description: 'GitHub Actions workflow with caching.',
        assignedTo: john._id,
        projectId: project2._id,
        priority: 'medium',
        status: 'completed',
      },
      {
        title: 'Write API integration notes',
        description: 'Endpoints, headers, and edge cases.',
        assignedTo: john._id,
        projectId: project2._id,
        priority: 'low',
        status: 'todo',
        dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      },
    ]);

    console.log('Seed complete.');
    console.log('Admin login: admin@taskhive.com / admin123');
    console.log('Member login: john@taskhive.com / member123');
    console.log('Member login: jane@taskhive.com / member123');
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
};

run();
