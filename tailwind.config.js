/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: { 50: '#f0f4ff', 100: '#dbe4ff', 500: '#534AB7', 600: '#3C3489', 700: '#26215C' },
        success: { 50: '#ecfdf5', 500: '#10b981', 700: '#047857' },
        danger: { 50: '#fef2f2', 500: '#ef4444', 700: '#b91c1c' },
        warning: { 50: '#fffbeb', 500: '#f59e0b', 700: '#b45309' },
      }
    }
  },
  plugins: [],
};
