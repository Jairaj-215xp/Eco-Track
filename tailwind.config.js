/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--bg)',
        surface: 'var(--surface)',
        'surface-2': 'var(--surface-2)',
        border: 'var(--border)',
        text: {
          DEFAULT: 'var(--text)',
          muted: 'var(--text-muted)'
        },
        accent: {
          DEFAULT: 'var(--accent)',
          soft: 'var(--accent-soft)'
        },
        warn: {
          DEFAULT: 'var(--warn)',
          soft: 'var(--warn-soft)'
        },
        info: {
          DEFAULT: 'var(--info)',
          soft: 'var(--info-soft)'
        },
        danger: {
          DEFAULT: 'var(--danger)',
          soft: 'var(--danger-soft)'
        },
        success: {
          DEFAULT: 'var(--success)',
          soft: 'var(--success-soft)'
        }
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        'full': '999px',
      },
      boxShadow: {
        'soft': '0 1px 2px rgba(20,40,30,.04), 0 8px 24px rgba(20,40,30,.06)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      maxWidth: {
        'content': '1080px',
        'feed': '640px',
      }
    },
  },
  plugins: [],
}
