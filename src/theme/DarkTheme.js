import { createTheme } from "@mui/material";

// Custom unique color palette - "Neon Horizon" theme
const neonHorizonColors = {
  // Primary colors - Electric cyan with purple accents
  primary: {
    50: '#E6F7FF',
    100: '#BAE7FF', 
    200: '#91D5FF',
    300: '#69C0FF',
    400: '#40A9FF',
    500: '#1890FF', // Main primary
    600: '#096DD9',
    700: '#0050B3',
    800: '#003A8C',
    900: '#002766',
  },
  
  // Secondary colors - Vibrant purple with pink undertones
  secondary: {
    50: '#F9F0FF',
    100: '#EFDBFF',
    200: '#D3ADF7',
    300: '#B37FEB',
    400: '#9254DE',
    500: '#722ED1', // Main secondary
    600: '#531DAB',
    700: '#391085',
    800: '#22075E',
    900: '#120338',
  },
  
  // Accent colors - Electric lime for highlights
  accent: {
    50: '#F6FFED',
    100: '#D9F7BE',
    200: '#B7EB8F',
    300: '#95DE64',
    400: '#73D13D',
    500: '#52C41A', // Main accent
    600: '#389E0D',
    700: '#237804',
    800: '#135200',
    900: '#092B00',
  },
  
  // Dark theme colors
  dark: {
    background: {
      primary: '#0A0E1A',    // Deep space blue
      secondary: '#1A1F2E',  // Slightly lighter space
      tertiary: '#252B3D',   // Card backgrounds
      elevated: '#2D3447',   // Elevated surfaces
    },
    surface: {
      primary: '#1A1F2E',
      secondary: '#252B3D',
      tertiary: '#2D3447',
      border: '#3A4154',
    },
    text: {
      primary: '#E8F4FD',    // Soft white
      secondary: '#B8C5D1',  // Muted blue-gray
      tertiary: '#8A9BA8',   // Disabled text
      accent: '#52C41A',     // Accent green
    },
    border: {
      primary: '#3A4154',
      secondary: '#4A5568',
      accent: '#1890FF',
    }
  },
  
  // Light theme colors
  light: {
    background: {
      primary: '#FAFBFC',    // Pure white with hint of blue
      secondary: '#F5F7FA',  // Light gray-blue
      tertiary: '#EBEEF5',   // Card backgrounds
      elevated: '#FFFFFF',   // Elevated surfaces
    },
    surface: {
      primary: '#FFFFFF',
      secondary: '#F5F7FA',
      tertiary: '#EBEEF5',
      border: '#E1E8ED',
    },
    text: {
      primary: '#1A202C',    // Dark charcoal
      secondary: '#4A5568',  // Medium gray
      tertiary: '#718096',   // Light gray
      accent: '#52C41A',     // Accent green
    },
    border: {
      primary: '#E1E8ED',
      secondary: '#CBD5E0',
      accent: '#1890FF',
    }
  }
};

export const DarkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: neonHorizonColors.primary[500],
      light: neonHorizonColors.primary[300],
      dark: neonHorizonColors.primary[700],
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: neonHorizonColors.secondary[500],
      light: neonHorizonColors.secondary[300],
      dark: neonHorizonColors.secondary[700],
      contrastText: '#FFFFFF',
    },
    background: {
      default: neonHorizonColors.dark.background.primary,
      paper: neonHorizonColors.dark.background.secondary,
    },
    text: {
      primary: neonHorizonColors.dark.text.primary,
      secondary: neonHorizonColors.dark.text.secondary,
      disabled: neonHorizonColors.dark.text.tertiary,
    },
    divider: neonHorizonColors.dark.border.primary,
    action: {
      active: neonHorizonColors.primary[500],
      hover: neonHorizonColors.dark.surface.secondary,
      selected: neonHorizonColors.dark.surface.tertiary,
    },
  },
  typography: {
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
  },
  shape: {
    borderRadius: 12,
  },
  shadows: [
    'none',
    '0px 2px 8px rgba(0, 0, 0, 0.1)',
    '0px 4px 16px rgba(0, 0, 0, 0.15)',
    '0px 8px 24px rgba(0, 0, 0, 0.2)',
    '0px 12px 32px rgba(0, 0, 0, 0.25)',
    '0px 16px 40px rgba(0, 0, 0, 0.3)',
    '0px 20px 48px rgba(0, 0, 0, 0.35)',
    '0px 24px 56px rgba(0, 0, 0, 0.4)',
    '0px 28px 64px rgba(0, 0, 0, 0.45)',
    '0px 32px 72px rgba(0, 0, 0, 0.5)',
    '0px 36px 80px rgba(0, 0, 0, 0.55)',
    '0px 40px 88px rgba(0, 0, 0, 0.6)',
    '0px 44px 96px rgba(0, 0, 0, 0.65)',
    '0px 48px 104px rgba(0, 0, 0, 0.7)',
    '0px 52px 112px rgba(0, 0, 0, 0.75)',
    '0px 56px 120px rgba(0, 0, 0, 0.8)',
    '0px 60px 128px rgba(0, 0, 0, 0.85)',
    '0px 64px 136px rgba(0, 0, 0, 0.9)',
    '0px 68px 144px rgba(0, 0, 0, 0.95)',
    '0px 72px 152px rgba(0, 0, 0, 1)',
    '0px 76px 160px rgba(0, 0, 0, 1)',
    '0px 80px 168px rgba(0, 0, 0, 1)',
    '0px 84px 176px rgba(0, 0, 0, 1)',
    '0px 88px 184px rgba(0, 0, 0, 1)',
    '0px 92px 192px rgba(0, 0, 0, 1)',
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: '12px 24px',
          fontWeight: 600,
          textTransform: 'none',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0px 4px 16px rgba(24, 144, 255, 0.3)',
          },
        },
        contained: {
          background: `linear-gradient(135deg, ${neonHorizonColors.primary[500]} 0%, ${neonHorizonColors.primary[600]} 100%)`,
          '&:hover': {
            background: `linear-gradient(135deg, ${neonHorizonColors.primary[600]} 0%, ${neonHorizonColors.primary[700]} 100%)`,
          },
        },
        outlined: {
          borderColor: neonHorizonColors.primary[500],
          color: neonHorizonColors.primary[500],
          '&:hover': {
            borderColor: neonHorizonColors.primary[400],
            backgroundColor: `${neonHorizonColors.primary[500]}15`,
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: neonHorizonColors.dark.background.secondary,
          border: `1px solid ${neonHorizonColors.dark.border.primary}`,
          borderRadius: 16,
          boxShadow: '0px 4px 16px rgba(0, 0, 0, 0.15)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: neonHorizonColors.dark.background.secondary,
          border: `1px solid ${neonHorizonColors.dark.border.primary}`,
        },
      },
    },
  },
});

// Export color constants for use in components
export const themeColors = neonHorizonColors;