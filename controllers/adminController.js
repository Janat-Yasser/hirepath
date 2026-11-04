const { escapeRegex } = require('../utils/safe');
const Job = require('../models/Job');
const Application = require('../models/Application');
const User = require('../models/User');

exports.dashboard = async (req, res) => {
  const [jobCount, openJobCount, applicationCount, users] = await Promise.all([
    Job.countDocuments({ postedBy: req.user._id }),
    Job.countDocuments({ postedBy: req.user._id, status: 'open' }),
    Application.countDocuments({ job: { $in: await Job.find({ postedBy: req.user._id }).distinct('_id') } }),
    User.countDocuments({ role: 'user' }),
  ]);

  const myJobIds = await Job.find({ postedBy: req.user._id }).distinct('_id');
  const recentApplications = await Application.find({ job: { $in: myJobIds } })
    .sort('-matchScore -createdAt')
    .limit(6)
    .populate('applicant', 'name email')
    .populate('job', 'title')
    .lean();

  const jobs = await Job.find({ postedBy: req.user._id }).sort('-createdAt').lean({ virtuals: true });

  // Application counts per job, for the mini bar chart on the dashboard.
  const perJobCounts = await Application.aggregate([
    { $match: { job: { $in: myJobIds } } },
    { $group: { _id: '$job', count: { $sum: 1 }, avgScore: { $avg: '$matchScore' } } },
  ]);
  const countsByJob = Object.fromEntries(perJobCounts.map((c) => [String(c._id), c]));
  const jobsWithStats = jobs.map((j) => ({
    ...j,
    applicationCount: countsByJob[String(j._id)]?.count || 0,
    avgMatchScore: Math.round(countsByJob[String(j._id)]?.avgScore || 0),
  }));

  res.render('admin/dashboard', {
    title: 'Admin dashboard',
    stats: { jobCount, openJobCount, applicationCount, candidateCount: users },
    jobs: jobsWithStats,
    recentApplications,
  });
};

exports.newJobForm = (req, res) => {
  res.render('admin/job-form', { title: 'Post a new job', job: null, error: null });
};

exports.createJob = async (req, res) => {
  try {
    const payload = buildJobPayload(req.body);
    payload.postedBy = req.user._id;
    const job = await Job.create(payload);
    res.redirect(`/admin/jobs/${job._id}/applications`);
  } catch (err) {
    res.status(400).render('admin/job-form', {
      title: 'Post a new job',
      job: req.body,
      error: err.message || 'Could not create the job. Check the fields and try again.',
    });
  }
};

exports.editJobForm = async (req, res) => {
  const job = await Job.findOne({ _id: req.params.id, postedBy: req.user._id }).lean();
  if (!job) return res.status(404).render('error', { title: 'Not found', code: 404, message: 'Job not found.' });
  res.render('admin/job-form', { title: 'Edit job', job, error: null });
};

exports.updateJob = async (req, res) => {
  try {
    const payload = buildJobPayload(req.body);
    const job = await Job.findOneAndUpdate({ _id: req.params.id, postedBy: req.user._id }, payload, {
      new: true,
      runValidators: true,
    });
    if (!job) return res.status(404).render('error', { title: 'Not found', code: 404, message: 'Job not found.' });
    res.redirect('/admin');
  } catch (err) {
    res.status(400).render('admin/job-form', {
      title: 'Edit job',
      job: { ...req.body, _id: req.params.id },
      error: err.message || 'Could not update the job. Check the fields and try again.',
    });
  }
};

exports.deleteJob = async (req, res) => {
  await Job.findOneAndDelete({ _id: req.params.id, postedBy: req.user._id });
  await Application.deleteMany({ job: req.params.id });
  res.redirect('/admin');
};

