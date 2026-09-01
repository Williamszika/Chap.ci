// =============================================================================
//  BANC DU CONTRÔLE DES PHOTOS
//
//  Ce qui n'a été regardé par personne arrive-t-il vraiment sous les yeux d'un
//  humain ? Et le système s'abstient-il bien de refuser tout seul ?
//
//      # 1. un serveur d'essai sur SQLite
//      S=/tmp/banc && mkdir -p $S/uploads && cd server
//      CHAPCI_DB_DRIVER=sqlite CHAPCI_SQLITE=$S/banc.sqlite \
//        CHAPCI_UPLOADS_DIR=$S/uploads php -S 127.0.0.1:8199 index.php &
//      # 2. le banc
//      CHAPCI_SQLITE=$S/banc.sqlite node scripts/banc-photos.mjs
//
//  ⚠️ POURQUOI CE BANC EXISTE. Le 01/09/2026, le bureau juridique a montré que
//  la politique de confidentialité promettait une analyse des photos
//  « entièrement sur votre appareil ». C'est vrai sur le site — et FAUX dans
//  l'application, qui envoie les photos sans qu'aucun filtre ne tourne nulle
//  part. Le serveur, lui, n'avait jamais rien regardé.
//
//  Le banc joue les DEUX clients sur le vrai serveur :
//   · le site, qui déclare avoir analysé ses photos ;
//   · l'application, qui ne déclare rien.
//  et vérifie que le second remonte dans la file de relecture.
//
//  ⚠️ IL VÉRIFIE AUSSI CE QUE LE SYSTÈME NE DOIT PAS FAIRE. Une photo qui
//  ressemble à une photo retirée doit être SIGNALÉE, jamais refusée : la mesure
//  des empreintes (`banc-empreintes.php`) a montré que deux affiches d'un même
//  vendeur sont parfois plus proches que la même photo recadrée. Un banc qui ne
//  vérifierait que les refus laisserait passer la pire régression — celle qui
//  condamne un vendeur honnête.
// =============================================================================

import { execFileSync } from 'node:child_process'
import zlib from 'node:zlib'

const API = process.env.CHAPCI_API ?? 'http://127.0.0.1:8199'
const DB = process.env.CHAPCI_SQLITE ?? ''
let rouges = 0
const dire = (ok, texte, detail = '') => {
  if (!ok) rouges++
  console.log(`  ${ok ? '✅' : '❌'} ${texte}${detail ? '  · ' + detail : ''}`)
}

async function appel(chemin, { method = 'GET', body, jeton, entetes } = {}) {
  const r = await fetch(API + chemin, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(jeton ? { Authorization: 'Bearer ' + jeton } : {}),
      ...(entetes ?? {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const t = await r.text()
  try { return { code: r.status, corps: JSON.parse(t) } } catch { return { code: r.status, corps: t.slice(0, 400) } }
}

/** Une vraie image PNG, décodable par GD : un damier dont on choisit le motif. */
function photo(graine) {
  const t = 24
  const lignes = []
  for (let y = 0; y < t; y++) {
    const px = [0]
    for (let x = 0; x < t; x++) {
      const clair = (Math.floor(x / 3) + Math.floor(y / 3) * graine) % 2 === 0
      px.push(clair ? 235 : 30, clair ? 215 : 45, clair ? 190 : 65)
    }
    lignes.push(Buffer.from(px))
  }
  const morceau = (type, data) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length)
    const corps = Buffer.concat([Buffer.from(type), data])
    const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(corps) >>> 0)
    return Buffer.concat([len, corps, crc])
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(t, 0); ihdr.writeUInt32BE(t, 4); ihdr[8] = 8; ihdr[9] = 2
  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    morceau('IHDR', ihdr),
    morceau('IDAT', zlib.deflateSync(Buffer.concat(lignes))),
    morceau('IEND', Buffer.alloc(0)),
  ])
  return 'data:image/png;base64,' + png.toString('base64')
}
let tableCrc = null
function crc32(buf) {
  if (!tableCrc) {
    tableCrc = new Int32Array(256)
    for (let n = 0; n < 256; n++) {
      let c = n
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
      tableCrc[n] = c
    }
  }
  let c = -1
  for (const b of buf) c = tableCrc[(c ^ b) & 0xff] ^ (c >>> 8)
  return c ^ -1
}

