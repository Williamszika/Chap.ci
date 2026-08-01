// verif.mjs <fichier.html> — parcourt CHAQUE sous-catégorie, coche les invariants
import { chromium } from '/home/user/Chap.ci/node_modules/playwright/index.mjs'
const file = process.argv[2]
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' })
const errs = []
let ko = 0
for (const [w, h, tag] of [[412, 900, 'mobile'], [1280, 900, 'bureau']]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 })
  const p = await ctx.newPage()
  p.on('pageerror', e => errs.push(tag + ' pageerror: ' + e.message))
  p.on('console', m => { if (m.type() === 'error') errs.push(tag + ' console: ' + m.text()) })
  await p.goto('file://' + process.cwd() + '/' + file); await p.waitForTimeout(500)
  const sous = await p.locator('#cSous .chip').allTextContents()
  if (tag === 'mobile') {
    console.log('sous-catégories (' + sous.length + ') : ' + sous.join(' | '))
    for (const s of sous) {
      await p.locator('#cSous .chip', { hasText: s }).first().click(); await p.waitForTimeout(320)
      // clique la 1re option de chaque champ à puces visible, pour ouvrir les champs conditionnels
      for (let tour = 0; tour < 3; tour++) {
        const champs = await p.locator('#champs .field:not(.hidden)').all()
        for (const c of champs) {
          const ch = c.locator('.chips .chip:not(.chip--plus)').first()
          if (await ch.count() && await ch.getAttribute('aria-pressed') === 'false') { await ch.click(); await p.waitForTimeout(60) }
        }
      }
      await p.waitForTimeout(200)
      const oblig = await p.locator('#champs .must').count()
      const vis = await p.locator('#champs .field:not(.hidden), #champs .toggle').count()
      const bandeau = await p.locator('#pvBand').evaluate(e => e.classList.contains('hidden')) ? '—'
        : (await p.locator('#pvBand').getAttribute('class')).replace('bandeau bandeau--', '')
      const coul = await p.locator('#fCoul').evaluate(e => e.classList.contains('hidden')) ? '—'
        : await p.locator('#cCoul .chip').count() + ' coul.'
      const titre = await p.inputValue('#iTitre')
      const bad = await p.locator('.barre').getAttribute('data-bad')
      if (!titre) { ko++; console.log('   ⚠ titre vide sur ' + s) }
      console.log(`  ${s.padEnd(26)} ${String(vis).padStart(2)} champs · ${String(oblig).padStart(2)} oblig · bandeau ${bandeau.padEnd(5)} · ${coul.padEnd(9)} · ${bad === '1' ? 'BLOQUÉ' : 'ok'} · « ${titre.slice(0, 46)} »`)
    }
    await p.locator('#t-plan').click(); await p.waitForTimeout(500)
    console.log('plan : ' + (await p.locator('#plan h2').count()) + ' sections, ' + (await p.locator('#plan tbody tr').count()) + ' lignes de tableau')
  }
  const over = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  if (over > 0) { ko++; console.log('⚠ DÉBORDEMENT ' + tag + ' : ' + over) }
  await ctx.close()
}
console.log(errs.length ? 'ERREURS JS:\n' + errs.slice(0, 6).join('\n') : 'aucune erreur JS' + (ko ? ' · ' + ko + ' avertissement(s)' : ' · tout est vert'))
await b.close()
