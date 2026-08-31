import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#070a12',
        surface: {
          50: '#0d1322',
          100: '#11192e',
          200: '#17223b',
          300: '#1e2c4c',
          400: '#283a63',
          500: '#344b7f',
        },
        cyber: {
          cyan: '#00f0ff',
          blue: '#0070f3',
          purple: '#9d00ff',
          pink: '#ff007f',
          amber: '#ffb703',
          red: '#ff0055',
          green: '#00ff66',
        },
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(0, 240, 255, 0.2), 0 0 10px rgba(0, 240, 255, 0.2)' },
          '100%': { boxShadow: '0 0 20px rgba(0, 240, 255, 0.6), 0 0 30px rgba(0, 240, 255, 0.4)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
