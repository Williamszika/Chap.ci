// =============================================================================
//  Livraison du rapport de sourcing par EMAIL (avec PDF joint).
//  Usage :  node sourcing/deliver-report.mjs <result.json> "<date FR>"
//  - <result.json> = valeur de retour du workflow ({ report, items, ... })
//  Dépendances : AUCUNE (Node ≥ 18 + Chromium système + curl). Pas de npm.
//  Config par variables d'env :
//    CHAPCI_API       (déf. https://chap.ci/api)
//    CHAPCI_CRON_KEY  (REQUIS : la clé cron valide du serveur, à passer en env)
//    CHAPCI_MAIL_TO   (optionnel : forcer un destinataire)
// =============================================================================
import { readFileSync, writeFileSync, mkdtempSync, existsSync, globSync } from 'node:fs'
import { spawn, execFileSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const API      = process.env.CHAPCI_API || 'https://chap.ci/api'
const CRON_KEY = process.env.CHAPCI_CRON_KEY || '' // REQUIS via env (l'ancienne clé en dur, invalide, a été retirée)
const MAIL_TO  = process.env.CHAPCI_MAIL_TO || ''
const [resultPath, dateArg] = process.argv.slice(2)
if (!resultPath) { console.error('Usage: node deliver-report.mjs <result.json> "<date>"'); process.exit(2) }

let res = JSON.parse(readFileSync(resultPath, 'utf8'))
if (typeof res === 'string') res = JSON.parse(res)
// Tolère le fichier de sortie complet du workflow (enveloppe { result: {...} }).
if (res && res.result && !res.items) { res = res.result; if (typeof res === 'string') res = JSON.parse(res) }
const items = res.items || []
const dateLabel = dateArg || res.generatedFor || ''
const m = /## 🔭 Note de marché\n([\s\S]*?)\n\n---/.exec(res.report || '')
const outlook = m ? m[1].trim() : ''

// Réglages du cycle (issus du workflow) — pour l'affichage. Replis si absents.
const cfg = res.config || {}
const BUDGET = cfg.budgetEUR || 1000
const FCFAPE = cfg.fcfaPerEur || 655.957
const MINPCT = cfg.minMarginPct || 30
const MINFCFA = cfg.minMarginFCFA || 20000
const budgetFCFA = Math.round(BUDGET * FCFAPE)

const fr = (n) => Number(n).toLocaleString('fr-FR')
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
function marketLinks(product, source, acqEUR) {
  const words = String(product).replace(/[^a-zA-Z0-9 ]+/g, ' ').split(/\s+/).filter(Boolean).slice(0, 4)
  const enc = encodeURIComponent(words.join(' ')), hy = words.join('-').toLowerCase(), src = String(source || '').toLowerCase()
  const cap = Math.max(30, Math.round((acqEUR || 100) * 1.8)); const out = []; const add = (n, u) => { if (!out.some(x => x[0] === n)) out.push([n, u]) }
  if (src.includes('marktplaats')) add('Marktplaats', `https://www.marktplaats.nl/q/${hy}/`)
  if (src.includes('leboncoin')) add('Leboncoin', `https://www.leboncoin.fr/recherche?text=${enc}`)
  if (src.includes('wallapop')) add('Wallapop', `https://es.wallapop.com/search?keywords=${enc}`)
  if (src.includes('vinted')) add('Vinted', `https://www.vinted.fr/catalog?search_text=${enc}`)
  add('Kleinanzeigen', `https://www.kleinanzeigen.de/s-${hy}/k0`)
  add('eBay', `https://www.ebay.de/sch/i.html?_nkw=${enc}&_udhi=${cap}&_sop=15`)
  return out.slice(0, 3)
}

// ---- PDF paysage 2 pages (identique au dossier envoyé à l'admin) -------------
const PRINT_CSS = `
  @page{size:297mm 210mm;margin:0}*{box-sizing:border-box;margin:0;padding:0}
  html,body{font-family:-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;color:#1f2530;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .page{padding:22px 30px 18px}
  .flag{height:7px;display:flex;border-radius:4px;overflow:hidden;margin-bottom:14px}
  .flag i{flex:1}.flag .o{background:#F77F00}.flag .w{background:#fff;border-top:1px solid #eee;border-bottom:1px solid #eee}.flag .g{background:#009E60}
  .head{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;border-bottom:2px solid #f0f0f2;padding-bottom:12px}
  .brand{font-size:22px;font-weight:800}.brand b{color:#009E60}.brand .pin{color:#F77F00}
  h1{font-size:18px;font-weight:800;margin-top:3px;color:#0f1420}h1 .em{color:#F77F00}
  .meta{text-align:right;font-size:11px;color:#6b7280;line-height:1.5}.meta b{color:#374151}
  .brief{margin:14px 0 12px;background:linear-gradient(100deg,#fff7ed,#f0fdf4);border:1px solid #ffe4c4;border-left:5px solid #F77F00;border-radius:10px;padding:11px 15px;font-size:12.5px;line-height:1.5}
  .brief .t{font-weight:800;color:#b45309;text-transform:uppercase;letter-spacing:.06em;font-size:10.5px;margin-bottom:2px}.brief b{color:#047857}
  table{width:100%;border-collapse:collapse;font-size:11.5px}
  thead th{background:#F77F00;color:#fff;font-weight:700;text-align:right;padding:9px 8px;font-size:10.5px;white-space:nowrap}
  thead th.l{text-align:left}
  tbody td{padding:8px;text-align:right;border-bottom:1px solid #eef0f2;white-space:nowrap}
  tbody td.l{text-align:left;white-space:normal}tbody tr:nth-child(even){background:#fafbfc}
  .num{font-variant-numeric:tabular-nums}.art{font-weight:700;color:#111827}.cat{display:block;font-size:9.5px;color:#9aa0aa;font-weight:600;margin-top:1px}
  .rank{font-weight:800;color:#F77F00;text-align:center!important}.marge{color:#047857;font-weight:800}.pct{font-weight:700}.profit{color:#047857;font-weight:800}
  .best td{background:#fff6ea!important}.best .rank::after{content:" ★";color:#f6b301}
  .legend{font-size:9.5px;color:#9aa0aa;margin-top:7px}
  .foot{margin-top:14px;font-size:9.5px;color:#9aa0aa;line-height:1.5;border-top:1px solid #f0f0f2;padding-top:9px;display:flex;justify-content:space-between;gap:12px}.foot b{color:#6b7280}
  .break{page-break-before:always}h2{font-size:14px;font-weight:800;margin:6px 0 10px;color:#0f1420}
  .two{display:grid;grid-template-columns:1fr 1fr;gap:22px}
  ol.links{list-style:none;counter-reset:k}ol.links li{counter-increment:k;font-size:11px;line-height:1.5;margin-bottom:9px;padding-left:22px;position:relative}
  ol.links li::before{content:counter(k);position:absolute;left:0;top:0;width:16px;height:16px;background:#F77F00;color:#fff;border-radius:50%;font-size:9.5px;font-weight:800;display:flex;align-items:center;justify-content:center}
  ol.links .cap{color:#9aa0aa;font-weight:600;font-size:10px}.lk a{color:#0369a1;text-decoration:none;font-weight:600}
  ul.tips{list-style:none}ul.tips li{font-size:10.5px;line-height:1.5;margin-bottom:9px;padding-left:12px;border-left:3px solid #f0e2cf}ul.tips b{color:#111827}
  .risk{display:inline-block;font-size:9px;font-weight:700;padding:1px 7px;border-radius:999px;white-space:nowrap}
  .r-faible{background:#dcfce7;color:#166534}.r-moyen{background:#fef3c7;color:#92400e}.r-élevé{background:#fee2e2;color:#991b1b}
  .note{font-size:11px;line-height:1.6;color:#374151;background:#f8fafc;border:1px solid #e8edf2;border-radius:10px;padding:12px 15px}
  .sub{font-size:10px;color:#9aa0aa;margin:-4px 0 12px}
`
function buildPrintHtml() {
  const best = items[0]
  const rows = items.map((it, i) => `
    <tr class="${i === 0 ? 'best' : ''}"><td class="rank">${i + 1}</td>
    <td class="l"><span class="art">${esc(it.product)}</span><span class="cat">${esc(it.category || '')}</span></td>
    <td class="num">${fr(it.acquisitionEUR)}</td><td class="num">${it.freightMode === 'Maritime' ? '🚢' : '✈️'} ${fr(it.freightEUR)} €</td>
    <td class="num">${fr(it.landedFCFA)}</td><td class="num">${fr(it.resaleFCFA)}</td>
    <td class="num marge">+${fr(it.marginFCFA)}</td><td class="num pct">${it.marginPct} %</td>
    <td class="num">${it.unitsForBudget}</td><td class="num profit">${fr(it.totalProfitFCFA)}</td></tr>`).join('')
  const linksList = items.map((it) => {
    const ls = marketLinks(it.product, it.europeSource, it.acquisitionEUR).map(([n, u]) => `<a href="${u}">${n}</a>`).join(' · ')
    return `<li><b>${esc(it.product)}</b> <span class="cap">(≤ ~${fr(it.acquisitionEUR)} €)</span><br><span class="lk">${ls}</span></li>`
  }).join('')
  const conseils = items.map((it) => `<li><b>${esc(it.product)}</b> — ${esc(it.buyingTip || it.notes || 'Vérifier l\'état réel et négocier.')}${it.risk ? ` <span class="risk r-${it.risk}">risque : ${it.risk}</span>` : ''}</li>`).join('')
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><style>${PRINT_CSS}</style></head><body>
  <div class="page"><div class="flag"><i class="o"></i><i class="w"></i><i class="g"></i></div>
    <div class="head"><div><div class="brand"><span class="pin">📍</span> Chap<b>.ci</b></div>
      <h1>🛒➡️🇨🇮 Rapport de sourcing — <span class="em">Europe → Abidjan</span></h1></div>
      <div class="meta"><div><b>${esc(dateLabel)}</b></div><div>Budget de référence : <b>${fr(BUDGET)} €</b> (${fr(budgetFCFA)} FCFA)</div>
      <div>Taux 1 € = 655,957 FCFA · Douane 100 % formelle incluse</div><div>Seuils : marge ≥ <b>${MINPCT} %</b> et ≥ <b>${fr(MINFCFA)} FCFA</b>/article</div></div></div>
    <div class="brief"><div class="t">🏆 En bref</div><b>${items.length} affaires</b> retenues. La meilleure : <b>${esc(best.product)}</b> — acheté ~${fr(best.acquisitionEUR)} €, revendu ~${fr(best.resaleFCFA)} FCFA → <b>+${fr(best.marginFCFA)} FCFA/pièce</b> (marge ${best.marginPct} %). Avec ${fr(BUDGET)} €, ~${best.unitsForBudget} unités → <b>${fr(best.totalProfitFCFA)} FCFA</b> de profit potentiel.</div>
    <table><thead><tr><th style="text-align:center">#</th><th class="l">Article</th><th>Achat (€)</th><th>Fret</th><th>Revient (FCFA)</th><th>Revente Abidjan</th><th>Marge / u</th><th>Marge %</th><th>Unités / ${fr(BUDGET)} €</th><th>Profit total*</th></tr></thead><tbody>${rows}</tbody></table>
    <div class="legend">* Profit total si tout le budget (${fr(BUDGET)} €) est investi sur cet article. Fret : ✈️ aérien · 🚢 maritime.</div></div>
  <div class="page break"><div class="flag"><i class="o"></i><i class="w"></i><i class="g"></i></div>
    <div class="two"><div><h2>🔗 Où acheter</h2><div class="sub">Liens de recherche en direct — cliquez pour voir les annonces du moment (filtrées par prix).</div><ol class="links">${linksList}</ol></div>
    <div><h2>💡 Conseils d'achat</h2><ul class="tips">${conseils}</ul></div></div>
    <h2 style="margin-top:16px">🔭 Note de marché</h2><div class="note">${esc(outlook)}</div>
    <div class="foot"><div>Prix indicatifs (recherche best-effort) — <b>à vérifier au moment de l'achat</b>. Import à déclarer et dédouaner en règle.</div><div>Généré par le <b>moteur de sourcing Chap.ci</b> · rapport automatique 3×/semaine</div></div></div>
  </body></html>`
}

// ---- Email HTML (responsive, lisible sans ouvrir le PDF) ---------------------
function buildEmailHtml() {
  const best = items[0]
  const rows = items.map((it, i) => `<tr style="background:${i % 2 ? '#fafbfc' : '#fff'}">
    <td style="padding:7px 8px;font-weight:700;color:#F77F00;text-align:center">${i + 1}</td>
    <td style="padding:7px 8px"><b>${esc(it.product)}</b><br><span style="color:#9aa0aa;font-size:11px">${esc(it.category || '')}</span></td>
    <td style="padding:7px 8px;text-align:right">${fr(it.acquisitionEUR)} €</td>
    <td style="padding:7px 8px;text-align:right">${fr(it.resaleFCFA)}</td>
    <td style="padding:7px 8px;text-align:right;color:#047857;font-weight:800">+${fr(it.marginFCFA)}</td>
    <td style="padding:7px 8px;text-align:right;font-weight:700">${it.marginPct} %</td></tr>`).join('')
  const linkItems = items.slice(0, 8).map((it) => {
    const ls = marketLinks(it.product, it.europeSource, it.acquisitionEUR).map(([n, u]) => `<a href="${u}" style="color:#0369a1;text-decoration:none;font-weight:600">${n}</a>`).join(' · ')
    return `<li style="margin-bottom:6px"><b>${esc(it.product)}</b> <span style="color:#9aa0aa">(≤ ~${fr(it.acquisitionEUR)} €)</span> — ${ls}</li>`
  }).join('')
  return `<div style="max-width:640px;margin:0 auto;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1f2530">
  <div style="height:6px;border-radius:4px;overflow:hidden;display:flex"><div style="flex:1;background:#F77F00"></div><div style="flex:1;background:#fff;border:1px solid #eee"></div><div style="flex:1;background:#009E60"></div></div>
  <h2 style="margin:16px 0 2px">🛒➡️🇨🇮 Rapport de sourcing — Europe → Abidjan</h2>
  <div style="color:#6b7280;font-size:13px">${esc(dateLabel)} · Budget de référence ${fr(BUDGET)} € · douane 100 % formelle incluse</div>
  <div style="margin:14px 0;background:#fff7ed;border-left:4px solid #F77F00;border-radius:8px;padding:11px 14px;font-size:14px">
    <b>${items.length} affaires</b> retenues. La meilleure : <b>${esc(best.product)}</b> — acheté ~${fr(best.acquisitionEUR)} €, revendu ~${fr(best.resaleFCFA)} FCFA → <b style="color:#047857">+${fr(best.marginFCFA)} FCFA/pièce</b> (marge ${best.marginPct} %).</div>
  <table style="width:100%;border-collapse:collapse;font-size:13px">
    <thead><tr style="background:#F77F00;color:#fff"><th style="padding:8px;text-align:center">#</th><th style="padding:8px;text-align:left">Article</th><th style="padding:8px;text-align:right">Achat</th><th style="padding:8px;text-align:right">Revente</th><th style="padding:8px;text-align:right">Marge/u</th><th style="padding:8px;text-align:right">%</th></tr></thead>
    <tbody>${rows}</tbody></table>
  <p style="margin:16px 0 6px;font-weight:700">🔗 Où acheter</p>
  <ul style="font-size:13px;padding-left:18px;margin:0">${linkItems}</ul>
  <p style="margin:16px 0;padding:10px 14px;background:#f0fdf4;border-radius:8px;font-size:13px">📎 <b>Le dossier complet</b> (tableau + tous les liens cliquables + conseils d'achat + note de marché) est en <b>pièce jointe PDF</b>.</p>
  <p style="color:#9aa0aa;font-size:11px;border-top:1px solid #eee;padding-top:8px">Prix indicatifs (recherche best-effort) — à vérifier au moment de l'achat. Import à déclarer et dédouaner en règle. Moteur de sourcing Chap.ci · rapport automatique 3×/semaine.</p>
  </div>`
}

// ---- Rendu PDF via Chromium (CDP, sans dépendance npm) -----------------------
function findChrome() {
  if (process.env.PW_CHROME && existsSync(process.env.PW_CHROME)) return process.env.PW_CHROME
  for (const g of ['/opt/pw-browsers/chromium-*/chrome-linux/chrome', '/opt/pw-browsers/chromium-*/chrome-linux/headless_shell']) {
    try { const hit = globSync(g); if (hit.length) return hit.sort().reverse()[0] } catch {}
  }
  return 'chromium'
}
async function renderPdf(htmlPath, outPdf) {
  const userDir = mkdtempSync(join(tmpdir(), 'cr-'))
  const chrome = spawn(findChrome(), ['--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', `--user-data-dir=${userDir}`, '--remote-debugging-port=0', 'file://' + htmlPath])
  const browserWs = await new Promise((resolve, reject) => {
    let buf = ''; const t = setTimeout(() => reject(new Error('timeout DevTools')), 15000)
    chrome.stderr.on('data', (d) => { buf += d; const mm = /DevTools listening on (ws:\/\/\S+)/.exec(buf); if (mm) { clearTimeout(t); resolve(mm[1].trim()) } })
  })
  const port = new URL(browserWs).port
  await new Promise(r => setTimeout(r, 400))
  const targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json()
  const page = targets.find(t => t.type === 'page')
  const ws = new WebSocket(page.webSocketDebuggerUrl)
  let id = 0; const pending = new Map()
  const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })) })
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej })
  ws.onmessage = (e) => { const mm = JSON.parse(e.data); if (mm.id && pending.has(mm.id)) { pending.get(mm.id)(mm.result); pending.delete(mm.id) } }
  await send('Page.enable')
  await new Promise(r => setTimeout(r, 800))
  const r = await send('Page.printToPDF', { landscape: false, printBackground: true, preferCSSPageSize: false, paperWidth: 11.69, paperHeight: 8.27, scale: 0.97, marginTop: 0, marginBottom: 0, marginLeft: 0, marginRight: 0 })
  ws.close(); chrome.kill()
  if (!r || !r.data) throw new Error('printToPDF vide')
  writeFileSync(outPdf, Buffer.from(r.data, 'base64'))
  return r.data // base64
}

// ---- Orchestration -----------------------------------------------------------
const tmp = mkdtempSync(join(tmpdir(), 'sourcing-'))
let pdfB64 = ''
if (items.length) {
  try {
    const htmlPath = join(tmp, 'rapport.html')
    writeFileSync(htmlPath, buildPrintHtml())
    pdfB64 = await renderPdf(htmlPath, join(tmp, 'rapport.pdf'))
    console.log('PDF généré (' + Math.round(pdfB64.length / 1365) + ' Ko)')
  } catch (e) {
    console.error('⚠️ Échec génération PDF (' + e.message + ') → email HTML seul.')
  }
}
const best = items[0]
const subject = items.length
  ? `🛒 Sourcing ${dateLabel} — ${items.length} affaires (top : ${best.product})`
  : `🛒 Sourcing ${dateLabel} — aucune affaire rentable ce cycle`
const emailHtml = items.length ? buildEmailHtml()
  : `<div style="font-family:sans-serif"><h2>Rapport de sourcing — ${esc(dateLabel)}</h2><p>Aucune affaire n'a passé les seuils de rentabilité ce cycle (mieux vaut ne pas acheter que perdre).</p></div>`

const payload = { key: CRON_KEY, subject, filename: `Rapport-sourcing-Chap.ci-${(dateLabel || '').replace(/[^0-9A-Za-z]+/g, '-')}.pdf`, html: emailHtml, pdf_base64: pdfB64 }
if (MAIL_TO) payload.to = MAIL_TO
const payloadPath = join(tmp, 'payload.json')
writeFileSync(payloadPath, JSON.stringify(payload))

try {
  const out = execFileSync('curl', ['-sS', '--max-time', '90', '-X', 'POST', '-H', 'Content-Type: application/json', '--data', '@' + payloadPath, `${API}/cron/report-email`], { encoding: 'utf8' })
  console.log('Réponse serveur :', out)
} catch (e) {
  console.error('❌ Envoi échoué :', e.message, e.stderr ? String(e.stderr).slice(0, 400) : '')
  process.exit(1)
}
