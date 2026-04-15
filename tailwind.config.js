/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: '#0f0e0d',
        paper: '#f5f0e8',
        warm: '#e8dfd0',
        accent: '#c84b2f',
        muted: '#8a7f72',
        approve: '#2d6a4f',
        disapprove: '#c84b2f',
        unsure: '#b5820a',
      },
    },
  },
  plugins: [],
};
