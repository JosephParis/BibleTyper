import express from 'express';
import { Settings } from '../models/settings';

const router = express.Router();

// Get user settings
router.get('/', async (req, res) => {
  try {
    // TODO: Implement user authentication
    const userId = 'default-user';
    const settings = await Settings.findOne({ userId });
    res.json(settings || { translation: 'niv' });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Update user settings
router.put('/', async (req, res) => {
  try {
    // TODO: Implement user authentication
    const userId = 'default-user';
    const { translation } = req.body;

    const settings = await Settings.findOneAndUpdate(
      { userId },
      { translation },
      { upsert: true, new: true }
    );

    res.json(settings);
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

export const settingsRoutes = router; 