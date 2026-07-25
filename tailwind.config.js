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
        // Bordures chaudes du système (ex-#EFE6D7 / #E6DAC6 codées en dur) :
        // `border-line` (séparateurs clairs) et `border-line2` (contours appuyés).
        line: '#EFE6D7',
        line2: '#E6DAC6',
        cream: {
          DEFAULT: '#FFFDF9',
          100: '#FFF3E4',
          200: '#FFF6EA', // fond d'application chaud (artifact --bg2)
        },
        // Palette ivoirienne étendue (artifact) — accents chaleureux, à doser.
        accent: {
          gold: '#E8A100',
          ocre: '#B5651D',
          terracotta: '#C1440E',
          sable: '#EAD9C0',
          sky: '#2E7DB8',
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
        // Ombres chaudes (teinte brune) de l'artifact — plus « ivoiriennes » que le gris neutre.
        card: '0 1px 3px rgba(60,40,10,.09), 0 1px 2px rgba(60,40,10,.05)',
        'card-lg': '0 12px 34px -10px rgba(120,70,10,.28), 0 6px 14px -8px rgba(120,70,10,.20)',
        nav: '0 -1px 8px rgba(60,40,10,0.06)',
      },
      maxWidth: {
        app: '560px',
      },
      transitionTimingFunction: {
        // Courbes fortes réutilisables (classes ease-smooth / ease-drawer)
        smooth: 'cubic-bezier(0.23, 1, 0.32, 1)',
        drawer: 'cubic-bezier(0.32, 0.72, 0, 1)',
      },
      animation: {
        // Spinner plus rapide (0.7s) : le chargement paraît plus véloce.
        spin: 'spin 0.7s linear infinite',
        // Apparition douce des cartes de la grille (cascade via animation-delay).
        fadeup: 'fadeup 0.45s cubic-bezier(0.23, 1, 0.32, 1) both',
      },
      keyframes: {
        // Petit « pop » du cœur quand on ajoute aux favoris.
        heartpop: {
          '0%': { transform: 'scale(1)' },
          '30%': { transform: 'scale(0.8)' },
          '60%': { transform: 'scale(1.25)' },
          '100%': { transform: 'scale(1)' },
        },
        // Fondu + léger glissement vers le haut.
        fadeup: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