// On interroge la base par PHP et non par la commande `sqlite3` : celle-ci
// n'est pas installée partout, et PHP l'est forcément — c'est lui qui fait
// tourner Chap.ci. Un banc qui exige un outil de plus est un banc qu'on ne
// lance pas.
const sql = (requete) => {
  if (!DB) throw new Error('CHAPCI_SQLITE non défini — le banc doit pouvoir lire la base')
  const code = `$p = new PDO('sqlite:' . $argv[1]);
    $st = $p->query($argv[2]);
    if ($st === false) { fwrite(STDERR, 'requête refusée'); exit(1); }
    $l = $st->fetch(PDO::FETCH_NUM);
    echo $l === false ? '' : (string) $l[0];`
  return execFileSync('php', ['-r', code, '--', DB, requete], { encoding: 'utf8' }).trim()
}
/** Écriture (INSERT/UPDATE) : pas de résultat à lire. */
const sqlEcrire = (requete) => {
  const code = `$p = new PDO('sqlite:' . $argv[1]); $p->exec($argv[2]);`
  execFileSync('php', ['-r', code, '--', DB, requete], { encoding: 'utf8' })
}

// ── Mise en place ──────────────────────────────────────────────────────────
const sante = await appel('/health')
if (sante.code !== 200) { console.log('❌ Pas de serveur sur ' + API); process.exit(1) }

const email = `vendeur-photos-${Date.now()}@banc.ci`
const inscription = await appel('/auth/signup', {
  method: 'POST',
  // `full_name` et `consent` : ce que la route exige réellement. Le banc doit
  // parler au serveur tel qu'il est, pas tel qu'on l'imagine.
  body: { full_name: 'Awa Banc', email, password: 'motdepasse-du-banc-9', consent: true },
})
const jeton = inscription.corps?.token
if (!jeton) { console.log('❌ Inscription impossible :', JSON.stringify(inscription).slice(0, 300)); process.exit(1) }
// Le banc confirme l'adresse lui-même : on teste les photos, pas le code e-mail.
sqlEcrire(`UPDATE users SET email_verified_at = '2026-09-01T00:00:00Z' WHERE email = '${email}'`)

const annonce = (photos, extra = {}) => ({
  title: 'Table basse en bois', description: 'Bon état, à récupérer sur place.',
  price: 45000, categoryId: 'maison', subcategory: 'meubles', condition: 'occasion',
  images: photos, regionId: 'abidjan', cityId: 'abidjan', commune: 'Cocody',
  sellerName: 'Awa Banc', sellerPhone: '0700000000', ...extra,
})
const TROIS = [photo(1), photo(3), photo(5)]

// ── 1. Le site : il déclare avoir analysé ──────────────────────────────────
console.log('── Le SITE publie, en déclarant son analyse ' + '─'.repeat(28))
const duSite = await appel('/listings', {
  method: 'POST', jeton, body: annonce(TROIS, { photosAnalysees: true }),
})
dire(duSite.code === 200, 'annonce du site publiée', 'HTTP ' + duSite.code)
const idSite = duSite.corps?.id
if (idSite) {
  const v = sql(`SELECT photos_verifiees FROM listings WHERE id = '${idSite}'`)
  dire(v === '1', 'elle est notée « photos analysées »', 'photos_verifiees = ' + v)
}

// ── 2. L'application : elle ne déclare rien ────────────────────────────────
console.log('\n── L’APPLICATION publie, sans rien déclarer ' + '─'.repeat(28))
const deLApp = await appel('/listings', { method: 'POST', jeton, body: annonce(TROIS) })
dire(deLApp.code === 200, 'annonce de l’application publiée', 'HTTP ' + deLApp.code)
dire(deLApp.code === 200, 'elle N’EST PAS refusée — publier reste possible sans filtre')
const idApp = deLApp.corps?.id
if (idApp) {
  const v = sql(`SELECT COALESCE(photos_verifiees,0) FROM listings WHERE id = '${idApp}'`)
  dire(v === '0', 'elle est notée « personne n’a regardé ces photos »', 'photos_verifiees = ' + v)
}

