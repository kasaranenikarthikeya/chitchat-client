/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary-bg': 'var(--primary-bg)',
        'secondary-bg': 'var(--secondary-bg)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'neumorphic': 'var(--neumorphic)',
        'neon-cyan': 'var(--neon-cyan)',
        'neon-lime': 'var(--neon-lime)',
        'neon-magenta': 'var(--neon-magenta)',
        'glass-bg': 'var(--glass-bg)',
      },
      keyframes: {
        pulse: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.1)' },
        },
        bounce: {
          '0%, 20%, 50%, 80%, 100%': { transform: 'translateY(0)' },
          '40%': { transform: 'translateY(-10px)' },
          '60%': { transform: 'translateY(-5px)' },
        },
        wave: {
          '0%': { height: '6px' },
          '50%': { height: '12px' },
          '100%': { height: '6px' },
        },
      },
      animation: {
        pulse: 'pulse 1s infinite',
        bounce: 'bounce 1s infinite',
        wave: 'wave 0.4s infinite',
      },
    },
  },
  plugins: [],
};