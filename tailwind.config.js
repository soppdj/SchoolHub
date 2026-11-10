/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        school: {
          navy: {
            950: '#0A1C2E',
            900: '#0F2942', // Deep Royal Navy
            800: '#153654',
            700: '#1E3A8A', // Primary Navy Blue
            600: '#2563EB',
            500: '#3B82F6',
            100: '#E0E7FF',
            50: '#EEF2FF',
          },
          gold: {
            700: '#B45309',
            600: '#D97706', // Warm Metallic Gold
            500: '#F59E0B',
            400: '#FBBF24',
            300: '#FCD34D',
            100: '#FEF3C7',
            50: '#FFFBEB',
          },
          slate: {
            bg: '#F8FAFC',
          }
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      animation: {
        'pulse-fast': 'pulse 1.2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'subtle-glow': 'subtleGlow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        subtleGlow: {
          '0%': { boxShadow: '0 0 10px rgba(217, 119, 6, 0.3)' },
          '100%': { boxShadow: '0 0 20px rgba(217, 119, 6, 0.7)' },
        }
      }
    },
  },
  plugins: [],
}
