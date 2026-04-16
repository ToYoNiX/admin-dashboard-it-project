
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
  './index.html',
  './src/**/*.{js,ts,jsx,tsx}'
],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        must: {
          navy: 'var(--must-navy)',
          green: 'var(--must-green)',
          gold: 'var(--must-gold)',
          bg: 'var(--must-bg)',
          surface: 'var(--must-surface)',
          text: {
            primary: 'var(--must-text-primary)',
            secondary: 'var(--must-text-secondary)',
          },
          border: 'var(--must-border)',
        },
        status: {
          pending: 'var(--status-pending)',
          approved: 'var(--status-approved)',
          rejected: 'var(--status-rejected)',
        }
      },
      fontFamily: {
        poppins: ['Poppins', 'sans-serif'],
        cairo: ['Cairo', 'sans-serif'],
      },
      spacing: {
        '8pt': '8px',
        '16pt': '16px',
        '24pt': '24px',
        '32pt': '32px',
        '40pt': '40px',
        '48pt': '48px',
      }
    },
  },
  plugins: [],
}
