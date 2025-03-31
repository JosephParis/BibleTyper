import React, { useState } from 'react';
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
} from '@mui/material';

const translations = [
  { value: 'niv', label: 'New International Version (NIV)' },
  { value: 'kjv', label: 'King James Version (KJV)' },
  { value: 'esv', label: 'English Standard Version (ESV)' },
  { value: 'nlt', label: 'New Living Translation (NLT)' },
];

const Settings: React.FC = () => {
  const [selectedTranslation, setSelectedTranslation] = useState('niv');

  const handleTranslationChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setSelectedTranslation(event.target.value as string);
  };

  const handleSave = async () => {
    try {
      // TODO: Implement API call to save settings
      console.log('Saving translation preference:', selectedTranslation);
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
          <FormControl fullWidth>
            <InputLabel>Bible Translation</InputLabel>
            <Select
              value={selectedTranslation}
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
      </Paper>
    </Container>
  );
};

export default Settings; 