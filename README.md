# HirePath

A full MVC job portal built with Node.js, Express, MongoDB and EJS — with role-based auth (candidate/admin), an admin dashboard for posting jobs and reviewing applicants, and an AI-assisted resume matching engine that scores every application against a job's requirements the moment it's submitted.

## Features

- **Auth** — JWT (httpOnly cookie) based registration/login for two roles: `user` (candidate) and `admin` (recruiter).
- **Public job board** — search and filter by keyword, location, and employment type.
- **Candidate flow** — apply with a resume upload (PDF/DOC/DOCX/TXT) and optional cover note; track application status and match score from a personal dashboard.
- **Admin flow** — post/edit/delete jobs with structured requirements and skill tags; review applicants ranked by AI match score; update application status; download resumes.
- **AI resume matching** — `utils/resumeAnalyzer.js` extracts text from resumes (native PDF parsing via `pdf-parse`), mines a curated skills vocabulary from both the resume and the job posting, and blends explicit skill coverage with NLP-based text similarity (stemmed token overlap via `natural`) into a single, explainable 0–100 match score with matched/missing skill breakdowns.

### Standout / unprecedented features

- **Personalized job board** — once a candidate has applied at least once, every job card on `/jobs` shows *their own* live match % against that role, computed from their saved skills profile. A "✨ Best match for you" sort re-ranks the entire board around it.
- **Skill-gap radar chart** — the job detail page renders an animated SVG radar chart plotting the candidate's saved skills against the role's key requirements, colour-coded matched (green) vs. missing (red) — an at-a-glance "here's exactly what to brush up on" view.
- **Drag-and-drop hiring pipeline (Kanban board)** — `/admin/jobs/:id/pipeline` turns applicant review into a Trello-style board (Pending → Reviewed → Shortlisted → Rejected → Hired). Dragging a card calls a JSON endpoint and updates instantly with no page reload, with a confetti burst when someone is shortlisted or hired.
- **Command palette (⌘K / Ctrl+K)** — a global, keyboard-driven quick-search overlay (top right of every page) that live-searches open jobs and jumps to any page, no mouse required.

### Motion & visual design

- Bright blue/green SaaS palette with a wave-divided hero and a realistic in-browser "product preview" mockup (not a stock illustration).
- A restrained signature motion layer: a soft cursor-following glow, magnetic buttons, 3D tilt cards, a kinetic gradient headline sweep, a subtle film-grain texture over the whole UI, and scroll-triggered reveals — built with plain CSS/vanilla JS, no animation framework dependency.

## Tech stack

- **Backend**: Node.js, Express (MVC: `models/`, `views/`, `controllers/`, `routes/`)
- **Database**: MongoDB via Mongoose
- **Views**: EJS + `express-ejs-layouts`
- **Auth**: JSON Web Tokens in an httpOnly cookie, `bcryptjs` password hashing
- **Uploads**: `multer` (disk storage, 5MB limit, PDF/DOC/DOCX/TXT only)
- **AI/NLP**: `pdf-parse` for text extraction, `natural` for tokenization/stemming and similarity scoring, plus a curated skill dictionary for explainable skill matching

## Project structure

```
job-portal/
├── config/db.js            # MongoDB connection
├── controllers/            # Route handlers (auth, jobs, admin, user)
├── middleware/              # JWT auth guard + resume upload (multer)
├── models/                  # User, Job, Application (Mongoose schemas)
├── routes/                  # authRoutes, jobRoutes, adminRoutes, userRoutes
├── utils/
│   ├── resumeAnalyzer.js    # the AI matching engine
│   ├── skillsDictionary.js  # curated skill vocabulary used for matching
│   └── seed.js              # creates an admin user + sample jobs
├── views/                    # EJS templates (partials/, auth/, jobs/, admin/, user/)
├── public/css/style.css      # design system + components
├── public/js/main.js         # scroll reveal, gauge animation, file-drop UX
├── uploads/resumes/          # uploaded resumes (gitignored, kept via .gitkeep)
└── server.js                 # app entry point
```

## Getting started

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   ```
   Then edit `.env`:
   - `MONGO_URI` — your MongoDB connection string (local or Atlas)
   - `JWT_SECRET` — a long random string
   - `ADMIN_EMAIL` / `ADMIN_PASSWORD` — credentials for the seeded admin account
   - `RECRUITER_SIGNUP_CODE` — invite code required to self-register as a recruiter. If it's blank, recruiter sign-up is only open when `NODE_ENV=development`

3. **Make sure MongoDB is running**, then seed an admin user and a few sample jobs:
   ```bash
   npm run seed
   ```

4. **Start the app**
   ```bash
   npm run dev     # with nodemon
   # or
   npm start
   ```

5. Visit `http://localhost:3000`. Log in with the seeded admin (`admin@hirepath.dev` / `Admin123!` by default) to post jobs and review applicants, or register a candidate account to browse jobs and apply.

## How the match score works

For each application, `analyzeResumeFile()`:

1. Extracts plain text from the uploaded resume.
2. Scans both the resume and the job's description/requirements for skills from a curated vocabulary (`utils/skillsDictionary.js`), plus any explicit skill tags the admin added to the job.
3. Computes **skill coverage** = matched skills ÷ total job skills.
4. Computes a secondary **text relevance** signal using stemmed token overlap (Jaccard similarity) between the resume and the job's text.
5. Blends them (`70% skill coverage + 30% text relevance`) into a single 0–100 score, and returns the matched/missing skill lists so the admin sees *why* a candidate scored the way they did.

This keeps the matching fully explainable and self-contained — no external AI API calls or API keys required — while still being meaningfully smarter than a plain keyword `grep`.

## Notes & next steps

- DOC/DOCX text extraction is best-effort (a lightweight binary-noise filter, not a full OOXML parser); PDF and TXT resumes give the most accurate scores.
- Resume files are stored on local disk under `uploads/resumes/` and served only through an authenticated, ownership-checked admin route — not as raw static files.
- Hardening already in place: async errors can't crash the server, search input is escaped (no regex injection), query params are forced to strings (no NoSQL operator injection), safe post-login redirects, and rate-limited auth routes. Run `npm test` for the unit tests.
- Next steps for production: CSRF tokens on forms, uploads in object storage (S3/GCS), email verification.

## License

© 2026 Janat Yasser. All rights reserved. See [LICENSE](LICENSE).
