# Manhattan Tract Density

**Live:** [corey.sciu.to/manhattan-density](https://corey.sciu.to/manhattan-density/)

How it's built: [ARCHITECTURE.md](ARCHITECTURE.md).

Built with [Claude Code](https://claude.com/claude-code).

Manhattan's census tracts drawn in 3D by density in 2010 and 2020, updating Angel and Lamson-Hall's 1910/2010 plate.

## Data and checks

Populations are the NYC Department of City Planning's 2010–2020 Census workbook, with 2010 counts re-tabulated
to the 2020 tracts, divided by each tract's land area. The tests confirm the totals match the Census and that the
2010 picture agrees with Angel and Lamson-Hall's *The Rise and Fall of Manhattan's Densities, 1800–2010* (2014)
wherever their built-block definition of density allows a comparison.

## Development

No build step: plain HTML, CSS and JavaScript. Each push to `main` runs the tests in GitHub Actions and, if they
pass, publishes to GitHub Pages with a version stamp.

```bash
npm run serve                                     # http://localhost:8090
npm install && npx playwright install chromium   # first time only
npm test                                          # unit tests (node --test)
npm run test:e2e                                  # browser tests, desktop and phone, with accessibility checks
npm run screenshot                                # refreshes preview.png, used for link previews
```
