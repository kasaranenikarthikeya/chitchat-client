/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary brand colors
        primary: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
        },
        // Secondary/neutral colors
        secondary: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
        // Accent colors
        accent: {
          blue: '#3b82f6',
          green: '#10b981',
          red: '#ef4444',
          yellow: '#f59e0b',
          purple: '#8b5cf6',
          pink: '#ec4899',
        },
        // Message bubble colors
        message: {
          sent: {
            bg: '#8b5cf6',
            text: '#ffffff',
          },
          received: {
            bg: '#f1f5f9',
            text: '#0f172a',
          },
        },
        // Status colors
        status: {
          online: '#10b981',
          offline: '#94a3b8',
          away: '#f59e0b',
          busy: '#ef4444',
        },
        text: {
          primary: '#f8fafc',
          secondary: '#94a3b8',
        },
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
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
      },
      spacing: {
        '4.5': '1.125rem',
        '5.5': '1.375rem',
        '6.5': '1.625rem',
        '7.5': '1.875rem',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        'message': '0 2px 4px rgba(0, 0, 0, 0.1)',
        'message-hover': '0 4px 6px rgba(0, 0, 0, 0.1)',
        'sidebar': '0 0 20px rgba(0, 0, 0, 0.1)',
        'header': '0 2px 8px rgba(0, 0, 0, 0.1)',
        'input': '0 2px 4px rgba(0, 0, 0, 0.05)',
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'bounce-in': 'bounceIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'pulse-glow': 'pulseGlow 2s infinite',
        'typing': 'typing 1.4s infinite ease-in-out',
        'ripple': 'ripple 0.6s linear',
        'message-appear': 'messageAppear 0.3s ease-out',
        'waveform': 'waveform 1s infinite linear',
        'typing-dot': 'typingDot 1.4s infinite ease-in-out',
        'shimmer': 'shimmer 2s infinite linear',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        bounceIn: {
          '0%': { transform: 'scale(0.3)', opacity: '0' },
          '50%': { transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(139, 92, 246, 0.5)' },
          '50%': { boxShadow: '0 0 20px rgba(139, 92, 246, 0.8)' },
        },
        typing: {
          '0%, 60%, 100%': { transform: 'scale(1)' },
          '30%': { transform: 'scale(1.5)' },
        },
        ripple: {
          '0%': { transform: 'scale(0)', opacity: '1' },
          '100%': { transform: 'scale(4)', opacity: '0' },
        },
        messageAppear: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        waveform: {
          '0%': { transform: 'scaleY(0.5)' },
          '50%': { transform: 'scaleY(1)' },
          '100%': { transform: 'scaleY(0.5)' },
        },
        typingDot: {
          '0%, 60%, 100%': { transform: 'scale(1)' },
          '30%': { transform: 'scale(1.5)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      backdropBlur: {
        xs: '2px',
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
      },
      transitionTimingFunction: {
        'bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [
    require('tailwind-scrollbar')({ nocompatible: true }),
  ],
  safelist: [
    'glass-panel',
    'glass-input',
    'glass-button',
    'message-bubble',
    'message-sent',
    'message-received',
    'typing-indicator',
    'typing-dot',
    'user-avatar',
    'status-indicator',
    'status-online',
    'status-offline',
    'status-away',
    'status-busy',
    'sidebar-item',
    'input-group',
    'input-icon',
    'input-with-icon',
    'ripple-effect',
    'scrollbar-custom',
    'skeleton',
    'skeleton-text',
  ],
};