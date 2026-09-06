/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        /* IDENTITÉ CHAP.CI — vert ivoirien (marque), orange (l'action), encre, crème.
         *
         * ⚠️ LE 30/08/2026, `primary` EST PASSÉ DE L'ORANGE AU VERT. Décision du
         * Patron, après comparaison des deux montages. Ce seul bloc emmène les
         * 556 usages de `primary-*` du front : c'est tout l'intérêt d'avoir un
         * jeton plutôt que des couleurs écrites en dur.
         *
         * L'ORANGE N'EST PAS PARTI. Il reste sous `ivoire.orange`, et il devient
         * la couleur de L'ACTION : « Contacter le vendeur », le bouton central de
         * la barre du bas. Sans cela, le bouton le plus important d'une fiche
         * aurait exactement la couleur de tous les autres. Les deux teintes sont
         * celles du drapeau ; seuls leurs rôles s'échangent.
         *
         * Contraste : #009E60 sur blanc ne donne que 3,5:1 — assez pour un aplat,
         * une bordure ou une icône, PAS pour du texte blanc de 16 px (il en faut
         * 4,5). D'où `btn-primary` construit sur 600 → 800 et non sur 500 → 700 :
         * voir src/index.css. Le 500 reste le vert de la MARQUE, celui du signe.
         */
        primary: {
          50: '#E9F8F0',
          100: '#C9EFDD',
          200: '#93DFBC',
          300: '#55CB98', // vert clair
          400: '#1BB477',
          500: '#009E60', // VERT IVOIRIEN — la marque, le signe
          600: '#008953', // 4,5:1 sur blanc : plancher du texte blanc
          700: '#00734A', // vert foncé — texte sur fond clair (5,9:1)
          800: '#005C3B',
          900: '#00452C',
        },
        /* L'ACTION — l'orange du drapeau, et il fallait le faire revenir.
         *
         * Le 30/08, en passant la marque au vert, l'orange s'était réduit à UN
         * bouton au fond d'une fiche d'annonce. Le Patron l'a vu tout de suite :
         * « je vois que les couleurs sont Vert Blanc Vert ». Le drapeau ivoirien
         * est ORANGE, blanc, vert — un site qui n'en montre que deux tiers ne
         * dit plus d'où il vient.
         *
         * La règle est donc : le VERT porte la marque et l'interface (en-tête,
         * navigation, liens, prix, le signe) ; l'ORANGE porte TOUTES les actions
         * (publier, contacter, valider) ; le blanc crème reste le sol. Les trois
         * couleurs sont présentes sur chaque écran, dans cet ordre d'importance.
         *
         * LES TROIS PLANCHERS, MESURÉS et non estimés (scratchpad/contraste.mjs,
         * formule WCAG 2.1) — les valeurs à l'œil se sont révélées fausses :
         *
         *   400 #F77F00  sous du blanc : 2,63:1  → JAMAIS de blanc dessus.
         *                C'est l'orange du drapeau, pour un aplat sans texte.
         *   500 #E96A00  3,22:1 → passe le seuil des OBJETS GRAPHIQUES (3:1) :
         *                le « + » blanc de la barre du bas. À #F77F00 il ne
         *                donnait que 2,63 — le site le faisait déjà, et non.
         *   600 #B35700  4,91:1 → passe le seuil du TEXTE (4,5:1). C'était
         *                #C25A00, annoncé « 4,6:1 » : il en vaut 4,42, donc
         *                SOUS le seuil. Le haut du dégradé des boutons était
         *                illisible au sens de la norme.
         */
        action: {
          50: '#FFF4E6',
          100: '#FFE3C2',
          200: '#FFC98A',
          300: '#FFA243',
          400: '#F77F00', // l'orange du drapeau — aplats et bordures SANS texte
          500: '#E96A00', // 3,22:1 sous du blanc : plancher d'une ICÔNE blanche
          600: '#B35700', // 4,91:1 sous du blanc : plancher d'un TEXTE blanc
          700: '#9A4100', // 6,71:1
          800: '#7C3600',
          900: '#5E2900',
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
          // Meme ocre, assombri pour le TEXTE. #B5651D sur fond creme ne donne
          // que 4,33:1 — sous les 4,5:1 exiges par la norme WCAG AA, donc
          // illisible en plein soleil, ce qui est la situation normale ici.
          // #96500E monte a 6,1:1. A utiliser des que l'ocre porte des mots ;
          // l'ocre clair reste bon pour un aplat, une bordure ou une icone.
          'ocre-dark': '#96500E',
          terracotta: '#C1440E',
          sable: '#EAD9C0',
          sky: '#2E7DB8',
        },
      },
      fontFamily: {
        // Les « Fallback » sont la police système aux mesures de la nôtre
        // (src/polices.css) : le texte ne bouge pas quand la vraie arrive.
        sans: ['"Inter Variable"', 'Inter', '"Inter Fallback"', 'system-ui', 'Avenir', 'Helvetica', 'Arial', 'sans-serif'],
        display: [
          '"Plus Jakarta Sans Variable"',
          '"Plus Jakarta Sans"',
          '"Plus Jakarta Sans Fallback"',
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
