<?php
// =============================================================================
//  Chap.ci — Pages « crawlables » pour le SEO et les aperçus de partage.
//  Sert /annonce/{id}, /vendeur/{id} et /sitemap.xml avec de vraies balises
//  meta (Open Graph / Twitter) : Google peut indexer, WhatsApp/Facebook
//  affichent un aperçu. Les humains sont redirigés vers l'app (routage #/).
// =============================================================================

$cfg  = require __DIR__ . '/api/config.php';
$site = rtrim($cfg['site_url'] ?? 'https://chap.ci', '/');
$upub = rtrim($cfg['uploads_path'] ?? '/uploads', '/');

// ⚠️ DÉCLARÉE ICI, ET PAS PLUS BAS : en PHP, un `const` de fichier n'est pas
//    remonté en haut comme une fonction — il s'exécute à sa ligne. Placé après
//    le routage, il donnait « Undefined constant » et une erreur 500 sur CHAQUE
//    page /vendre/. Trouvé par `npm run banc:vendre` avant livraison.
/**
 * SEUIL D'INDEXATION D'UNE PAGE VILLE (16/09/2026).
 *
 * En dessous de ce nombre d'annonces, une page `/vendre/{cat}/{ville}` n'a rien
 * qui lui soit propre : il ne reste que le texte d'accueil, identique aux
 * 21 autres villes de la même catégorie, à un nom de ville près. C'est du
 * contenu dupliqué, et Google le fait payer AU DOMAINE ENTIER, pas seulement à
 * ces pages-là. Elles sortent donc du sitemap ET passent en `noindex`.
 *
 * Trois, et pas un : avec une ou deux annonces, la page reste à 95 % du texte
 * commun. À trois vignettes — titres, prix, photos —, elle porte enfin quelque
 * chose que la page voisine n'a pas.
 *
 * ⚠️ Les pages CATÉGORIE (sans ville) ne sont pas concernées : il y en a seize,
 * une par catégorie, et elles diffèrent entre elles par construction. Le problème
 * n'a jamais été leur nombre, mais les 22 copies par ville de chacune.
 */
const SEO_MIN_ANNONCES_VILLE = 3;

// --- Connexion à la base (mysql / pgsql / sqlite) ----------------------------
function seo_pdo(array $cfg): ?PDO {
  $db = $cfg['db'] ?? [];
  $driver = $db['driver'] ?? 'mysql';
  try {
    if ($driver === 'sqlite') {
      $pdo = new PDO('sqlite:' . ($db['sqlite_path'] ?? ''));
    } elseif ($driver === 'pgsql') {
      $dsn = "pgsql:host={$db['host']};dbname={$db['name']}";
      if (!empty($db['port'])) $dsn .= ";port={$db['port']}";
      $pdo = new PDO($dsn, $db['user'] ?? '', $db['pass'] ?? '');
    } else {
      $dsn = "mysql:host={$db['host']};dbname={$db['name']};charset=utf8mb4";
      if (!empty($db['port'])) $dsn .= ";port={$db['port']}";
      $pdo = new PDO($dsn, $db['user'] ?? '', $db['pass'] ?? '');
    }
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    return $pdo;
  } catch (Throwable $e) {
    return null;
  }
}

function h(string $s): string { return htmlspecialchars($s, ENT_QUOTES, 'UTF-8'); }

/**
 * LE PRIX RÉELLEMENT AFFICHÉ — promotion comprise, EXPIRATION COMPRISE.
 *
 * Trouvé par 📣 Le Crieur le 07/09/2026 : ce fichier lisait partout
 * `promo_price ?: price` sans jamais regarder `promo_until`. L'annonce « Un Lit
 * capitonné » annonçait donc 585 000 FCFA à Google et à WhatsApp quinze jours
 * après la fin de sa promotion, quand le site montrait bien 650 000 FCFA à un
 * visiteur. Un prix faux sur un partage, c'est l'acheteur qui arrive avec un
 * chiffre en tête et repart fâché — et un rich result que Google peut refuser.
 *
 * Même garde que `listing_prix_effectif()` dans api/index.php, et que
 * `src/lib/promo.ts` sur le site : une promotion SANS date de fin reste active,
 * une promotion datée ne vaut que jusqu'à sa date. Les dates sont des chaînes
 * ISO en UTC (« 2026-09-07T10:00:00Z ») : la comparaison de texte suffit.
 */
function seo_prix(array $l): int {
  $promo = (int) ($l['promo_price'] ?? 0);
  $fin   = (string) ($l['promo_until'] ?? '');
  if ($promo > 0 && ($fin === '' || $fin > gmdate('Y-m-d\TH:i:s\Z'))) return $promo;
  return (int) ($l['price'] ?? 0);
}
function abs_img(string $img, string $site, string $upub): string {
  if ($img === '') return '';
  if (strncmp($img, 'http', 4) === 0) return $img;
  if ($img[0] === '/') return $site . $img;
  return $site . $upub . '/' . $img;
}
// Clé IndexNow : lue au même endroit que le serveur (api/index.php la génère une
// seule fois dans le dossier data protégé ; on la ressert ici pour la vérification).
function seo_indexnow_key(array $cfg): string {
  $configured = trim((string) (getenv('CHAPCI_INDEXNOW_KEY') ?: ($cfg['indexnow_key'] ?? '')));
  if (strlen($configured) >= 8 && ctype_alnum($configured)) return $configured;
  $sqlite = (string) ($cfg['db']['sqlite_path'] ?? $cfg['sqlite_path'] ?? '');
  $dir  = $sqlite !== '' ? dirname($sqlite) : (__DIR__ . '/api/data');
  $file = $dir . '/.indexnow_key';
  return @is_readable($file) ? trim((string) @file_get_contents($file)) : '';
}

$uri  = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?? '/';
$pdo  = seo_pdo($cfg);
$ua   = $_SERVER['HTTP_USER_AGENT'] ?? '';
$isBot = (bool) preg_match('/bot|crawl|spider|facebookexternalhit|whatsapp|twitter|slurp|bingpreview|embedly|telegram|discord|linkedin|pinterest/i', $ua);

// ---------------------------------------------- vérification IndexNow /{clé}.txt --
// IndexNow demande un fichier https://chap.ci/{clé}.txt contenant la clé, pour
// prouver qu'on est bien propriétaire du site avant d'accepter nos pings.
if (preg_match('#^/([A-Za-z0-9]{8,64})\.txt$#', $uri, $mk)) {
  $key = seo_indexnow_key($cfg);
  if ($key !== '' && hash_equals($key, $mk[1])) {
    header('Content-Type: text/plain; charset=utf-8');
    echo $key;
    exit;
  }
  http_response_code(404);
  exit;
}

