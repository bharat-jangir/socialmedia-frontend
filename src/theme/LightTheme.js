import { createTheme } from "@mui/material";
import { themeColors } from "./DarkTheme";

export const LightTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: themeColors.primary[500],
      light: themeColors.primary[300],
      dark: themeColors.primary[700],
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: themeColors.secondary[500],
      light: themeColors.secondary[300],
      dark: themeColors.secondary[700],
      contrastText: '#FFFFFF',
    },
    background: {
      default: themeColors.light.background.primary,
      paper: themeColors.light.background.secondary,
    },
    text: {
      primary: themeColors.light.text.primary,
      secondary: themeColors.light.text.secondary,
      disabled: themeColors.light.text.tertiary,
    },
    divider: themeColors.light.border.primary,
    action: {
      active: themeColors.primary[500],
      hover: themeColors.light.surface.secondary,
      selected: themeColors.light.surface.tertiary,
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
    '0px 2px 8px rgba(0, 0, 0, 0.05)',
    '0px 4px 16px rgba(0, 0, 0, 0.08)',
    '0px 8px 24px rgba(0, 0, 0, 0.12)',
    '0px 12px 32px rgba(0, 0, 0, 0.15)',
    '0px 16px 40px rgba(0, 0, 0, 0.18)',
    '0px 20px 48px rgba(0, 0, 0, 0.2)',
    '0px 24px 56px rgba(0, 0, 0, 0.22)',
    '0px 28px 64px rgba(0, 0, 0, 0.25)',
    '0px 32px 72px rgba(0, 0, 0, 0.28)',
    '0px 36px 80px rgba(0, 0, 0, 0.3)',
    '0px 40px 88px rgba(0, 0, 0, 0.32)',
    '0px 44px 96px rgba(0, 0, 0, 0.35)',
    '0px 48px 104px rgba(0, 0, 0, 0.38)',
    '0px 52px 112px rgba(0, 0, 0, 0.4)',
    '0px 56px 120px rgba(0, 0, 0, 0.42)',
    '0px 60px 128px rgba(0, 0, 0, 0.45)',
    '0px 64px 136px rgba(0, 0, 0, 0.48)',
    '0px 68px 144px rgba(0, 0, 0, 0.5)',
    '0px 72px 152px rgba(0, 0, 0, 0.52)',
    '0px 76px 160px rgba(0, 0, 0, 0.55)',
    '0px 80px 168px rgba(0, 0, 0, 0.58)',
    '0px 84px 176px rgba(0, 0, 0, 0.6)',
    '0px 88px 184px rgba(0, 0, 0, 0.62)',
    '0px 92px 192px rgba(0, 0, 0, 0.65)',
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
            boxShadow: '0px 4px 16px rgba(24, 144, 255, 0.2)',
          },
        },
        contained: {
          background: `linear-gradient(135deg, ${themeColors.primary[500]} 0%, ${themeColors.primary[600]} 100%)`,
          '&:hover': {
            background: `linear-gradient(135deg, ${themeColors.primary[600]} 0%, ${themeColors.primary[700]} 100%)`,
          },
        },
        outlined: {
          borderColor: themeColors.primary[500],
          color: themeColors.primary[500],
          '&:hover': {
            borderColor: themeColors.primary[400],
            backgroundColor: `${themeColors.primary[500]}10`,
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: themeColors.light.background.elevated,
          border: `1px solid ${themeColors.light.border.primary}`,
          borderRadius: 16,
          boxShadow: '0px 4px 16px rgba(0, 0, 0, 0.08)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: themeColors.light.background.elevated,
          border: `1px solid ${themeColors.light.border.primary}`,
        },
      },
    },
  },
});
