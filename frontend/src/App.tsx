import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import TypingPractice from './components/TypingPractice';
import Header from './components/Header';
import Settings from './components/Settings';
import VerseDisplay from './components/VerseDisplay';
import DocumentUpload from './components/DocumentUpload';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <div className="App">
          <Header />
          <Routes>
            <Route path="/" element={<TypingPractice />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/verse-display" element={<VerseDisplay />} />
            <Route path="/documents" element={<DocumentUpload />} />
          </Routes>
        </div>
      </Router>
    </ThemeProvider>
  );
};

export default App; 