import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import TypingPractice from './components/TypingPractice';
import Header from './components/Header';
import Settings from './components/Settings';
import VerseDisplay from './components/VerseDisplay';
import DocumentUpload from './components/DocumentUpload';
import DocumentEdit from './components/DocumentEdit';
import LoginPage from './components/LoginPage';
import ErrorBoundary from './components/ErrorBoundary';

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

const ProtectedRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  if (!isAuthenticated) return <Navigate to="/login" />;
  return children;
};

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '';

const App: React.FC = () => {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <ErrorBoundary>
          <Router>
            <div className="App">
              <Header />
              <Routes>
                <Route path="/" element={<TypingPractice />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                <Route path="/verse-display" element={<VerseDisplay />} />
                <Route path="/documents" element={<ProtectedRoute><DocumentUpload /></ProtectedRoute>} />
                <Route path="/documents/:id/edit" element={<ProtectedRoute><DocumentEdit /></ProtectedRoute>} />
              </Routes>
            </div>
          </Router>
          </ErrorBoundary>
        </ThemeProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
};

export default App;
