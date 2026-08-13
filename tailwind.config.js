/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Deep Navy (30% Structure & Authority)
        navy: {
          950: '#060d19',
          900: '#0A192F',
          800: '#112240',
          700: '#1d3557',
          600: '#233554',
        },
        // Warm Gold & Champagne (10% High-Contrast Accent CTAs)
        gold: {
          300: '#f3e5ab',
          400: '#E5C158',
          500: '#D4AF37', // Metallic Warm Gold
          600: '#B89428',
          700: '#99781B',
        },
        // Marble & Crisp White (60% Open Backgrounds)
        marble: {
          50: '#FFFFFF',
          100: '#F8F9FA', // Soft Marble Gray
          200: '#F1F3F5',
          300: '#E9ECEF',
          400: '#DEE2E6',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
