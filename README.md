# HirePath

[![CI](https://github.com/Janat-Yasser/hirepath/actions/workflows/ci.yml/badge.svg)](https://github.com/Janat-Yasser/hirepath/actions/workflows/ci.yml)

A job board where every application arrives with a match score, and the recruiter can see exactly why it got that score: which of the job's skills the resume covers and which it's missing. There are no external AI calls and no API keys; the matching runs in the app and is covered by tests.

Node.js · Express · MongoDB · EJS, server-rendered, with JWT auth.

## Two sides of the same board

| If you're a candidate | If you're a recruiter |
|---|---|
| Search jobs by keyword, location and type | Post jobs with requirements and skill tags |
| Apply with a resume (PDF, DOCX, DOC or TXT) and a cover note | See applicants ranked by match score, with matched and missing skills |
| After your first application, every job shows *your* match % and can be sorted by best fit | Move applicants through a drag-and-drop pipeline: Pending → Reviewed → Shortlisted → Rejected → Hired |
| A radar chart on each job shows your skills against its key requirements | Download resumes through an authenticated route; they're never public files |

There's also a keyboard command palette (**Ctrl+K** / **⌘K**) on every page for jumping to jobs and pages.

## How a score is made, worked through

Here's a real run of `scoreResumeAgainstJob()` from `utils/resumeAnalyzer.js` on a short example.

**The job.** *Junior ML Engineer*: "Build and deploy machine learning models…". Requirements: Python and SQL; PyTorch or TensorFlow; Docker. Skill tags: python, sql, pytorch, docker, aws.

**The resume.** "Projects in Python and PyTorch: trained a CNN for ECG beat classification. Wrote SQL queries for a hotel booking analysis. Built web apps with Node.js and Express."

1. **Find skills on both sides.** Both texts are scanned against a vocabulary of known skills in `utils/skillsDictionary.js`, matching whole words and phrases.
   - The job needs 7: the 5 tags, plus *machine learning* and *tensorflow* found in its text.
   - The resume shows python, pytorch, sql, node.js and express.
2. **Skill coverage** = 3 matched ÷ 7 needed = **0.43**.
3. **Text relevance:** Jaccard overlap of the stemmed words in the two texts. Here it's about **0.10**, because the texts share few words.
4. **Score** = 0.7 × coverage + 0.3 × relevance = **33 / 100**.
   - Matched: python, sql, pytorch. Missing: docker, aws, machine learning, tensorflow.
   - Summary shown to the recruiter: *"Weak match — only 3 of 7 key skills were found."*

That example also shows the scorer's main weakness. "PyTorch **or** TensorFlow" is treated as needing both, and "trained a CNN" doesn't count as *machine learning* because only listed phrases match. The score is easy to explain, but it's a keyword method, not a model that understands the resume.

## Security work

- Async errors can't crash the server.
- Search input is escaped, so it can't inject a regular expression.
- Query parameters are forced to strings, which blocks NoSQL operator injection.
- Redirects after sign-in only go to pages on the site.
- Sign-in routes are rate-limited.
- Recruiter sign-up needs an invite code (`RECRUITER_SIGNUP_CODE`). It's only open without one in development.
- Uploads are limited to 5 MB and to resume file types.

## Run it

Needs Node 18+ and MongoDB, local or Atlas.

```bash
npm install
cp .env.example .env     # set MONGO_URI, JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
npm run seed             # an admin account and sample jobs
npm start                # http://localhost:3000
npm test                 # resume analyzer and input-safety tests
```

## Code map

```
utils/resumeAnalyzer.js    text extraction, skill matching, scoring
utils/skillsDictionary.js  the skill vocabulary
utils/safe.js              input escaping helpers
controllers/  routes/      auth, jobs, admin, user
models/                    User, Job, Application (Mongoose)
views/                     EJS: landing, jobs, admin, user, auth
```

## What's not done

- DOCX and DOC text extraction is best-effort, so PDF and TXT resumes score most accurately.
- CSRF tokens, email verification and object storage for uploads are still to do.
- The matching would gain the most from synonyms and from reading "or" in requirements.

## License

© 2026 Janat Yasser. All rights reserved. See [LICENSE](LICENSE).
