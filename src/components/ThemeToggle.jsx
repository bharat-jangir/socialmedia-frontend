import React from 'react';
import { IconButton, Tooltip, Box } from '@mui/material';
import { LightMode, DarkMode } from '@mui/icons-material';
import { useThemeContext } from '../context/ThemeContext';

const ThemeToggle = ({ size = 'medium', showLabel = false }) => {
  const { mode, toggleTheme } = useThemeContext();

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Tooltip title={mode === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
        <IconButton
          onClick={toggleTheme}
          sx={{
            color: 'text.primary',
            backgroundColor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            '&:hover': {
              backgroundColor: 'action.hover',
              transform: 'scale(1.05)',
            },
            transition: 'all 0.2s ease',
            ...(size === 'small' && {
              width: 32,
              height: 32,
              '& .MuiSvgIcon-root': {
                fontSize: 18,
              },
            }),
            ...(size === 'large' && {
              width: 48,
              height: 48,
              '& .MuiSvgIcon-root': {
                fontSize: 28,
              },
            }),
          }}
        >
          {mode === 'dark' ? <LightMode /> : <DarkMode />}
        </IconButton>
      </Tooltip>
      {showLabel && (
        <Box sx={{ 
          color: 'text.secondary', 
          fontSize: '0.875rem',
          fontWeight: 500,
        }}>
          {mode === 'dark' ? 'Light Mode' : 'Dark Mode'}
        </Box>
      )}
    </Box>
  );
};

export default ThemeToggle;
