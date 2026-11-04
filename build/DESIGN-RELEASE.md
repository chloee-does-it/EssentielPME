# Production design release — 2026-11-04

Approved staging design: 1cd199e. Production base: 5b872e5.

`node build/build.mjs` first generates the production pages, then applies
`design-release.mjs`. Approved visual templates live in `build/design/`.
Do not copy `preview-home/` directly onto production: its forms are disabled,
its calendar is a placeholder and its pages are noindex.

The overlay retains production contact and confirmation bodies, guide forms,
downloads, legal text, consent markup, GTM loader, integration modules,
canonical and alternate-language links. Industry layouts restore native booking
dialogs and selected-plan hooks. Private and guide pages retain their noindex.
New public pages are added to sitemap.xml. Domain routing and API configuration
are unchanged.

Validation performed before deployment:
- 46 HTML pages; zero missing local link/asset targets.
- Existing form HTML is identical to the previous production version.
- Existing canonical/hreflang links and private noindex directives retained.
- One consent banner per page; denied Consent Mode defaults present.
- main.js, config.js, industry-landing.mjs and booking modules unchanged.
- 17 existing assertions passed across tracking, plan-context, schedule and
  native-integration suites, executed through an awaited assertion harness.
- Browser checks: cookie refusal, guide-form required-field validation,
  industry booking dialog opening. Local calendar requests are origin-restricted;
  real availability must be verified on the production origin after deployment.

No test lead, email or calendar invitation was submitted during preflight.
Rollback: restore the previous site/build tree from 5b872e5 and push a normal
revert commit, or select the previous healthy DigitalOcean deployment.
