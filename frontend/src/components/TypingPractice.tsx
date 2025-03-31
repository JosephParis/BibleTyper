import React, { useState, useEffect, useRef } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Box,
  Button,
  CircularProgress,
} from '@mui/material';
import axios from 'axios';

interface Verse {
  text: string;
  reference: string;
}

const TypingPractice: React.FC = () => {
  const [verses, setVerses] = useState<Verse[]>([]);
  const [currentVerseIndex, setCurrentVerseIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [startTime, setStartTime] = useState<number | null>(null);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchVerses = async () => {
    try {
      setIsLoading(true);
      setError(null);
      // TODO: Replace with actual API call
      const response = await axios.get('/api/verses');
      setVerses(response.data);
      setUserInput('');
      setStartTime(null);
      setWpm(0);
      setAccuracy(100);
    } catch (err) {
      setError('Failed to fetch verses. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVerses();
  }, []);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentVerseIndex]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUserInput(value);

    if (!startTime) {
      setStartTime(Date.now());
    }

    // Calculate accuracy
    const currentVerse = verses[currentVerseIndex];
    if (currentVerse) {
      const correctChars = value.split('').filter((char, i) => char === currentVerse.text[i]).length;
      const accuracy = (correctChars / value.length) * 100;
      setAccuracy(Math.round(accuracy));
    }

    // Calculate WPM
    if (startTime) {
      const timeElapsed = (Date.now() - startTime) / 1000 / 60; // in minutes
      const wordsTyped = value.split(' ').length;
      const currentWpm = Math.round(wordsTyped / timeElapsed);
      setWpm(currentWpm);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (currentVerseIndex < verses.length - 1) {
        setCurrentVerseIndex(prev => prev + 1);
        setUserInput('');
        setStartTime(null);
        setWpm(0);
        setAccuracy(100);
      } else {
        // Practice complete
        setCurrentVerseIndex(0);
        setUserInput('');
        setStartTime(null);
        setWpm(0);
        setAccuracy(100);
      }
    }
  };

  if (isLoading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ mt: 4 }}>
        <Typography color="error">{error}</Typography>
        <Button onClick={fetchVerses} sx={{ mt: 2 }}>
          Try Again
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Practice Typing Bible Verses
        </Typography>
        
        {verses.length > 0 && (
          <>
            <Typography variant="subtitle1" gutterBottom>
              {verses[currentVerseIndex].reference}
            </Typography>
            <Typography variant="body1" paragraph sx={{ whiteSpace: 'pre-wrap' }}>
              {verses[currentVerseIndex].text}
            </Typography>
            
            <TextField
              fullWidth
              multiline
              rows={4}
              value={userInput}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              inputRef={inputRef}
              placeholder="Start typing here..."
              variant="outlined"
            />

            <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
              <Typography>WPM: {wpm}</Typography>
              <Typography>Accuracy: {accuracy}%</Typography>
            </Box>

            <Typography variant="caption" display="block" sx={{ mt: 2 }}>
              Press Enter to move to the next verse
            </Typography>
          </>
        )}
      </Paper>
    </Container>
  );
};

export default TypingPractice; 