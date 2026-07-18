/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Identité de marque Chap.ci : orange (chap-chap), vert (.ci), encre, crème
        primary: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#FFA243', // orange clair
          400: '#fb923c',
          500: '#F77F00', // orange Chap (principal)
          600: '#ea6a00',
          700: '#D95F00', // orange foncé
          800: '#9a4100',
          900: '#7c3600',
        },
        ivoire: {
          green: '#009E60',
          'green-dark': '#00784A',
          orange: '#F77F00',
          'orange-light': '#FFA243',
          'orange-dark': '#D95F00',
        },
        ink: '#1B1A17',
        cream: {
          DEFAULT: '#FFFDF9',
          100: '#FFF3E4',
        },
      },
      fontFamily: {
        sans: ['"Inter Variable"', 'Inter', 'system-ui', 'Avenir', 'Helvetica', 'Arial', 'sans-serif'],
        display: [
          '"Plus Jakarta Sans Variable"',
          '"Plus Jakarta Sans"',
          'system-ui',
          'sans-serif',
        ],
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
        nav: '0 -1px 8px rgba(0,0,0,0.06)',
      },
      maxWidth: {
        app: '560px',
      },
      transitionTimingFunction: {
        // Courbes fortes réutilisables (classes ease-smooth / ease-drawer)
        smooth: 'cubic-bezier(0.23, 1, 0.32, 1)',
        drawer: 'cubic-bezier(0.32, 0.72, 0, 1)',
      },
    },
  },
  plugins: [],
}