// ------------------------------------ /.well-known/… : l'application, déclarée --
// Les liens universels (iOS) et App Links (Android) : pour qu'une adresse
// https://chap.ci/annonce/… ouvre l'APPLICATION quand elle est installée, le
// téléphone vient lire ici que chap.ci reconnaît cette application. Deux
// identifiants, que seul le Patron possède, se posent dans api/config.php :
//   'apple_team_id'  => 'ABCDE12345'   (Apple Developer → Membership → Team ID)
//   'android_sha256' => 'AA:BB:…'      (Play Console → Intégrité de l'app →
//                                       empreinte SHA-256 de la clé de signature)
// Tant qu'ils manquent, ces adresses répondent 404 et rien ne change : le lien
// ouvre le site. Les deux règles de routage vont dans le .htaccess racine
// (web/htaccess-root). Voir store/LIENS-UNIVERSELS.md.
if ($uri === '/.well-known/apple-app-site-association') {
  $team = strtoupper(trim((string) ($cfg['apple_team_id'] ?? '')));
  if (!preg_match('/^[A-Z0-9]{10}$/', $team)) { http_response_code(404); exit; }
  $appId = $team . '.ci.chap.app';
  // Les deux écritures : « components/appIDs » (iOS 13+) et « paths/appID »
  // (plus ancien). Apple lit celle qu'il connaît, ignore l'autre.
  $aasa = ['applinks' => ['apps' => [], 'details' => [[
    'appID' => $appId,
    'appIDs' => [$appId],
    'paths' => ['/annonce/*', '/vendeur/*'],
    'components' => [['/' => '/annonce/*'], ['/' => '/vendeur/*']],
  ]]]];
  header('Content-Type: application/json');
  header('Cache-Control: public, max-age=3600');
  echo json_encode($aasa, JSON_UNESCAPED_SLASHES);
  exit;
}
if ($uri === '/.well-known/assetlinks.json') {
  $brut = $cfg['android_sha256'] ?? '';
  $liste = is_array($brut) ? $brut : preg_split('/[\s,;]+/', (string) $brut);
  $empreintes = [];
  foreach ($liste as $e) {
    $e = strtoupper(trim((string) $e));
    // Une empreinte SHA-256 : 32 octets, en hexadécimal séparé par « : ».
    if (preg_match('/^([0-9A-F]{2}:){31}[0-9A-F]{2}$/', $e)) $empreintes[] = $e;
  }
  if (!$empreintes) { http_response_code(404); exit; }
  header('Content-Type: application/json');
  header('Cache-Control: public, max-age=3600');
  echo json_encode([[
    'relation' => ['delegate_permission/common.handle_all_urls'],
    'target' => ['namespace' => 'android_app', 'package_name' => 'ci.chap.app',
                 'sha256_cert_fingerprints' => $empreintes],
  ]], JSON_UNESCAPED_SLASHES);
  exit;
}

