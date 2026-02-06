/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2196F3',
        secondary: '#03A9F4',
        success: '#4CAF50',
        error: '#F44336',
        warning: '#FF9800',
      },
    },
  },
  plugins: [],
}
