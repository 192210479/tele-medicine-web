/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1E88E5', // Blue
          dark: '#1565C0',
          light: '#64B5F6',
        },
        secondary: {
          DEFAULT: '#26A69A', // Teal
          dark: '#00897B',
          light: '#80CBC4',
        },
        success: '#43A047', // Green
        warning: '#FB8C00', // Orange
        surface: '#F5F7FA', // Light Gray
        background: '#F5F7FA',
        text: {
          primary: '#212121',
          secondary: '#757575',
        }
      },
      fontFamily: {
        sans: ['Roboto', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.1)',
      }
    },
  },
  plugins: [],
}