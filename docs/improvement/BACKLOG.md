# Improvement Backlog

Project: akra-app (C:\Users\bagus\Documents\AkraApps)
Last updated: 2026-11-21 (cycle 001)

Scoring: see the improvement-cycle skill `references/scoring.md`. Score = Impact x Confidence / Effort. P0 >= 8.0 (score-based P0 only for Security/Stability/data integrity) or any override, P1 4.0-7.9 (cap for other dimensions without an override), P2 2.0-3.9, P3 < 2.0. New features are capped at P2 unless the user asked for features that cycle.

| ID | Pri | Score | Dimension | Title | Evidence | Effort | Status | Cycle |
|----|-----|-------|-----------|-------|----------|--------|--------|-------|
| IC-001 | P0 | 7.5 | Security | Unscoped global Firestore queries, cross-user overwrites/deletes, and missing post owner check | `src/context/AppContext.tsx:335-411,440-462,609-617` (also Performance B2, hotspot x1.5, P0 override) | L | done | 001 |
| IC-002 | P0 | 12.0 | Security | Missing Firebase API key silently bypasses authentication into demo account mode | `src/lib/firebase.ts:15-40,51-74`; `src/context/AppContext.tsx:465-478` | S | done | 001 |
| IC-003 | P0 | 15.0 | Stability | Side effects and stale mutated variables inside `updateProgress` state updater | `src/context/AppContext.tsx:509-566` (also Code quality B8, hotspot x1.5) | S | done | 001 |
| IC-004 | P0 | 15.0 | Stability | Unguarded `JSON.parse` and `localStorage.setItem` crash on corrupt data or multi-MB base64 uploads | `src/context/AppContext.tsx:110,131,168,216-290,302-311,426-435,477,808,837`; `src/features/Feed/Feed.tsx:127-132` (hotspot x1.5) | S | done | 001 |
| IC-005 | P0 | 13.5 | Stability | `Date.now()` ID collisions and unguarded `targetBooks === 0` division producing `Infinity%` | `src/context/AppContext.tsx:531,589,642,663,691,705,731,765,778`; `src/features/Feed/Feed.tsx:814`; `src/features/Profile/Profile.tsx:143` (hotspot x1.5) | S | done | 001 |
| IC-006 | P0 | 13.5 | Stability | Swallowed auth/persistence/clipboard errors and missing App Router Error Boundaries | `src/context/AppContext.tsx:479-483,497-501,612-616,839-843`; `src/components/Login.tsx:14-18`; `src/features/Books/BookDetails.tsx:336`; `src/app/layout.tsx:10-24` (hotspot x1.5) | S | done | 001 |
| IC-007 | P0 | 13.5 | Stability | Unbounded `fetch()` calls lack timeouts and `AbortController` cancellation | `src/lib/bookApi.ts:26,58`; `src/features/Books/BookDetails.tsx:89,104,129,154,186`; `src/components/Header.tsx:72-97` (hotspot x1.5) | S | done | 001 |
| IC-008 | P0 | 12.0 | Stability | `BookDetails` re-fetches 5 sequential Open Library APIs on every progress update and forces 5-star rating | `src/features/Books/BookDetails.tsx:66-70,78,89-207,260` (also Performance B3) | S | done | 001 |
| IC-009 | P1 | 6.8 | Security | Missing HTTP security headers (CSP, frame/MIME protections) and unrestricted SVG/unvalidated uploads | `next.config.ts:1-7`; `src/features/Feed/Feed.tsx:126,311`; `src/features/Profile/Profile.tsx:125-132,876` (hotspot x1.5) | M | done | 001 |
| IC-010 | P1 | 15.0 | UX & accessibility | Low-contrast `--color-text-slate-light` (`#adb5bd`, 2.07:1 on white) fails WCAG AA across app | `src/app/globals.css:21`; `src/components/Header.tsx`, `Feed.tsx`, `Books.tsx`, `Profile.tsx`, `Search.tsx` (hotspot x1.5, dim cap P1) | S | done | 001 |
| IC-011 | P1 | 13.5 | UX & accessibility | `outline: none` and `focus:outline-none` remove keyboard focus indicators without visible replacements | `src/app/globals.css:161-165`; `src/features/Feed/Feed.tsx:316,325,342,680`; `src/features/Books/Books.tsx:299`; `src/features/Books/BookDetails.tsx:518` (hotspot x1.5, dim cap P1) | S | done | 001 |
| IC-012 | P1 | 13.5 | UX & accessibility | Blocking `alert()` dialogs and silent login failures degrade error feedback | `src/features/Feed/Feed.tsx:127`; `src/features/Profile/Profile.tsx:128`; `src/features/Books/BookDetails.tsx:337`; `src/components/Login.tsx:16-18` (hotspot x1.5, dim cap P1) | S | done | 001 |
| IC-013 | P1 | 9.0 | Performance | Sequential N+1 Firestore writes and monolithic 10-key `localStorage` serialization on every mutation | `src/context/AppContext.tsx:214-316,440-462` (hotspot x1.5, dim cap P1) | M | done | 001 |
| IC-014 | P1 | 9.0 | UX & accessibility | Multiple prominent buttons and interactive elements have no click handlers (dead UI) | `src/components/Header.tsx:429-434,480-486`; `src/features/Feed/Feed.tsx:369,509-511,563-570,709,824-826`; `src/features/Profile/Profile.tsx:344-347,741-745`; `src/features/Books/BookDetails.tsx:775-777`; `src/features/Books/Books.tsx:31,96-117` (hotspot x1.5, dim cap P1) | M | done | 001 |
| IC-015 | P1 | 9.0 | UX & accessibility | Clickable non-semantic `<div>`, `<span>`, `<img>`, and `<Star>` elements block keyboard access | `src/components/Header.tsx:138-149,209,235,264,291,320,490-495`; `src/features/Feed/Feed.tsx:191,209-215,...`; `src/features/Profile/Profile.tsx:434-450,...`; `src/features/Books/BookDetails.tsx:539-552,975-982` (hotspot x1.5, dim cap P1) | M | done | 001 |
| IC-016 | P1 | 9.0 | DX/CI-CD/dependencies | No CI/CD pipeline or `typecheck` verification script | No `.github/workflows`, `.gitlab-ci.yml`, `Jenkinsfile`; `package.json:5-10` lacks `typecheck` and `test` (dim cap P1) | S | done | 001 |
| IC-017 | P1 | 9.0 | DX/CI-CD/dependencies | Missing `.env.example` and unmodified `create-next-app` README | No `.env.example`; `src/lib/firebase.ts:6-11`; `README.md:1-36` (dim cap P1) | S | done | 001 |
| IC-018 | P1 | 6.8 | UX & accessibility | 24 form controls and icon-only buttons lack associated `<label>` or `aria-label` attributes | `src/components/Header.tsx:178-198,373-386,480-486`; `src/features/Feed/Feed.tsx:308-352,610-688,961-991`; `src/features/Search/Search.tsx:199-205`; `src/features/Books/Books.tsx:293-300`; `src/features/Books/BookDetails.tsx:509-519,901-907`; `src/features/Profile/Profile.tsx:364-366,581-601,863-996` (hotspot x1.5) | M | done | 001 |
| IC-019 | P1 | 6.8 | UX & accessibility | Modals lack `role="dialog"`, `aria-modal`, Escape dismissal, and focus containment | `src/features/Feed/Feed.tsx:832-1052`; `src/features/Profile/Profile.tsx:822-1021` (hotspot x1.5) | M | done | 001 |
| IC-020 | P1 | 6.8 | UX & accessibility | Empty feed, empty shelf expansion, silent file-type rejection, and broken share URLs | `src/features/Feed/Feed.tsx:126,373`; `src/features/Profile/Profile.tsx:567-574`; `src/features/Books/BookDetails.tsx:333,336` (hotspot x1.5) | M | done | 001 |
| IC-021 | P1 | 6.8 | UI | Broken CSS classes (`color-brand-orange`, `resize-vertical`, `background-transparent`), off-palette hexes, and incomplete EN/ID i18n | `src/features/Feed/Feed.tsx:240,250,260,325`; `src/components/Header.tsx:160`; `src/app/globals.css`; `src/components/Login.tsx`; `src/features/Books/BookDetails.tsx`; `src/features/Profile/Profile.tsx`; `src/features/Search/Search.tsx` (hotspot x1.5) | M | done | 001 |
| IC-022 | P1 | 6.8 | Performance | Unmemoized monolithic `AppContext` value and eager tab imports cause full-tree re-renders and larger initial JS | `src/context/AppContext.tsx:103-161,874-929`; `src/app/layout.tsx:18-20`; `src/app/page.tsx:4-12,39-43` (hotspot x1.5) | M | done | 001 |
| IC-023 | P1 | 6.8 | Code quality & tests | Widespread `any` types and `as any` casts defeat TypeScript `strict: true` | `src/context/AppContext.tsx:10,18`; `src/lib/firebase.ts:22-24`; `src/lib/bookApi.ts:30,62`; `src/components/Header.tsx:37,77,238,323`; `src/features/Books/BookDetails.tsx:159,491`; `src/features/Books/Books.tsx:10,38,83,208`; `src/features/Profile/Profile.tsx:396`; `src/features/Search/Search.tsx:31,128,159,228,250,406`; `src/features/Feed/Feed.tsx:51,719` (hotspot x1.5) | M | done | 001 |
| IC-024 | P1 | 6.0 | Code quality & tests | Zero automated tests and no test runner configured | `package.json:5-10`; `git ls-files` matches 0 test/spec files | M | done | 001 |
| IC-025 | P1 | 6.0 | DX/CI-CD/dependencies | Missing `node_modules` baseline, unused template SVGs in `public/`, and missing `.editorconfig`/`engines` | `node_modules` absent; `public/{file,globe,next,vercel,window}.svg` unused; `package.json:1-28` lacks `engines`; no `.editorconfig` | S | done | 001 |
| IC-026 | P1 | 6.0 | Observability & ops | No `/api/health` endpoint and incomplete Firebase env var validation | `src/app/layout.tsx:1-24`; `src/app/page.tsx:1-51`; `src/lib/firebase.ts:5-19` | S | done | 001 |
| IC-027 | P1 | 4.5 | UI | Render-blocking Google Fonts `@import`, missing `prefers-reduced-motion`, and zero dark mode tokens | `src/app/globals.css:1,178-297`; `src/app/layout.tsx:1-22`; `src/components/Login.tsx:50-51`; `src/components/Header.tsx:382` (also Performance B5, hotspot x1.5) | M | done | 001 |
| IC-028 | P1 | 4.5 | UI | 41 raw `<img>` tags lack lazy loading, explicit dimensions, and `onError` fallbacks | `src/components/Header.tsx:218,244,274,329,437,490`; `src/components/BottomNav.tsx:36`; `src/features/Feed/Feed.tsx:192,...`; `src/features/Books/Books.tsx:232`; `src/features/Books/BookDetails.tsx:423,...`; `src/features/Profile/Profile.tsx:251,...`; `src/features/Search/Search.tsx:313,463` (also Performance B5, hotspot x1.5) | M | done | 001 |
| IC-029 | P1 | 4.5 | Code quality & tests | Duplicated delete-confirm modals, relative-time formatters, and hybrid book search logic | `src/features/Feed/Feed.tsx:154-168,1019-1052` vs `src/features/Profile/Profile.tsx:197-205,822-855`; `src/features/Books/Books.tsx:53-81` vs `src/features/Search/Search.tsx:69-156` (hotspot x1.5) | M | done | 001 |
| IC-030 | P1 | 4.5 | Code quality & tests | Oversized ~1,000-line god context and feature components coupling UI, state, and persistence | `src/context/AppContext.tsx` (1012L), `src/features/Feed/Feed.tsx` (994L), `src/features/Profile/Profile.tsx` (958L), `src/features/Books/BookDetails.tsx` (933L) (hotspot x1.5) | L | done | 001 |
| IC-031 | P1 | 4.5 | Observability & ops | Ad-hoc `console.*` logging (24 calls) with no structured logger or error reporting | `package.json:11-27`; `src/context/AppContext.tsx:351,413,460,482,500,615,842`; `src/lib/firebase.ts:35,39`; `src/lib/bookApi.ts:45,78` (hotspot x1.5) | M | done | 001 |
| IC-032 | P1 | 4.5 | Code quality & tests | Unused dead mock constants (`INITIAL_*`, `LOCAL_BOOK_DATABASE`, `RICH_BOOK_DATABASE`) remain in source | `src/context/AppContext.tsx:93-101`; `src/features/Books/Books.tsx:10`; `src/features/Books/bookDetailsData.ts:23` (hotspot x1.5) | S | done | 001 |
| IC-033 | P2 | 3.0 | Observability & ops | Missing operational runbook and Firestore backup/rollback documentation | `README.md:1-36`; no runbooks or backup/rollback docs | M | done | 001 |
| IC-034 | P2 | 13.5 | New features | proposal: Add a Saved Posts ("Tersimpan") view for already-collected `savedPostIds` | `src/context/AppContext.tsx:62-63,156,716-726`; `src/features/Feed/Feed.tsx:512-520`; `src/features/Profile/Profile.tsx:35` (hotspot x1.5, feature cap P2) | S | done | 001 |
| IC-035 | P2 | 9.0 | New features | proposal: Populate hardcoded dummy edition metadata in `BookDetails.tsx` from Open Library `editions.json` | `src/features/Books/BookDetails.tsx:153,667-694` (feature cap P2) | S | done | 001 |
| IC-036 | P2 | 6.0 | New features | proposal: Implement Notifications generation, navigation, and Firestore sync for social collections | `src/types/index.ts:92-104`; `src/components/Header.tsx:371-478`; `src/context/AppContext.tsx:100,160,440-462` (hotspot x1.5, feature cap P2) | L | done | 001 |
| IC-037 | P2 | 3.0 | New features | proposal: Complete stubbed "Grup" (Groups) and "Listopia" tabs in Search | `src/features/Search/Search.tsx:243,246,504-509` | L | done | 001 |

## Archive

When the main table has more than 40 rows, move rows with status `done`, `stale` or `rejected` whose Cycle is at least 2 cycles before the current one here, unchanged and in ID order. Archived rows keep their IDs, are never re-proposed, and still count for dedupe.

| ID | Pri | Score | Dimension | Title | Evidence | Effort | Status | Cycle |
|----|-----|-------|-----------|-------|----------|--------|--------|-------|

## Status legend

- `proposed`: found and scored, awaiting user choice.
- `picked`: user chose it for the current cycle.
- `in-progress`: being executed on the cycle branch.
- `done`: committed and verified. Never re-proposed.
- `blocked`: attempted, failed or reverted; reason recorded in the cycle report.
- `deferred`: user chose not to do it now; re-validated next cycle.
- `stale`: evidence no longer present; kept for history.
- `rejected`: user declined permanently; not re-proposed.

## Dimensions

Performance, Security, Stability, New features, UI, UX & accessibility, Code quality & tests, DX/CI-CD/dependencies, Observability & ops.
