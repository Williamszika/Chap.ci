// =============================================================================
//  BANC DU STOCK DES COMPTES PROFESSIONNELS (07/09/2026)
//
//      npm run banc:stock
//
//  Demande du Patron : « pour les comptes Pro, il doit y avoir une gérance de
//  stock et un signalement si les produits sont sous le minimum, 5 ».
//
//  Un serveur Chap.ci sur SQLite. Koffi tient Maison Koffi (approuvée pro par
//  SQL), Awa achète, Yao vend un objet en particulier. Le banc vérifie :
//    1. seul un professionnel approuvé pose un stock : le même champ envoyé
//       par Yao est ignoré, et la route de stock lui répond 403 ;
//    2. une commande CONCLUE retire une unité ; 6 → 5 franchit le minimum et
//       Koffi reçoit « Stock bas » — une seule fois, pas à chaque vente ;
//    3. annuler une commande rend l'unité ; la conclure de nouveau la reprend ;
//    4. arriver à zéro envoie « Rupture de stock », une fois ; réapprovisionner
//       au-dessus du minimum réarme l'alerte ;
//    5. l'annonce d'une boutique ne devient pas « vendue » à la première vente
//       (flux « deal » d'une conversation), celle d'un particulier si ;
//    6. GET /pro/stock trie ce qui manque en premier ; /pro/tableau compte ;
//    7. modifier l'annonce sans envoyer le champ garde le stock, l'envoyer
//       l'écrit.
//
//  ⚠️ UNE VÉRIFICATION DOIT POUVOIR ÉCHOUER : la deuxième vente sous le seuil
//  est là pour NE PAS sonner, et Yao pour NE PAS avoir de stock.
// =============================================================================
import { execFileSync, spawn } from 'node:child_process'
import { mkdirSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const racine = join(dirname(fileURLToPath(import.meta.url)), '..')
const D = join(tmpdir(), 'chapci-banc-stock')
rmSync(D, { recursive: true, force: true }); mkdirSync(join(D, 'uploads'), { recursive: true })
const DB = join(D, 'banc.sqlite')
const PORT = 8216
const API = `http://127.0.0.1:${PORT}`
let rouges = 0
const dire = (ok, texte, detail = '') => { if (!ok) rouges++; console.log(`  ${ok ? '✅' : '❌'} ${texte}${detail ? '  · ' + detail : ''}`) }

const serveur = spawn('php', ['-S', `127.0.0.1:${PORT}`, 'index.php'], {
  cwd: join(racine, 'server'), stdio: 'ignore', detached: true,
  env: { ...process.env, CHAPCI_DB_DRIVER: 'sqlite', CHAPCI_SQLITE: DB, CHAPCI_UPLOADS_DIR: join(D, 'uploads') },
})
serveur.unref()
const fini = () => { try { process.kill(serveur.pid) } catch { /* déjà parti */ } try { process.kill(-serveur.pid) } catch { /* déjà parti */ } }
process.on('exit', fini)
for (const s of ['SIGINT', 'SIGTERM']) process.on(s, () => { fini(); process.exit(130) })
for (let i = 0; i < 40; i++) {
  try { if ((await fetch(API + '/health')).ok) break } catch { /* pas encore */ }
  await new Promise((r) => setTimeout(r, 250))
}
const sql = (q) => execFileSync('php', ['-r', `$p = new PDO('sqlite:' . $argv[1]); $s = $p->query($argv[2]); $l = $s ? $s->fetch(PDO::FETCH_NUM) : false; echo $l === false ? '' : (string) $l[0];`, '--', DB, q], { encoding: 'utf8' }).trim()
const sqlEcrire = (q) => execFileSync('php', ['-r', `$p = new PDO('sqlite:' . $argv[1]); $p->exec($argv[2]);`, '--', DB, q])
const appel = async (chemin, { method = 'GET', body, jeton } = {}) => {
  const r = await fetch(API + chemin, {
    method, headers: { 'Content-Type': 'application/json', ...(jeton ? { Authorization: `Bearer ${jeton}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  })
  const t = await r.text(); let corps = null; try { corps = JSON.parse(t) } catch { corps = t }
  return { code: r.status, corps }
}
const inscrire = async (nom) => {
  const email = `${nom.toLowerCase()}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@banc.ci`
  const r = await appel('/auth/signup', { method: 'POST', body: { full_name: nom, email, password: 'motdepasse-du-banc-9', consent: true } })
  if (!r.corps?.token) { console.log('❌ inscription impossible :', JSON.stringify(r).slice(0, 200)); process.exit(1) }
  sqlEcrire(`UPDATE users SET email_verified_at = '2026-09-01T00:00:00Z' WHERE email = '${email}'`)
  return { jeton: r.corps.token, id: r.corps.user?.id ?? sql(`SELECT id FROM users WHERE email = '${email}'`), email }
}
const photo = (i) => {
  const f = join(D, `photo-${i}.jpg`)
  execFileSync('php', ['-r', `
    $im = imagecreatetruecolor(600, 450); mt_srand($argv[2]);
    imagefill($im, 0, 0, imagecolorallocate($im, mt_rand(60, 220), mt_rand(60, 220), mt_rand(60, 220)));
    for ($k = 0; $k < 20; $k++) { $c = imagecolorallocate($im, mt_rand(0, 255), mt_rand(0, 255), mt_rand(0, 255));
      imagefilledellipse($im, mt_rand(0, 600), mt_rand(0, 450), mt_rand(40, 200), mt_rand(40, 200), $c); }
    imagejpeg($im, $argv[1], 80);`, '--', f, String(i)])
  return 'data:image/jpeg;base64,' + readFileSync(f).toString('base64')
}
const photos = [1, 2, 3].map(photo)
const annonce = (qui, titre, extra = {}) => appel('/listings', { method: 'POST', jeton: qui.jeton, body: {
  title: titre, description: 'Produit de la boutique, disponible tout de suite, à voir à Cocody.', price: 12000, negotiable: false,
  categoryId: 'mode', subcategory: 'Chaussures', condition: 'neuf', images: photos,
  regionId: 'abidjan', cityId: 'abidjan-ville', commune: 'Cocody', sellerName: 'Vendeur', sellerPhone: '0700000001', delivery: false, ...extra,
} })
const lire = async (id) => (await appel(`/listings/${id}`)).corps
const notifsStock = async (qui) => { const r = await appel('/notifications', { jeton: qui.jeton }); return (Array.isArray(r.corps) ? r.corps : []).filter((n) => n.type === 'stock') }
// Une vente conclue : Awa contacte, commande, puis confirme la réception.
const vendre = async (acheteur, vendeur, listingId) => {
  const c = await appel('/conversations', { method: 'POST', jeton: acheteur.jeton, body: { listingId, sellerId: vendeur.id } })
  const o = await appel('/orders', { method: 'POST', jeton: acheteur.jeton, body: { sellerId: vendeur.id, items: [{ listingId }], conversationId: c.corps?.id } })
  const f = await appel(`/orders/${o.corps?.id}`, { method: 'PATCH', jeton: acheteur.jeton, body: { status: 'finalise' } })
  return { commande: o.corps?.id, code: f.code }
}

const koffi = await inscrire('Koffi'), awa = await inscrire('Awa'), yao = await inscrire('Yao')
sqlEcrire(`UPDATE users SET pro_status = 'approuve', pro_nom = 'Maison Koffi', pro_type = 'boutique', pro_secteur = 'Mode & Beauté', pro_decide_at = '2026-08-01T00:00:00Z' WHERE id = '${koffi.id}'`)

console.log('── Qui peut poser un stock ' + '─'.repeat(45))
let r = await annonce(koffi, 'Baskets blanches taille 42', { stock: 6, stockMin: 5 })
const bask = r.corps?.id
let l = await lire(bask)
dire(r.code === 200 && l?.stock === 6 && l?.stockMin === 5 && l?.stockEtat === 'ok', 'Maison Koffi publie avec 6 en stock, minimum 5 : état « ok »', JSON.stringify({ stock: l?.stock, stockMin: l?.stockMin, stockEtat: l?.stockEtat }))
r = await annonce(yao, 'Mes vieilles baskets', { stock: 6, stockMin: 5 })
const vieilles = r.corps?.id
l = await lire(vieilles)
dire(r.code === 200 && l?.stock === null && l?.stockEtat === 'aucun', 'Yao, particulier, envoie le même champ : ignoré, pas de stock', JSON.stringify({ stock: l?.stock, stockEtat: l?.stockEtat }))
r = await appel(`/listings/${vieilles}/stock`, { method: 'PUT', jeton: yao.jeton, body: { stock: 3 } })
dire(r.code === 403, 'la route de stock refuse un particulier : 403', `HTTP ${r.code}`)
r = await appel(`/listings/${bask}/stock`, { method: 'PUT', jeton: awa.jeton, body: { stock: 3 } })
dire(r.code === 403, 'et refuse quelqu’un d’autre sur l’annonce de Koffi : 403', `HTTP ${r.code}`)
r = await annonce(koffi, 'Sandales cuir', { stock: 2 })
const sand = r.corps?.id
l = await lire(sand)
dire(l?.stock === 2 && l?.stockMin === 5 && l?.stockEtat === 'bas', 'sans seuil envoyé, le minimum est 5 : 2 en stock, état « bas »', JSON.stringify({ stock: l?.stock, stockMin: l?.stockMin, stockEtat: l?.stockEtat }))
let n = await notifsStock(koffi)
dire(n.length === 0, 'publier à 2 ne sonne pas : c’est Koffi qui l’a écrit')

console.log('\n── Une vente retire une unité, le seuil sonne une fois ' + '─'.repeat(19))
let v = await vendre(awa, koffi, bask)
l = await lire(bask)
dire(v.code === 200 && l?.stock === 5 && l?.stockEtat === 'bas' && l?.sold === false, 'Awa achète et confirme : 6 → 5, état « bas », l’annonce n’est PAS vendue', JSON.stringify({ code: v.code, stock: l?.stock, stockEtat: l?.stockEtat, sold: l?.sold }))
n = await notifsStock(koffi)
dire(n.length === 1 && /Stock bas/.test(n[0].title) && /5/.test(n[0].body) && /Baskets/.test(n[0].body) && n[0].link === '#/compte?onglet=stock',
  'Koffi reçoit « Stock bas » : le produit, il en reste 5 (minimum 5), lien vers son stock', JSON.stringify(n[0] ?? null))
const v2 = await vendre(awa, koffi, bask)
l = await lire(bask)
n = await notifsStock(koffi)
dire(l?.stock === 4 && n.length === 1, 'deuxième vente : 5 → 4, et pas de nouvelle alerte', `stock ${l?.stock}, ${n.length} alerte(s)`)
r = await appel(`/orders/${v2.commande}`, { method: 'PATCH', jeton: koffi.jeton, body: { status: 'annule' } })
l = await lire(bask)
dire(r.code === 200 && l?.stock === 5, 'Koffi annule la deuxième commande : l’unité revient, 5', `HTTP ${r.code}, stock ${l?.stock}`)
r = await appel(`/orders/${v2.commande}`, { method: 'PATCH', jeton: awa.jeton, body: { status: 'finalise' } })
l = await lire(bask)
dire(r.code === 200 && l?.stock === 4, 'Awa la confirme de nouveau : 4 — une commande ne retire qu’une fois', `stock ${l?.stock}`)
r = await appel(`/orders/${v2.commande}`, { method: 'PATCH', jeton: awa.jeton, body: { status: 'finalise' } })
l = await lire(bask)
dire(l?.stock === 4, 'la confirmer deux fois ne retire pas deux fois', `stock ${l?.stock}`)

console.log('\n── La rupture ' + '─'.repeat(58))
r = await appel(`/listings/${bask}/stock`, { method: 'PUT', jeton: koffi.jeton, body: { stock: 1 } })
dire(r.code === 200 && r.corps?.stock === 1 && r.corps?.stockEtat === 'bas', 'Koffi écrit 1 dans sa console', JSON.stringify(r.corps))
n = await notifsStock(koffi)
dire(n.length === 1, 'écrire soi-même sous le seuil ne sonne pas')
v = await vendre(awa, koffi, bask)
l = await lire(bask)
n = await notifsStock(koffi)
dire(l?.stock === 0 && l?.stockEtat === 'rupture', 'la vente suivante : 0, « rupture »', JSON.stringify({ stock: l?.stock, stockEtat: l?.stockEtat }))
dire(n.length === 2 && /Rupture/.test(n[0].title ?? '') || /Rupture/.test(n[1]?.title ?? ''), 'Koffi reçoit « Rupture de stock »', JSON.stringify(n.map((x) => x.title)))
v = await vendre(awa, koffi, bask)
l = await lire(bask)
n = await notifsStock(koffi)
dire(l?.stock === 0 && n.length === 2, 'à zéro, une vente de plus ne descend pas sous zéro et ne sonne pas', `stock ${l?.stock}, ${n.length} alertes`)
r = await appel(`/listings/${bask}/stock`, { method: 'PUT', jeton: koffi.jeton, body: { stock: 20 } })
l = await lire(bask)
dire(r.corps?.stockEtat === 'ok' && l?.stockEtat === 'ok', 'Koffi réapprovisionne à 20 : « ok », l’alerte est réarmée', JSON.stringify(r.corps))
for (let i = 0; i < 15; i++) await vendre(awa, koffi, bask)
l = await lire(bask)
n = await notifsStock(koffi)
dire(l?.stock === 5 && n.length === 3 && /Stock bas/.test(n[0].title), 'quinze ventes plus tard : 5, et « Stock bas » sonne de nouveau — une seule fois', `stock ${l?.stock}, ${n.length} alertes`)

console.log('\n── Le flux « deal » d’une conversation ' + '─'.repeat(33))
let c = await appel('/conversations', { method: 'POST', jeton: awa.jeton, body: { listingId: sand, sellerId: koffi.id } })
r = await appel(`/conversations/${c.corps?.id}/deal`, { method: 'POST', jeton: awa.jeton, body: { action: 'received' } })
l = await lire(sand)
dire(r.code === 200 && l?.stock === 1 && l?.sold === false, 'Awa dit « reçu » sur les sandales : 2 → 1, l’annonce reste en vente', JSON.stringify({ stock: l?.stock, sold: l?.sold }))
r = await appel(`/conversations/${c.corps?.id}/deal`, { method: 'POST', jeton: koffi.jeton, body: { action: 'sold' } })
l = await lire(sand)
dire(r.code === 200 && l?.stock === 1, 'Koffi confirme « vendu » sur la même conversation : toujours 1, pas deux fois', `stock ${l?.stock}`)
c = await appel('/conversations', { method: 'POST', jeton: awa.jeton, body: { listingId: vieilles, sellerId: yao.id } })
r = await appel(`/conversations/${c.corps?.id}/deal`, { method: 'POST', jeton: awa.jeton, body: { action: 'received' } })
l = await lire(vieilles)
dire(r.code === 200 && l?.sold === true, 'sur l’objet de Yao, particulier : l’annonce est vendue, comme avant', JSON.stringify({ sold: l?.sold, stock: l?.stock }))

console.log('\n── La console et le tableau ' + '─'.repeat(44))
r = await appel('/pro/stock', { jeton: yao.jeton })
dire(r.code === 403, '/pro/stock est réservé aux professionnels : 403 pour Yao', `HTTP ${r.code}`)
await annonce(koffi, 'Casquette', {}) // sans stock
r = await appel('/pro/stock', { jeton: koffi.jeton })
const S = r.corps ?? {}
const ordre = (S.annonces ?? []).map((a) => `${a.title.split(' ')[0]}:${a.stockEtat}`)
dire(r.code === 200 && S.suivies === 2 && S.bas === 2 && S.rupture === 0 && S.minDefaut === 5, 'Koffi : 2 produits suivis, 2 sous le minimum, 0 en rupture, minimum par défaut 5', JSON.stringify({ suivies: S.suivies, bas: S.bas, rupture: S.rupture, minDefaut: S.minDefaut }))
dire(ordre[0] === 'Sandales:bas' && ordre[1] === 'Baskets:bas' && ordre[2] === 'Casquette:aucun', 'ce qui manque en premier (1 avant 5), le produit sans suivi en dernier', ordre.join(', '))
r = await appel('/pro/tableau?periode=7', { jeton: koffi.jeton })
dire(r.code === 200 && r.corps?.pro?.stockSuivi === 2 && r.corps?.pro?.stockBas === 2 && r.corps?.pro?.stockRupture === 0, 'le tableau de bord porte les mêmes compteurs', JSON.stringify({ stockSuivi: r.corps?.pro?.stockSuivi, stockBas: r.corps?.pro?.stockBas, stockRupture: r.corps?.pro?.stockRupture }))
r = await appel(`/listings/${sand}/stock`, { method: 'PUT', jeton: koffi.jeton, body: { stockMin: 0 } })
l = await lire(sand)
dire(r.code === 200 && l?.stockMin === 0 && l?.stockEtat === 'ok', 'baisser le minimum des sandales à 0 : 1 en stock devient « ok »', JSON.stringify({ stockMin: l?.stockMin, stockEtat: l?.stockEtat }))
r = await appel(`/listings/${sand}/stock`, { method: 'PUT', jeton: koffi.jeton, body: { stock: null } })
l = await lire(sand)
dire(r.code === 200 && l?.stock === null && l?.stockEtat === 'aucun', '« ne plus suivre » : stock null, état « aucun »', JSON.stringify({ stock: l?.stock, stockEtat: l?.stockEtat }))

console.log('\n── Modifier l’annonce ' + '─'.repeat(50))
const base = await lire(bask)
const corps = { title: base.title, description: base.description, price: 13000, negotiable: false, categoryId: base.categoryId, subcategory: base.subcategory, condition: 'neuf', images: base.images, regionId: base.regionId, cityId: base.cityId, commune: base.commune, sellerName: 'Vendeur', sellerPhone: '0700000001', delivery: false }
r = await appel(`/listings/${bask}`, { method: 'PUT', jeton: koffi.jeton, body: corps })
l = await lire(bask)
dire(r.code === 200 && l?.price === 13000 && l?.stock === 5, 'modifier le prix sans envoyer le stock : le stock reste à 5', `HTTP ${r.code}, stock ${l?.stock}`)
r = await appel(`/listings/${bask}`, { method: 'PUT', jeton: koffi.jeton, body: { ...corps, stock: 30, stockMin: 8 } })
l = await lire(bask)
dire(r.code === 200 && l?.stock === 30 && l?.stockMin === 8 && l?.stockEtat === 'ok', 'l’envoyer l’écrit : 30, minimum 8', JSON.stringify({ stock: l?.stock, stockMin: l?.stockMin, stockEtat: l?.stockEtat }))

console.log(`\n${rouges === 0 ? '✅ Tout est vert' : `❌ ${rouges} vérification${rouges > 1 ? 's' : ''} en échec`}`)
process.exit(rouges === 0 ? 0 : 1)
