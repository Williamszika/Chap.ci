#!/usr/bin/env node
/**
 * Production de tous les fichiers du signe « losange qui glisse ».
 *
 * Un logo n'est pas un fichier mais un jeu : le signe seul, ses verrouillages,
 * ses versions monochromes, le favicon, les icones d'application et — ici —
 * les images de demarrage de l'application Flutter, chacune avec ses
 * contraintes propres. Les generer d'un seul trace evite qu'elles derivent les
 * unes des autres au fil des retouches.
 *
 * Usage : node projets/chap-ci/logo-losange/generer.mjs
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import sharp from 'sharp';
import { GRILLE, PARAMETRES, PARAMETRES_PETIT, mesures, signe } from './construire.mjs';
import { verifierContraste } from '../../../src/lib/couleur.mjs';

const executer = promisify(execFile);
const ICI = path.dirname(new URL(import.meta.url).pathname);
const SORTIE = path.join(ICI, 'fichiers');

const C = {
  orange: '#F77F00',
  orangeSombre: '#9A4D00',
  encre: '#1B1A17',
  creme: '#FFF3E4',
  papier: '#FFFDF9',
  blanc: '#FFFFFF',
  vert: '#009E60',
};

/** Enveloppe un fragment dans un SVG carre a la grille de construction. */
function carre(corps, { fond, taille = GRILLE, couleur = C.encre } = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${GRILLE} ${GRILLE}" width="${taille}" height="${taille}">
${fond ? `  <rect width="${GRILLE}" height="${GRILLE}" fill="${fond}"/>\n` : ''}  <g style="color:${couleur}">${signe(PARAMETRES)}</g>
</svg>`;
}

/**
 * Signe recentre et mis a l'echelle pour un cadre donne.
 * `part` est la fraction du cadre que le signe doit occuper en diametre.
 */
function signeCadre({ cadre, part, couleur, fond, parametres = PARAMETRES }) {
  const m = mesures(parametres);
  // Le signe est centre sur la grille : il suffit de le ramener au rayon voulu.
  const echelle = ((cadre * part) / 2 / m.rayonEncombrement) * (GRILLE / GRILLE);
  const k = (echelle * GRILLE) / GRILLE;
  const decalage = cadre / 2 - (GRILLE / 2) * k;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${cadre} ${cadre}" width="${cadre}" height="${cadre}">
${fond ? `  <rect width="${cadre}" height="${cadre}" fill="${fond}"/>\n` : ''}  <g transform="translate(${decalage.toFixed(2)} ${decalage.toFixed(2)}) scale(${k.toFixed(5)})" style="color:${couleur}">${signe(parametres)}</g>
</svg>`;
}

/* --------------------------------------------------------------------------
 * Verrouillages
 * ----------------------------------------------------------------------- */

/**
 * Le signe pose a cote du nom.
 *
 * La hauteur du signe est calee sur la hauteur de capitale du nom, et non sur
 * le corps : c'est l'alignement optique, celui qu'on voit. Le calage sur le
 * corps laisse toujours le signe trop grand.
 */
