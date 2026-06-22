/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        court: {
          green: '#8CFF00',
          lime: '#8CFF00',
          blue: '#047EA8',
          ink: '#070B0E',
          panel: '#07151D',
          line: '#E7ECEC',
        },
      },
      boxShadow: {
        glow: '0 18px 46px rgba(4, 126, 168, 0.18)',
        card: '0 24px 70px rgba(6, 20, 27, 0.12)',
      },
    },
  },
  plugins: [],
};
