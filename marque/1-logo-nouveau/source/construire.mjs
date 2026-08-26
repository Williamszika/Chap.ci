/**
 * Construction geometrique du signe Chap.ci — « le losange qui glisse ».
 *
 * Le nom vient du nouchi : « chap-chap » veut dire vite, vite. C'est le mot le
 * plus important de la marque, et le signe part de la :
 *
 *   - un losange, motif de tissu ouest-africain deja present dans la trame de
 *     la charte — la marchandise, l'objet qu'on echange ;
 *   - fendu en deux moities qui se font face — l'acheteur et le vendeur, et le
 *     redoublement du mot lui-meme ;
 *   - les deux moities decalees en diagonale — elles glissent, c'est la vitesse ;
 *   - le vide entre elles, qui ne se referme jamais : « Chap.ci ne prend aucune
 *     commission sur les ventes et ne s'interpose jamais dans le paiement ».
 *     La plateforme n'est pas au milieu. Le creux est le sujet du dessin.
 *
 * Tout est parametre pour que la forme se regle par la mesure et non a l'oeil.
 */

/** Grille de construction. Un carre de 96, marges comprises. */
export const GRILLE = 96;

export const PARAMETRES = {
  /** Demi-hauteur d'une moitie. Les flancs sont a 45 deg, donc c'est aussi son avancee. */
  rayon: 25,
  /** Epaisseur du trait, mesuree perpendiculairement au flanc. */
  epaisseur: 11,
  /** Largeur de la fente entre les deux dos. */
  fente: 14,
  /** Decalage vertical d'une moitie par rapport a l'autre : le glissement. */
  decalage: 5,
};

/**
 * Variante pour les tres petites tailles.
 *
 * En dessous de 32 px, la fente se bouche et le trait se dissout : mesure a
 * 16 px, la version courante ne laisse que 2,3 px de fente et 1,8 px de trait.
 * On epaissit le trait, on ouvre la fente et on rentre le glissement — le signe
 * reste le meme, il est seulement dit plus fort.
 */
export const PARAMETRES_PETIT = {
  rayon: 25,
  epaisseur: 14,
  fente: 20,
  decalage: 4,
};

const R2 = Math.SQRT2;
const arrondi = (n) => Number(n.toFixed(2));

/**
 * Sommets d'une moitie, dans l'ordre du trace.
 *
 * `sens` vaut 1 pour la moitie qui pointe a droite, -1 pour celle de gauche.
 *
 * Les extremites sont coupees **d'equerre au flanc** et non a la verticale.
 * La difference n'est pas cosmetique : avec une coupe verticale, les dos des
 * deux moities se touchent en haut et en bas, la fente disparait et le signe
 * se referme en un losange ordinaire. Essaye, mesure, corrige.
 */
export function sommets(pointeX, centreY, p = PARAMETRES, sens = 1) {
  const { rayon: r, epaisseur: e } = p;
  const dos = pointeX - sens * r;

  return [
    [dos, centreY - r],
    [pointeX, centreY],
    [dos, centreY + r],
    // Retour par l'interieur : le decalage perpendiculaire d'une droite a 45 deg
    // vaut e/racine(2) sur chaque axe, et e*racine(2) sur l'axe seul au sommet.
    [dos - (sens * e) / R2, centreY + r - e / R2],
    [pointeX - sens * e * R2, centreY],
    [dos - (sens * e) / R2, centreY - r + e / R2],
  ];
}

const versChemin = (pts) => `M ${pts.map(([x, y]) => `${arrondi(x)} ${arrondi(y)}`).join(' L ')} Z`;

/** Les deux chemins du signe, gauche puis droite. */
export function chemins(p = PARAMETRES) {
  const { rayon: r, fente: f, decalage: d } = p;
  const c = GRILLE / 2;

  return [
    versChemin(sommets(c - f / 2 - r, c - d, p, -1)),
    versChemin(sommets(c + f / 2 + r, c + d, p, 1)),
  ];
}

/**
 * Mesures qui decident de la tenue du signe.
 *
 * `rayonEncombrement` sert au masque d'icone : Android 12 ne laisse voir que le
 * cercle central, soit les deux tiers du cadre. Au-dela, le signe est rogne.
 */
export function mesures(p = PARAMETRES, taille = GRILLE) {
  const c = GRILLE / 2;
  const tous = chemins(p)
    .join(' ')
    .match(/-?\d+(\.\d+)?\s-?\d+(\.\d+)?/g)
    .map((paire) => paire.split(/\s+/).map(Number));

  const rayonEncombrement = Math.max(...tous.map(([x, y]) => Math.hypot(x - c, y - c)));
  const echelle = taille / GRILLE;

  return {
    rayonEncombrement: arrondi(rayonEncombrement),
    /** Facteur a appliquer pour tenir dans le cercle masque des icones. */
    echelleMasquable: arrondi(GRILLE / 3 / rayonEncombrement),
    /** La fente en pixels a la taille demandee : elle se bouche la premiere. */
    fentePx: arrondi(p.fente * echelle),
    /** Le trait en pixels : il disparait juste apres. */
    traitPx: arrondi(p.epaisseur * echelle),
    largeur: arrondi((p.fente + 2 * p.rayon) * echelle),
    hauteur: arrondi((2 * p.rayon + 2 * p.decalage) * echelle),
  };
}

/** Le signe en un fragment SVG, dans la couleur courante. */
export function signe(p = PARAMETRES) {
  return chemins(p)
    .map((d) => `<path d="${d}" fill="currentColor"/>`)
    .join('');
}
