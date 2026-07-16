const Job = require('../models/Job');
const Application = require('../models/Application');
const { analyzeResumeFile, scoreSkillsAgainstJob, resolveJobSkills } = require('../utils/resumeAnalyzer');

exports.listJobs = async (req, res) => {
  const { q, location, type, sort } = req.query;
  const filter = { status: 'open' };

  if (q) {
    filter.$or = [
      { title: { $regex: q, $options: 'i' } },
      { company: { $regex: q, $options: 'i' } },
      { skills: { $regex: q, $options: 'i' } },
    ];
  }
  if (location) filter.location = { $regex: location, $options: 'i' };
  if (type) filter.type = type;

  let jobs = await Job.find(filter).sort('-createdAt').lean({ virtuals: true });

  // Unprecedented-for-a-job-board feature: candidates see THEIR OWN live match score
  // on every card, computed from the skills profile built from their last resume upload.
  const canPersonalize = req.user && req.user.role === 'user' && req.user.skills && req.user.skills.length;
  if (canPersonalize) {
    jobs = jobs.map((job) => {
      const { matchScore } = scoreSkillsAgainstJob(req.user.skills, job);
      return { ...job, personalMatch: matchScore };
    });
    if (sort === 'match') {
      jobs.sort((a, b) => (b.personalMatch ?? -1) - (a.personalMatch ?? -1));
    }
  }

  res.render('jobs/index', {
    title: 'Find your next role',
    jobs,
    canPersonalize,
    query: { q: q || '', location: location || '', type: type || '', sort: sort || '' },
  });
};

// Lightweight JSON search used by the command palette (Ctrl/Cmd+K).
exports.searchJobsJson = async (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q) return res.json([]);
  const jobs = await Job.find({
    status: 'open',
    $or: [
      { title: { $regex: q, $options: 'i' } },
      { company: { $regex: q, $options: 'i' } },
    ],
  })
    .select('title company location')
    .limit(6)
    .lean();
  res.json(jobs);
};

exports.showJob = async (req, res) => {
  const job = await Job.findById(req.params.id).populate('postedBy', 'name').lean({ virtuals: true });
  if (!job) {
    return res.status(404).render('error', { title: 'Job not found', code: 404, message: 'That job posting does not exist or was removed.' });
  }

  let existingApplication = null;
  let radar = null;

  if (req.user && req.user.role === 'user') {
    existingApplication = await Application.findOne({ job: job._id, applicant: req.user._id }).lean();

    // Skill-gap radar: only worth showing once we have a saved skills profile.
    if (req.user.skills && req.user.skills.length) {
      const jobSkills = resolveJobSkills(job).slice(0, 8);
      if (jobSkills.length >= 3) {
        const candidateSkills = req.user.skills.map((s) => s.toLowerCase());
        radar = jobSkills.map((skill) => ({
          skill,
          matched: candidateSkills.includes(skill),
        }));
      }
    }
  }

  res.render('jobs/show', {
    title: job.title,
    job,
    existingApplication,
    radar,
    applied: req.query.applied === '1',
    error: null,
  });
};

exports.applyToJob = async (req, res) => {
  const job = await Job.findById(req.params.id).lean({ virtuals: true });
  if (!job) {
    return res.status(404).render('error', { title: 'Job not found', code: 404, message: 'That job posting does not exist or was removed.' });
  }

  try {
    if (!req.file) {
      return res.status(400).render('jobs/show', {
        title: job.title,
        job,
        existingApplication: null,
        applied: false,
        error: 'Please attach a resume (PDF, DOC, DOCX or TXT).',
      });
    }

    const already = await Application.findOne({ job: job._id, applicant: req.user._id });
    if (already) {
      return res.redirect(`/jobs/${job._id}?applied=1`);
    }

    const analysis = await analyzeResumeFile(req.file.path, job);

    await Application.create({
      job: job._id,
      applicant: req.user._id,
      coverLetter: req.body.coverLetter || '',
      resumePath: req.file.path,
      resumeOriginalName: req.file.originalname,
      matchScore: analysis.matchScore,
      matchedSkills: analysis.matchedSkills,
      missingSkills: analysis.missingSkills,
      analyzerSummary: analysis.summary,
    });

    // Keep the applicant's profile skills/resume fresh from their most recent submission.
    const User = require('../models/User');
    await User.findByIdAndUpdate(req.user._id, {
      resumePath: req.file.path,
      resumeOriginalName: req.file.originalname,
      skills: analysis.resumeSkills,
    });

    res.redirect(`/jobs/${job._id}?applied=1`);
  } catch (err) {
    res.status(400).render('jobs/show', {
      title: job.title,
      job,
      existingApplication: null,
      applied: false,
      error: err.message || 'We could not process your application. Please try again.',
    });
  }
};
