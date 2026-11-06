# Manhattan Tract Density

**Live:** [corey.sciu.to/manhattan-density](https://corey.sciu.to/manhattan-density/)

Manhattan's census tracts drawn in 3D by density in 2010 and 2020, updating Angel and Lamson-Hall's 1910/2010 plate.

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
