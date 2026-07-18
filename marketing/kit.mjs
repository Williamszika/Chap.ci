// =============================================================================
//  Générateur de visuels marketing Chap.ci — note ivoirienne (orange/vert/crème).
//
//  Produit des visuels prêts à poster (Facebook 1080×1080, Story 1080×1920) :
//   - brand / vendeurs / acheteurs  : notoriété & acquisition (2 publics)
//   - promo                         : éclat de prix (soldes / réduction)
//   - category                      : mise en avant d'une catégorie
//   - event                         : saisonnier (indépendance, rentrée, Noël…)
//   - listing                       : une VRAIE annonce (photo + prix + lieu)
//
//  USAGE (dans une session Claude Code sur le web — Chromium est pré-installé) :
//   node marketing/kit.mjs <type> clé=valeur clé="valeur avec espaces" …
//
//  Exemples :
//   node marketing/kit.mjs vendeurs
//   node marketing/kit.mjs promo title="iPhone 13 Pro" old=320000 new=250000
//   node marketing/kit.mjs category cat=vehicules
//   node marketing/kit.mjs event event=noel
//   node marketing/kit.mjs listing title="Toyota Corolla" price=6500000 \
//        location=Cocody image=/chemin/vers/photo.jpg
//
//  Sortie : ./<type>.png (ou OUT_DIR=… pour changer de dossier).
//  Pour intégrer une vraie photo d'annonce : voir marketing/README.md
//  (télécharger l'image avec curl puis la passer via image=…).
// =============================================================================

// Playwright : installé globalement dans l'environnement Claude web.
let chromium
try { ({ chromium } = await import('playwright')) }
catch { ({ chromium } = await import('/opt/node22/lib/node_modules/playwright/index.mjs')) }

import { readFileSync } from 'node:fs'

// ---- Palette & helpers ------------------------------------------------------
const ORANGE = '#F77F00', ORANGE_D = '#D95F00', GREEN = '#009E60'
const CREAM = '#FFFDF9', INK = '#1B1A17'
const FONT = `-apple-system, 'DejaVu Sans', 'Liberation Sans', sans-serif`

const wax = (color, op) => `background-image:
  radial-gradient(circle at 20% 20%, ${color} 6px, transparent 7px),
  radial-gradient(circle at 70% 60%, ${color} 4px, transparent 5px),
  radial-gradient(circle at 45% 85%, ${color} 5px, transparent 6px);
  background-size:90px 90px,70px 70px,110px 110px;opacity:${op};`

const flagBar = `<div style="position:absolute;top:0;left:0;right:0;height:12px;display:flex">
  <div style="flex:1;background:${ORANGE}"></div><div style="flex:1;background:#fff"></div>
  <div style="flex:1;background:${GREEN}"></div></div>`

const logo = (dark) => `<div style="display:flex;align-items:center;gap:16px">
  <div style="width:64px;height:64px;border-radius:50%;background:${dark ? ORANGE : '#fff'};
    color:${dark ? '#fff' : ORANGE};font-weight:900;font-size:40px;display:grid;place-items:center">C</div>
  <div style="font-size:34px;font-weight:800;letter-spacing:-.5px;color:${dark ? INK : '#fff'}">
    Chap<span style="color:${dark ? GREEN : '#bff0d4'}">.ci</span></div></div>`

const cta = (dark) => `<div style="background:${dark ? ORANGE : '#fff'};color:${dark ? '#fff' : ORANGE_D};
  font-weight:900;font-size:46px;padding:22px 40px;border-radius:20px;
  box-shadow:0 10px 30px rgba(0,0,0,.22)">chap.ci</div>`

const fmt = (n) => Number(n).toLocaleString('fr-FR').replace(/ /g, ' ') // espace fine
const dataUri = (path) => {
  const ext = (path.split('.').pop() || 'jpg').toLowerCase()
  const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg'
  return `data:${mime};base64,${readFileSync(path).toString('base64')}`
}

