/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: { DEFAULT: '#F7F3EE', 100: '#FBF9F6', 200: '#EFE8DF', 300: '#E2D8CB' },
        ink: { DEFAULT: '#1C1917', soft: '#44403C', muted: '#78716C' },
        clay: { DEFAULT: '#B4532A', dark: '#8F3F1E', light: '#F3E1D7' },
        sage: { DEFAULT: '#5F6F52', light: '#E4E9DD' },
      },
      fontFamily: {
        display: ['"Fraunces Variable"', 'Georgia', 'serif'],
        sans: ['"DM Sans Variable"', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        shimmer: { '100%': { transform: 'translateX(100%)' } },
        'slide-in': { from: { transform: 'translateX(100%)' }, to: { transform: 'translateX(0)' } },
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'pop-in': { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      },
      animation: {
        shimmer: 'shimmer 1.4s infinite',
        'slide-in': 'slide-in .28s cubic-bezier(.2,.8,.2,1)',
        'fade-in': 'fade-in .2s ease-out',
        'pop-in': 'pop-in .22s ease-out',
      },
    },
  },
  plugins: [],
};
