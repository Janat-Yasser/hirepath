const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema(
  {
    job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
    applicant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    coverLetter: { type: String, default: '' },
    resumePath: { type: String, required: true },
    resumeOriginalName: { type: String, default: '' },
    matchScore: { type: Number, default: 0 }, // 0-100, produced by resume analyzer
    matchedSkills: [{ type: String }],
    missingSkills: [{ type: String }],
    analyzerSummary: { type: String, default: '' },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'shortlisted', 'rejected', 'hired'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

applicationSchema.index({ job: 1, applicant: 1 }, { unique: true });

module.exports = mongoose.model('Application', applicationSchema);
