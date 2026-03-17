import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'board-dark': '#b58863',
        'board-light': '#f0d9b5',
        'bg-chess': '#0a0a0a',
        'bg-sidebar': '#0d0d0d',
        'bg-panel': '#111111',
        'bg-hover': '#1c1c1c',
        'primary-chess': '#d4af37',
        'primary-hover': '#f5cc4e',
        'gold-muted': '#8a7220',
        'gold-dark': '#1a1500',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'gold': '0 0 20px rgba(212, 175, 55, 0.3)',
        'gold-lg': '0 0 40px rgba(212, 175, 55, 0.4)',
      }
    },
  },
  plugins: [],
}

export default config