// ---- Registres --------------------------------------------------------------
const CATS = {
  vehicules:    { emoji: '🚗', label: 'Véhicules',    color: '#1e3a8a', tagline: 'Voitures, motos, pièces…' },
  immobilier:   { emoji: '🏠', label: 'Immobilier',   color: '#065f46', tagline: 'Location, vente, terrains…' },
  telephones:   { emoji: '📱', label: 'Téléphones',   color: '#5b21b6', tagline: 'Smartphones, accessoires…' },
  electronique: { emoji: '💻', label: 'Électronique', color: '#334155', tagline: 'PC, TV, consoles, audio…' },
  mode:         { emoji: '👗', label: 'Mode & Beauté', color: '#9d174d', tagline: 'Vêtements, chaussures, wax…' },
  maison:       { emoji: '🛋️', label: 'Maison & Meubles', color: '#92400e', tagline: 'Meubles, électroménager…' },
  alimentation: { emoji: '🍲', label: 'Alimentation', color: '#166534', tagline: 'Vivriers, épices, boissons…' },
  emploi:       { emoji: '💼', label: 'Emploi',       color: '#0e7490', tagline: 'Offres & services près de toi' },
}
const EVENTS = {
  independance: { title: "Bonne fête de<br>l'Indépendance !", sub: 'Célébrons la Côte d\'Ivoire 🇨🇮 sur Chap.ci', c1: ORANGE, c2: GREEN, emoji: '🇨🇮' },
  rentree:      { title: "C'est la<br>rentrée !", sub: 'Fournitures, tel, ordis… à petits prix sur Chap.ci', c1: '#1d4ed8', c2: ORANGE, emoji: '🎒' },
  noel:         { title: 'Joyeux<br>Noël !', sub: 'Trouve tes cadeaux près de chez toi sur Chap.ci', c1: '#b91c1c', c2: GREEN, emoji: '🎄' },
  nouvelan:     { title: 'Bonne<br>année !', sub: 'Nouvelle année, bonnes affaires sur Chap.ci', c1: ORANGE_D, c2: '#eab308', emoji: '🎉' },
  ramadan:      { title: 'Ramadan<br>Moubarak', sub: 'Tout pour le mois béni sur Chap.ci', c1: '#065f46', c2: '#eab308', emoji: '🌙' },
}

