// Copyright (c) 2026 Janat Yasser. All rights reserved.
const test = require('node:test');
const assert = require('node:assert/strict');
const { escapeRegex, str, safeNext } = require('../utils/safe');

test('escapeRegex makes user text a literal pattern', () => {
  for (const s of ['(', 'a+b', '[x]', 'c++', '(a+)+$', '.*']) {
    assert.ok(new RegExp(escapeRegex(s)).test(s), s);
  }
  assert.equal(new RegExp(escapeRegex('.*')).test('anything'), false);
});

test('str only accepts plain strings', () => {
  assert.equal(str('  hi  '), 'hi');
  assert.equal(str({ $ne: 'x' }), '');
  assert.equal(str(['a', 'b']), '');
  assert.equal(str(undefined), '');
  assert.equal(str('x'.repeat(500)).length, 200);
});

test('safeNext blocks open redirects', () => {
  assert.equal(safeNext('/jobs/123'), '/jobs/123');
  assert.equal(safeNext('//evil.com'), null);
  assert.equal(safeNext('/\\evil.com'), null);
  assert.equal(safeNext('https://evil.com'), null);
  assert.equal(safeNext(undefined), null);
});
