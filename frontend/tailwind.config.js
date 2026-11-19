/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{ts,tsx,js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0B111E',
        surface: {
          DEFAULT: '#111C33',
          subtle: '#0F172A',
          hover: '#16233F',
          active: '#1A2A4C',
        },
        sidebar: {
          DEFAULT: '#0D1527',
          hover: '#14203B',
          active: '#1A294A',
          border: 'rgba(255, 255, 255, 0.07)',
        },
        border: {
          DEFAULT: 'rgba(255, 255, 255, 0.08)',
          strong: 'rgba(255, 255, 255, 0.15)',
        },
        primary: {
          DEFAULT: '#3B82F6',
          hover: '#2563EB',
          subtle: 'rgba(59, 130, 246, 0.12)',
          foreground: '#FFFFFF',
        },
        risk: {
          high: {
            DEFAULT: '#EF4444',
            bg: 'rgba(239, 68, 68, 0.12)',
            text: '#FCA5A5',
            border: 'rgba(239, 68, 68, 0.3)',
          },
          medium: {
            DEFAULT: '#F59E0B',
            bg: 'rgba(245, 158, 11, 0.12)',
            text: '#FCD34D',
            border: 'rgba(245, 158, 11, 0.3)',
          },
          low: {
            DEFAULT: '#10B981',
            bg: 'rgba(16, 185, 129, 0.12)',
            text: '#6EE7B7',
            border: 'rgba(16, 185, 129, 0.3)',
          },
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
        mono: [
          'JetBrains Mono',
          'Fira Code',
          'Consolas',
          'monospace',
        ],
      },
    },
  },
  plugins: [],
};
