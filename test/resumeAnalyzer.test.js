// Copyright (c) 2026 Janat Yasser. All rights reserved.
const test = require('node:test');
const assert = require('node:assert/strict');
const { scoreResumeAgainstJob, scoreSkillsAgainstJob } = require('../utils/resumeAnalyzer');

const job = {
  title: 'Backend Developer',
  description: 'Build REST APIs with Node.js and Express backed by MongoDB.',
  requirements: ['Node.js', 'Express', 'MongoDB', 'Docker'],
  skills: ['node.js', 'express', 'mongodb', 'docker'],
};

test('a matching resume scores higher than an unrelated one', () => {
  const good = scoreResumeAgainstJob('Backend engineer: Node.js, Express, MongoDB, Docker, REST APIs.', job);
  const bad = scoreResumeAgainstJob('Pastry chef with 10 years of experience in French desserts.', job);
  assert.ok(good.matchScore > bad.matchScore, `${good.matchScore} <= ${bad.matchScore}`);
  assert.ok(good.matchScore >= 0 && good.matchScore <= 100);
});

test('missing skills are reported', () => {
  const r = scoreSkillsAgainstJob(['node.js', 'express'], job);
  assert.ok(r.matchScore < 100);
  assert.ok(Array.isArray(r.missingSkills) && r.missingSkills.length > 0);
});
