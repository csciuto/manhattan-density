// The data and the page's claims, checked against the Census and against the earlier work: run with `node --test`.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { TRACTS } = require('../tracts.js');
const D = require('../density.js');

const T = D.enrich(JSON.parse(JSON.stringify(TRACTS)));
const F = D.findings(T);
const sum = (k) => T.reduce((a, t) => a + t[k], 0);
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

// ---- against the Census --------------------------------------------------------------------------------------
test('310 tracts, the 2020 tract set for Manhattan', () => {
  assert.equal(T.length, 310);
  assert.equal(new Set(T.map((t) => t.id)).size, 310);
});

test('populations add up to the official Census counts for Manhattan', () => {
  assert.equal(sum('p10'), 1585873);   // 2010 Census, re-tabulated by NYC City Planning to 2020 tracts
  assert.equal(sum('p20'), 1694251);   // 2020 Census
});

// ---- against Angel & Lamson-Hall (2014), the 1910/2010 work this updates ------------------------------------
// They divide by the area of built city blocks (no streets or parks); this page divides by each tract's land.
// So the two can't match exactly, but they should agree wherever the difference in definitions allows.
test("2010 average density sits below their 350 p/ha by about Manhattan's share of streets and parks", () => {
  const avg = sum('p10') / sum('ha');
  assert.ok(Math.abs(avg - 270.3) < 0.1, `land-area average ${avg}`);
  const ratio = avg / 350;
  assert.ok(ratio > 0.65 && ratio < 0.85, `ratio to their built-block figure: ${ratio}`);
});

test('residential neighborhoods average within their 2010 figure of 329 ± 23 p/ha', () => {
  const by = {};
  for (const t of T) { by[t.nta] = by[t.nta] || [0, 0]; by[t.nta][0] += t.p10; by[t.nta][1] += t.ha; }
  const res = Object.values(by).filter(([p]) => p > 10000).map(([p, ha]) => p / ha);
  const mean = res.reduce((a, b) => a + b, 0) / res.length;
  assert.ok(mean >= 329 - 23 && mean <= 329 + 23, `mean of ${res.length} residential neighborhoods: ${mean}`);
});

test("no 2010 or 2020 tract reaches 1910's top band (1,200–2,400 p/ha)", () => {
  assert.equal(T.filter((t) => D.band(t.d10) === 4 || D.band(t.d20) === 4).length, 0);
});

// ---- the page's own claims ----------------------------------------------------------------------------------
test('"270 of 310 tracts stay in the same band", as the page says', () => {
  assert.equal(F.same, 270);
  assert.match(html, /<b>270 of 310 tracts<\/b>/);
  assert.equal(F.same + F.up + F.down, 310);
});

test('findings match the original version of the page', () => {
  assert.equal(F.up, 32);   // values read from the original page's findings strip
  assert.equal(F.down, 8);
  assert.equal(F.max20.id, '154.03');
  assert.equal(Math.round(F.max20.d20), 1110);
  assert.equal(Math.round(F.pw10), 403);
  assert.equal(Math.round(F.pw20), 417);
});

test('every density lands in exactly one band, every change in one change band', () => {
  for (const t of T) {
    assert.ok(D.band(t.d10) >= 0 && D.band(t.d20) >= 0, t.id);
    assert.equal(D.CH.filter((c) => t.dd >= c[0] && t.dd < c[1]).length, 1, t.id);
  }
});
