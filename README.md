# BibleTyper

A typing practice application that helps users improve their typing speed and accuracy while engaging with Bible verses.

## Features

- Practice typing with randomly selected Bible verses
- Track typing speed (WPM) and accuracy
- Support for multiple Bible translations (NIV by default)
- User progress tracking
- Modern, responsive UI

## Tech Stack

- Frontend: React + TypeScript
- Backend: Node.js + Express
- Database: MongoDB
- Bible API: Bible.org API

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
3. Create a `.env` file in the backend directory with your MongoDB connection string and Bible API key
4. Start the development servers:
   ```bash
   # Start backend server
   cd backend
   npm run dev

   # Start frontend server
   cd frontend
   npm start
   ```

## Environment Variables

Create a `.env` file in the backend directory with the following variables:
```
MONGODB_URI=your_mongodb_connection_string
BIBLE_API_KEY=your_bible_api_key
```

## License

MIT 