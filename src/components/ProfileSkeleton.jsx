import React from 'react';
import { Box, Skeleton, Card } from '@mui/material';
import { useTheme } from '@mui/material/styles';

const ProfileSkeleton = () => {
  const theme = useTheme();

  return (
    <Box 
      className="flex flex-col items-center min-h-screen"
      sx={{ backgroundColor: theme.palette.background.default }}
    >
      {/* Profile Header Skeleton */}
      <Card 
        className="w-full max-w-4xl rounded-lg shadow-lg mb-6 overflow-hidden"
        sx={{ 
          backgroundColor: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
          animation: 'fadeIn 0.3s ease-in',
          '@keyframes fadeIn': {
            '0%': { opacity: 0, transform: 'translateY(-10px)' },
            '100%': { opacity: 1, transform: 'translateY(0)' }
          }
        }}
      >
        {/* Cover Photo Skeleton */}
        <Box className="relative h-64 overflow-hidden">
          <Skeleton 
            variant="rectangular" 
            width="100%" 
            height="100%"
            animation="wave"
            sx={{ 
              bgcolor: theme.palette.mode === 'dark' 
                ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.1) 100%)'
                : 'linear-gradient(135deg, rgba(0, 0, 0, 0.05) 0%, rgba(0, 0, 0, 0.1) 100%)',
              backgroundSize: '200% 200%',
              animation: 'shimmer 2s infinite',
              '@keyframes shimmer': {
                '0%': { backgroundPosition: '-200% 0' },
                '100%': { backgroundPosition: '200% 0' }
              }
            }}
          />
          
          {/* Profile Picture Skeleton */}
          <Box className="absolute bottom-0 left-6 transform translate-y-1/2">
            <Skeleton 
              variant="circular" 
              width={140} 
              height={140}
              animation="wave"
              sx={{ 
                bgcolor: theme.palette.mode === 'dark' 
                  ? 'rgba(255, 255, 255, 0.12)' 
                  : 'rgba(0, 0, 0, 0.12)',
                border: `4px solid ${theme.palette.background.paper}`,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
              }}
            />
          </Box>
          
          {/* Action Buttons Skeleton */}
          <Box className="absolute bottom-4 right-6">
            <Skeleton 
              variant="rectangular" 
              width={120} 
              height={40}
              animation="wave"
              sx={{ 
                bgcolor: theme.palette.mode === 'dark' 
                  ? 'rgba(255, 255, 255, 0.1)' 
                  : 'rgba(0, 0, 0, 0.1)',
                borderRadius: '20px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}
            />
          </Box>
        </Box>
        
        {/* Profile Info Section Skeleton */}
        <Box className="pt-16 px-6 pb-6">
          {/* Name Skeleton */}
          <Skeleton 
            variant="text" 
            width={220} 
            height={42}
            animation="wave"
            sx={{ 
              bgcolor: theme.palette.mode === 'dark' 
                ? 'rgba(255, 255, 255, 0.1)' 
                : 'rgba(0, 0, 0, 0.1)',
              mb: 3,
              borderRadius: 1
            }}
          />
          
          {/* Stats Row Skeleton */}
          <Box className="flex gap-8 mt-4">
            {[1, 2, 3].map((item) => (
              <Box key={item} className="text-center">
                <Skeleton 
                  variant="text" 
                  width={45} 
                  height={36}
                  animation="wave"
                  sx={{ 
                    bgcolor: theme.palette.mode === 'dark' 
                      ? 'rgba(255, 255, 255, 0.1)' 
                      : 'rgba(0, 0, 0, 0.1)',
                    mb: 1,
                    borderRadius: 1,
                    mx: 'auto'
                  }}
                />
                <Skeleton 
                  variant="text" 
                  width={60} 
                  height={22}
                  animation="wave"
                  sx={{ 
                    bgcolor: theme.palette.mode === 'dark' 
                      ? 'rgba(255, 255, 255, 0.08)' 
                      : 'rgba(0, 0, 0, 0.08)',
                    borderRadius: 1,
                    mx: 'auto'
                  }}
                />
              </Box>
            ))}
          </Box>
          
          {/* Bio Skeleton */}
          <Box className="mt-6 p-4 rounded-lg" sx={{ backgroundColor: theme.palette.background.default }}>
            <Skeleton 
              variant="text" 
              width="100%" 
              height={24}
              animation="wave"
              sx={{ 
                bgcolor: theme.palette.mode === 'dark' 
                  ? 'rgba(255, 255, 255, 0.08)' 
                  : 'rgba(0, 0, 0, 0.08)',
                mb: 1.5,
                borderRadius: 1
              }}
            />
            <Skeleton 
              variant="text" 
              width="85%" 
              height={24}
              animation="wave"
              sx={{ 
                bgcolor: theme.palette.mode === 'dark' 
                  ? 'rgba(255, 255, 255, 0.08)' 
                  : 'rgba(0, 0, 0, 0.08)',
                borderRadius: 1
              }}
            />
          </Box>
        </Box>
      </Card>

      {/* Tabs Skeleton */}
      <Card 
        className="w-full max-w-4xl rounded-lg shadow-lg"
        sx={{ 
          backgroundColor: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
          animation: 'fadeIn 0.4s ease-in 0.1s both',
          '@keyframes fadeIn': {
            '0%': { opacity: 0, transform: 'translateY(-10px)' },
            '100%': { opacity: 1, transform: 'translateY(0)' }
          }
        }}
      >
        <Box 
          className="flex"
          sx={{ borderBottom: `1px solid ${theme.palette.divider}` }}
        >
          {[1, 2, 3].map((item) => (
            <Box key={item} sx={{ flex: 1, p: 2 }}>
              <Skeleton 
                variant="text" 
                width={60} 
                height={24}
                animation="wave"
                sx={{ 
                  bgcolor: theme.palette.mode === 'dark' 
                    ? 'rgba(255, 255, 255, 0.1)' 
                    : 'rgba(0, 0, 0, 0.1)',
                  borderRadius: 1,
                  mx: 'auto'
                }}
              />
            </Box>
          ))}
        </Box>
      </Card>

      {/* Content Grid Skeleton */}
      <Box 
        className="w-full max-w-4xl mt-4"
        sx={{
          animation: 'fadeIn 0.5s ease-in 0.2s both',
          '@keyframes fadeIn': {
            '0%': { opacity: 0, transform: 'translateY(-10px)' },
            '100%': { opacity: 1, transform: 'translateY(0)' }
          }
        }}
      >
        <Box className="grid grid-cols-3 gap-1">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((item, index) => (
            <Skeleton 
              key={item}
              variant="rectangular" 
              width="100%"
              animation="wave"
              sx={{ 
                aspectRatio: '1/1',
                bgcolor: theme.palette.mode === 'dark' 
                  ? `rgba(255, 255, 255, ${0.05 + (index % 3) * 0.02})` 
                  : `rgba(0, 0, 0, ${0.05 + (index % 3) * 0.02})`,
                borderRadius: 2,
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                transition: 'transform 0.2s ease-in-out',
                '&:hover': {
                  transform: 'scale(1.02)'
                }
              }}
            />
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default ProfileSkeleton;

