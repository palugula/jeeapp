/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0B0C10',
        card: '#161B22',
        popover: '#1F2937',
        primary: '#6366F1',
        secondary: '#334155',
        accent: '#2D3748',
        muted: '#1E293B',
        border: '#262C36',
        input: '#0D1117',
        'text-primary': '#E2E8F0',
        'text-card': '#F8FAFC',
        'text-popover': '#F1F5F9',
        'text-secondary': '#CBD5E1',
        'text-accent': '#94A3B8',
        'text-muted': '#64748B',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
