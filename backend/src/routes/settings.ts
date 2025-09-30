import express from 'express';
import { getCollections } from '../db';
import { Settings, SettingsUpdate } from '../models/settings';

const router = express.Router();
const { settings } = getCollections();

// Get user settings
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const userSettings = await settings.findOne({ userId }) as Settings | null;
    
    if (!userSettings) {
      // Create default settings if none exist
      const defaultSettings: Settings = {
        userId,
        theme: 'light',
        fontSize: 16,
        lineHeight: 1.5,
        translation: 'niv',
        versesPerPractice: 3,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await settings.insertOne(defaultSettings);
      return res.json(defaultSettings);
    }
    
    res.json(userSettings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Update user settings
router.put('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const updates: SettingsUpdate = {
      ...req.body,
      updatedAt: new Date()
    };

    const result = await settings.findOneAndUpdate(
      { userId },
      { $set: updates },
      { returnDocument: 'after', upsert: true }
    ) as Settings | null;

    if (!result) {
      return res.status(404).json({ error: 'Settings not found' });
    }

    res.json(result);
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

export const settingsRoutes = router; 