// Copyright (c) 2026 Janat Yasser. All rights reserved.
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Reads the JWT from the httpOnly cookie (if present) and attaches req.user + res.locals.user.
// Never blocks the request - use `protect` for that.
const attachUser = async (req, res, next) => {
  try {
    const token = req.cookies && req.cookies.token;
    if (!token) {
      res.locals.user = null;
      return next();
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    req.user = user || null;
    res.locals.user = user || null;
    next();
  } catch (err) {
    res.locals.user = null;
    req.user = null;
    next();
  }
};

// Requires a logged-in user. Redirects to login with a return path.
const protect = (req, res, next) => {
  if (!req.user) {
    req.session_redirect = req.originalUrl;
    return res.redirect(`/auth/login?next=${encodeURIComponent(req.originalUrl)}`);
  }
  next();
};

// Requires a logged-in user with one of the allowed roles.
const restrictTo = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.redirect(`/auth/login?next=${encodeURIComponent(req.originalUrl)}`);
  }
  if (!roles.includes(req.user.role)) {
    return res.status(403).render('error', {
      title: 'Access denied',
      code: 403,
      message: "You don't have permission to view this page.",
    });
  }
  next();
};

module.exports = { attachUser, protect, restrictTo };
