import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';

const ImageCarousel = ({ images, autoPlay = true, interval = 4000 }) => {
  const theme = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Auto-play functionality
  useEffect(() => {
    if (!autoPlay) return;

    const timer = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
        setIsTransitioning(false);
      }, 300); // Half of transition duration
    }, interval);

    return () => clearInterval(timer);
  }, [autoPlay, interval, images.length]);

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        backgroundColor: theme.palette.background.default, // Use actual theme background colors
      }}
    >
      {/* All Images Container with sliding effect */}
      <Box
        sx={{
          display: 'flex',
          width: `${images.length * 100}%`,
          height: '100%',
          transform: `translateX(-${currentIndex * (100 / images.length)}%)`,
          transition: isTransitioning ? 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
        }}
      >
        {images.map((image, index) => (
          <Box
            key={index}
            component="img"
            src={image}
            alt={`Carousel slide ${index + 1}`}
            sx={{
              width: `${100 / images.length}%`,
              height: '100%',
              objectFit: 'cover',
              filter: theme.palette.mode === 'dark' 
                ? 'brightness(1.2) contrast(1.3) saturate(1.4)' // Enhanced for dark mode
                : 'brightness(1.1) contrast(1.2) saturate(1.3)', // Standard for light mode
              flexShrink: 0,
              display: 'block',
              // Remove individual image background - let container background show through
            }}
          />
        ))}
      </Box>
    </Box>
  );
};

export default ImageCarousel;
