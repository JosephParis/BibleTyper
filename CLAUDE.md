# BibleTyper - Project Guide

## Overview

BibleTyper is a full-stack typing practice app for Bible verses. Users type KJV Bible verses, get real-time WPM and accuracy feedback, and can configure practice settings. All data is stored locally in SQLite.

## Tech Stack

- **Frontend:** React 18, TypeScript, Material-UI 5, Styled-Components, React Router 6, Axios
- **Backend:** Node.js, Express 4, TypeScript, better-sqlite3 (SQLite), Axios
- **Database:** SQLite file (`bibletyper.db`) with `settings` and `verses` tables

## Project Structure

```
BibleTyper/
├── backend/
│   ├── src/
│   │   ├── index.ts              # Express server entry point (port 3001)
│   │   ├── db.ts                 # SQLite database setup and query functions
│   │   ├── importKJV.ts          # Script to import KJV verses from GitHub
│   │   ├── models/
│   │   │   └── settings.ts       # Settings TypeScript interfaces
│   │   └── routes/
│   │       ├── verses.ts         # GET /api/verses/random
│   │       └── settings.ts       # GET/POST /api/settings
│   ├── package.json
│   └── tsconfig.json
└── frontend/
    ├── src/
    │   ├── index.tsx              # React entry point
    │   ├── App.tsx                # Router setup, MUI theme
    │   └── components/
    │       ├── Header.tsx         # Navigation bar
    │       ├── TypingPractice.tsx # Main typing interface (WPM, accuracy)
    │       ├── Settings.tsx       # Verses-per-practice config
    │       └── VerseDisplay.tsx   # Simple verse card display
    ├── package.json
    └── tsconfig.json
```

## Commands

### Backend

```bash
cd backend
npm install                # Install dependencies
npm run import-kjv         # Import 31,102 KJV verses into SQLite
npm run dev                # Start dev server with nodemon (port 3001)
npm run build              # Compile TypeScript to dist/
npm start                  # Run production build
```

### Frontend

```bash
cd frontend
npm install                # Install dependencies
npm start                  # Start React dev server (port 3000)
npm run build              # Production build
```

## API Endpoints

| Method | Endpoint | Params/Body | Description |
|--------|----------|-------------|-------------|
| GET | `/api/verses/random` | `?count=N` (1-10, default 3) | Fetch N consecutive random verses from a chapter |
| GET | `/api/settings` | — | Retrieve all settings |
| POST | `/api/settings` | `{ versesPerPractice: number }` | Update settings |

## Database Schema

**`settings`** — Key-value pairs for user preferences
- `id` INTEGER PRIMARY KEY
- `key` TEXT UNIQUE NOT NULL
- `value` TEXT NOT NULL

**`verses`** — All 31,102 KJV Bible verses
- `id` INTEGER PRIMARY KEY
- `book` TEXT NOT NULL
- `chapter` INTEGER NOT NULL
- `verse` INTEGER NOT NULL
- `text` TEXT NOT NULL
- UNIQUE(book, chapter, verse)
- INDEX on (book, chapter)

## Key Architecture Notes

- Frontend runs on port 3000, backend on port 3001. CORS is enabled.
- Verse selection picks a random chapter, then returns consecutive verses from that chapter.
- WPM and accuracy are calculated client-side in real-time (no backend calls during typing).
- The `importKJV.ts` script fetches from the `aruljohn/Bible-kjv` GitHub repository.
- Settings default to `versesPerPractice: 3` on first database init.
- Paste is disabled in the typing input to ensure authentic practice.
