// Copyright (c) 2026 Janat Yasser. All rights reserved.
const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'Job title is required'], trim: true },
    company: { type: String, required: [true, 'Company name is required'], trim: true },
    location: { type: String, required: [true, 'Location is required'], trim: true },
    type: {
      type: String,
      enum: ['Full-time', 'Part-time', 'Contract', 'Internship', 'Remote'],
      default: 'Full-time',
    },
    department: { type: String, default: 'General' },
    salaryMin: { type: Number, default: 0 },
    salaryMax: { type: Number, default: 0 },
    description: { type: String, required: [true, 'Description is required'] },
    responsibilities: [{ type: String }],
    requirements: [{ type: String }], // free text requirements, also mined for skills
    skills: [{ type: String }], // canonical skill tags used for matching
    experienceLevel: {
      type: String,
      enum: ['Entry', 'Mid', 'Senior', 'Lead'],
      default: 'Mid',
    },
    status: { type: String, enum: ['open', 'closed'], default: 'open' },
    deadline: { type: Date },
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

jobSchema.virtual('salaryLabel').get(function salaryLabel() {
  if (!this.salaryMin && !this.salaryMax) return 'Competitive';
  const fmt = (n) => `$${Math.round(n / 1000)}k`;
  if (this.salaryMin && this.salaryMax) return `${fmt(this.salaryMin)} - ${fmt(this.salaryMax)}`;
  return fmt(this.salaryMin || this.salaryMax);
});

jobSchema.set('toObject', { virtuals: true });
jobSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Job', jobSchema);
