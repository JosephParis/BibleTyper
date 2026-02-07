import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  TextField,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import axios from 'axios';

interface Settings {
  versesPerPractice: number;
  activeSourceText: string;
}

interface Document {
  id: number;
  name: string;
  file_type: string;
  chunk_count: number;
}

const Settings: React.FC = () => {
  const [settings, setSettings] = useState<Settings>({
    versesPerPractice: 3,
    activeSourceText: 'bible',
  });
  const [versesInput, setVersesInput] = useState<string>('3');
  const [documents, setDocuments] = useState<Document[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [settingsRes, docsRes] = await Promise.all([
          axios.get<Settings>('http://localhost:3001/api/settings'),
          axios.get<Document[]>('http://localhost:3001/api/documents'),
        ]);
        setSettings(settingsRes.data);
        setVersesInput(settingsRes.data.versesPerPractice.toString());
        setDocuments(docsRes.data);
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };
    loadData();
  }, []);

  const handleVersesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setVersesInput(value);

    if (value !== '') {
      const numValue = parseInt(value);
      if (!isNaN(numValue)) {
        setSettings(prev => ({ ...prev, versesPerPractice: numValue }));
      }
    }
  };

  const handleVersesBlur = () => {
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

  const handleSourceTextChange = (value: string) => {
    setSettings(prev => ({ ...prev, activeSourceText: value }));
  };

  const handleSave = async () => {
    try {
      const saveData: any = {
        activeSourceText: settings.activeSourceText,
      };

      if (settings.activeSourceText === 'bible') {
        saveData.versesPerPractice = Math.min(Math.max(settings.versesPerPractice, 1), 10);
      }

      await axios.post('http://localhost:3001/api/settings', saveData);

      if (saveData.versesPerPractice !== undefined) {
        setSettings(prev => ({ ...prev, versesPerPractice: saveData.versesPerPractice }));
        setVersesInput(saveData.versesPerPractice.toString());
      }
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
          {/* Source Text Selection */}
          <Box sx={{ mb: 3 }}>
            <FormControl fullWidth>
              <InputLabel>Source Text</InputLabel>
              <Select
                value={settings.activeSourceText}
                label="Source Text"
                onChange={(e) => handleSourceTextChange(e.target.value)}
              >
                <MenuItem value="bible">Bible - KJV Translation</MenuItem>
                {documents.map((doc) => (
                  <MenuItem key={doc.id} value={String(doc.id)}>
                    {doc.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Choose what text to practice typing.{' '}
              <RouterLink to="/documents">Upload more documents</RouterLink>
            </Typography>
          </Box>

          {/* Verses per Practice - only visible when Bible is selected */}
          {settings.activeSourceText === 'bible' && (
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
          )}

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
