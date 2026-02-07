# BibleTyper

A typing practice application that helps users improve their typing speed and accuracy while engaging with Bible verses.

## Features

- Practice typing with randomly selected Bible verses
- Track typing speed (WPM) and accuracy
- Uses King James Version (KJV)
- User progress tracking
- Modern, responsive UI

## Tech Stack

- Frontend: React + TypeScript
- Backend: Node.js + Express
- Database: SQLite (stores both settings and all KJV verses locally)
- Bible Text: King James Version (public domain, stored locally)

## Setup Instructions

1. Clone the repository
2. Install dependencies:
   ```bash
   # Install frontend dependencies
   cd frontend
   npm install

   # Install backend dependencies
   cd ../backend
   npm install
   ```
3. Import KJV Bible verses (first time only):
   ```bash
   cd backend
   npm run import-kjv
   ```
   This will download all 31,102 KJV verses and store them in the local SQLite database (~3-5 MB).

4. Start the development servers:
   ```bash
   # Start backend server
   cd backend
   npm run dev

   # Start frontend server (in a new terminal)
   cd frontend
   npm start
   ```

## License

MIT 