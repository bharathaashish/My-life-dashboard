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
        dark: {
          bg: '#15151dff',         // Modern dark background
          widget: '#282a2cff',     // Widget background
          header: '#0f172a',     // Header background
          accent: '#636363ff',     // Accent color
          text: '#f1f5f9',       // Text color
          primary: '#3b82f6',    // Primary color
          secondary: '#8b5cf6',  // Secondary color
          success: '#10b981',    // Success color
          warning: '#f59e0b',    // Warning color
          error: '#ef4444',      // Error color
        },
        light: {
          bg: '#f5f5f5',         // Off-white background
          widget: '#ffffff',     // White widget background
          header: '#eeeeee',     // Slightly darker off-white header
          accent: '#e0e0e0',     // Light gray accent
          text: '#212121',       // Dark gray text
          primary: '#3b82f6',    // Primary color
          secondary: '#8b5cf6',  // Secondary color
          success: '#10b981',    // Success color
          warning: '#f59e0b',    // Warning color
          error: '#ef4444',      // Error color
        }
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
      },
      boxShadow: {
        'widget': '0 4px 20px rgba(0, 0, 0, 0.08)',
        'widget-dark': '0 4px 20px rgba(0, 0, 0, 0.25)',
      },
      transitionProperty: {
        'height': 'height',
        'spacing': 'margin, padding',
      },
      transitionDuration: {
        '300': '300ms',
        '500': '500ms',
      }
    },
  },
  plugins: [],
}
