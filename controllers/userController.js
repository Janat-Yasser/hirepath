const Application = require('../models/Application');
const User = require('../models/User');

exports.dashboard = async (req, res) => {
  const applications = await Application.find({ applicant: req.user._id })
    .sort('-createdAt')
    .populate('job', 'title company location status')
    .lean();

  const stats = {
    total: applications.length,
    shortlisted: applications.filter((a) => a.status === 'shortlisted').length,
    pending: applications.filter((a) => a.status === 'pending').length,
    avgMatch: applications.length
      ? Math.round(applications.reduce((sum, a) => sum + a.matchScore, 0) / applications.length)
      : 0,
  };

  res.render('user/dashboard', { title: 'Your applications', applications, stats });
};

exports.profileForm = (req, res) => {
  res.render('user/profile', { title: 'Your profile', error: null, success: req.query.saved === '1' });
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, title, location, bio } = req.body;
    await User.findByIdAndUpdate(req.user._id, { name, title, location, bio });
    res.redirect('/user/profile?saved=1');
  } catch (err) {
    res.status(400).render('user/profile', {
      title: 'Your profile',
      error: err.message || 'Could not update your profile.',
      success: false,
    });
  }
};
