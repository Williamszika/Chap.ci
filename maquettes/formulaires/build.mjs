// build.mjs <prefixe> <Titre> <fichier-sortie>
// Assemble  <prefixe>-data.js + <prefixe>-plan.js + le moteur commun  →  apercu-X.html
import fs from 'fs'
const [pfx, titre, out] = process.argv.slice(2)
const R = f => fs.readFileSync(f, 'utf8')

const head = R('mode-head.html')
  .replace('<title>Chap.ci — Mode &amp; Beauté : six formulaires</title>', `<title>Chap.ci — ${titre}</title>`)
  .replace('<div class="brand__t">Mode &amp; Beauté — six formulaires</div>', `<div class="brand__t">${titre}</div>`)

// moteur : identique partout, seule la page « ce qui change » diffère
let app = R('mode-app.js')
const i = app.indexOf('  /* -------------------- ce qui change -------------------- */')
const j = app.indexOf('  /* -------------------- liaisons simples -------------------- */')
app = app.slice(0, i) + R(`${pfx}-plan.js`) + '\n' + app.slice(j)
app = app.replace("if (cur === 't-plan') planMode()", "if (cur === 't-plan') planCat()")
if (app.includes('planMode')) throw new Error('reste planMode')

const data = R(`${pfx}-data.js`)
new Function(data); new Function(app)          // contrôle de syntaxe

const form = head + '<script>\n' + data + '</scr' + 'ipt>\n<script>\n' + app + '</scr' + 'ipt>\n'
fs.writeFileSync(`${pfx}-form.html`, form)
fs.writeFileSync(out, form.replace('__FONTS__', R('fonts.css')))
console.log(`${out} — ${fs.statSync(out).size} octets, syntaxe OK`)
