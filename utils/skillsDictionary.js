// A curated vocabulary of recognizable skills/technologies used to mine
// both resumes and job requirements for comparable, canonical skill tags.
// This keeps the matching engine deterministic and explainable (no black box),
// which matters for an admin who needs to trust and justify a match score.

const SKILLS = [
  // Languages
  'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'go', 'golang', 'rust',
  'php', 'ruby', 'swift', 'kotlin', 'scala', 'sql', 'html', 'css', 'sass', 'bash',
  // Frontend
  'react', 'redux', 'vue', 'angular', 'next.js', 'nextjs', 'nuxt', 'svelte',
  'tailwind', 'bootstrap', 'jquery', 'webpack', 'vite',
  // Backend / frameworks
  'node.js', 'nodejs', 'express', 'nestjs', 'django', 'flask', 'fastapi', 'spring',
  'spring boot', 'laravel', 'rails', 'graphql', 'rest', 'grpc', 'microservices',
  // Data / ML
  'machine learning', 'deep learning', 'nlp', 'pandas', 'numpy', 'scikit-learn',
  'tensorflow', 'pytorch', 'data analysis', 'data science', 'etl', 'spark', 'hadoop',
  'power bi', 'tableau', 'statistics',
  // Databases
  'mongodb', 'mongoose', 'postgresql', 'postgres', 'mysql', 'redis', 'elasticsearch',
  'firebase', 'dynamodb', 'sqlite', 'oracle',
  // DevOps / cloud
  'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'terraform', 'ci/cd', 'jenkins',
  'github actions', 'linux', 'nginx', 'devops',
  // Mobile
  'react native', 'flutter', 'ios', 'android', 'swiftui',
  // Design
  'figma', 'adobe xd', 'photoshop', 'illustrator', 'ui/ux', 'wireframing', 'prototyping',
  // Testing
  'jest', 'mocha', 'cypress', 'selenium', 'unit testing', 'qa',
  // PM / soft
  'agile', 'scrum', 'kanban', 'jira', 'confluence', 'project management',
  'communication', 'leadership', 'teamwork', 'problem solving', 'time management',
  'stakeholder management', 'public speaking', 'mentoring', 'negotiation',
  // Marketing / biz
  'seo', 'sem', 'content marketing', 'social media marketing', 'google analytics',
  'salesforce', 'crm', 'copywriting', 'email marketing', 'excel', 'accounting',
  'financial modeling', 'budgeting',
];

// Longer phrases must be checked before their substrings (e.g. "spring boot" before "spring").
const SORTED_SKILLS = [...SKILLS].sort((a, b) => b.length - a.length);

module.exports = { SKILLS, SORTED_SKILLS };
