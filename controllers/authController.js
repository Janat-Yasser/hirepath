const jwt = require('jsonwebtoken');
const User = require('../models/User');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

const sendTokenCookie = (res, userId) => {
  const token = signToken(userId);
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

exports.getRegister = (req, res) => {
  res.render('auth/register', { title: 'Create your account', error: null, values: {} });
};

exports.postRegister = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).render('auth/register', {
        title: 'Create your account',
        error: 'Please fill in every field.',
        values: { name, email },
      });
    }
    if (password.length < 6) {
      return res.status(400).render('auth/register', {
        title: 'Create your account',
        error: 'Password must be at least 6 characters.',
        values: { name, email },
      });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).render('auth/register', {
        title: 'Create your account',
        error: 'An account with that email already exists.',
        values: { name, email },
      });
    }

    // Only allow the 'admin' role to be self-assigned via a dedicated recruiter flow flag,
    // preventing arbitrary users from elevating themselves through form tampering.
    const safeRole = role === 'admin' && req.body.recruiterCode === process.env.RECRUITER_SIGNUP_CODE
      ? 'admin'
      : 'user';

    const user = await User.create({ name, email, password, role: safeRole });
    sendTokenCookie(res, user._id);
    res.redirect(user.role === 'admin' ? '/admin' : '/user/dashboard');
  } catch (err) {
    res.status(400).render('auth/register', {
      title: 'Create your account',
      error: err.message || 'Something went wrong. Please try again.',
      values: req.body,
    });
  }
};

exports.getLogin = (req, res) => {
  res.render('auth/login', { title: 'Welcome back', error: null, next: req.query.next || '' });
};

exports.postLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: (email || '').toLowerCase() }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).render('auth/login', {
        title: 'Welcome back',
        error: 'Incorrect email or password.',
        next: req.body.next || '',
      });
    }

    sendTokenCookie(res, user._id);
    const dest = req.body.next && req.body.next.startsWith('/')
      ? req.body.next
      : user.role === 'admin' ? '/admin' : '/user/dashboard';
    res.redirect(dest);
  } catch (err) {
    res.status(500).render('auth/login', {
      title: 'Welcome back',
      error: 'Something went wrong. Please try again.',
      next: '',
    });
  }
};

exports.logout = (req, res) => {
  res.clearCookie('token');
  res.redirect('/');
};
