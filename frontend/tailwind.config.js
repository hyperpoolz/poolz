const { nextui } = require("@nextui-org/react");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './app/**/*.{js,ts,jsx,tsx}',
    "./node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Enhanced HyperLend-inspired palette with more visual depth
        background: {
          DEFAULT: '#071311',
          secondary: 'rgba(26, 36, 31, 0.6)',
          tertiary: 'rgba(42, 52, 47, 0.4)',
          glass: 'rgba(26, 36, 31, 0.8)',
        },
        foreground: {
          DEFAULT: '#f9fafb',
          secondary: '#caeae5',
          tertiary: '#9db3ae',
          muted: '#7a8f8a',
        },
        accent: {
          DEFAULT: '#caeae5',
          hover: '#b8dbd5',
          light: '#e1f5f1',
          dark: '#9db3ae',
          glow: 'rgba(202, 234, 229, 0.3)',
        },
        primary: {
          DEFAULT: '#caeae5',
          50: '#f0fbf9',
          100: '#e1f5f1',
          200: '#caeae5',
          300: '#9db3ae',
          400: '#7a8f8a',
          500: '#5a706b',
          600: '#455954',
          700: '#364643',
          800: '#2a3732',
          900: '#1a241f',
        },
        border: {
          DEFAULT: 'rgba(202, 234, 229, 0.1)',
          hover: 'rgba(202, 234, 229, 0.2)',
          light: 'rgba(202, 234, 229, 0.15)',
          accent: '#caeae5',
        },
        success: {
          DEFAULT: '#10b981',
          light: '#6ee7b7',
          dark: '#047857',
        },
        warning: {
          DEFAULT: '#f59e0b',
          light: '#fbbf24',
          dark: '#d97706',
        },
        error: {
          DEFAULT: '#ef4444',
          light: '#f87171',
          dark: '#dc2626',
        },
        info: {
          DEFAULT: '#3b82f6',
          light: '#60a5fa',
          dark: '#1d4ed8',
        },
        // Enhanced gradient system
        gradients: {
          primary: 'linear-gradient(135deg, #caeae5 0%, #9db3ae 100%)',
          secondary: 'linear-gradient(135deg, rgba(26, 36, 31, 0.8) 0%, rgba(42, 52, 47, 0.6) 100%)',
          card: 'linear-gradient(145deg, rgba(26, 36, 31, 0.4) 0%, rgba(42, 52, 47, 0.2) 50%, rgba(26, 36, 31, 0.4) 100%)',
          glow: 'radial-gradient(circle at center, rgba(202, 234, 229, 0.1) 0%, transparent 70%)',
          mesh: 'linear-gradient(45deg, #071311 0%, #1a241f 25%, #2a3732 50%, #1a241f 75%, #071311 100%)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Monaco', 'Consolas', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'float': 'float 3s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'gradient-shift': 'gradientShift 4s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(202, 234, 229, 0.3)' },
          '100%': { boxShadow: '0 0 20px rgba(202, 234, 229, 0.6), 0 0 40px rgba(202, 234, 229, 0.3)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
      backdropBlur: {
        xs: '2px',
        glass: '16px',
      },
      boxShadow: {
        'glow-sm': '0 0 10px rgba(202, 234, 229, 0.2)',
        'glow-md': '0 0 20px rgba(202, 234, 229, 0.3), 0 0 40px rgba(202, 234, 229, 0.1)',
        'glow-lg': '0 0 30px rgba(202, 234, 229, 0.4), 0 0 60px rgba(202, 234, 229, 0.2)',
        'glow-xl': '0 0 40px rgba(202, 234, 229, 0.5), 0 0 80px rgba(202, 234, 229, 0.3)',
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.3)',
        'card-hover': '0 10px 25px -3px rgba(202, 234, 229, 0.15), 0 4px 6px -2px rgba(202, 234, 229, 0.1)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        'inner-glow': 'inset 0 1px 0 rgba(202, 234, 229, 0.1), inset 0 -1px 0 rgba(202, 234, 229, 0.05)',
      },
    },
  },
  plugins: [
    nextui({
      themes: {
        dark: {
          colors: {
            background: '#0a0a0b',
            foreground: '#ffffff',
            primary: {
              50: '#f0faf8',
              100: '#d7f0ec',
              200: '#c9eae4',
              300: '#a3c4ba',
              400: '#7d9e91',
              500: '#5a7869',
              600: '#445c50',
              700: '#354740',
              800: '#2a3732',
              900: '#1f2926',
              DEFAULT: '#c9eae4',
              foreground: '#0f0f10',
            },
            secondary: {
              DEFAULT: '#242429',
              foreground: '#8b9a96',
            },
          },
        },
      },
    }),
    require('@tailwindcss/typography'),
  ],
}