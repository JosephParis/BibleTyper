import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Header: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Type2Mem
        </Typography>
        <Box>
          <Button color="inherit" component={RouterLink} to="/">
            Practice
          </Button>
          {isAuthenticated && (
            <>
              <Button color="inherit" component={RouterLink} to="/documents">
                Documents
              </Button>
              <Button color="inherit" component={RouterLink} to="/settings">
                Settings
              </Button>
            </>
          )}
          {isAuthenticated ? (
            <Button color="inherit" onClick={logout}>
              {user?.name || user?.email} — Logout
            </Button>
          ) : (
            <Button color="inherit" component={RouterLink} to="/login">
              Sign In
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
