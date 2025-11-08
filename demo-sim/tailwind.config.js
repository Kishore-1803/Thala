/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        slack: {
          purple: '#4A154B',
          light: '#350D36',
          dark: '#2C0E2D',
        },
        jira: {
          blue: '#0052CC',
          light: '#F4F5F7',
        }
      }
    },
  },
  plugins: [],
}