function verrouillageHorizontal({ sombre = false } = {}) {
  const corps = 64;
  const hauteurSigne = corps * 0.86;
  const m = mesures(PARAMETRES);
  const k = hauteurSigne / (2 * PARAMETRES.rayon + 2 * PARAMETRES.decalage);
  const largeurSigne = (PARAMETRES.fente + 2 * PARAMETRES.rayon) * k;

  const gouttiere = corps * 0.42;
  const x = largeurSigne + gouttiere;
  const largeur = Math.round(x + corps * 4.7);
  const hauteur = 104;

  // Le signe est trace sur la grille : on le recadre sur son encombrement reel.
  const boite = {
    x: (GRILLE - (PARAMETRES.fente + 2 * PARAMETRES.rayon)) / 2,
    y: (GRILLE - (2 * PARAMETRES.rayon + 2 * PARAMETRES.decalage)) / 2,
  };
  const y = (hauteur - hauteurSigne) / 2;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${largeur} ${hauteur}" width="${largeur}" height="${hauteur}">
  <g transform="translate(${(-boite.x * k).toFixed(2)} ${(y - boite.y * k).toFixed(2)}) scale(${k.toFixed(5)})" style="color:${C.orange}">${signe(PARAMETRES)}</g>
  <text x="${x.toFixed(1)}" y="${hauteur / 2 + corps * 0.34}" font-family="Plus Jakarta Sans" font-weight="800"
        font-size="${corps}" letter-spacing="-2.4" fill="${sombre ? C.papier : C.encre}">Chap<tspan fill="${sombre ? C.orange : C.orangeSombre}">.ci</tspan></text>
</svg>`;
}

/** Signe, nom, signature — pour une fiche de magasin d'applications. */
function verrouillageSignature({ sombre = false } = {}) {
  const largeur = 520;
  const hauteur = 200;
  const cadre = 96;
  const k = cadre / GRILLE;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${largeur} ${hauteur}" width="${largeur}" height="${hauteur}">
  <g transform="translate(${(largeur / 2 - cadre / 2).toFixed(1)} 8) scale(${k.toFixed(5)})" style="color:${C.orange}">${signe(PARAMETRES)}</g>
  <text x="${largeur / 2}" y="152" text-anchor="middle" font-family="Plus Jakarta Sans" font-weight="800"
        font-size="52" letter-spacing="-2" fill="${sombre ? C.papier : C.encre}">Chap<tspan fill="${sombre ? C.orange : C.orangeSombre}">.ci</tspan></text>
  <text x="${largeur / 2}" y="182" text-anchor="middle" font-family="Inter" font-weight="600"
        font-size="17" letter-spacing="3.4" fill="${sombre ? C.creme : '#6B6255'}">PETITES ANNONCES CI</text>
</svg>`;
}

/* --------------------------------------------------------------------------
 * Images de demarrage Flutter
 * ----------------------------------------------------------------------- */

/**
 * Trame de losanges — le motif dont le signe est tire.
 *
 * Elle n'est jamais posee au centre : sur un ecran de demarrage, tout ce qui
 * traine autour du signe le concurrence. Elle reste en peripherie, tres basse
 * en opacite, comme une texture de tissu.
 */
function trame(largeur, hauteur, { pas = 132, couleur = C.orange, opacite = 0.07 } = {}) {
  const r = pas / 2.6;
  let motifs = '';
  for (let y = -pas; y < hauteur + pas; y += pas) {
    for (let x = -pas, i = 0; x < largeur + pas; x += pas, i++) {
      const dx = (Math.round(y / pas) % 2) * (pas / 2);
      motifs += `<path d="M ${(x + dx).toFixed(0)} ${(y - r).toFixed(0)} L ${(x + dx + r).toFixed(0)} ${y.toFixed(0)} L ${(x + dx).toFixed(0)} ${(y + r).toFixed(0)} L ${(x + dx - r).toFixed(0)} ${y.toFixed(0)} Z" />`;
    }
  }
  return `<g fill="none" stroke="${couleur}" stroke-width="2" opacity="${opacite}">${motifs}</g>`;
}

/**
 * Ecran de demarrage plein cadre, pour l'affichage Flutter qui suit le splash
 * natif. Le signe occupe le tiers median ; le nom et la signature se posent
 * dessous, dans la zone sure.
 */
function ecranDemarrage(largeur, hauteur) {
  const cadre = Math.round(Math.min(largeur, hauteur) * 0.34);
  const m = mesures(PARAMETRES);
  const k = cadre / 2 / m.rayonEncombrement;
  const x = largeur / 2 - (GRILLE / 2) * k;
  // Le bloc signe + nom est centre optiquement un peu au-dessus du milieu :
  // l'oeil place le centre plus haut que la geometrie.
  const y = hauteur * 0.42 - (GRILLE / 2) * k;
  const corps = Math.round(Math.min(largeur, hauteur) * 0.088);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${largeur} ${hauteur}" width="${largeur}" height="${hauteur}">
  <rect width="${largeur}" height="${hauteur}" fill="${C.encre}"/>
  ${trame(largeur, hauteur, { pas: Math.round(largeur / 7) })}
  <g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${k.toFixed(5)})" style="color:${C.orange}">${signe(PARAMETRES)}</g>
  <text x="${largeur / 2}" y="${(hauteur * 0.42 + cadre * 0.86).toFixed(0)}" text-anchor="middle"
        font-family="Plus Jakarta Sans" font-weight="800" font-size="${corps}"
        letter-spacing="${(-corps * 0.038).toFixed(2)}" fill="${C.papier}">Chap<tspan fill="${C.orange}">.ci</tspan></text>
  <text x="${largeur / 2}" y="${(hauteur * 0.42 + cadre * 0.86 + corps * 0.72).toFixed(0)}" text-anchor="middle"
        font-family="Inter" font-weight="600" font-size="${(corps * 0.26).toFixed(1)}"
        letter-spacing="${(corps * 0.05).toFixed(2)}" fill="${C.creme}" opacity="0.72">ACHETER · VENDRE · CHAP-CHAP</text>
