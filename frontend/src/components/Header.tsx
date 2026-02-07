import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const Header: React.FC = () => {
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          BibleTyper
        </Typography>
        <Box>
          <Button color="inherit" component={RouterLink} to="/">
            Practice
          </Button>
          <Button color="inherit" component={RouterLink} to="/documents">
            Documents
          </Button>
          <Button color="inherit" component={RouterLink} to="/settings">
            Settings
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header; 