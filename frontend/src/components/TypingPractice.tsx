import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  CircularProgress,
} from '@mui/material';
import styled from 'styled-components';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

interface Verse {
  id: number;
  text: string;
  reference: string;
  sourceText: string;
}

interface Settings {
  versesPerPractice: number;
  activeSourceText: string;
}

const ReferenceText = styled.div`
  font-size: 1.5rem;
  line-height: 1.6;
  color: #666;
  margin-bottom: 1rem;
  font-family: monospace;
  letter-spacing: 0.05em;
  position: relative;
  white-space: pre-wrap;
  word-break: keep-all;
  overflow-wrap: break-word;
  hyphens: none;
`;

const ReferenceCharacter = styled.span<{ isTyped: boolean; isCorrect: boolean }>`
  display: inline-block;
  background-color: ${props => props.isTyped ? (props.isCorrect ? '#c8e6c9' : '#ffcdd2') : 'transparent'};
  border-radius: 2px;
  min-width: 0.5em;
  min-height: 1.6em;
  text-align: center;
  white-space: pre;
`;

const InputContainer = styled.div`
  position: relative;
  width: 100%;
`;

const HiddenInput = styled.input`
  position: absolute;
  opacity: 0;
  height: 0;
  width: 0;
`;

const DisplayText = styled.div`
  border: 2px solid #ccc;
  border-radius: 4px;
  padding: 8px 12px;
  min-height: 1.5em;
  font-size: 1.5rem;
  line-height: 1.6;
  background: white;
  cursor: text;
  position: relative;
  font-family: monospace;
  letter-spacing: 0.05em;
  white-space: pre-wrap;
  word-break: keep-all;
  overflow-wrap: break-word;
  hyphens: none;
  max-width: 100%;
  min-height: 3em;

  &:focus-within {
    outline: none;
    border-color: #1976d2;
    box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.1);
  }
`;

const InputCursor = styled.span`
  width: 2px;
  height: 1.6em;
  background-color: #1976d2;
  animation: blink 1s step-end infinite;
  margin-left: 2px;
  display: inline-block;
  vertical-align: middle;

  @keyframes blink {
    from, to {
      opacity: 1;
    }
    50% {
      opacity: 0;
    }
  }
`;

const Character = styled.span<{ isCorrect: boolean }>`
  background-color: ${props => props.isCorrect ? '#c8e6c9' : '#ffcdd2'};
  display: inline-block;
  padding: 0;
  min-width: 0.5em;
  min-height: 1.6em;
  border-radius: 2px;
  margin: 0;
  white-space: pre;
  text-align: center;
`;

const StartTypingPrompt = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #666;
  pointer-events: none;
  opacity: 0.7;
  font-style: italic;
  width: 100%;
  text-align: center;
  padding: 0 12px;
`;

const WordContainer = styled.span`
  display: inline-block;
  white-space: nowrap;
