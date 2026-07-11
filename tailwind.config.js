/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Identité ivoirienne : orange, blanc, vert
        primary: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#F77F00',
          600: '#ea6a00',
          700: '#c25100',
          800: '#9a4100',
          900: '#7c3600',
        },
        ivoire: {
          green: '#009E60',
          orange: '#F77F00',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'Avenir', 'Helvetica', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
        nav: '0 -1px 8px rgba(0,0,0,0.06)',
      },
      maxWidth: {
        app: '560px',
      },
    },
  },
  plugins: [],
}