</svg>`;
}

/* --------------------------------------------------------------------------
 * Production
 * ----------------------------------------------------------------------- */

const produits = [];

async function ecrire(relatif, contenu) {
  const cible = path.join(SORTIE, relatif);
  await fs.mkdir(path.dirname(cible), { recursive: true });
  await fs.writeFile(cible, contenu);
  // Les fichiers de travail sont prefixes d'un point : ils ne comptent pas.
  if (!path.basename(relatif).startsWith('.')) produits.push(relatif);
  return cible;
}

async function png(relatif, svg, { largeur, hauteur } = {}) {
  const cible = path.join(SORTIE, relatif);
  await fs.mkdir(path.dirname(cible), { recursive: true });
  let pipeline = sharp(Buffer.from(svg));
  if (largeur) pipeline = pipeline.resize(largeur, hauteur ?? largeur, { fit: 'fill' });
  await pipeline.png({ compressionLevel: 9 }).toFile(cible);
  produits.push(relatif);
  return cible;
}

/** Convertit les textes en courbes : un SVG qui appelle une police par son nom
 *  s'affiche avec une substitution partout ou elle n'est pas installee. */
async function vectoriser(source, cible) {
  await executer('inkscape', [
    source,
    '--export-type=svg',
    '--export-text-to-path',
    '--export-plain-svg',
    `--export-filename=${cible}`,
  ]);
}

/**
 * Recadre un verrouillage sur son dessin reel, plus une zone de reserve.
 *
 * La largeur du cadre ne peut pas etre calculee a l'avance : elle depend de la
 * chasse reelle du texte une fois vectorise, que seule la mesure donne. Un
 * cadre estime laisse trainer du vide a droite — mesure ici a 120 px sur un
 * verrouillage de 760 — et ce vide se voit des qu'on pose le logo sur un fond
 * de couleur.
 *
 * La reserve vaut la moitie de la hauteur du **signe** — pas celle du dessin
 * entier. Sur un verrouillage empile, la hauteur totale comprend le nom et la
 * signature : s'en servir donnerait une reserve deux fois trop large.
 */
async function recadrerSurReserve(fichier, hauteurSigne, partReserve = 0.5) {
  const { stdout } = await executer('inkscape', [
    fichier,
    '--query-x',
    '--query-y',
    '--query-width',
    '--query-height',
  ]);
  const [x, y, l, h] = stdout.trim().split(/\s+/).map(Number);
  const reserve = hauteurSigne * partReserve;

  const L = Number((l + reserve * 2).toFixed(2));
  const H = Number((h + reserve * 2).toFixed(2));
  const svg = await fs.readFile(fichier, 'utf8');

  // On enveloppe le contenu dans une translation plutot que de toucher au
  // viewBox : les coordonnees internes restent celles de la construction.
  const interieur = svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
  const recadre = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${L} ${H}" width="${L}" height="${H}">
  <g transform="translate(${(reserve - x).toFixed(2)} ${(reserve - y).toFixed(2)})">${interieur}</g>
</svg>`;

  await fs.writeFile(fichier, recadre);
  return { largeur: L, hauteur: H, reserve: Number(reserve.toFixed(2)) };
}

await fs.rm(SORTIE, { recursive: true, force: true });

// --- Signe seul, dans chaque couleur de la charte
for (const [nom, couleur] of Object.entries({
  orange: C.orange,
  encre: C.encre,
  creme: C.creme,
  blanc: C.blanc,
  noir: '#000000',
})) {
  await ecrire(`signe/chapci-signe-${nom}.svg`, carre(null, { couleur }));
}

