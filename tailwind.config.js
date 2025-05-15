/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Use class strategy for dark mode
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2e7d32',
          dark: '#1b5e20',
          light: '#4caf50',
        },
        secondary: {
          DEFAULT: '#795548',
          dark: '#4b2c20',
          light: '#a98274',
        },
      },
      backgroundColor: {
        'card': 'var(--card-bg)',
        'glass': 'var(--glass-bg)',
      },
      borderColor: {
        'glass': 'var(--glass-border)',
      },
      boxShadow: {
        'card': 'var(--card-shadow)',
        'glass': 'var(--glass-shadow)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        'fadeIn': 'fadeIn 0.3s ease-in-out',
      },
    },
  },
  plugins: [],
} 