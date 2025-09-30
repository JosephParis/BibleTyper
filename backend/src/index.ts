import express from 'express';
import cors from 'cors';
import { verseRoutes } from './routes/verses';
import { settingsRoutes } from './routes/settings';
import { connectToDatabase } from './db';

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/verses', verseRoutes);
app.use('/api/settings', settingsRoutes);

async function startServer() {
  try {
    // Connect to MongoDB
    await connectToDatabase();

    // Start the Express server
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer().catch(console.dir); 