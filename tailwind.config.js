/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          // Legacy tones from Sankofa Logo
          bronze: '#8C6239',   // The metallic brown/gold in the text
          mutedRed: '#A33B32', // The deep red from the bird's head
          forest: '#2D5A27',   // The dark green from the wings
          ochre: '#C69C2B',    // The gold/yellow from the tail
          paper: '#F9F7F2',    // A slightly textured-look off-white background
          dark: '#1A1A1B',     // Deep charcoal for text
        },
      },
    },
  },
  plugins: [],
}
