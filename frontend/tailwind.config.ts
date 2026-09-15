import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './utils/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        hextech: {
          bg: '#0a0e17',
          card: '#111827',
          border: '#1f293d',
          accent: '#38bdf8',
          gold: '#f59e0b',
          purple: '#a855f7',
          emerald: '#10b981',
          rose: '#f43f5e',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hextech-glow': 'radial-gradient(circle at 50% 0%, rgba(56, 189, 248, 0.15), transparent 70%)',
      },
      boxShadow: {
        'glow-gold': '0 0 20px rgba(245, 158, 11, 0.35)',
        'glow-purple': '0 0 20px rgba(168, 85, 247, 0.35)',
        'glow-cyan': '0 0 20px rgba(56, 189, 248, 0.35)',
      },
    },
  },
  plugins: [],
};

export default config;
