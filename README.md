# Falak Portfolio Platform — MVP Prototype

A frontend-only, bilingual (English/Arabic, RTL-aware) prototype of Falak Ventures'
portfolio monitoring and investor-reporting platform. Built with Next.js (App Router),
React, TypeScript and Tailwind CSS.

> **Prototype only.** All data is synthetic mock data. There is **no real authentication
> or authorization** and **no backend, API or database** — nothing entered here is sent
> to or stored on a server. The "Falak Admin", "Investor" and "Startup" views are
> simulated roles for design review, not access controls. Startup submissions and
> review/approval actions are simulated in memory and reset on reload.

## Requirements
Node.js 24.x and npm. No environment variables are needed.

## Local setup
```bash
npm ci
npm run dev      # http://localhost:3000
npm run lint
npm run build
npm start        # serve the production build
```

## Routes
| Route | Simulated role | Purpose |
|---|---|---|
| `/` | Falak Admin (demo) | Landing page |
| `/admin` | Falak Admin (demo) | Portfolio overview: KPIs, reporting status, filterable companies |
| `/company` | Falak Admin (demo) | Cross-period company reports register |
| `/company/[slug]?period=` | Falak Admin (demo) | Company report; an invalid or missing period falls back to the latest |
| `/vehicle` | Falak Admin (demo) | Investment vehicle directory |
| `/vehicle/[slug]` | Falak Admin (demo) | Vehicle dashboard |
| `/investor` | Investor (demo) | Read-only investor view (approved/published reports only) |
| `/submit` | Startup (demo) | Demo company/period selector |
| `/submit/[slug]?period=` | Startup (demo) | Reporting form; draft and submit are simulated locally |
| `/review` | Falak Admin (demo) | Review & approval workspace (in-memory transitions) |

Unknown routes show a bilingual 404.

## Limitations
- No authentication, authorization or user accounts; role labels are cosmetic.
- No backend or database; all edits are local component state and reset on reload.
- Startup reporting and review/approval are simulated; nothing is submitted anywhere.
- Two mock reporting periods (Q1 and Q2 2026); no charts or exports.

## Notes
- Mock data lives in `src/lib/mock`. Overdue and "last updated" logic uses a fixed
  snapshot date (2026-09-09), not the live clock.
- Revenue is never summed across currencies.
- The only data stored is the language and theme preference (browser `localStorage`).
- `references/` contains confidential source material. It is excluded from Git
  (`.gitignore`) and from CLI uploads (`.vercelignore`), and it was **not** used to seed
  the synthetic mock data.
- Fonts: Jost, Inter and Cairo (Google Fonts, fetched at build time) are placeholders;
  Alexandria (OFL) is bundled. Brand fonts await licensing — see `PROTOTYPE_NOTES.md`.

## Deployment (Vercel)
The required path for this project is: put the code in a **private** Git repository, then
connect that repository to Vercel. Vercel supports other deployment methods, but they are
not used here; `.vercelignore` exists only as a safeguard if one ever is.

**Deployment Protection is required.** Enable it immediately after creating the Vercel
project and before opening or sharing any deployment URL. If the Git import creates the
initial deployment automatically, do not open or share it until protection is enabled.
- Vercel Authentication, set to *All Deployments*, is the required method. It is available
  on all plans. The default Standard Protection leaves a production custom domain public.
- Password Protection needs a paid plan (not available on Hobby) and is not used here.

The app also emits `noindex, nofollow` robots metadata as defense in depth only; it is
not access control and does not replace Deployment Protection. Node is pinned to 24.x via
`engines`.
