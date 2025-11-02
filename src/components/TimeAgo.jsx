import { useState, useEffect } from 'react';
import { Typography } from '@mui/material';
import { formatTimeAgo } from '../utils/dateTimeUtils';

/**
 * TimeAgo component that updates the displayed time in real-time
 * Automatically re-renders every minute to update relative time display
 */
const TimeAgo = ({ dateInput, variant = 'caption', color = 'text.secondary', sx = {} }) => {
  const [timeString, setTimeString] = useState(() => formatTimeAgo(dateInput));

  useEffect(() => {
    // Update immediately
    setTimeString(formatTimeAgo(dateInput));

    // Update every minute for real-time updates
    const interval = setInterval(() => {
      setTimeString(formatTimeAgo(dateInput));
    }, 60000); // Update every 60 seconds

    // Also update more frequently for recent times (every 30 seconds)
    let quickInterval;
    const date = new Date(typeof dateInput === 'string' && !dateInput.includes('Z') 
      ? dateInput + 'Z' 
      : dateInput);
    const now = new Date();
    const diffInMinutes = (now - date) / (1000 * 60);

    if (diffInMinutes < 60) {
      // For times less than 1 hour old, update every 30 seconds
      quickInterval = setInterval(() => {
        setTimeString(formatTimeAgo(dateInput));
      }, 30000); // Update every 30 seconds
    }

    return () => {
      clearInterval(interval);
      if (quickInterval) {
        clearInterval(quickInterval);
      }
    };
  }, [dateInput]);

  return (
    <Typography variant={variant} color={color} sx={sx}>
      {timeString}
    </Typography>
  );
};

export default TimeAgo;