// --- Verrouillages
// La hauteur du signe dans chaque verrouillage, en unites du fichier : c'est
// elle qui donne la zone de reserve.
const HAUTEUR_SIGNE = { horizontal: 64 * 0.86, signature: 60 };

const reserves = {};
const verrouillages = {
  'chapci-horizontal': [verrouillageHorizontal(), HAUTEUR_SIGNE.horizontal],
  'chapci-horizontal-reserve': [verrouillageHorizontal({ sombre: true }), HAUTEUR_SIGNE.horizontal],
  'chapci-signature': [verrouillageSignature(), HAUTEUR_SIGNE.signature],
  'chapci-signature-reserve': [verrouillageSignature({ sombre: true }), HAUTEUR_SIGNE.signature],
};
for (const [nom, [svg, hauteurSigne]] of Object.entries(verrouillages)) {
  const vivant = await ecrire(`verrouillages/${nom}.svg`, svg);
  const courbes = path.join(SORTIE, `verrouillages/${nom}-courbes.svg`);
  await vectoriser(vivant, courbes);
  reserves[nom] = await recadrerSurReserve(courbes, hauteurSigne);
  produits.push(`verrouillages/${nom}-courbes.svg`);
}

// --- Favicon : sous 48 px, la variante epaisse
await ecrire('favicon/favicon.svg', carre(null, { fond: C.orange, couleur: C.encre }));
for (const taille of [16, 32, 48, 96]) {
  const p = taille <= 48 ? PARAMETRES_PETIT : PARAMETRES;
  await png(
    `favicon/favicon-${taille}.png`,
    signeCadre({ cadre: 96, part: 0.86, couleur: C.encre, fond: C.orange, parametres: p }),
    { largeur: taille }
  );
}
await executer('convert', [
  ...[16, 32, 48].map((t) => path.join(SORTIE, `favicon/favicon-${t}.png`)),
  path.join(SORTIE, 'favicon/favicon.ico'),
]);
produits.push('favicon/favicon.ico');

// --- Icones d'application
await png(
  'application/app-icon-512.png',
  signeCadre({ cadre: 512, part: 0.62, couleur: C.encre, fond: C.orange })
);
await png(
  'application/app-icon-1024.png',
  signeCadre({ cadre: 1024, part: 0.62, couleur: C.encre, fond: C.orange })
);
await png(
  'application/apple-touch-icon.png',
  signeCadre({ cadre: 180, part: 0.62, couleur: C.encre, fond: C.orange })
);
// Masquable : le systeme rogne jusqu'au cercle des deux tiers. Le signe descend
// donc a 0,44 du cadre pour garder de la marge sous le masque le plus agressif.
await png(
  'application/maskable-512.png',
  signeCadre({ cadre: 512, part: 0.44, couleur: C.encre, fond: C.orange })
);

/*
 * --- Flutter : splash natif
 *
 * Le clair reprend l'icone d'application — signe encre sur champ orange, la
 * combinaison mesuree a 6,62:1. Le sombre inverse : signe orange sur encre,
 * meme rapport. Les deux tiennent AA, ce qui n'est pas le cas de l'orange sur
 * creme (2,40:1) : sur un ecran d'entree de gamme en plein soleil, un signe
 * orange sur fond clair disparait.
 */
const SPLASH = { clair: C.encre, sombre: C.orange };

for (const [mode, couleur] of Object.entries(SPLASH)) {
  const suffixe = mode === 'clair' ? '' : '_sombre';
  // Sans fond d'icone : 1152 px, contenu dans le cercle de 768 px de diametre.
  await png(
    `flutter/splash/chapci_android12${suffixe}.png`,
    signeCadre({ cadre: 1152, part: 768 / 1152, couleur })
  );
  // Splash classique (Android < 12, iOS, web) : image en densite 4x.
  await png(
    `flutter/splash/chapci_splash${suffixe}.png`,
    signeCadre({ cadre: 1152, part: 0.56, couleur })
  );
}
// Avec fond d'icone : 960 px, contenu dans le cercle de 640 px. Le fond est
// alors pose par `icon_background_color`, donc le signe reste en encre.
await png(
  'flutter/splash/chapci_android12_sur_fond.png',
  signeCadre({ cadre: 960, part: 640 / 960, couleur: C.encre })
);

