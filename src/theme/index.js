import { createTheme } from "@mui/material";

// SoulConnect Theme - Unique Social Media Color Palette
const soulConnectColors = {
  // Primary - Coral Rose (warmth, connection)
  primary: {
    50: '#FFF5F5',
    100: '#FFE8E8',
    200: '#FFD1D1',
    300: '#FFB3B3',
    400: '#FF8A8A',
    500: '#FF6B6B', // Main coral rose
    600: '#FF5252',
    700: '#FF3838',
    800: '#FF1F1F',
    900: '#E60000',
  },
  
  // Secondary - Sky Blue (trust, communication)
  secondary: {
    50: '#F0FDFC',
    100: '#CCFBF1',
    200: '#99F6E4',
    300: '#5EEAD4',
    400: '#2DD4BF',
    500: '#4ECDC4', // Main sky blue
    600: '#0D9488',
    700: '#0F766E',
    800: '#115E59',
    900: '#134E4A',
  },
  
  // Accent - Lavender (creativity, inspiration)
  accent: {
    50: '#F8FFFE',
    100: '#F0FDF4',
    200: '#DCFCE7',
    300: '#BBF7D0',
    400: '#86EFAC',
    500: '#A8E6CF', // Main lavender
    600: '#16A34A',
    700: '#15803D',
    800: '#166534',
    900: '#14532D',
  },
  
  // Warm Beige (comfort, positivity)
  warm: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FBBF24',
    500: '#FFEAA7', // Main warm beige
    600: '#D97706',
    700: '#B45309',
    800: '#92400E',
    900: '#78350F',
  },
  
  // Neutral grays for backgrounds and text
  neutral: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#E5E5E5',
    300: '#D4D4D4',
    400: '#A3A3A3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
  },
  
  // Semantic colors
  success: {
    50: '#F0FDF4',
    100: '#DCFCE7',
    200: '#BBF7D0',
    300: '#86EFAC',
    400: '#4ADE80',
    500: '#22C55E',
    600: '#16A34A',
    700: '#15803D',
    800: '#166534',
    900: '#14532D',
  },
  
  error: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    200: '#FECACA',
    300: '#FCA5A5',
    400: '#F87171',
    500: '#EF4444',
    600: '#DC2626',
    700: '#B91C1C',
    800: '#991B1B',
    900: '#7F1D1D',
  },
  
  warning: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FBBF24',
    500: '#F59E0B',
    600: '#D97706',
    700: '#B45309',
    800: '#92400E',
    900: '#78350F',
  },
  
  info: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    200: '#BFDBFE',
    300: '#93C5FD',
    400: '#60A5FA',
    500: '#3B82F6',
    600: '#2563EB',
    700: '#1D4ED8',
    800: '#1E40AF',
    900: '#1E3A8A',
  }
};

// Enhanced typography for SoulConnect
const typography = {
  fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  h1: {
    fontSize: '2.5rem',
    fontWeight: 700,
    lineHeight: 1.2,
    letterSpacing: '-0.02em',
  },
  h2: {
    fontSize: '2rem',
    fontWeight: 600,
    lineHeight: 1.3,
    letterSpacing: '-0.01em',
  },
  h3: {
    fontSize: '1.5rem',
    fontWeight: 600,
    lineHeight: 1.4,
  },
  h4: {
    fontSize: '1.25rem',
    fontWeight: 600,
    lineHeight: 1.4,
  },
  h5: {
    fontSize: '1.125rem',
    fontWeight: 600,
    lineHeight: 1.4,
  },
  h6: {
    fontSize: '1rem',
    fontWeight: 600,
    lineHeight: 1.4,
  },
  body1: {
    fontSize: '1rem',
    lineHeight: 1.6,
    fontWeight: 400,
  },
  body2: {
    fontSize: '0.875rem',
    lineHeight: 1.5,
    fontWeight: 400,
  },
  button: {
    fontSize: '0.875rem',
    fontWeight: 600,
    textTransform: 'none',
    letterSpacing: '0.02em',
  },
};

// Modern shape settings with subtle rounding
const shape = {
  borderRadius: 8,
};

// SoulConnect shadows with warm undertones
const soulConnectShadows = [
  'none',
  '0px 1px 3px rgba(255, 107, 107, 0.1)',
  '0px 2px 6px rgba(255, 107, 107, 0.1)',
  '0px 4px 12px rgba(255, 107, 107, 0.1)',
  '0px 8px 24px rgba(255, 107, 107, 0.1)',
  '0px 16px 48px rgba(255, 107, 107, 0.1)',
  '0px 24px 64px rgba(255, 107, 107, 0.1)',
  '0px 32px 80px rgba(255, 107, 107, 0.1)',
  '0px 40px 96px rgba(255, 107, 107, 0.1)',
  '0px 48px 112px rgba(255, 107, 107, 0.1)',
  '0px 56px 128px rgba(255, 107, 107, 0.1)',
  '0px 64px 144px rgba(255, 107, 107, 0.1)',
  '0px 72px 160px rgba(255, 107, 107, 0.1)',
  '0px 80px 176px rgba(255, 107, 107, 0.1)',
  '0px 88px 192px rgba(255, 107, 107, 0.1)',
  '0px 96px 208px rgba(255, 107, 107, 0.1)',
  '0px 104px 224px rgba(255, 107, 107, 0.1)',
  '0px 112px 240px rgba(255, 107, 107, 0.1)',
  '0px 120px 256px rgba(255, 107, 107, 0.1)',
  '0px 128px 272px rgba(255, 107, 107, 0.1)',
  '0px 136px 288px rgba(255, 107, 107, 0.1)',
  '0px 144px 304px rgba(255, 107, 107, 0.1)',
  '0px 152px 320px rgba(255, 107, 107, 0.1)',
  '0px 160px 336px rgba(255, 107, 107, 0.1)',
  '0px 168px 352px rgba(255, 107, 107, 0.1)',
];

