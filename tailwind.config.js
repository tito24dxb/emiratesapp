/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        crew: {
          bordeaux: '#3e000c',
          'yale-blue': '#2b4162',
          jasmine: '#ffe882',
          'punch-red': '#e71d36',
          'brick-ember': '#d10000',
          red: '#e71d36',
          'red-dark': '#d10000',
          'red-darker': '#3e000c',
          charcoal: '#2b4162',
          'charcoal-dark': '#3e000c',
          'charcoal-light': '#2b4162',
          white: '#FFFFFF',
          'gray-light': '#F5F5F5',
        },
      },
    },
  },
  plugins: [],
};