/*
 * Bandeau de marque, 800 x 320, pose en bas de l'ecran de demarrage.
 *
 * Les deux versions sont tracees depuis la source et non obtenues en
 * remplacant des couleurs dans le SVG vectorise : Inkscape reecrit les
 * couleurs a sa facon, et un remplacement par chaine echoue en silence. Il a
 * echoue ici — le « .ci » restait orange sur un champ orange, donc invisible,
 * et seule l'epreuve a l'ecran l'a montre.
 */
function bandeauMarque({ sombre = false } = {}) {
  const nom = sombre ? C.papier : C.encre;
  // Sur champ orange, le point-ci ne peut pas rester orange : il disparait.
  const extension = sombre ? C.orange : C.papier;
  const signature = sombre ? C.creme : '#3C362C';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 320" width="800" height="320">
  <text x="400" y="176" text-anchor="middle" font-family="Plus Jakarta Sans" font-weight="800"
        font-size="104" letter-spacing="-3.6" fill="${nom}">Chap<tspan fill="${extension}">.ci</tspan></text>
  <text x="400" y="226" text-anchor="middle" font-family="Inter" font-weight="600"
        font-size="26" letter-spacing="5" fill="${signature}">PETITES ANNONCES CI</text>
</svg>`;
}

for (const [nom, sombre] of [
  ['chapci_branding', false],
  ['chapci_branding_sombre', true],
]) {
  const source = await ecrire(`flutter/splash/.${nom}.svg`, bandeauMarque({ sombre }));
  const courbes = path.join(SORTIE, `flutter/splash/.${nom}-courbes.svg`);
  await vectoriser(source, courbes);
  await png(`flutter/splash/${nom}.png`, await fs.readFile(courbes, 'utf8'));
  await fs.rm(source, { force: true });
  await fs.rm(courbes, { force: true });
}

// --- Flutter : ecran de demarrage plein cadre
for (const [nom, l, h] of [
  ['chapci_demarrage_1080x1920', 1080, 1920],
  ['chapci_demarrage_1284x2778', 1284, 2778],
  ['chapci_demarrage_1200x1200', 1200, 1200],
]) {
  const svg = ecranDemarrage(l, h);
  const source = await ecrire(`flutter/demarrage/.${nom}.svg`, svg);
  const courbes = path.join(SORTIE, `flutter/demarrage/.${nom}-courbes.svg`);
  await vectoriser(source, courbes);
  await png(`flutter/demarrage/${nom}.png`, await fs.readFile(courbes, 'utf8'));
  await fs.rm(source, { force: true });
  await fs.rm(courbes, { force: true });
}

/*
 * --- Apercu de l'animation d'entree
 *
 * Les deux moities arrivent ecartees et se rejoignent : le nom qui joue,
 * « chap-chap ». La courbe est celle d'une apparition — rapide au depart,
 * freinee a l'arrivee. Rendre la sequence en image evite de juger une
 * animation sur sa description.
 */
const IMAGES = 18;
const sortieCubique = (t) => 1 - (1 - t) ** 3;

function signeEcarte(ecart, cadre = 320) {
  const p = { ...PARAMETRES };
  const c = GRILLE / 2;
  const r2 = Math.SQRT2;
  const moities = [-1, 1].map((sens) => {
    const pointeX = c + sens * (p.fente / 2 + p.rayon + ecart);
    const cy = c + sens * (p.decalage + ecart * 0.55);
    const dos = pointeX - sens * p.rayon;
    const pts = [
      [dos, cy - p.rayon],
      [pointeX, cy],
      [dos, cy + p.rayon],
      [dos - (sens * p.epaisseur) / r2, cy + p.rayon - p.epaisseur / r2],
      [pointeX - sens * p.epaisseur * r2, cy],
      [dos - (sens * p.epaisseur) / r2, cy - p.rayon + p.epaisseur / r2],
    ];
    return `<path d="M ${pts.map(([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)}`).join(' L ')} Z" fill="${C.encre}"/>`;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${GRILLE} ${GRILLE}" width="${cadre}" height="${cadre}">
    <rect width="${GRILLE}" height="${GRILLE}" fill="${C.orange}"/>${moities.join('')}</svg>`;
}

