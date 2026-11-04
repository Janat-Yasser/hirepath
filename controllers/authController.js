const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { safeNext } = require('../utils/safe');

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
    // Recruiter (admin) sign-up needs the invite code. With no code configured, open recruiter
    // sign-up is allowed ONLY in development, never in production.
    const code = process.env.RECRUITER_SIGNUP_CODE;
    const recruiterAllowed = code
      ? req.body.recruiterCode === code
      : process.env.NODE_ENV === 'development';
    const safeRole = role === 'admin' && recruiterAllowed ? 'admin' : 'user';

    const user = await User.create({ name, email, password, role: safeRole });
    sendTokenCookie(res, user._id);
    res.redirect(user.role === 'admin' ? '/admin' : '/user/dashboard');
  } catch (err) {
    res.status(400).render('auth/register', {
      title: 'Create your account',
      error: err.name === 'ValidationError'
        ? Object.values(err.errors).map((e) => e.message).join(' ')
        : 'Something went wrong. Please try again.',
      values: { name: req.body.name, email: req.body.email },
    });
  }
};

exports.getLogin = (req, res) => {
  res.render('auth/login', { title: 'Welcome back', error: null, next: safeNext(req.query.next) || '' });
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
    const dest = safeNext(req.body.next) || (user.role === 'admin' ? '/admin' : '/user/dashboard');
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