// --------------------------------------------------------------- sitemap.xml --
if (preg_match('#/sitemap\.xml$#', $uri)) {
  header('Content-Type: application/xml; charset=utf-8');
  echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
  echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";
  // Page d'accueil (les vues internes utilisent #/, non indexables : on les omet).
  echo '  <url><loc>' . h($site . '/') . "</loc><changefreq>daily</changefreq><priority>1.0</priority></url>\n";
  /* « À propos » — la SEULE vue interne qui ait une vraie adresse (19/09/2026).
   * Les autres (#/conditions, #/confidentialite…) restent derrière le `#` et
   * n'ont rien à proposer ici. Celle-ci est servie par render_about_page() et
   * porte les fondateurs en JSON-LD : sans cette ligne, la page existerait
   * sans que personne ne sache l'aller chercher. */
  echo '  <url><loc>' . h($site . '/a-propos') . "</loc><changefreq>monthly</changefreq><priority>0.8</priority></url>\n";
  // Pages d'atterrissage SEO « Vendez votre {catégorie} à {ville} » (capte les vendeurs).
  //
  // ⚠️ LE SITEMAP NE PROPOSE PLUS QUE LES PAGES VILLE QUI ONT DU STOCK (16/09/2026).
  //
  //    Avant ce jour, il annonçait 16 catégories × (1 + 22 villes) = 368 pages,
  //    SANS AUCUNE CONDITION. Pour 46 annonces. Les 22 pages ville d'une même
  //    catégorie affichaient alors les mêmes annonces — la requête ne filtrait
  //    pas sur la commune —, si bien qu'elles ne différaient que par un nom de
  //    ville. 368 pages quasi jumelles, c'est du contenu dupliqué, et Google le
  //    fait payer au domaine entier.
  //
  //    Les seize pages CATÉGORIE restent toutes proposées : elles diffèrent
  //    entre elles par construction, et ce n'est pas leur nombre qui posait
  //    problème. Seules les 352 copies par ville sont filtrées.
  $stock = chapci_seo_stock($pdo);
  $villes = chapci_seo_cities();
  foreach (chapci_seo_cats() as $cSlug => $c) {
    echo '  <url><loc>' . h($site . '/vendre/' . $cSlug) . "</loc><changefreq>weekly</changefreq><priority>0.7</priority></url>\n";
    foreach ($villes as $vSlug => $vName) {
      if (chapci_seo_compte($stock, $cSlug, $vSlug, $villes) < SEO_MIN_ANNONCES_VILLE) continue;
      echo '  <url><loc>' . h($site . '/vendre/' . $cSlug . '/' . $vSlug) . "</loc><changefreq>weekly</changefreq><priority>0.6</priority></url>\n";
    }
  }
  if ($pdo) {
    /* ⚠️ `sold` AJOUTÉ LE 17/09/2026 — le fichier se contredisait lui-même.
     *
     * Cette boucle ne filtrait que `hidden`. Or `chapci_seo_stock()` et la page
     * `/vendre/` (plus bas) excluent AUSSI les annonces vendues. Le même
     * sitemap comptait donc une annonce vendue quand il listait les annonces,
     * et l'ignorait quand il décidait si une page ville méritait d'exister.
     *
     * Trouvé par 📣 Le Crieur, qui a relevé un écart de 1 entre `/api/listings`
     * (45) et le sitemap (46) et l'a mis sur le compte d'« une annonce publiée
     * entre les deux appels ». L'explication était plausible et fausse : la
     * liste publique exclut les vendues (index.php:7657), pas cette requête.
     * Une annonce vendue, et une seule, faisait tout l'écart.
     *
     * Ce que ça change, honnêtement : PEU. La fiche d'une annonce vendue reste
     * en ligne et déclare loyalement `SoldOutOfStock` à Google (ligne ~317) —
     * personne n'était trompé. Ce qui est corrigé, c'est qu'un sitemap cesse
     * d'annoncer comme disponible ce qu'une petite annonce ne remettra jamais
     * en vente, et que le fichier n'applique plus deux règles opposées à la
     * même notion. */
    $rows = $pdo->query('SELECT id, created_at FROM listings
      WHERE (hidden IS NULL OR hidden = 0) AND (sold IS NULL OR sold = 0)
      ORDER BY created_at DESC LIMIT 5000')->fetchAll(PDO::FETCH_ASSOC);
    foreach ($rows as $r) {
      $lastmod = substr((string) $r['created_at'], 0, 10);
      echo '  <url><loc>' . h($site . '/annonce/' . $r['id']) . '</loc>'
        . ($lastmod ? '<lastmod>' . h($lastmod) . '</lastmod>' : '')
        . "<changefreq>daily</changefreq></url>\n";
    }
  }
  echo "</urlset>\n";
  exit;
}

// -------------------------------------------------------------- /annonce/{id} --
if (preg_match('#/annonce/([A-Za-z0-9-]+)#', $uri, $m) && $pdo) {
  $st = $pdo->prepare('SELECT * FROM listings WHERE id = ? AND (hidden IS NULL OR hidden = 0)');
  $st->execute([$m[1]]);
  $l = $st->fetch(PDO::FETCH_ASSOC);
  if ($l) {
    $imgs = $l['images'] ? (json_decode($l['images'], true) ?: []) : [];
    $img  = abs_img((string) ($imgs[0] ?? ''), $site, $upub);
    $price = number_format(seo_prix($l), 0, ',', ' ');
    $loc = $l['commune'] ?: ($l['city_id'] ?: '');
    $title = $l['title'] . ' — ' . $price . ' FCFA' . ($loc ? ' · ' . $loc : '') . ' | Chap.ci';
    $descRaw = trim((string) ($l['description'] ?? ''));
    $desc = $descRaw !== '' && $descRaw !== 'Aucune description fournie.'
      ? mb_substr($descRaw, 0, 160)
      : ($price . ' FCFA' . ($loc ? ' à ' . $loc : '') . ' sur Chap.ci — 100% ivoirien.');
    $canon = $site . '/annonce/' . $l['id'];
    $appUrl = $site . '/#/annonce/' . $l['id'];
    render_page($title, $desc, $img, $canon, $appUrl, $l, $price, $loc, $isBot);
    exit;
  }
  /* Annonce inconnue, retirée ou masquée : 404 FRANC (17/09/2026).
   * Elle tombait auparavant dans la redirection finale vers l'accueil — un
   * « soft 404 », que Google nomme et pénalise : une adresse morte qui répond
   * comme si elle était vivante. Sur un site de petites annonces, où chaque
   * vente fait mourir une adresse, ce n'est pas un cas rare : c'est le cas
   * NORMAL au bout de quelques mois. */
  render_404($site, 'Cette annonce n’est plus en ligne',
    'Elle a peut-être été vendue, ou retirée par son vendeur.');
}

// -------------------------------------------------------------- /vendeur/{id} --
if (preg_match('#/vendeur/([A-Za-z0-9-]+)#', $uri, $m) && $pdo) {
  $st = $pdo->prepare('SELECT full_name, bio, avatar_url FROM profiles WHERE id = ?');
  $st->execute([$m[1]]);
  $p = $st->fetch(PDO::FETCH_ASSOC);
  /* ⚠️ AUCUNE VÉRIFICATION ICI JUSQU'AU 17/09/2026. Sans ce test, un
   * identifiant inventé rendait une page COMPLÈTE et indexable, intitulée
   * « Vendeur — Vendeur sur Chap.ci », en HTTP 200 : on fabriquait à l'infini
   * des pages de gens qui n'existent pas. Pire qu'une redirection. */
  if (!$p) {
    render_404($site, 'Ce vendeur n’existe pas',
      'Le compte a peut-être été supprimé, ou l’adresse est incorrecte.');
  }
  $name = $p['full_name'] ?? 'Vendeur';
  $title = $name . ' — Vendeur sur Chap.ci';
  $desc = trim((string) ($p['bio'] ?? '')) ?: ('Découvrez les annonces de ' . $name . ' sur Chap.ci.');
  $img = abs_img((string) ($p['avatar_url'] ?? ''), $site, $upub);
  render_page($title, $desc, $img, $site . '/vendeur/' . $m[1], $site . '/#/vendeur/' . $m[1], null, '', '', $isBot);
  exit;
}

// ------------------------------------------------ /vendre/{cat}/{ville} SEO --
// Pages d'atterrissage « Vendez votre {catégorie} à {ville} » : servies à
// l'identique aux robots ET aux humains (pas de « cloaking »), avec un CTA
// direct vers la publication. Objectif : capter les vendeurs depuis Google.
if (preg_match('#^/vendre/([a-z0-9-]+)(?:/([a-z0-9-]+))?/?$#', $uri, $mv)) {
  $cats = chapci_seo_cats();
  $cities = chapci_seo_cities();
  $catSlug = $mv[1];
  $citySlug = $mv[2] ?? '';
  if (isset($cats[$catSlug]) && ($citySlug === '' || isset($cities[$citySlug]))) {
    [$catLabel, $sell] = $cats[$catSlug];
    $cityName = $citySlug !== '' ? $cities[$citySlug] : '';
    render_sell_page($site, $upub, $pdo, $catSlug, $catLabel, $sell, $citySlug, $cityName, $cities);
    exit;
  }
  http_response_code(404);
  exit;
}

/* ------------------------------------------------------------------ /a-propos --
 *
 * LA PAGE QUI DONNE UNE ADRESSE AUX FONDATEURS (19/09/2026).
 *
 * Le Patron a tapé son nom dans Google : rien. C'était inévitable, et pas une
 * question de délai. Deux causes se cumulaient :
 *
 *   1. l'application tourne en HashRouter. Dans `https://chap.ci/#/a-propos`,
 *      TOUT ce qui suit le `#` reste dans le navigateur et n'arrive jamais au
 *      serveur. Google ne voit que `https://chap.ci/`. La page « À propos »
 *      n'avait donc aucune adresse à indexer — le sitemap le dit lui-même plus
 *      haut : « les vues internes utilisent #/, non indexables : on les omet » ;
 *   2. ce fichier ne connaissait que cinq formes d'adresses (clé de
 *      vérification, /.well-known/, /annonce/, /vendeur/, /vendre/). Tout le
 *      reste tombait dans la redirection ci-dessous. Vérifié en local avant
 *      d'écrire une ligne : /a-propos, /conditions et /confidentialite
 *      renvoyaient un 302 vers l'accueil, y compris à Googlebot.
 *
 * Cette page-ci est donc la porte qui manquait : une vraie adresse, sans `#`,
 * servie identiquement aux robots et aux humains (pas de « cloaking »).
 *
 * ⚠️ Ce qui fait le travail ici n'est pas le texte, c'est le bloc JSON-LD
 * `Organization` avec ses deux `founder`. C'est lui qui relie un NOM DE
 * PERSONNE à Chap.ci dans une forme que Google sait lire. Un nom noyé dans un
 * paragraphe ne crée pas ce lien.
 *
 * ⚠️ ET CE N'EST PAS UNE PROMESSE DE CLASSEMENT. Exister dans l'index et
 * sortir en tête sur un nom propre sont deux choses différentes : la seconde
 * dépend de la concurrence sur ce nom et de l'autorité du domaine, que cette
 * page ne change pas. Ce qu'elle garantit, c'est qu'il y a désormais quelque
 * chose à trouver — ce qui n'était pas le cas.
 */
if (preg_match('#^/a-propos/?$#', $uri)) {
  render_about_page($site);
  exit;
}

// Rien trouvé : on renvoie vers l'app.
header('Location: ' . $site . '/');
exit;

// -----------------------------------------------------------------------------
/**
 * LA PAGE INTROUVABLE — un vrai 404, pour les robots comme pour les humains.
 *
 * ⚠️ `noindex` EST LE POINT ESSENTIEL, et il n'est pas décoratif : sans lui,
 * Google indexerait la page d'erreur elle-même, et chaque adresse morte
 * deviendrait une entrée de plus au catalogue — exactement le contenu dupliqué
 * que le chantier du 16/09 a passé la journée à retirer.
 *
 * Le ton compte aussi. « 404 Not Found » ne veut rien dire pour quelqu'un qui
 * cherchait une chemise ; « Cette annonce n'est plus en ligne — elle a
 * peut-être été vendue » lui dit ce qui s'est passé ET ce qu'il peut faire
 * ensuite. Une page d'erreur qui ne propose pas de suite est une porte fermée.
 */
function render_404(string $site, string $titre, string $explication): void {
  http_response_code(404);
  header('Content-Type: text/html; charset=utf-8');
  $t = h($titre); $e = h($explication); $s = h($site);
  echo "<!doctype html>\n<html lang=\"fr\">\n<head>\n"
     . "<meta charset=\"utf-8\">\n"
     . "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n"
     . "<title>$t — Chap.ci</title>\n"
     . "<meta name=\"description\" content=\"$e\">\n"
     . "<meta name=\"robots\" content=\"noindex, follow\">\n"
     . "<style>body{margin:0;font:16px/1.6 system-ui,sans-serif;background:#FFFDF9;color:#1B1A17}"
     . ".w{max-width:560px;margin:0 auto;padding:48px 20px}h1{font-size:24px;margin:0 0 8px}"
     . "p{color:#4b5563;margin:0 0 24px}a{display:inline-block;background:#B35700;color:#fff;"
     . "text-decoration:none;padding:12px 20px;border-radius:12px;font-weight:600;margin-right:8px}"
     . "a.s{background:transparent;color:#00734A;padding-left:0}</style>\n"
     . "</head>\n<body>\n<div class=\"w\">\n"
     . "<h1>$t</h1>\n<p>$e</p>\n"
     . "<a href=\"$s/\">Retour à l’accueil</a>\n"
     . "<a class=\"s\" href=\"$s/#/explorer\">Voir toutes les annonces →</a>\n"
     . "</div>\n</body>\n</html>";
  exit;
}

/**
 * LES FONDATEURS — source unique.
 *
 * Orthographe reprise du pacte de fondateurs (journal du 21/08/2026). Un nom
 * de personne ne s'approxime pas : si l'une de ces deux lignes est fausse,
 * c'est ici qu'on la corrige, et nulle part ailleurs.
 *
 * `photo` reste vide tant que les portraits ne sont pas livrés. La page sait
 * afficher les deux cas : avec photo, ou avec les initiales dans un rond. Une
 * balise <img> vers un fichier absent ferait un carré cassé sur la page la
 * plus regardée par ceux qui cherchent qui est derrière Chap.ci.
 */
function chapci_fondateurs(): array {
  return [
    ['nom' => 'Zika Bi Abraham',          'role' => 'Cofondateur', 'photo' => ''],
    ['nom' => 'Guibe Goze Ange Venceslas', 'role' => 'Cofondateur', 'photo' => ''],
  ];
}

function render_about_page(string $site): void {
  header('Content-Type: text/html; charset=utf-8');
  header('Cache-Control: public, max-age=3600');
  $fondateurs = chapci_fondateurs();
  $noms  = implode(' et ', array_column($fondateurs, 'nom'));
  $title = 'À propos de Chap.ci — qui est derrière la marketplace ivoirienne';
  $desc  = 'Chap.ci est la place de marché 100 % ivoirienne, fondée par ' . $noms
         . '. Acheter et vendre chap-chap partout en Côte d’Ivoire, sans commission.';
  $canon = $site . '/a-propos';

  /* Le bloc qui fait réellement le travail : il DIT à Google que ces deux
   * personnes ont fondé cette organisation. Un nom dans un paragraphe se lit ;
   * un `founder` se comprend. */
  $jsonld = [
    '@context' => 'https://schema.org',
    '@type' => 'Organization',
    'name' => 'Chap.ci',
    'url' => $site . '/',
    'logo' => $site . '/icons/icon-512.png',
    'description' => 'Place de marché de petites annonces en Côte d’Ivoire.',
    'areaServed' => ['@type' => 'Country', 'name' => 'Côte d’Ivoire'],
    'founder' => array_map(
      fn(array $f) => array_filter([
        '@type' => 'Person',
        'name' => $f['nom'],
        'jobTitle' => $f['role'],
        'image' => $f['photo'] !== '' ? $site . $f['photo'] : null,
      ]),
      $fondateurs,
    ),
  ];

  $t = h($title); $d = h($desc); $c = h($canon); $s = h($site);
  echo "<!doctype html>\n<html lang=\"fr\">\n<head>\n"
     . "<meta charset=\"utf-8\">\n"
     . "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n"
     . "<title>$t</title>\n"
     . "<meta name=\"description\" content=\"$d\">\n"
     . "<link rel=\"canonical\" href=\"$c\">\n"
     . "<meta property=\"og:type\" content=\"website\">\n"
     . "<meta property=\"og:title\" content=\"$t\">\n"
     . "<meta property=\"og:description\" content=\"$d\">\n"
     . "<meta property=\"og:url\" content=\"$c\">\n"
     . "<meta property=\"og:image\" content=\"" . h($site . '/og/accueil.png') . "\">\n"
     . "<meta name=\"twitter:card\" content=\"summary_large_image\">\n"
     . '<script type="application/ld+json">'
     . json_encode($jsonld, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)
     . "</script>\n"
     . "<style>body{margin:0;font:16px/1.65 system-ui,sans-serif;background:#FFFDF9;color:#1B1A17}"
     . ".w{max-width:720px;margin:0 auto;padding:40px 20px 56px}"
     . "h1{font-size:28px;line-height:1.2;margin:0 0 12px}h2{font-size:20px;margin:36px 0 12px}"
     . "p{color:#44403C;margin:0 0 16px}"
     . ".f{display:flex;gap:14px;align-items:center;border:1px solid #EADFD0;background:#fff;"
     . "border-radius:14px;padding:14px;margin:0 0 12px}"
     . ".av{width:56px;height:56px;border-radius:50%;flex:0 0 56px;object-fit:cover;"
     . "background:#FFF1E0;color:#B35700;font-weight:700;display:flex;align-items:center;"
     . "justify-content:center;font-size:18px}"
     . ".n{font-weight:700;font-size:17px}.r{color:#6B7280;font-size:14px}"
     . "a.b{display:inline-block;background:#B35700;color:#fff;text-decoration:none;padding:12px 20px;"
     . "border-radius:12px;font-weight:600;margin:8px 8px 0 0}"
     . "a.s{color:#00734A}"
     . "footer{margin-top:40px;color:#6B7280;font-size:14px}</style>\n"
     . "</head>\n<body>\n<div class=\"w\">\n";

  echo "<h1>À propos de Chap.ci</h1>\n";
  echo "<p>Chap.ci est la place de marché <strong>100 % ivoirienne</strong> : on y achète et on y "
     . "vend chap-chap, de Cocody à Korhogo. Publier est gratuit, et il n’y a <strong>aucune "
     . "commission</strong> sur les ventes — les paiements se règlent entre vous, comme au marché.</p>\n";

  echo "<h2>Les fondateurs</h2>\n";
  foreach ($fondateurs as $f) {
    // Initiales : première lettre des deux premiers mots du nom.
    $mots = preg_split('/\s+/', trim($f['nom']));
    $ini = mb_strtoupper(mb_substr($mots[0], 0, 1) . (isset($mots[1]) ? mb_substr($mots[1], 0, 1) : ''));
    $av = $f['photo'] !== ''
      ? '<img class="av" src="' . h($site . $f['photo']) . '" alt="' . h($f['nom']) . '" width="56" height="56">'
      : '<div class="av" aria-hidden="true">' . h($ini) . '</div>';
    echo "<div class=\"f\">$av<div><div class=\"n\">" . h($f['nom']) . "</div>"
       . "<div class=\"r\">" . h($f['role']) . " de Chap.ci</div></div></div>\n";
  }

  echo "<h2>Nous écrire</h2>\n";
  echo "<p>Une question, un partenariat, un problème sur une annonce : "
     . "<a class=\"s\" href=\"mailto:contact@chap.ci\">contact@chap.ci</a>.</p>\n";

  echo "<a class=\"b\" href=\"$s/#/explorer\">Voir toutes les annonces</a>\n"
     . "<a class=\"b\" href=\"$s/#/publier\" style=\"background:#00734A\">Publier une annonce</a>\n";

  echo "<footer>Chap.ci — petites annonces 100 % ivoiriennes 🇨🇮 · "
     . "<a class=\"s\" href=\"$s/\">Accueil</a> · "
     . "<a class=\"s\" href=\"$s/#/conditions\">Conditions</a> · "
     . "<a class=\"s\" href=\"$s/#/confidentialite\">Confidentialité</a></footer>\n";
  echo "</div>\n</body>\n</html>";
}

function render_page(string $title, string $desc, string $img, string $canon, string $appUrl, ?array $l, string $price, string $loc, bool $isBot): void {
  header('Content-Type: text/html; charset=utf-8');
  $t = h($title); $d = h($desc); $i = h($img); $c = h($canon); $a = h($appUrl);
  echo "<!doctype html>\n<html lang=\"fr\">\n<head>\n";
  echo "<meta charset=\"utf-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n";
  echo "<title>$t</title>\n";
  echo "<meta name=\"description\" content=\"$d\">\n";
  echo "<link rel=\"canonical\" href=\"$c\">\n";
  // ── L'ICÔNE, AVEC SON EMPREINTE DANS L'ADRESSE ────────────────────────────
  // Ces pages sont celles que Google et WhatsApp lisent le plus, et elles ne
  // déclaraient AUCUNE icône : le robot retombait sur /favicon.ico, dont il
  // gardait sa copie. Le 03/09/2026, deux jours après le passage à la couronne,
  // Google servait encore l'ancienne épingle. Les caches ne redemandent une
  // icône que si son ADRESSE change — d'où les 8 premiers caractères du md5 du
  // fichier, comme dans vite.config.ts pour index.html.
  // Trois niveaux, parce que md5_file() rend `false` sur un fichier absent, et
  // que substr(false) donne '' : un `?v=` vide serait une adresse constante,
  // et le bug reviendrait sans bruit. (Déjà vécu avec le logo des e-mails.)
  $vIcone = function (string $f): string {
    $chemin = __DIR__ . '/' . $f;
    $v = substr((string) @md5_file($chemin), 0, 8) ?: (string) @filemtime($chemin) ?: date('Ymd');
    return h('/' . $f . '?v=' . $v);
  };
  echo "<link rel=\"icon\" type=\"image/svg+xml\" href=\"" . $vIcone('favicon.svg') . "\">\n";
  echo "<link rel=\"icon\" href=\"" . $vIcone('favicon.ico') . "\" sizes=\"any\">\n";
  echo "<link rel=\"apple-touch-icon\" href=\"" . $vIcone('apple-touch-icon.png') . "\">\n";
  echo "<meta property=\"og:type\" content=\"product\">\n";
  echo "<meta property=\"og:title\" content=\"$t\">\n";
  echo "<meta property=\"og:description\" content=\"$d\">\n";
  echo "<meta property=\"og:url\" content=\"$c\">\n";
  echo "<meta property=\"og:site_name\" content=\"Chap.ci\">\n";
  if ($i !== '') echo "<meta property=\"og:image\" content=\"$i\">\n";
  echo "<meta name=\"twitter:card\" content=\"summary_large_image\">\n";
  echo "<meta name=\"twitter:title\" content=\"$t\">\n";
  echo "<meta name=\"twitter:description\" content=\"$d\">\n";
  if ($i !== '') echo "<meta name=\"twitter:image\" content=\"$i\">\n";
  echo "<meta name=\"robots\" content=\"index, follow\">\n";
  // Données structurées JSON-LD (schema.org) : Google affiche prix, disponibilité
  // et image directement dans les résultats (rich results) → plus de visibilité.
  if ($l) {
    $ld = [
      '@context' => 'https://schema.org', '@type' => 'Product',
      'name' => (string) ($l['title'] ?? ''),
      'description' => $desc,
      'category' => (string) ($l['category_id'] ?? ''),
      'offers' => [
        '@type' => 'Offer',
        'price' => seo_prix($l),
        'priceCurrency' => 'XOF', // franc CFA (FCFA)
        'availability' => empty($l['sold']) ? 'https://schema.org/InStock' : 'https://schema.org/SoldOutOfStock',
        'url' => $canon,
        'areaServed' => 'CI',
      ],
    ];
    if ($img !== '') $ld['image'] = $img;
    // Sécurité : ce JSON est écrit DANS un <script>. Un titre d'annonce contenant
    // « </script><script>… » refermerait le bloc et exécuterait du code (XSS
    // stockée). JSON_HEX_TAG échappe < et > en </>, et l'absence de
    // JSON_UNESCAPED_SLASHES rétablit \/ : « </script> » ne peut plus fermer la
    // balise. JSON_UNESCAPED_SLASHES est donc VOLONTAIREMENT retiré.
    echo '<script type="application/ld+json">'
       . json_encode($ld, JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT)
       . "</script>\n";

    // ── LE FIL D'ARIANE DE LA FICHE ──────────────────────────────────────────
    // Les pages de catégorie en avaient un depuis longtemps ; les fiches
    // d'annonce, non — alors que ce sont elles qui remplissent le plan de site.
    // Dans un résultat Google, une fiche s'annonçait donc par son URL nue
    // (« chap.ci › annonce › 3f7a… »), là où la concurrence affiche
    // « chap.ci › Matériel Pro ». C'est la même information, déjà présente à
    // l'écran depuis toujours : elle n'était simplement jamais dite au robot.
    //
    // Le libellé vient de `chapci_seo_cats()`, une liste fixe : rien
    // d'injectable. La catégorie d'une annonce peut néanmoins être absente ou
    // périmée (deux catégories ont été fondues le 01/08) — on ne fabrique alors
    // aucun maillon plutôt que d'en fabriquer un vers une page vide.
    // ⚠️ `$site` est une variable GLOBALE, et cette fonction ne la reçoit pas :
    // l'écrire ici donnait « "item": "/" » au lieu de « https://chap.ci/ », et
    // Google ignore purement et simplement un fil d'Ariane aux URL relatives.
    // On repart donc de `$canon`, qui est absolu par construction. (Attrapé au
    // banc le 30/08 ; la version d'à côté, `render_sell_page`, ne tombe pas
    // dans le piège parce qu'elle reçoit `$site` en paramètre.)
    $racine = preg_replace('#^(https?://[^/]+).*$#', '$1', $canon);
    $catId = (string) ($l['category_id'] ?? '');
    $catsFil = chapci_seo_cats();
    $fil = [['name' => 'Accueil', 'item' => $racine . '/']];
    if ($catId !== '' && isset($catsFil[$catId])) {
      $fil[] = ['name' => $catsFil[$catId][0], 'item' => $racine . '/vendre/' . $catId];
    }
    $fil[] = ['name' => (string) ($l['title'] ?? ''), 'item' => $canon];
    $ldFil = ['@context' => 'https://schema.org', '@type' => 'BreadcrumbList', 'itemListElement' => []];
    foreach ($fil as $ix => $cr) {
      $ldFil['itemListElement'][] = ['@type' => 'ListItem', 'position' => $ix + 1,
                                     'name' => $cr['name'], 'item' => $cr['item']];
    }
    // Même échappement que ci-dessus, et pour la même raison : le TITRE d'une
    // annonce entre ici, et il est écrit par un vendeur. `</script>` ne doit
    // pas pouvoir refermer la balise.
    echo '<script type="application/ld+json">'
       . json_encode($ldFil, JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT)
       . "</script>\n";
  }
  // Humains : redirection vers l'app. Robots : on garde le contenu.
  if (!$isBot) echo "<script>location.replace(" . json_encode($appUrl) . ");</script>\n";
  echo "<style>body{font-family:system-ui,Arial,sans-serif;margin:0;background:#f4f5f7;color:#111}"
    . ".w{max-width:520px;margin:0 auto;padding:20px}img{max-width:100%;border-radius:14px;display:block}"
    . ".p{color:#00734A;font-size:26px;font-weight:800;margin:12px 0}"
    . "a.btn{display:inline-block;background:#009E60;color:#fff;text-decoration:none;padding:12px 20px;border-radius:12px;font-weight:700;margin-top:14px}</style>\n";
  echo "</head>\n<body>\n<div class=\"w\">\n";
  echo "<h1 style=\"font-size:20px\">$t</h1>\n";
  if ($i !== '') echo "<img src=\"$i\" alt=\"$t\">\n";
  if ($l) {
    echo "<p class=\"p\">" . h($price) . " FCFA</p>\n";
    if ($loc !== '') echo "<p>📍 " . h($loc) . "</p>\n";
    echo "<p>$d</p>\n";
  }
  echo "<a class=\"btn\" href=\"$a\">Voir l’annonce sur Chap.ci →</a>\n";
  echo "</div>\n</body>\n</html>";
}

// --- SEO : catégories & villes pour les pages « Vendez votre X à Y » ----------
function chapci_seo_cats(): array {
  // slug (= id de catégorie de l'app) => [libellé, tournure « vendez … »]
  //
  // SEIZE, comme dans l'application. « Téléphones » et « Agriculture » ont été
  // fondues le 01/08 ; les laisser ici faisait publier au sitemap 46 URL vers
  // des pages désormais vides — 2 catégories × 23 déclinaisons de ville. Google
  // les aurait explorées, trouvées sans annonce, et aurait baissé sa confiance
  // dans tout le reste du plan de site. Une page vide indexée coûte plus cher
  // qu'une page absente.
  //
  // ⚠️ Cette liste doit rester alignée sur src/data/categories.ts. Deux
  // endroits pour la même vérité, c'est la garantie qu'ils divergeront : à
  // chaque changement de catégorie, corrigez les DEUX.
  return [
    'vehicules'    => ['Véhicules', 'votre voiture'],
    'immobilier'   => ['Immobilier', 'votre bien immobilier'],
    'mode'         => ['Mode & Beauté', 'vos articles mode & beauté'],
    'electronique' => ['Électronique', 'votre matériel électronique'],
    'maison'       => ['Maison & Meubles', 'vos meubles'],
    'emploi'       => ['Emploi', 'une offre d’emploi'],
    'services'     => ['Services', 'vos services'],
    'materiel-pro' => ['Matériel Pro', 'votre matériel professionnel'],
    'alimentation' => ['Alimentation & Boissons', 'vos produits alimentaires'],
    'animaux'      => ['Animaux', 'vos animaux'],
    'loisirs'      => ['Loisirs & Sport', 'vos articles de sport & loisirs'],
    'bebe'         => ['Bébé & Enfant', 'vos articles bébé & enfant'],
    // Santé : compléments, soins, matériel paramédical. SANS médicaments —
    // vente réservée aux pharmaciens, et interdite par les règles Google Play.
    'sante'        => ['Santé & Bien-être', 'vos produits de santé et bien-être'],
    'voyage'       => ['Voyage', 'vos billets et vos séjours'],
    // La rentrée ivoirienne tombe le 14 septembre, et les inscriptions courent
    // du 1er au 31 août : cette page-là a six semaines par an pour exister.
    'scolaire'     => ['École & Fournitures', 'vos fournitures scolaires'],
    // « À donner » n'est pas une catégorie de vente : la page qui la sert dit
    // « Donnez » et non « Vendez », et affiche « Gratuit » là où les autres
    // affichent un prix (voir $don dans render_sell_page).
    'a-donner'     => ['À donner', 'ce dont vous ne vous servez plus'],
  ];
}
function chapci_seo_cities(): array {
  // slug => nom (grandes villes & communes de Côte d'Ivoire, forte intention vendeur)
  return [
    'abidjan' => 'Abidjan', 'cocody' => 'Cocody', 'yopougon' => 'Yopougon', 'abobo' => 'Abobo',
    'marcory' => 'Marcory', 'treichville' => 'Treichville', 'plateau' => 'Plateau', 'adjame' => 'Adjamé',
    'koumassi' => 'Koumassi', 'port-bouet' => 'Port-Bouët', 'anyama' => 'Anyama', 'bingerville' => 'Bingerville', 'grand-bassam' => 'Grand-Bassam',
    'bouake' => 'Bouaké', 'yamoussoukro' => 'Yamoussoukro', 'daloa' => 'Daloa', 'san-pedro' => 'San-Pédro',
    'korhogo' => 'Korhogo', 'man' => 'Man', 'gagnoa' => 'Gagnoa', 'divo' => 'Divo', 'abengourou' => 'Abengourou',
  ];
}

/**
 * Communes couvertes par un slug de ville.
 *
 * `listings.commune` stocke le NOM affiché (« Cocody », « Treichville ») —
 * comparaison exacte, comme le fait déjà le serveur. Un slug rend donc son nom.
 *
 * Sauf « abidjan » : une annonce à Cocody EST à Abidjan, et personne ne range
 * son annonce sous « Abidjan » quand il peut écrire sa commune. Sans ce
 * regroupement, la page la plus recherchée du site serait vide et sortirait de
 * l'index alors que le stock existe — juste rangé sous un autre nom.
 */
function chapci_seo_communes(string $citySlug, array $cities): array {
  if ($citySlug === 'abidjan') {
    return ['Abidjan', 'Cocody', 'Yopougon', 'Abobo', 'Marcory', 'Treichville', 'Plateau',
            'Adjamé', 'Koumassi', 'Port-Bouët', 'Anyama', 'Bingerville'];
  }
  return isset($cities[$citySlug]) ? [$cities[$citySlug]] : [];
}

/**
 * Stock par (catégorie, commune), en UNE requête.
 *
 * Le sitemap doit trancher 352 pages ville : les compter une par une ferait
 * 352 requêtes à chaque passage de robot. Un seul GROUP BY suffit, et le reste
 * se calcule en PHP.
 */
function chapci_seo_stock(?PDO $pdo): array {
  if (!$pdo) return [];
  try {
    $rows = $pdo->query('SELECT category_id, commune, COUNT(*) AS n FROM listings
      WHERE (hidden IS NULL OR hidden = 0) AND (sold IS NULL OR sold = 0)
      GROUP BY category_id, commune')->fetchAll(PDO::FETCH_ASSOC);
  } catch (Throwable $e) { return []; }
  $par = [];
  foreach ($rows as $r) {
    $par[(string) $r['category_id']][(string) ($r['commune'] ?? '')] = (int) $r['n'];
  }
  return $par;
}

/** Annonces d'une catégorie dans les communes d'un slug de ville. */
function chapci_seo_compte(array $stock, string $catSlug, string $citySlug, array $cities): int {
  $dansLaCat = $stock[$catSlug] ?? [];
  if ($citySlug === '') return array_sum($dansLaCat);
  $n = 0;
  foreach (chapci_seo_communes($citySlug, $cities) as $nom) $n += $dansLaCat[$nom] ?? 0;
  return $n;
}

/**
 * Page d'atterrissage « Vendez votre {catégorie} à {ville} » — HTML crawlable,
 * identique pour robots et humains (pas de cloaking). CTA direct vers /#/publier,
 * annonces récentes de la catégorie (maillage interne) et liens vers d'autres villes.
 */
function render_sell_page(string $site, string $upub, ?PDO $pdo, string $catSlug, string $catLabel, string $sell, string $citySlug, string $cityName, array $cities): void {
  header('Content-Type: text/html; charset=utf-8');
  // La rubrique « À donner » n'a rien à vendre : sa page doit dire « Donnez ».
  // Servir « Vendez ce dont vous ne vous servez plus » serait un contresens que
  // Google indexerait, et qui ferait fuir exactement les gens qu'on cherche.
  $don    = $catSlug === 'a-donner';
  $place  = $cityName !== '' ? ('à ' . $cityName) : 'en Côte d’Ivoire';
  $h1     = ($don ? 'Donnez ' : 'Vendez ') . $sell . ' ' . $place;
  $title  = $h1 . ' — gratuit | Chap.ci';
  $desc   = $don
          ? 'Publiez gratuitement votre don ' . $place . ' sur Chap.ci : vêtements, meubles, '
            . 'fournitures scolaires, coup de main. Rien ne se paie, rien ne se demande en échange. '
            . '100 % ivoirien, en ligne en 2 minutes.'
          : 'Publiez gratuitement votre annonce ' . mb_strtolower($catLabel) . ' ' . $place
            . ' sur Chap.ci et vendez vite à des acheteurs proches de vous. 100 % ivoirien, en ligne en 2 minutes.';
  $canon  = $site . '/vendre/' . $catSlug . ($citySlug !== '' ? '/' . $citySlug : '');
  $publish = $site . '/#/publier';
  $explore = $site . '/#/explorer?cat=' . $catSlug;
  $t = h($title); $d = h($desc); $c = h($canon);
  // Image d'aperçu (partage WhatsApp/Facebook) : une bannière 1200×630 par catégorie.
  $oi = h($site . '/og/' . $catSlug . '.png');

  // Annonces récentes de la catégorie : preuve d'activité + maillage interne.
  $items = [];
  if ($pdo) {
    try {
      // `promo_until` EST INDISPENSABLE : sans elle, seo_prix() ne peut pas
      // savoir qu'une promotion est finie et la carte afficherait un prix faux.
      // ⚠️ LE FILTRE PAR COMMUNE A ÉTÉ AJOUTÉ LE 16/09/2026, ET IL MANQUAIT DEPUIS
      //    TOUJOURS. La requête ne connaissait que `category_id` : les 22 pages
      //    ville d'une même catégorie affichaient donc LES MÊMES annonces, et ne
      //    différaient que par le nom de la ville dans le texte. La ville de
      //    l'URL était décorative. Signe qui ne trompe pas : `commune` était déjà
      //    dans le SELECT ci-dessous… et n'était utilisée nulle part.
      $communes = $citySlug !== '' ? chapci_seo_communes($citySlug, $cities) : [];
      $ou = $communes ? ' AND commune IN (' . implode(',', array_fill(0, count($communes), '?')) . ')' : '';
      $st = $pdo->prepare('SELECT id,title,price,promo_price,promo_until,images,commune FROM listings
        WHERE category_id = ? AND (hidden IS NULL OR hidden = 0) AND (sold IS NULL OR sold = 0)' . $ou . '
        ORDER BY created_at DESC LIMIT 12');
      $st->execute(array_merge([$catSlug], $communes));
      $items = $st->fetchAll(PDO::FETCH_ASSOC) ?: [];
    } catch (Throwable $e) { $items = []; }
  }

  /* Indexable ou non — la décision se prend ICI, sur le stock réel.
   *
   * Une page ville sous le seuil n'a rien qui lui soit propre : le texte est
   * celui des 21 autres villes de la catégorie, à un nom près. La laisser dans
   * l'index, c'est offrir à Google des centaines de quasi-jumelles, et il le
   * fait payer au domaine entier.
   *
   * `noindex, follow` et non `noindex, nofollow` : la page sort de l'index, mais
   * ses liens continuent de mener aux annonces et aux autres villes. On retire
   * la page du catalogue, on ne coupe pas les couloirs.
   *
   * Le `canonical` reste sur elle-même : `noindex` + un canonical qui désigne
   * une AUTRE page sont deux ordres contradictoires, et Google en ignore un —
   * on ne sait jamais lequel. Un seul signal, net. */
  $indexable = $citySlug === '' || count($items) >= SEO_MIN_ANNONCES_VILLE;

  echo "<!doctype html>\n<html lang=\"fr\">\n<head>\n";
  echo "<meta charset=\"utf-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n";
  echo "<title>$t</title>\n<meta name=\"description\" content=\"$d\">\n<link rel=\"canonical\" href=\"$c\">\n";
  echo '<meta name="robots" content="' . ($indexable ? 'index, follow' : 'noindex, follow') . "\">\n";
  echo "<meta property=\"og:type\" content=\"website\">\n<meta property=\"og:title\" content=\"$t\">\n";
  echo "<meta property=\"og:description\" content=\"$d\">\n<meta property=\"og:url\" content=\"$c\">\n";
  echo "<meta property=\"og:site_name\" content=\"Chap.ci\">\n";
  echo "<meta property=\"og:image\" content=\"$oi\">\n<meta property=\"og:image:width\" content=\"1200\">\n<meta property=\"og:image:height\" content=\"630\">\n<meta property=\"og:image:alt\" content=\"$t\">\n";
  echo "<meta name=\"twitter:card\" content=\"summary_large_image\">\n<meta name=\"twitter:image\" content=\"$oi\">\n";
  // JSON-LD : fil d'Ariane (rich results).
  $crumbs = [['name' => 'Accueil', 'item' => $site . '/'], ['name' => $catLabel, 'item' => $site . '/vendre/' . $catSlug]];
  if ($cityName !== '') $crumbs[] = ['name' => $cityName, 'item' => $canon];
  $ld = ['@context' => 'https://schema.org', '@type' => 'BreadcrumbList', 'itemListElement' => []];
  foreach ($crumbs as $ix => $cr) $ld['itemListElement'][] = ['@type' => 'ListItem', 'position' => $ix + 1, 'name' => $cr['name'], 'item' => $cr['item']];
  // Même échappement que le JSON-LD produit : ces valeurs viennent aujourd'hui
  // de listes fixes (catégories, communes), donc rien n'est injectable — mais un
  // sink dans un <script> se ferme par principe, pas quand il devient exploitable.
  echo '<script type="application/ld+json">'
     . json_encode($ld, JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT)
     . "</script>\n";
  echo "<style>"
    . "body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;margin:0;background:#FFF6EA;color:#1B1A17;line-height:1.55}"
    . ".w{max-width:820px;margin:0 auto;padding:20px 16px 48px}"
    . "header{display:flex;align-items:center;gap:8px;font-weight:800;font-size:20px}header .ci{color:#009E60}"
    . "h1{font-size:26px;margin:18px 0 6px;line-height:1.2}"
    . ".lead{color:#4b5563;font-size:15px;max-width:640px}"
    . "a.cta{display:inline-flex;align-items:center;gap:8px;background:linear-gradient(#00B36E,#00734A);color:#fff;text-decoration:none;padding:14px 22px;border-radius:14px;font-weight:800;margin:16px 0;box-shadow:0 8px 20px -8px rgba(217,95,0,.6)}"
    . "h2{font-size:18px;margin:28px 0 10px}"
    . "ul.why{list-style:none;padding:0;margin:0;display:grid;grid-template-columns:1fr 1fr;gap:8px}"
    . "ul.why li{background:#fff;border:1px solid #EFE6D7;border-radius:12px;padding:10px 12px;font-size:14px}"
    . ".grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px}"
    . ".card{background:#fff;border:1px solid #EFE6D7;border-radius:14px;overflow:hidden;text-decoration:none;color:inherit;display:block}"
    . ".card img{width:100%;aspect-ratio:4/3;object-fit:cover;display:block;background:#f0f0f0}"
    . ".card .b{padding:8px 10px}.card .pr{color:#C05600;font-weight:800}.card .ti{font-size:13px;color:#374151;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}"
    . ".links a{display:inline-block;background:#fff;border:1px solid #E6DAC6;border-radius:999px;padding:6px 12px;margin:4px 4px 0 0;text-decoration:none;color:#333;font-size:13px}"
    . "footer{margin-top:30px;color:#9ca3af;font-size:13px}"
    . "@media(max-width:520px){ul.why{grid-template-columns:1fr}}"
    . "</style>\n</head>\n<body>\n<div class=\"w\">\n";
  echo "<header>Chap<span class=\"ci\">.ci</span></header>\n";
  echo "<h1>" . h($h1) . " 🇨🇮</h1>\n";
  echo "<p class=\"lead\">Vous avez " . h($sell) . ($don ? ' à donner ' : ' à vendre ') . h($place) . " ? Sur <strong>Chap.ci</strong>, "
     . "publier une annonce est <strong>100 % gratuit</strong> et prend moins de 2 minutes. "
     . ($don ? 'Ceux à qui cela servira' : 'Vos acheteurs')
     . " vous trouvent " . ($cityName !== '' ? 'à ' . h($cityName) . ' et partout en Côte d’Ivoire' : 'partout en Côte d’Ivoire') . ".</p>\n";
  echo "<a class=\"cta\" href=\"" . h($publish) . "\">➕ Publier une annonce gratuitement</a>\n";

  if ($don) {
    echo "<h2>Pourquoi donner sur Chap.ci ?</h2>\n<ul class=\"why\">\n"
       . "<li>✅ <strong>Gratuit</strong> — publier ne coûte rien, et le don ne rapporte rien.</li>\n"
       . "<li>🚫 <strong>Rien à payer, jamais</strong> — pas même « les frais de transport ». Une annonce qui réclame de l’argent est refusée.</li>\n"
       . "<li>📍 <strong>Près de chez vous</strong> — la remise se fait en main propre" . ($cityName !== '' ? ' à ' . h($cityName) : '') . ".</li>\n"
       . "<li>🇨🇮 <strong>100 % ivoirien</strong> — entre voisins, entre Ivoiriens.</li>\n"
       . "</ul>\n";
  } else {
    echo "<h2>Pourquoi vendre sur Chap.ci ?</h2>\n<ul class=\"why\">\n"
       . "<li>✅ <strong>Gratuit</strong> — aucune commission sur vos ventes.</li>\n"
       . "<li>⚡ <strong>Rapide</strong> — en ligne en moins de 2 minutes.</li>\n"
       . "<li>📍 <strong>Local</strong> — des acheteurs proches de vous" . ($cityName !== '' ? ' à ' . h($cityName) : '') . ".</li>\n"
       . "<li>🇨🇮 <strong>100 % ivoirien</strong> — paiement Mobile Money (Orange, Wave…).</li>\n"
       . "</ul>\n";
  }

  if ($items) {
    echo "<h2>" . ($don ? 'Ce qui est à donner en ce moment' : 'Annonces récentes en ' . h($catLabel)) . "</h2>\n<div class=\"grid\">\n";
    foreach ($items as $it) {
      $imgs = $it['images'] ? (json_decode($it['images'], true) ?: []) : [];
      $img  = abs_img((string) ($imgs[0] ?? ''), $site, $upub);
      // Un prix à zéro s'écrit « Gratuit », jamais « 0 FCFA » : c'est ce que
      // l'application affiche déjà, et c'est la seule forme juste dans « À donner ».
      $montant = seo_prix($it);
      $pr   = $montant === 0 ? 'Gratuit' : number_format($montant, 0, ',', ' ') . ' FCFA';
      $url  = $site . '/annonce/' . $it['id'];
      echo "<a class=\"card\" href=\"" . h($url) . "\">"
         . ($img !== '' ? "<img src=\"" . h($img) . "\" alt=\"" . h((string) $it['title']) . "\" loading=\"lazy\">" : "")
         . "<div class=\"b\"><div class=\"pr\">" . h($pr) . "</div><div class=\"ti\">" . h((string) $it['title']) . "</div></div></a>\n";
    }
    echo "</div>\n";
  }

  echo "<h2>Explorer</h2>\n<p><a href=\"" . h($explore) . "\">"
     . ($don ? 'Voir tout ce qui est à donner sur Chap.ci' : 'Voir toutes les annonces ' . h($catLabel) . ' sur Chap.ci')
     . " →</a></p>\n";

  // Maillage interne : la même catégorie dans d'autres villes.
  // « Donner À donner dans d'autres villes » ne se dit pas : sur cette rubrique
  // le nom de la catégorie EST déjà le verbe.
  echo "<h2>" . ($don ? 'Donner' : 'Vendre ' . h($catLabel)) . " dans d'autres villes</h2>\n<div class=\"links\">\n";
  $shown = 0;
  foreach ($cities as $vSlug => $vName) {
    if ($vSlug === $citySlug) continue;
    echo "<a href=\"" . h($site . '/vendre/' . $catSlug . '/' . $vSlug) . "\">" . h($vName) . "</a>";
    if (++$shown >= 14) break;
  }
  echo "\n</div>\n";

  echo "<footer>Chap.ci — petites annonces 100 % ivoiriennes 🇨🇮 · <a href=\"" . h($site) . "/\">Accueil</a></footer>\n";
  echo "</div>\n</body>\n</html>";
}
