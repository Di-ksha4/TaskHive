const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const taskRoutes = require('./routes/tasks');
const notificationRoutes = require('./routes/notifications');
const analyticsRoutes = require('./routes/analytics');
const userRoutes = require('./routes/users');
const { errorHandler } = require('./middleware/errorHandler');

dotenv.config();

if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  console.error('JWT_SECRET must be set in production. Exiting.');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

connectDB(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/taskhive');

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(morgan('dev'));
app.use(rateLimit({ windowMs: 60 * 1000, max: 120, standardHeaders: true, legacyHeaders: false }));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`TaskHive API listening on port ${PORT}`);
});
