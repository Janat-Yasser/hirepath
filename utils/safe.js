// Copyright (c) 2026 Janat Yasser. All rights reserved.
// Small input-safety helpers shared by controllers.

// Escape user text so it can be used inside a RegExp / Mongo $regex as a literal.
const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Query-string values can arrive as arrays/objects (?q[$ne]=x). Only accept plain strings.
const str = (v, max = 200) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

// Only allow same-site relative redirects like "/jobs/123" (not "//evil.com" or "/\\evil.com").
const safeNext = (next) =>
  typeof next === 'string' && /^\/(?![/\\])/.test(next) ? next : null;

module.exports = { escapeRegex, str, safeNext };
