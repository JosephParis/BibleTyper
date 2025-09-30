import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Button,
  SelectChangeEvent,
  TextField,
  Slider,
} from '@mui/material';
import axios from 'axios';

interface Settings {
  translation: string;
  versesPerPractice: number;
}

const translations = [
  { value: 'niv', label: 'New International Version (NIV)' },
  { value: 'kjv', label: 'King James Version (KJV)' },
  { value: 'esv', label: 'English Standard Version (ESV)' },
  { value: 'nlt', label: 'New Living Translation (NLT)' },
];

const Settings: React.FC = () => {
  const [settings, setSettings] = useState<Settings>({
    translation: 'niv',
    versesPerPractice: 3
  });
  const [versesInput, setVersesInput] = useState<string>('3');

  useEffect(() => {
    // Load settings from backend
    const loadSettings = async () => {
      try {
        const response = await axios.get<Settings>('http://localhost:3001/api/settings');
        setSettings(response.data);
        setVersesInput(response.data.versesPerPractice.toString());
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };
    loadSettings();
  }, []);

  const handleTranslationChange = (event: SelectChangeEvent) => {
    setSettings(prev => ({ ...prev, translation: event.target.value }));
  };

  const handleVersesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setVersesInput(value);
    
    // Only update settings if it's a valid number
    if (value !== '') {
      const numValue = parseInt(value);
      if (!isNaN(numValue)) {
        setSettings(prev => ({ ...prev, versesPerPractice: numValue }));
      }
    }
  };

  const handleVersesBlur = () => {
    // When user clicks out, set to 0 if empty
    if (versesInput === '') {
      setSettings(prev => ({ ...prev, versesPerPractice: 0 }));
      setVersesInput('0');
    }
  };

  const handleSliderChange = (_event: Event, value: number | number[]) => {
    if (typeof value === 'number') {
      setSettings(prev => ({ ...prev, versesPerPractice: value }));
      setVersesInput(value.toString());
    }
  };

  const handleSave = async () => {
    try {
      // Clamp the verses per practice value before saving
      const clampedSettings = {
        ...settings,
        versesPerPractice: Math.min(Math.max(settings.versesPerPractice, 1), 10)
      };
      
      await axios.post('http://localhost:3001/api/settings', clampedSettings);
      // Update the local state with the clamped value
      setSettings(clampedSettings);
      setVersesInput(clampedSettings.versesPerPractice.toString());
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Settings
        </Typography>

        <Box sx={{ mt: 2 }}>
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Bible Translation</InputLabel>
            <Select
              value={settings.translation}
              label="Bible Translation"
              onChange={handleTranslationChange}
            >
              {translations.map((translation) => (
                <MenuItem key={translation.value} value={translation.value}>
                  {translation.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box sx={{ mb: 3 }}>
            <Typography gutterBottom>
              Verses per Practice
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <TextField
                type="number"
                value={versesInput}
                onChange={handleVersesChange}
                onBlur={handleVersesBlur}
                inputProps={{ 
                  style: { width: '60px' }
                }}
                size="small"
              />
              <Slider
                value={settings.versesPerPractice}
                onChange={handleSliderChange}
                min={1}
                max={10}
                step={1}
                marks
                valueLabelDisplay="auto"
                sx={{ flexGrow: 1 }}
              />
            </Box>
            <Typography variant="caption" color="text.secondary">
              Choose between 1 and 10 verses
            </Typography>
          </Box>

          <Box sx={{ mt: 3 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSave}
            >
              Save Settings
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default Settings; 