exports.viewApplications = async (req, res) => {
  const job = await Job.findOne({ _id: req.params.id, postedBy: req.user._id }).lean({ virtuals: true });
  if (!job) return res.status(404).render('error', { title: 'Not found', code: 404, message: 'Job not found.' });

  const sortParam = req.query.sort === 'recent' ? '-createdAt' : '-matchScore';
  const applications = await Application.find({ job: job._id })
    .sort(sortParam)
    .populate('applicant', 'name email title location skills')
    .lean();

  res.render('admin/applications', {
    title: `Applicants — ${job.title}`,
    job,
    applications,
    sort: req.query.sort === 'recent' ? 'recent' : 'match',
  });
};

exports.updateApplicationStatus = async (req, res) => {
  const application = await Application.findById(req.params.appId).populate('job');
  if (!application || String(application.job.postedBy) !== String(req.user._id)) {
    return res.status(404).render('error', { title: 'Not found', code: 404, message: 'Application not found.' });
  }
  application.status = req.body.status;
  await application.save();
  res.redirect(`/admin/jobs/${application.job._id}/applications`);
};

const PIPELINE_STAGES = ['pending', 'reviewed', 'shortlisted', 'rejected', 'hired'];

exports.viewPipeline = async (req, res) => {
  const job = await Job.findOne({ _id: req.params.id, postedBy: req.user._id }).lean({ virtuals: true });
  if (!job) return res.status(404).render('error', { title: 'Not found', code: 404, message: 'Job not found.' });

  const applications = await Application.find({ job: job._id })
    .sort('-matchScore')
    .populate('applicant', 'name email')
    .lean();

  const columns = PIPELINE_STAGES.map((stage) => ({
    stage,
    applications: applications.filter((a) => a.status === stage),
  }));

  res.render('admin/pipeline', {
    title: `Pipeline — ${job.title}`,
    job,
    columns,
  });
};

// Drag-and-drop status change used by the Kanban board — no page reload, JSON in/out.
exports.moveApplication = async (req, res) => {
  const application = await Application.findById(req.params.appId).populate('job');
  if (!application || String(application.job.postedBy) !== String(req.user._id)) {
    return res.status(404).json({ error: 'Application not found.' });
  }
  if (!PIPELINE_STAGES.includes(req.body.status)) {
    return res.status(400).json({ error: 'Invalid status.' });
  }
  application.status = req.body.status;
  await application.save();
  res.json({ success: true, status: application.status });
};

exports.downloadResume = async (req, res) => {
  const path = require('path');
  const fs = require('fs');

  // Locate by filename against this admin's own jobs to prevent path traversal / cross-tenant access.
  const myJobIds = await Job.find({ postedBy: req.user._id }).distinct('_id');
  // Stored names are "<timestamp>-<random>.<ext>"; reject anything else outright.
  const filename = String(req.params.filename);
  if (!/^[\w-]+\.(pdf|txt|docx?)$/i.test(filename)) {
    return res.status(404).render('error', { title: 'Not found', code: 404, message: 'Resume not found.' });
  }
  const match = await Application.findOne({
    job: { $in: myJobIds },
    resumePath: { $regex: `[\\/]${escapeRegex(filename)}$` },
  });

  if (!match) {
    return res.status(404).render('error', { title: 'Not found', code: 404, message: 'Resume not found.' });
  }

  const absolutePath = path.resolve(match.resumePath);
  if (!fs.existsSync(absolutePath)) {
    return res.status(404).render('error', { title: 'Not found', code: 404, message: 'Resume file is missing on disk.' });
  }
  res.download(absolutePath, match.resumeOriginalName || 'resume');
};

function buildJobPayload(body) {
  const toList = (val) =>
    (val || '')
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

  return {
    title: body.title,
    company: body.company,
    location: body.location,
    type: body.type,
    department: body.department,
    salaryMin: Number(body.salaryMin) || 0,
    salaryMax: Number(body.salaryMax) || 0,
    experienceLevel: body.experienceLevel,
    description: body.description,
    responsibilities: toList(body.responsibilities),
    requirements: toList(body.requirements),
    skills: toList(body.skills).map((s) => s.toLowerCase()),
    status: body.status === 'closed' ? 'closed' : 'open',
    deadline: body.deadline || null,
  };
}
