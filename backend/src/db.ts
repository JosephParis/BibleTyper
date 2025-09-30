import { MongoClient, ServerApiVersion } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bibletyper';

// Create a MongoClient with a MongoClientOptions object
const client = new MongoClient(MONGODB_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// Connect to MongoDB
export async function connectToDatabase() {
  try {
    console.log('Attempting to connect to MongoDB...');
    console.log('Connection string (with masked credentials):', 
      MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//****:****@'));
    
    await client.connect();
    console.log('Initial connection established');
    
    await client.db("admin").command({ ping: 1 });
    console.log("Successfully connected to MongoDB!");
    return client;
  } catch (error) {
    console.error('MongoDB connection error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      code: (error as any).code,
      codeName: (error as any).codeName,
      errorResponse: (error as any).errorResponse
    });
    throw error;
  }
}

// Get database instance
export function getDatabase() {
  return client.db();
}

// Get collections
export function getCollections() {
  const db = getDatabase();
  return {
    settings: db.collection('settings'),
    verses: db.collection('verses')
  };
}

// Close database connection
export async function closeDatabase() {
  try {
    await client.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error closing database connection:', error);
    throw error;
  }
} 