// ---- Templates --------------------------------------------------------------
function frame(inner, dark) {
  return `<div style="width:1080px;height:1080px;position:relative;overflow:hidden;font-family:${FONT};
    ${dark ? `background:radial-gradient(120% 100% at 50% -10%, #ff9a3c 0%, ${ORANGE} 45%, ${ORANGE_D} 100%);color:#fff`
           : `background:${CREAM};color:${INK}`}">
    <div style="position:absolute;inset:0;${wax(dark ? '#ffffff' : ORANGE, dark ? 0.10 : 0.06)}"></div>
    ${flagBar}
    <div style="position:relative;padding:70px 72px;height:100%;box-sizing:border-box;display:flex;flex-direction:column">
      ${inner}</div></div>`
}

const T = {
  vendeurs: () => frame(`${logo(false)}
    <div style="margin-top:52px"><span style="display:inline-block;background:#fff;color:${ORANGE_D};font-weight:900;font-size:26px;padding:10px 22px;border-radius:999px;letter-spacing:1px">100% GRATUIT</span></div>
    <h1 style="margin:24px 0 0;font-size:116px;line-height:.95;font-weight:900;letter-spacing:-3px;text-shadow:0 4px 24px rgba(0,0,0,.18)">Vends<br>tout,<br><span style="color:#ffe08a">chap&#8209;chap&nbsp;!</span></h1>
    <p style="margin:34px 0 0;font-size:40px;line-height:1.25;font-weight:600;max-width:820px">Publie ton annonce en <b>2 minutes</b> et vends près de chez toi 🇨🇮</p>
    <div style="margin-top:auto;display:flex;align-items:center;justify-content:space-between">
      <div style="font-size:32px;font-weight:700;opacity:.95">📱 Voitures · Tel · Mode · Maison…</div>${cta(false)}</div>`, true),

  acheteurs: () => frame(`${logo(true)}
    <div style="margin-top:50px"><span style="background:${GREEN};color:#fff;font-weight:800;font-size:26px;padding:9px 20px;border-radius:999px">📍 Près de chez toi</span></div>
    <h1 style="margin:22px 0 0;font-size:100px;line-height:.96;font-weight:900;letter-spacing:-3px;color:${INK}">Les bonnes<br>affaires,<br><span style="color:${ORANGE}">à petit prix</span></h1>
    <div style="margin-top:36px;display:flex;flex-wrap:wrap;gap:14px">
      ${Object.values(CATS).slice(0, 6).map(c => `<span style="background:#fff;border:2px solid #f0e6d6;border-radius:16px;padding:14px 22px;font-size:30px;font-weight:700">${c.emoji} ${c.label}</span>`).join('')}</div>
    <div style="margin-top:auto;display:flex;align-items:center;justify-content:space-between">
      <div style="font-size:50px;font-weight:900;color:${ORANGE_D}">dès 1&#8239;000&nbsp;FCFA</div>${cta(true)}</div>`, false),

  promo: (o) => {
    const oldP = Number(o.old || 0), newP = Number(o.new || 0)
    const pct = oldP > 0 && newP > 0 ? Math.round((1 - newP / oldP) * 100) : (o.percent || 0)
    const media = o.image
      ? `<div style="width:100%;height:420px;border-radius:24px;background:#0002 center/cover url('${dataUri(o.image)}');box-shadow:0 12px 30px rgba(0,0,0,.25)"></div>`
      : `<div style="width:100%;height:340px;border-radius:24px;background:#ffffff22;display:grid;place-items:center;font-size:160px">🏷️</div>`
    return frame(`${logo(false)}
      <div style="position:absolute;top:60px;right:66px;width:210px;height:210px;border-radius:50%;background:#fff;color:${ORANGE_D};display:grid;place-items:center;box-shadow:0 12px 30px rgba(0,0,0,.28);transform:rotate(-8deg)">
        <div style="text-align:center;line-height:.9"><div style="font-size:96px;font-weight:900">-${pct}%</div></div></div>
      <div style="margin-top:40px">${media}</div>
      <h1 style="margin:30px 0 0;font-size:66px;line-height:1;font-weight:900;letter-spacing:-1px;max-width:820px">${o.title || 'Bonne affaire'}</h1>
      <div style="margin-top:20px;display:flex;align-items:baseline;gap:22px">
        ${oldP ? `<span style="font-size:44px;font-weight:700;opacity:.8;text-decoration:line-through">${fmt(oldP)} FCFA</span>` : ''}
        <span style="font-size:86px;font-weight:900;color:#ffe08a">${fmt(newP || oldP)} FCFA</span></div>
      <div style="margin-top:auto;display:flex;align-items:center;justify-content:space-between">
        <div style="font-size:32px;font-weight:700;opacity:.95">🔥 Offre à saisir vite !</div>${cta(false)}</div>`, true)
  },

  category: (o) => {
    const c = CATS[o.cat] || { emoji: o.emoji || '📦', label: o.label || 'Catégorie', color: o.color || ORANGE_D, tagline: o.tagline || '' }
    return `<div style="width:1080px;height:1080px;position:relative;overflow:hidden;font-family:${FONT};
      background:radial-gradient(120% 100% at 50% -10%, ${c.color}dd, ${c.color} 60%, #0009 160%);color:#fff">
      <div style="position:absolute;inset:0;${wax('#ffffff', 0.08)}"></div>${flagBar}
      <div style="position:relative;padding:70px 72px;height:100%;box-sizing:border-box;display:flex;flex-direction:column">
        ${logo(false)}
        <div style="margin-top:40px;font-size:240px;line-height:1">${c.emoji}</div>
        <h1 style="margin:10px 0 0;font-size:104px;line-height:.95;font-weight:900;letter-spacing:-2px">${c.label}</h1>
        <p style="margin:20px 0 0;font-size:40px;font-weight:600;opacity:.95">${c.tagline}</p>
        <p style="margin:14px 0 0;font-size:34px;font-weight:700;color:#ffe08a">Des centaines d'annonces près de toi 🇨🇮</p>
        <div style="margin-top:auto;display:flex;align-items:center;justify-content:space-between">
          <div style="font-size:32px;font-weight:700;opacity:.95">👉 Trouve la tienne</div>${cta(false)}</div>
      </div></div>`
  },

  event: (o) => {
    const e = EVENTS[o.event] || { title: o.title || 'Chap.ci', sub: o.sub || 'La marketplace 100% ivoirienne', c1: o.c1 || ORANGE, c2: o.c2 || GREEN, emoji: o.emoji || '🇨🇮' }
    return `<div style="width:1080px;height:1080px;position:relative;overflow:hidden;font-family:${FONT};
      background:linear-gradient(135deg, ${e.c1} 0%, ${e.c2} 100%);color:#fff">
      <div style="position:absolute;inset:0;${wax('#ffffff', 0.10)}"></div>${flagBar}
      <div style="position:relative;padding:74px 72px;height:100%;box-sizing:border-box;display:flex;flex-direction:column">
        ${logo(false)}
        <div style="margin-top:56px;font-size:150px;line-height:1">${e.emoji}</div>
        <h1 style="margin:16px 0 0;font-size:110px;line-height:.95;font-weight:900;letter-spacing:-2px;text-shadow:0 4px 24px rgba(0,0,0,.2)">${e.title}</h1>
        <p style="margin:30px 0 0;font-size:42px;font-weight:600;max-width:840px">${e.sub}</p>
        <div style="margin-top:auto;display:flex;align-items:center;justify-content:flex-end">${cta(false)}</div>
      </div></div>`
  },

  listing: (o) => {
    const media = o.image
      ? `background:#111 center/cover url('${dataUri(o.image)}')`
      : `background:${ORANGE};display:grid;place-items:center`
    return `<div style="width:1080px;height:1080px;position:relative;overflow:hidden;font-family:${FONT};background:${INK};color:#fff">
      <div style="position:absolute;top:0;left:0;right:0;height:640px;${media}"></div>
      ${o.image ? '' : `<div style="position:absolute;top:230px;width:100%;text-align:center;font-size:180px">📦</div>`}
      <div style="position:absolute;top:600px;left:0;right:0;height:200px;background:linear-gradient(to bottom, transparent, ${INK})"></div>
      ${flagBar}
      <div style="position:absolute;top:40px;left:40px">${logo(false)}</div>
      ${o.badge ? `<div style="position:absolute;top:56px;right:56px;background:#fff;color:${ORANGE_D};font-weight:900;font-size:30px;padding:12px 26px;border-radius:999px">${o.badge}</div>` : ''}
      <div style="position:absolute;left:60px;right:60px;bottom:56px">
        <h1 style="margin:0;font-size:70px;line-height:1.02;font-weight:900;letter-spacing:-1px">${o.title || 'Annonce'}</h1>
        <div style="margin-top:18px;display:flex;align-items:center;gap:20px">
          <span style="font-size:76px;font-weight:900;color:#ffe08a">${o.price ? fmt(o.price) + ' FCFA' : ''}</span>
          ${o.location ? `<span style="font-size:36px;font-weight:600;opacity:.9">📍 ${o.location}</span>` : ''}</div>
        <div style="margin-top:26px;display:flex;align-items:center;justify-content:space-between">
          <span style="font-size:34px;font-weight:700;opacity:.95">Dispo maintenant sur</span>
          <span style="background:#fff;color:${ORANGE_D};font-weight:900;font-size:44px;padding:18px 34px;border-radius:18px">chap.ci</span></div>
      </div></div>`
  },
}

// ---- CLI --------------------------------------------------------------------
const [type, ...rest] = process.argv.slice(2)
const opts = {}
for (const a of rest) { const i = a.indexOf('='); if (i > 0) opts[a.slice(0, i)] = a.slice(i + 1) }
const build = T[type]
if (!build) { console.error(`Type inconnu : "${type}". Types : ${Object.keys(T).join(', ')}`); process.exit(1) }

const html = build(opts)
const OUT = process.env.OUT_DIR || '.'
const name = opts.name || `${type}${opts.cat ? '-' + opts.cat : ''}${opts.event ? '-' + opts.event : ''}`

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--no-sandbox', '--force-color-profile=srgb'],
})
const ctx = await browser.newContext({ viewport: { width: 1080, height: 1080 }, deviceScaleFactor: 1 })
const page = await ctx.newPage()
await page.setContent(`<body style="margin:0">${html}</body>`, { waitUntil: 'networkidle' })
await page.waitForTimeout(300)
await page.screenshot({ path: `${OUT}/${name}.png` })
await browser.close()
console.log(`OK → ${OUT}/${name}.png`)
