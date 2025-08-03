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
        // Hyperliquid-inspired color palette
        background: {
          DEFAULT: '#0a0a0b',
          secondary: '#1a1a1b',
          tertiary: '#2a2a2b',
        },
        foreground: {
          DEFAULT: '#ffffff',
          secondary: '#a0a0a0',
          tertiary: '#707070',
        },
        accent: {
          DEFAULT: '#00d4aa',
          hover: '#00b896',
          light: '#00e6c3',
          dark: '#00a080',
        },
        border: {
          DEFAULT: '#2a2a2b',
          hover: '#3a3a3b',
          light: '#4a4a4b',
        },
        success: '#00d4aa',
        warning: '#ffa726',
        error: '#ef5350',
        info: '#42a5f5',
        // Custom gradients
        'gradient-primary': 'linear-gradient(135deg, #00d4aa 0%, #00b896 100%)',
        'gradient-secondary': 'linear-gradient(135deg, #1a1a1b 0%, #2a2a2b 100%)',
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
          '0%': { boxShadow: '0 0 5px #00d4aa' },
          '100%': { boxShadow: '0 0 20px #00d4aa, 0 0 30px #00d4aa' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'glow-sm': '0 0 10px rgba(0, 212, 170, 0.3)',
        'glow-md': '0 0 20px rgba(0, 212, 170, 0.4)',
        'glow-lg': '0 0 30px rgba(0, 212, 170, 0.5)',
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
              50: '#e6fffa',
              100: '#b3fff0',
              200: '#80ffe6',
              300: '#4dffdc',
              400: '#1affd2',
              500: '#00d4aa',
              600: '#00b896',
              700: '#009c82',
              800: '#00806e',
              900: '#00645a',
              DEFAULT: '#00d4aa',
              foreground: '#000000',
            },
            secondary: {
              DEFAULT: '#1a1a1b',
              foreground: '#a0a0a0',
            },
          },
        },
      },
    }),
    require('@tailwindcss/typography'),
  ],
}