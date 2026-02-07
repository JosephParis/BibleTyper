import express from 'express';
import { getSettings, updateSetting } from '../db';
import { Settings, SettingsUpdate } from '../models/settings';

const router = express.Router();

// Get settings
router.get('/', async (req, res) => {
  try {
    const settings = getSettings();
    res.json(settings as Settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Update settings
router.post('/', async (req, res) => {
  try {
    const updates: SettingsUpdate = req.body;

    // Update each setting
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        updateSetting(key, value);
      }
    });

    // Return updated settings
    const settings = getSettings();
    res.json(settings as Settings);
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

export const settingsRoutes = router;