`;

const TypingPractice: React.FC = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [verses, setVerses] = useState<Verse[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [versesPerPractice, setVersesPerPractice] = useState(3);
  const [activeSourceText, setActiveSourceText] = useState('bible');
  const [documentNotFound, setDocumentNotFound] = useState(false);
  const [backspaceCount, setBackspaceCount] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [totalTime, setTotalTime] = useState(0);
  const [difficulty, setDifficulty] = useState<'full' | 'everyOther' | 'firstLetter' | 'partial' | 'hidden'>('full');
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchSettings = useCallback(async () => {
    if (!isAuthenticated) {
      setVersesPerPractice(3);
      setActiveSourceText('bible');
      return;
    }
    try {
      const response = await axios.get<Settings>('/api/settings');
      setVersesPerPractice(response.data.versesPerPractice);
      setActiveSourceText(response.data.activeSourceText || 'bible');
    } catch (err) {
      console.error('Error fetching settings:', err);
    }
  }, [isAuthenticated]);

  const fetchVerses = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      setDocumentNotFound(false);

      let url: string;
      if (activeSourceText === 'bible') {
        url = `/api/verses/random?count=${versesPerPractice}`;
      } else {
        url = `/api/documents/${activeSourceText}/random`;
      }

      const response = await axios.get<Verse[]>(url);
      setVerses(response.data);
      setUserInput('');
      setStartTime(null);
      setWpm(0);
      setAccuracy(100);
      setBackspaceCount(0);
      setCompleted(false);
      setTotalTime(0);
      setDifficulty('full');
    } catch (err: any) {
      console.error('Error fetching verses:', err);
      if (err.response?.status === 404 && activeSourceText !== 'bible') {
        setDocumentNotFound(true);
      } else if (err instanceof Error) {
        setError(`Failed to fetch verses: ${err.message}`);
      } else {
        setError('Failed to fetch verses: Unknown error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  }, [activeSourceText, versesPerPractice]);

  useEffect(() => {
    if (!authLoading) {
      fetchSettings();
    }
  }, [authLoading, fetchSettings]);

  useEffect(() => {
    if (activeSourceText === 'bible' ? versesPerPractice > 0 : true) {
      fetchVerses();
    }
  }, [versesPerPractice, activeSourceText, fetchVerses]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [verses, difficulty]);

  const resetStats = () => {
    setUserInput('');
    setStartTime(null);
    setWpm(0);
    setAccuracy(100);
    setBackspaceCount(0);
    setCompleted(false);
    setTotalTime(0);
  };

  const tryAgain = () => {
    resetStats();
  };

  const nextDifficulty = () => {
    const order: Array<'full' | 'everyOther' | 'firstLetter' | 'partial' | 'hidden'> = ['full', 'everyOther', 'firstLetter', 'partial', 'hidden'];
    const currentIndex = order.indexOf(difficulty);
    const next = order[currentIndex + 1];
    if (next) {
      setDifficulty(next);
      resetStats();
    }
  };

  // Common structural words that get hints in "partial" mode.
  // Content words (nouns, verbs, adjectives) stay hidden to test recall.
  const hintWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'nor', 'for', 'yet', 'so',
    'of', 'to', 'in', 'on', 'at', 'by', 'is', 'it', 'be', 'as',
    'was', 'are', 'am', 'were', 'been', 'has', 'had', 'have', 'do',
    'did', 'not', 'no', 'if', 'he', 'she', 'we', 'they', 'them',
    'his', 'her', 'my', 'our', 'its', 'him', 'me', 'us', 'i',
    'that', 'this', 'with', 'from', 'will', 'shall', 'who', 'whom',
    'which', 'than', 'then', 'into', 'upon', 'unto', 'also',
  ]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Backspace') {
      setBackspaceCount(prev => prev + 1);
    }
    if (e.key === 'Enter') {
      const currentVerse = verses[0];
      if (currentVerse && userInput.length === currentVerse.text.length && startTime) {
        setTotalTime(Math.round((Date.now() - startTime) / 1000));
        setCompleted(true);
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const currentVerse = verses[0]; // Use the first (and only) verse
    
    if (currentVerse && value.length <= currentVerse.text.length) {
      setUserInput(value);

      if (!startTime) {
        setStartTime(Date.now());
      }

      // Calculate accuracy
      const correctChars = value.split('').filter((char, i) => char === currentVerse.text[i]).length;
      const accuracy = value.length > 0 ? (correctChars / value.length) * 100 : 100;
      setAccuracy(Math.round(accuracy));

      // Calculate WPM
      if (startTime && value.length > 0) {
        const timeElapsed = (Date.now() - startTime) / 1000 / 60; // in minutes
        const wordsTyped = value.trim().split(/\s+/).length;
        const currentWpm = timeElapsed > 0 ? Math.round(wordsTyped / timeElapsed) : 0;
        setWpm(currentWpm);
      }
    }
  };

  const renderInputText = () => {
    const words = userInput.split(' ');
    let charIndex = 0;
    
    return (
      <>
        {words.map((word, wordIndex) => {
          const wordElement = (
            <WordContainer key={wordIndex}>
              {word.split('').map((char, charInWordIndex) => {
                const currentCharIndex = charIndex;
                charIndex++;
                return (
                  <Character
                    key={currentCharIndex}
                    isCorrect={char === verses[0]?.text[currentCharIndex]}
                  >
                    {char}
                  </Character>
                );
              })}
            </WordContainer>
          );
          
          // Add space after word if not the last word
          if (wordIndex < words.length - 1) {
            const spaceElement = (
              <Character
                key={charIndex}
                isCorrect={verses[0]?.text[charIndex] === ' '}
              >
                {'\u00A0'}
              </Character>
            );
            charIndex++;
            return [wordElement, spaceElement];
          }
          
          return wordElement;
        })}
        <InputCursor />
      </>
    );
  };

  const isPunctuation = (char: string): boolean => /[^a-zA-Z0-9]/.test(char);

  const getDisplayChar = (char: string, isFirstOfWord: boolean, word: string, wordIndex: number): string => {
    if (difficulty === 'full') return char;
    if (isPunctuation(char)) return char;
    if (difficulty === 'everyOther') {
      if (wordIndex % 2 === 1) return isFirstOfWord ? char : '_';
      return char;
    }
    if (difficulty === 'firstLetter') return isFirstOfWord ? char : '_';
    if (difficulty === 'partial') {
      const cleanWord = word.replace(/[^a-zA-Z]/g, '').toLowerCase();
      if (hintWords.has(cleanWord)) return isFirstOfWord ? char : '_';
      return '_';
    }
    return '_'; // hidden
  };

  const renderReferenceText = () => {
    const currentVerse = verses[0];
    if (!currentVerse) return null;

    const text = currentVerse.text;
    const words = text.split(' ');
    let charIndex = 0;

    return (
      <ReferenceText>
        {words.map((word, wordIndex) => {
          const wordElement = (
            <WordContainer key={wordIndex}>
              {word.split('').map((char, charInWordIndex) => {
                const currentCharIndex = charIndex;
                charIndex++;
                return (
                  <ReferenceCharacter
                    key={currentCharIndex}
                    isTyped={currentCharIndex < userInput.length}
                    isCorrect={userInput[currentCharIndex] === char}
                  >
                    {getDisplayChar(char, charInWordIndex === 0, word, wordIndex)}
                  </ReferenceCharacter>
                );
              })}
            </WordContainer>
          );

          // Add space after word if not the last word
          if (wordIndex < words.length - 1) {
            const spaceElement = (
              <ReferenceCharacter
                key={charIndex}
                isTyped={charIndex < userInput.length}
                isCorrect={userInput[charIndex] === ' '}
              >
                {'\u00A0'}
              </ReferenceCharacter>
            );
            charIndex++;
            return [wordElement, spaceElement];
          }

          return wordElement;
        })}
      </ReferenceText>
    );
  };

  if (isLoading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (documentNotFound) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Paper elevation={3} sx={{ p: 3, textAlign: 'center' }}>
          <Typography gutterBottom>
            The selected document is no longer available.
          </Typography>
          <Button variant="contained" href="/documents" sx={{ mr: 1 }}>
            Manage Documents
          </Button>
          <Button variant="outlined" onClick={async () => {
            await axios.post('/api/settings', { activeSourceText: 'bible' });
            setActiveSourceText('bible');
          }}>
            Switch to Bible
          </Button>
        </Paper>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Paper elevation={3} sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="error" gutterBottom>
            {error}
          </Typography>
          <Button variant="contained" onClick={fetchVerses}>
            Try Again
          </Button>
        </Paper>
      </Container>
    );
  }

  const currentVerse = verses[0];

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  if (completed) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ textAlign: 'center', mb: 1 }}>
            Results
          </Typography>
          <Typography variant="body2" sx={{ textAlign: 'center', color: '#999', mb: 2 }}>
            {difficulty === 'full' ? 'Full Text' : difficulty === 'everyOther' ? 'Every Other' : difficulty === 'firstLetter' ? 'First Letters' : difficulty === 'partial' ? 'Hints Only' : 'From Memory'}
          </Typography>

          {currentVerse && (
            <Typography variant="subtitle1" sx={{ textAlign: 'center', color: '#666', mb: 3 }}>
              {currentVerse.reference}
            </Typography>
          )}

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, mb: 4 }}>
            <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">WPM</Typography>
              <Typography variant="h4">{wpm}</Typography>
            </Paper>
            <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">Total Time</Typography>
              <Typography variant="h4">{formatTime(totalTime)}</Typography>
            </Paper>
            <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">Accuracy</Typography>
              <Typography variant="h4">{accuracy}%</Typography>
            </Paper>
            <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">Backspaces</Typography>
              <Typography variant="h4">{backspaceCount}</Typography>
            </Paper>
          </Box>

          <Box sx={{ textAlign: 'center', display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button variant="outlined" size="large" onClick={tryAgain}>
              Try Again
            </Button>
            {difficulty !== 'hidden' && (
              <Button variant="contained" size="large" onClick={nextDifficulty}>
                {difficulty === 'full' ? 'Next: Every Other' : difficulty === 'everyOther' ? 'Next: First Letters' : difficulty === 'firstLetter' ? 'Next: Hints Only' : 'Next: From Memory'}
              </Button>
            )}
            <Button variant={difficulty === 'hidden' ? 'contained' : 'outlined'} size="large" onClick={fetchVerses}>
              New Passage
            </Button>
          </Box>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h6">
            Typing Practice
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {difficulty === 'full' ? 'Full Text' : difficulty === 'everyOther' ? 'Every Other' : difficulty === 'firstLetter' ? 'First Letters' : difficulty === 'partial' ? 'Hints Only' : 'From Memory'}
          </Typography>
        </Box>

        {currentVerse && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
              {currentVerse.reference} ({currentVerse.sourceText})
            </Typography>
            {renderReferenceText()}
          </Box>
        )}

        <InputContainer onClick={() => inputRef.current?.focus()}>
          <HiddenInput
            ref={inputRef}
            value={userInput}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
          />
          <DisplayText>
            {renderInputText()}
            {!userInput && <StartTypingPrompt>Click here and start typing...</StartTypingPrompt>}
          </DisplayText>
        </InputContainer>

        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
          <Typography>WPM: {wpm}</Typography>
          <Typography>Accuracy: {accuracy}%</Typography>
        </Box>

        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Button variant="outlined" onClick={fetchVerses}>
            {activeSourceText === 'bible' ? 'New Verses' : 'Next Passage'}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default TypingPractice; 