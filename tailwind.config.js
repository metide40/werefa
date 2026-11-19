/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          charcoal: '#172B2B',
          green: '#397C69',
          gold: '#DCA84E',
          terracotta: '#C8755D',
          ivory: '#F5F0E5',
          white: '#FFFFFF',
          muted: '#73817B',
          darkSurface: '#243536',
          emergency: '#B91C1C',
          urgent: '#C2410C',
          normal: '#397C69',
          forest: '#172B2B',
          amber: '#DCA84E',
          teal: '#397C69',
          darkTeal: '#172B2B',
          lightTeal: 'rgba(57, 124, 105, 0.12)',
          orange: '#DCA84E',
          darkOrange: '#B8893F',
          bg: '#F5F0E5',
          card: '#FFFFFF',
          text: '#172B2B',
          border: 'rgba(23, 43, 43, 0.1)',
          surface: '#FFFFFF',
        }
      },
      fontFamily: {
        sans: [
          'Inter',
          'Noto Sans Ethiopic',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif'
        ],
        display: [
          'Inter',
          'Noto Sans Ethiopic',
          'system-ui',
          'sans-serif'
        ],
        ethiopic: [
          'Noto Sans Ethiopic',
          'Inter',
          'system-ui',
          'sans-serif'
        ],
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(23, 43, 43, 0.06), 0 2px 6px -1px rgba(0, 0, 0, 0.03)',
        'card': '0 8px 28px -4px rgba(23, 43, 43, 0.07), 0 4px 10px -2px rgba(0, 0, 0, 0.03)',
        'elevated': '0 14px 40px -8px rgba(23, 43, 43, 0.12), 0 4px 12px -2px rgba(0, 0, 0, 0.04)',
        'gold': '0 4px 16px -2px rgba(220, 168, 78, 0.35)',
        'green': '0 4px 14px -2px rgba(57, 124, 105, 0.25)',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.25rem',
        '3xl': '1.5rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out forwards',
        'slide-up': 'slideUp 0.45s ease-out forwards',
        'scale-in': 'scaleIn 0.35s ease-out forwards',
        'soft-pulse': 'softPulse 2.2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        softPulse: {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.03)', opacity: '0.9' },
        },
      },
    },
  },
  plugins: [],
}