// SoulConnect Dark Theme
export const DarkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: soulConnectColors.primary[500], // Coral Rose
      light: soulConnectColors.primary[400],
      dark: soulConnectColors.primary[600],
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: soulConnectColors.secondary[500], // Sky Blue
      light: soulConnectColors.secondary[400],
      dark: soulConnectColors.secondary[600],
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#0F0F23', // Deep midnight blue
      paper: '#1A1A2E', // Slightly lighter midnight
    },
    text: {
      primary: '#E8F4FD', // Soft white
      secondary: '#B8C5D1', // Muted blue-gray
      disabled: '#8A9BA8', // Disabled text
    },
    divider: '#2D3748', // Subtle divider
    action: {
      active: soulConnectColors.primary[500],
      hover: '#2D3748',
      selected: '#1A1A2E',
    },
    success: {
      main: soulConnectColors.success[500],
      light: soulConnectColors.success[400],
      dark: soulConnectColors.success[600],
    },
    error: {
      main: soulConnectColors.error[500],
      light: soulConnectColors.error[400],
      dark: soulConnectColors.error[600],
    },
    warning: {
      main: soulConnectColors.warning[500],
      light: soulConnectColors.warning[400],
      dark: soulConnectColors.warning[600],
    },
    info: {
      main: soulConnectColors.info[500],
      light: soulConnectColors.info[400],
      dark: soulConnectColors.info[600],
    },
  },
  typography,
  shape,
  shadows: soulConnectShadows,
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '12px 24px',
          fontWeight: 600,
          textTransform: 'none',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0px 4px 16px rgba(255, 107, 107, 0.2)',
          },
        },
        contained: {
          background: `linear-gradient(135deg, ${soulConnectColors.primary[500]} 0%, ${soulConnectColors.primary[600]} 100%)`,
          '&:hover': {
            background: `linear-gradient(135deg, ${soulConnectColors.primary[600]} 0%, ${soulConnectColors.primary[700]} 100%)`,
          },
        },
        outlined: {
          borderColor: soulConnectColors.primary[500],
          color: soulConnectColors.primary[500],
          '&:hover': {
            borderColor: soulConnectColors.primary[400],
            backgroundColor: `${soulConnectColors.primary[500]}15`,
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#1A1A2E',
          border: `1px solid #2D3748`,
          borderRadius: 12,
          boxShadow: '0px 4px 16px rgba(255, 107, 107, 0.1)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: '#1A1A2E',
          border: `1px solid #2D3748`,
        },
      },
    },
  },
});

// SoulConnect Light Theme
export const LightTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: soulConnectColors.primary[500], // Coral Rose
      light: soulConnectColors.primary[400],
      dark: soulConnectColors.primary[600],
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: soulConnectColors.secondary[500], // Sky Blue
      light: soulConnectColors.secondary[400],
      dark: soulConnectColors.secondary[600],
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#FEFEFE', // Pure white with warm hint
      paper: '#F8FAFC', // Soft gray-white
    },
    text: {
      primary: '#1A202C', // Dark charcoal
      secondary: '#4A5568', // Medium gray
      disabled: '#A0AEC0', // Light gray
    },
    divider: '#E2E8F0', // Light divider
    action: {
      active: soulConnectColors.primary[500],
      hover: '#F7FAFC',
      selected: '#EDF2F7',
    },
    success: {
      main: soulConnectColors.success[500],
      light: soulConnectColors.success[400],
      dark: soulConnectColors.success[600],
    },
    error: {
      main: soulConnectColors.error[500],
      light: soulConnectColors.error[400],
      dark: soulConnectColors.error[600],
    },
    warning: {
      main: soulConnectColors.warning[500],
      light: soulConnectColors.warning[400],
      dark: soulConnectColors.warning[600],
    },
    info: {
      main: soulConnectColors.info[500],
      light: soulConnectColors.info[400],
      dark: soulConnectColors.info[600],
    },
  },
  typography,
  shape,
  shadows: soulConnectShadows,
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '12px 24px',
          fontWeight: 600,
          textTransform: 'none',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0px 4px 16px rgba(255, 107, 107, 0.2)',
          },
        },
        contained: {
          background: `linear-gradient(135deg, ${soulConnectColors.primary[500]} 0%, ${soulConnectColors.primary[600]} 100%)`,
          '&:hover': {
            background: `linear-gradient(135deg, ${soulConnectColors.primary[600]} 0%, ${soulConnectColors.primary[700]} 100%)`,
          },
        },
        outlined: {
          borderColor: soulConnectColors.primary[500],
          color: soulConnectColors.primary[500],
          '&:hover': {
            borderColor: soulConnectColors.primary[400],
            backgroundColor: `${soulConnectColors.primary[500]}10`,
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#FFFFFF',
          border: `1px solid #E2E8F0`,
          borderRadius: 12,
          boxShadow: '0px 4px 16px rgba(255, 107, 107, 0.08)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: '#FFFFFF',
          border: `1px solid #E2E8F0`,
        },
      },
    },
  },
});

// Export color constants for use in components
export const themeColors = soulConnectColors;
