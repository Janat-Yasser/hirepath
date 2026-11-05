// Copyright (c) 2026 Janat Yasser. All rights reserved.
const fs = require('fs');
const path = require('path');
const natural = require('natural');
const { SORTED_SKILLS } = require('./skillsDictionary');

const tokenizer = new natural.WordTokenizer();
const stopwords = new Set(natural.stopwords);

/**
 * Extract raw text from an uploaded resume file.
 * Supports PDF natively (pdf-parse) and plain text.
 * DOC/DOCX are read as best-effort text (binary noise is filtered out) since a full
 * OOXML parser is out of scope here - PDF or TXT is recommended for best accuracy.
 */
async function extractText(filePath) {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === '.pdf') {
    const pdfParse = require('pdf-parse');
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer);
    return data.text || '';
  }

  if (ext === '.txt') {
    return fs.readFileSync(filePath, 'utf8');
  }

  // Best-effort fallback for .doc/.docx: strip non-printable/binary noise.
  const raw = fs.readFileSync(filePath, 'latin1');
  return raw.replace(/[^\x20-\x7E\n]+/g, ' ');
}

// Escapes a string for safe use inside a RegExp.
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Scan free text for known skills using whole-word/phrase boundary matching.
 * Returns a de-duplicated array of canonical, lowercase skill names.
 */
function extractSkills(text) {
  const lower = ` ${text.toLowerCase()} `;
  const found = new Set();
  for (const skill of SORTED_SKILLS) {
    const pattern = new RegExp(`(?<![a-z0-9])${escapeRegex(skill)}(?![a-z0-9])`, 'i');
    if (pattern.test(lower)) found.add(skill);
  }
  return [...found];
}

// Tokenize, lowercase, strip stopwords/punctuation, and stem for similarity comparison.
function normalizedTokens(text) {
  const tokens = tokenizer.tokenize((text || '').toLowerCase());
  return tokens
    .filter((t) => /^[a-z]+$/.test(t) && !stopwords.has(t) && t.length > 2)
    .map((t) => natural.PorterStemmer.stem(t));
}

// Jaccard similarity between the stemmed token sets of two texts -> 0..1
function textSimilarity(textA, textB) {
  const setA = new Set(normalizedTokens(textA));
  const setB = new Set(normalizedTokens(textB));
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  for (const tok of setA) if (setB.has(tok)) intersection += 1;
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

// Resolves the canonical skill list for a job: explicit tags + anything minable
// from its free-text description/requirements.
function resolveJobSkills(job) {
  const jobRequirementText = [job.description, ...(job.requirements || [])].join('. ');
  const explicit = (job.skills || []).map((s) => s.toLowerCase());
  const mined = extractSkills(jobRequirementText);
  return [...new Set([...explicit, ...mined])];
}

/**
 * Lightweight matcher used for candidate-facing features (personalized job board
 * scores, the skill-gap radar) where we already have a saved skills list on the
 * profile and don't want to re-parse a resume file on every page view.
 */
function scoreSkillsAgainstJob(candidateSkills, job) {
  const skills = (candidateSkills || []).map((s) => s.toLowerCase());
  const jobSkills = resolveJobSkills(job);
  const matchedSkills = jobSkills.filter((s) => skills.includes(s));
  const missingSkills = jobSkills.filter((s) => !skills.includes(s));
  const matchScore = jobSkills.length
    ? Math.round((matchedSkills.length / jobSkills.length) * 100)
    : null; // null = not enough data to score (job has no skill tags yet)
  return { matchScore, matchedSkills, missingSkills, jobSkills };
}

/**
 * Core matching function: compares a resume against a job posting.
 * Combines:
 *   - skill coverage (explicit skill overlap - the strongest, most explainable signal)
 *   - textual relevance (stemmed token similarity between resume and job description)
 * into a single 0-100 match score, plus matched/missing skill lists for the admin UI.
 */
function scoreResumeAgainstJob(resumeText, job) {
  const resumeSkills = extractSkills(resumeText);
  const jobRequirementText = [job.description, ...(job.requirements || [])].join('. ');
  const jobSkills = resolveJobSkills(job);

  const matchedSkills = jobSkills.filter((s) => resumeSkills.includes(s));
  const missingSkills = jobSkills.filter((s) => !resumeSkills.includes(s));

  const skillCoverage = jobSkills.length > 0 ? matchedSkills.length / jobSkills.length : 0.5;
  const relevance = textSimilarity(resumeText, `${jobRequirementText} ${jobSkills.join(' ')}`);

  // Weighted blend: explicit skill overlap is the primary, explainable driver.
  const rawScore = skillCoverage * 0.7 + relevance * 0.3;
  const matchScore = Math.round(Math.min(1, rawScore) * 100);

  let summary;
  if (jobSkills.length === 0) {
    summary = 'This job has no defined skill tags yet, so the score reflects general text relevance only.';
  } else if (matchScore >= 80) {
    summary = `Strong match — the resume covers ${matchedSkills.length} of ${jobSkills.length} key skills.`;
  } else if (matchScore >= 50) {
    summary = `Partial match — the resume covers ${matchedSkills.length} of ${jobSkills.length} key skills.`;
  } else {
    summary = `Weak match — only ${matchedSkills.length} of ${jobSkills.length} key skills were found.`;
  }

  return { matchScore, matchedSkills, missingSkills, resumeSkills, summary };
}

/**
 * Convenience wrapper: reads a resume file from disk and scores it against a job.
 */
async function analyzeResumeFile(filePath, job) {
  const text = await extractText(filePath);
  const result = scoreResumeAgainstJob(text, job);
  return { ...result, rawTextLength: text.length };
}

module.exports = {
  extractText,
  extractSkills,
  resolveJobSkills,
  scoreSkillsAgainstJob,
  scoreResumeAgainstJob,
  analyzeResumeFile,
};
