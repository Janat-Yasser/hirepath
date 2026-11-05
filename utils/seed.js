// Copyright (c) 2026 Janat Yasser. All rights reserved.
require('dotenv').config();
const connectDB = require('../config/db');
const User = require('../models/User');
const Job = require('../models/Job');
const mongoose = require('mongoose');

const sampleJobs = [
  {
    title: 'Frontend Engineer',
    company: 'Northlight Studio',
    location: 'Remote',
    type: 'Full-time',
    department: 'Engineering',
    salaryMin: 80000,
    salaryMax: 110000,
    experienceLevel: 'Mid',
    description:
      'Build accessible, high-performance interfaces for our design tooling platform. You will own features end to end, from prototype to production.',
    responsibilities: [
      'Ship UI features in React with strong attention to detail',
      'Collaborate closely with design on interaction and motion',
      'Write tests and maintain component documentation',
    ],
    requirements: [
      '3+ years building production React applications',
      'Strong CSS and responsive layout skills',
      'Comfortable with TypeScript and REST APIs',
    ],
    skills: ['javascript', 'typescript', 'react', 'css', 'html', 'rest'],
  },
  {
    title: 'Backend Engineer (Node.js)',
    company: 'Northlight Studio',
    location: 'Berlin, Germany',
    type: 'Full-time',
    department: 'Engineering',
    salaryMin: 85000,
    salaryMax: 120000,
    experienceLevel: 'Senior',
    description:
      'Design and scale the services powering our marketplace. You will work across Node.js, MongoDB, and our deployment pipeline.',
    responsibilities: [
      'Design REST and GraphQL APIs',
      'Own data modeling in MongoDB',
      'Improve CI/CD and observability',
    ],
    requirements: [
      '4+ years with Node.js in production',
      'Experience with MongoDB or another document database',
      'Familiarity with Docker and CI/CD pipelines',
    ],
    skills: ['node.js', 'express', 'mongodb', 'docker', 'ci/cd', 'rest', 'graphql'],
  },
  {
    title: 'Data Analyst',
    company: 'Northlight Studio',
    location: 'New York, NY',
    type: 'Full-time',
    department: 'Data',
    salaryMin: 70000,
    salaryMax: 95000,
    experienceLevel: 'Entry',
    description:
      'Turn product and marketing data into decisions. You will build dashboards and partner with stakeholders across the company.',
    responsibilities: [
      'Build and maintain reporting dashboards',
      'Partner with marketing and product on key metrics',
      'Perform ad-hoc analysis to answer business questions',
    ],
    requirements: [
      'Strong SQL skills',
      'Experience with a BI tool such as Tableau or Power BI',
      'Comfortable presenting findings to non-technical stakeholders',
    ],
    skills: ['sql', 'tableau', 'power bi', 'data analysis', 'excel', 'statistics'],
  },
  {
    title: 'Product Designer',
    company: 'Northlight Studio',
    location: 'Remote',
    type: 'Contract',
    department: 'Design',
    salaryMin: 60000,
    salaryMax: 90000,
    experienceLevel: 'Mid',
    description:
      'Shape the end-to-end experience of our applicant-facing product, from research through polished, animated interfaces.',
    responsibilities: [
      'Run lightweight user research and synthesize findings',
      'Prototype flows in Figma',
      'Partner with engineering on implementation quality',
    ],
    requirements: [
      'A portfolio showing shipped product work',
      'Strong command of Figma and prototyping',
      'Experience with design systems',
    ],
    skills: ['figma', 'ui/ux', 'prototyping', 'wireframing'],
  },
];

(async () => {
  await connectDB();

  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@hirepath.dev').toLowerCase();
  let admin = await User.findOne({ email: adminEmail });
  if (!admin) {
    admin = await User.create({
      name: process.env.ADMIN_NAME || 'Admin',
      email: adminEmail,
      password: process.env.ADMIN_PASSWORD || 'Admin123!',
      role: 'admin',
    });
    console.log(`Created admin user: ${admin.email} / ${process.env.ADMIN_PASSWORD || 'Admin123!'}`);
  } else {
    console.log(`Admin user already exists: ${admin.email}`);
  }

  for (const jobData of sampleJobs) {
    const exists = await Job.findOne({ title: jobData.title, company: jobData.company });
    if (!exists) {
      await Job.create({ ...jobData, postedBy: admin._id });
      console.log(`Created job: ${jobData.title}`);
    }
  }

  console.log('Seed complete.');
  await mongoose.connection.close();
  process.exit(0);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
