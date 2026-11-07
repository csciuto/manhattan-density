// Density bands, change bands and the page's findings. Pure: no DOM. Unit-tested in tests/density.test.js.
// Bands follow Angel & Lamson-Hall's 1910/2010 plate, in persons per hectare of land.
var BANDS = [[0, 150, '--b0', '0–150'], [150, 300, '--b1', '150–300'], [300, 600, '--b2', '300–600'],
             [600, 1200, '--b3', '600–1,200'], [1200, 1e9, '--b4', '1,200–2,400']];
var CH = [[-1e9, -50, '--lossS', 'Down 50+'], [-50, -10, '--lossW', 'Down 10–50'], [-10, 10, '--flat', 'Within ±10'],
          [10, 50, '--gainW', 'Up 10–50'], [50, 150, '--gainS', 'Up 50–150'], [150, 1e9, '--gainX', 'Up 150+']];

function band(d) { return BANDS.findIndex(function (b) { return d >= b[0] && d < b[1]; }); }

// adds d10, d20 (persons per hectare), dd (change), cx/cy (shape center) and h (drawn height) to each tract
function enrich(T) {
  T.forEach(function (t) {
    t.d10 = t.ha > 0 ? t.p10 / t.ha : 0; t.d20 = t.ha > 0 ? t.p20 / t.ha : 0; t.dd = t.d20 - t.d10;
    var sx = 0, sy = 0, n = 0;
    t.rings.forEach(function (r) { r.forEach(function (p) { sx += p[0]; sy += p[1]; n++; }); });
    t.cx = sx / n; t.cy = sy / n; t.h = t.d20;
  });
  return T;
}

// population-weighted density: the density the typical resident lives at
function popWeighted(T, pop, dens) {
  return T.reduce(function (a, t) { return a + t[pop] * t[dens]; }, 0) / T.reduce(function (a, t) { return a + t[pop]; }, 0);
}

function findings(T) {
  return {
    same: T.filter(function (t) { return band(t.d10) === band(t.d20); }).length,
    up: T.filter(function (t) { return band(t.d20) > band(t.d10); }).length,
    down: T.filter(function (t) { return band(t.d20) < band(t.d10); }).length,
    max20: T.reduce(function (a, t) { return t.d20 > a.d20 ? t : a; }),
    pw10: popWeighted(T, 'p10', 'd10'),
    pw20: popWeighted(T, 'p20', 'd20'),
  };
}

if (typeof module !== 'undefined') module.exports = { BANDS, CH, band, enrich, popWeighted, findings };
