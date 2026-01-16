/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        heading: ['Chivo', 'sans-serif'],
        sans: ['IBM Plex Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        border: '#E2E8F0',
        input: '#E2E8F0',
        ring: '#0F172A',
        background: '#F8FAFC',
        foreground: '#0F172A',
        primary: {
          DEFAULT: '#0F172A',
          foreground: '#F8FAFC',
        },
        secondary: {
          DEFAULT: '#FFFFFF',
          foreground: '#0F172A',
        },
        accent: {
          DEFAULT: '#2563EB',
          foreground: '#FFFFFF',
        },
        destructive: {
          DEFAULT: '#EF4444',
          foreground: '#FFFFFF',
        },
        muted: {
          DEFAULT: '#F1F5F9',
          foreground: '#64748B',
        },
        card: {
          DEFAULT: '#FFFFFF',
          foreground: '#0F172A',
        },
        popover: {
          DEFAULT: '#FFFFFF',
          foreground: '#0F172A',
        },
      },
      borderRadius: {
        sm: '0.125rem',
        DEFAULT: '0.125rem',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
