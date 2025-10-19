/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // SoulConnect Theme Colors
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
        // Dark theme backgrounds
        dark: {
          bg: '#0F0F23',
          paper: '#1A1A2E',
          surface: '#2D3748',
        },
        // Light theme backgrounds
        light: {
          bg: '#FEFEFE',
          paper: '#F8FAFC',
          surface: '#EDF2F7',
        },
      },
      fontFamily: {
        sans: ['Inter', 'SF Pro Display', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        'soul': '8px',
        'soul-lg': '12px',
      },
      boxShadow: {
        'soul': '0px 4px 16px rgba(255, 107, 107, 0.1)',
        'soul-lg': '0px 8px 24px rgba(255, 107, 107, 0.1)',
        'soul-xl': '0px 16px 48px rgba(255, 107, 107, 0.1)',
      },
    },
  },
  plugins: [],
};

