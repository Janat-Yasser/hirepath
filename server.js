require('dotenv').config();
const express = require('express');
// Express 4 doesn't catch errors thrown in async handlers; without this, one failed
// DB query (bad id, invalid regex, DB blip) crashes the whole process.
require('express-async-errors');
const rateLimit = require('express-rate-limit');
const path = require('path');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const methodOverride = require('method-override');
const expressLayouts = require('express-ejs-layouts');

const connectDB = require('./config/db');
const { attachUser } = require('./middleware/auth');

const authRoutes = require('./routes/authRoutes');
const jobRoutes = require('./routes/jobRoutes');
const adminRoutes = require('./routes/adminRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();

// --- View engine ---
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'partials/layout');

// --- Core middleware ---
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(attachUser);

// Make a couple of small things available in every view.
app.use((req, res, next) => {
  res.locals.currentPath = req.path;
  next();
});

// --- Routes ---
app.get('/', async (req, res) => {
  const Job = require('./models/Job');
  let featuredJobs = [];
  try {
    featuredJobs = await Job.find({ status: 'open' }).sort('-createdAt').limit(3).lean({ virtuals: true });
  } catch (err) {
    featuredJobs = [];
  }
  res.render('landing', { title: 'HirePath — Hiring, matched by data', featuredJobs });
});
// Slow down password guessing and sign-up spam.
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: 'draft-7', legacyHeaders: false, skip: (req) => req.method === 'GET' });
app.use('/auth', authLimiter, authRoutes);
app.use('/jobs', jobRoutes);
app.use('/admin', adminRoutes);
app.use('/user', userRoutes);

// --- 404 ---
app.use((req, res) => {
  res.status(404).render('error', { title: 'Page not found', code: 404, message: "The page you're looking for doesn't exist." });
});

// --- Error handler ---
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  // Malformed ids (CastError) are just "not found", not server errors.
  const status = err.name === 'CastError' ? 404 : err.status || err.statusCode || 500;
  if (status >= 500) console.error(err);
  if (req.path.endsWith('.json') || req.xhr || (req.headers.accept || '').includes('application/json')) {
    return res.status(status).json({ error: status === 404 ? 'Not found' : 'Something went wrong' });
  }
  res.status(status).render('error', {
    title: status === 404 ? 'Page not found' : 'Something went wrong',
    code: status,
    message: status === 404
      ? "The page you're looking for doesn't exist."
      : process.env.NODE_ENV === 'production' ? 'An unexpected error occurred.' : err.message,
  });
});

const PORT = process.env.PORT || 3000;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`HirePath running on http://localhost:${PORT}`));
});

module.exports = app;
