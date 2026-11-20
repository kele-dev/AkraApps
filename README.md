# AKRA — Share Pages, Find Bookmates

AKRA is a Next.js (App Router) reading community web application for tracking books, sharing quotes/thoughts/photos, managing reading goals and custom shelves, and discussing books in Buddy Reads.

## Tech Stack

- Next.js 16 (App Router) & React 19
- TypeScript 5 (`strict: true`)
- Tailwind CSS v4
- Firebase Auth & Cloud Firestore (optional local demo mode in non-production)
- Google Books & Open Library APIs

## Getting Started

1. Install dependencies:

```bash
npm ci
```

2. Configure environment variables by copying `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Set all `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`, `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, and `NEXT_PUBLIC_FIREBASE_APP_ID` values for Firebase Auth + Firestore, or set `NEXT_PUBLIC_ENABLE_DEMO_MODE=true` for local-only demo development.

3. Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Available Scripts

- `npm run dev` — Start development server
- `npm run build` — Build production bundle
- `npm run start` — Start production server
- `npm run lint` — Run ESLint
- `npm run typecheck` — Run `tsc --noEmit`
- `npm test` — Run unit/regression tests

## Project Structure

- `src/app/` — App Router entry, layout, global styles, error boundaries, and `/api/health`
- `src/components/` — Shared layout and UI components (`Header`, `Login`, `BottomNav`, `Card`, `ProgressBar`)
- `src/context/` — Application state (`AppContext`)
- `src/features/` — Feature modules (`Feed`, `Books`, `Profile`, `Search`)
- `src/lib/` — Firebase config, book API client, storage, validation, and utilities
- `firestore.rules` — Reference Cloud Firestore security rules