// ── 3. Une photo retirée par un humain, puis republiée ─────────────────────
console.log('\n── Une photo retirée, puis reproposée ' + '─'.repeat(33))
if (idApp) {
  // On simule la décision d'un humain : les photos de cette annonce sont
  // retenues. (La route `mod/image-retenir` exige un jeton de service ; le banc
  // agit ici directement sur la base, ce que fait la route.)
  const fichiers = sql(`SELECT images FROM listings WHERE id = '${idApp}'`)
  dire(fichiers.includes('/uploads/'), 'les photos ont bien été enregistrées', fichiers.slice(0, 60) + '…')
  // On demande au serveur l'empreinte via sa propre fonction, par la route.
  const retenu = await appel('/mod/image-retenir', {
    method: 'POST', body: { listingId: idApp, raison: 'essai du banc' },
  })
  dire(retenu.code === 401 || retenu.code === 403,
    'la route de rétention exige un jeton de service', 'HTTP ' + retenu.code)
}

// ── 4. Le contrôle ne refuse JAMAIS sur une ressemblance ───────────────────
// On met une empreinte bidon dans la liste, à distance nulle d'une photo qu'on
// republie ensuite : l'annonce doit passer, et porter un signal.
console.log('\n── Une ressemblance SIGNALE, elle ne refuse pas ' + '─'.repeat(24))
{
  const emp = execFileSync('php', ['-r', `
    $src = file_get_contents('/home/user/Chap.ci/server/index.php');
    $i = strpos($src, 'function image_empreinte('); $j = strpos($src, '{', $i); $p = 0;
    for ($k = $j; $k < strlen($src); $k++) { if ($src[$k]==='{') $p++; elseif ($src[$k]==='}') { $p--; if(!$p){ eval(substr($src,$i,$k-$i+1)); break; } } }
    $uri = trim(file_get_contents('php://stdin'));
    echo image_empreinte(base64_decode(substr($uri, strpos($uri, ',') + 1)));
  `], { input: TROIS[0], encoding: 'utf8' }).trim()
  dire(/^[0-9a-f]{16}$/.test(emp), 'le serveur sait calculer une empreinte', emp)
  sqlEcrire(`INSERT OR REPLACE INTO images_bloquees (empreinte,raison,listing_id,created_at)
       VALUES ('${emp}','photo retirée pour l’essai','x','2026-09-01T00:00:00Z')`)

  const republie = await appel('/listings', { method: 'POST', jeton, body: annonce(TROIS) })
  dire(republie.code === 200,
    'l’annonce reprenant cette photo N’EST PAS refusée', 'HTTP ' + republie.code)
  const idR = republie.corps?.id
  if (idR) {
    const sig = sql(`SELECT COALESCE(photo_signal,'') FROM listings WHERE id = '${idR}'`)
    dire(sig.includes('ressemble'), 'mais elle porte un signal pour le relecteur', sig.slice(0, 70))
  }
}

// ── 5. Contre-épreuve : le banc sait-il dire non ? ─────────────────────────
console.log('\n── Contre-épreuve ' + '─'.repeat(53))
{
  // Une annonce SANS photo ne doit jamais être notée « analysée ».
  const sansPhoto = sql(
    `SELECT COUNT(*) FROM listings WHERE photos_verifiees = 1 AND (images IS NULL OR images = '[]')`)
  dire(sansPhoto === '0', 'aucune annonce sans photo n’est notée « analysée »', sansPhoto + ' trouvée(s)')
  // Et un mensonge du client ne DOIT PAS être pris pour une sécurité : on
  // vérifie que le drapeau est bien stocké tel quel, pour que le relecteur
  // sache que c'est une déclaration, pas une preuve.
  const menteur = await appel('/listings', {
    method: 'POST', jeton, body: annonce(TROIS, { photosAnalysees: true }),
  })
  const idM = menteur.corps?.id
  if (idM) {
    const v = sql(`SELECT photos_verifiees FROM listings WHERE id = '${idM}'`)
    dire(v === '1', 'le drapeau du client est noté tel quel (déclaration, pas preuve)', 'stocké = ' + v)
  }
}

console.log()
console.log(rouges ? `❌ ${rouges} contrôle(s) au rouge` : '✅ tous les contrôles au vert')
process.exit(rouges ? 1 : 0)
