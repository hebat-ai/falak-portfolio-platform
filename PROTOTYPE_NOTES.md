# Prototype Notes — Fonts & Brand Assets

## Alexandria (Arabic body text) — approved, in use
- Source: `references/Alexandria-VariableFont_wght.ttf`, copied to `src/fonts/open-source/alexandria-variable.ttf`
- Copyright: Copyright 2022 The Alexandria Project Authors (https://github.com/Gue3bara/Alexandria)
- License: SIL Open Font License, Version 1.1 (http://scripts.sil.org/OFL) — verified directly from the file's own embedded metadata; verbatim license text stored alongside it at `src/fonts/open-source/OFL.txt`
- Status: this is Falak's actual approved brand font for Arabic body text, not a placeholder — freely embeddable under OFL

## Century Gothic (English, brand-approved) — Pending Font Web-License Approval
- Present only in `references/` (GOTHIC.TTF, GOTHICI.TTF, GOTHICB0.TTF, GOTHICBI.TTF, etc.) — never copied, embedded, staged, committed, or deployed
- Embedded license text: property of The Monotype Corporation plc; explicitly states "You may not copy or distribute this software" under the standard license
- Placeholder in use until approved: **Jost** (headings) and **Inter** (body), via next/font/google, OFL/free-licensed

## TS Zunburk VF3 OS (Arabic headings, brand-approved) — Pending Font Web-License Approval
- Present only in `references/` (TSZunburkVF3-*OS.otf) — never copied, embedded, staged, committed, or deployed
- Embedded license text: Copyright 2025 TSFonts Type Studio, "Standard License" (commercial)
- Placeholder in use until approved: **Cairo**, via next/font/google, OFL-licensed

## Logos & patterns
- Not copied into the app. A placeholder brand mark (`src/components/brand/BrandMark.tsx`) is in use pending approval; the original logo artwork remains only in `references/`.

## Prototype scope and limitations
- Frontend-only MVP prototype. All data is synthetic mock data in `src/lib/mock`. The project owner confirms that `references/` was not used to seed it.
- No real authentication or authorization, and no backend, API or database. "Falak Admin (demo)", "Investor (demo)" and "Startup (demo)" are simulated viewpoints, not access controls.
- Startup submissions and review/approval actions are simulated in component state, reset on reload, and never modify the shared mock data or any other page.

## Language and theme restore
The server always renders English, LTR and light. A saved language or theme preference (browser `localStorage`, keys `falak-prototype-lang` and `falak-prototype-theme`) is applied after hydration, so a returning Arabic-preferring or dark-theme user may see a brief English/LTR/light flash first. Accepted to avoid hydration mismatches.

## Reporting status is not performance
Reporting status (draft, overdue, etc.) reflects submission compliance only. It is never a signal of company performance.

## Editability is UI-only
Which statuses open the startup form editable (`draft`, `changes_requested`) versus locked is a shared UI rule (`isReportEditable` in `src/lib/reportingStatus.ts`). It is a design preview, not a server-enforced permission.

## Data and display conventions
- A fixed snapshot date (`DASHBOARD_SNAPSHOT_DATE`, 2026-09-09) drives all overdue and "last updated" logic, never the live clock.
- Western digits are used in both languages (a configurable choice in `src/lib/format.ts`).
- Revenue is shown per currency and never summed across currencies; missing revenue is `null`, never coerced to 0.
