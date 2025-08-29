import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // プライマリカラー
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        // アクセント型カラー
        accent: {
          atamadaka: '#ef4444',
          heiban: '#3b82f6',
          nakadaka: '#10b981',
          odaka: '#f59e0b',
          'atamadaka-light': '#fca5a5',
          'heiban-light': '#93c5fd',
          'nakadaka-light': '#6ee7b7',
          'odaka-light': '#fbbf24',
        }
      },
      fontFamily: {
        japanese: [
          'Hiragino Sans',
          'Hiragino Kaku Gothic ProN',
          'Yu Gothic Medium',
          'Meiryo',
          'MS Gothic',
          'sans-serif',
        ],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
export default config