import express from 'express';
import cors from 'cors';
import { verseRoutes } from './routes/verses';
import { settingsRoutes } from './routes/settings';
import { documentRoutes } from './routes/documents';
import { initializeDatabase } from './db';

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/verses', verseRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/documents', documentRoutes);

function startServer() {
  try {
    // Initialize SQLite database
    initializeDatabase();

    // Start the Express server
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer(); 