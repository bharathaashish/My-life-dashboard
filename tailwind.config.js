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
          bg: '#0a0e1a',         // Space blackish dark blue background
          widget: '#1a1f2e',     // Darker blue widget background for contrast
          header: '#0f1419',     // Darker header background
          accent: '#2a3441',     // Blue-gray accent
          text: '#e6eef6',       // Light blue-white text
          primary: '#4a90e2',    // Brighter blue primary
          secondary: '#8b5cf6',  // Secondary color
          success: '#10b981',    // Success color
          warning: '#f59e0b',    // Warning color
          error: '#ef4444',      // Error color
        },
        light: {
          bg: '#f8fafc',         // Very light background
          widget: '#e8f4fd',     // Light bluish widget background
          header: '#f0e6ff',     // Light purplish header
          accent: '#e1f0ff',     // Light blue accent
          text: '#2d3748',       // Dark blue-gray text
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
