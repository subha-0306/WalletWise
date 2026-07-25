/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        warm: {
          bg: '#FAF6F1',
        },
        surface: {
          card: '#FFFFFF',
          recessed: '#F3ECE3',
        },
        primary: {
          espresso: '#4A2E22',
        },
        secondary: {
          coffee: '#8B5E3C',
        },
        tertiary: {
          latte: '#D8B48C',
        },
        text: {
          main: '#2C1810',
          muted: '#7A6A5D',
        },
        indicator: {
          income: '#7A8B69',
          expense: '#B5674F',
        },
        cream: {
          border: '#E8DED2',
        },
      },
      fontFamily: {
        sans: [
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'Inter',
          'sans-serif',
        ],
      },
      boxShadow: {
        warm: '0 4px 20px -2px rgba(74, 46, 34, 0.08)',
        'warm-sm': '0 2px 8px -1px rgba(74, 46, 34, 0.06)',
        'warm-lg': '0 10px 30px -4px rgba(74, 46, 34, 0.12)',
      },
    },
  },
  plugins: [],
};