{
  const cadre = 200;
  // 0,5 et non davantage : au-dela, la moitie gauche sort du cadre. Le point
  // le plus a gauche vaut 48 - (fente/2 + rayon + ecart), qui doit rester
  // positif — soit un ecart maximal de 16 sur la grille, marge comprise.
  const ecartMax = PARAMETRES.rayon * 0.5;
  const images = [];
  for (let i = 0; i < IMAGES; i++) {
    const t = sortieCubique(i / (IMAGES - 1));
    const svg = signeEcarte(ecartMax * (1 - t), cadre);
    images.push(await sharp(Buffer.from(svg)).png().toBuffer());
  }

  // Pellicule : six etats preleves dans la sequence.
  const preleves = [0, 3, 6, 9, 12, 17];
  await sharp({
    create: {
      width: preleves.length * (cadre + 12) + 12,
      height: cadre + 24,
      channels: 3,
      background: C.papier,
    },
  })
    .composite(preleves.map((n, i) => ({ input: images[n], left: 12 + i * (cadre + 12), top: 12 })))
    .png()
    .toFile(path.join(SORTIE, 'flutter/demarrage/chapci_entree_pellicule.png'));
  produits.push('flutter/demarrage/chapci_entree_pellicule.png');

  // Sequence animee, pour la voir bouger plutot que la lire.
  const atelier = path.join(SORTIE, 'flutter/demarrage/.images');
  await fs.mkdir(atelier, { recursive: true });
  await Promise.all(
    images.map((b, i) => fs.writeFile(path.join(atelier, `${String(i).padStart(2, '0')}.png`), b))
  );
  await executer('convert', [
    '-delay',
    // Le delai d'ImageMagick est en centiemes de seconde.
    String(Math.round(62 / IMAGES)),
    '-loop',
    '0',
    path.join(atelier, '*.png'),
    // Une pause a la fin, sinon la boucle repart avant qu'on ait vu la forme.
    '-delay',
    '120',
    path.join(atelier, `${String(IMAGES - 1).padStart(2, '0')}.png`),
    path.join(SORTIE, 'flutter/demarrage/chapci_entree.gif'),
  ]);
  await fs.rm(atelier, { recursive: true, force: true });
  produits.push('flutter/demarrage/chapci_entree.gif');
}

/* --------------------------------------------------------------------------
 * Controles
 * ----------------------------------------------------------------------- */

const m = mesures(PARAMETRES);
const mp = mesures(PARAMETRES_PETIT);

console.log('\n  Construction');
console.log(`    rayon d encombrement   ${m.rayonEncombrement} sur une grille de ${GRILLE}`);
console.log(
  `    fente a 16 px          ${mesures(PARAMETRES, 16).fentePx} px — variante petite : ${mesures(PARAMETRES_PETIT, 16).fentePx} px`
);
console.log(
  `    trait a 16 px          ${mesures(PARAMETRES, 16).traitPx} px — variante petite : ${mesures(PARAMETRES_PETIT, 16).traitPx} px`
);
console.log(`    echelle masquable      x${mp.echelleMasquable}`);

console.log('\n  Verrouillages, recadres sur leur dessin reel');
for (const [nom, r] of Object.entries(reserves)) {
  console.log(`    ${nom.padEnd(28)} ${r.largeur} x ${r.hauteur} — reserve ${r.reserve}`);
}

console.log('\n  Contraste');
for (const [nom, a, b] of [
  ['encre sur orange', C.encre, C.orange],
  ['orange sur encre', C.orange, C.encre],
  ['orange sur creme', C.orange, C.creme],
]) {
  const r = verifierContraste(a, b);
  console.log(
    `    ${nom.padEnd(22)} ${r.ratio.toFixed(2)}:1 ${r.aa ? '✓ AA' : '— sous AA, grand format seulement'}`
  );
}

console.log(`\n  ${produits.length} fichier(s) dans ${path.relative(process.cwd(), SORTIE)}/`);
