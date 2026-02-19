/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#6366f1',
        secondary: '#8b5cf6',
        accent: '#ec4899',
        background: '#f8fafc',
        surface: '#ffffff',
        text: '#1e293b',
        textLight: '#64748b',
      },
    },
  },
  plugins: [],
}
