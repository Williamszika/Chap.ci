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

// --------------------------------------------------------------- sitemap.xml --
if (preg_match('#/sitemap\.xml$#', $uri)) {
  header('Content-Type: application/xml; charset=utf-8');
  echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
  echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";
  // Page d'accueil (les vues internes utilisent #/, non indexables : on les omet).
  echo '  <url><loc>' . h($site . '/') . "</loc><changefreq>daily</changefreq><priority>1.0</priority></url>\n";
  // Pages d'atterrissage SEO « Vendez votre {catégorie} à {ville} » (capte les vendeurs).
  foreach (chapci_seo_cats() as $cSlug => $c) {
    echo '  <url><loc>' . h($site . '/vendre/' . $cSlug) . "</loc><changefreq>weekly</changefreq><priority>0.7</priority></url>\n";
    foreach (chapci_seo_cities() as $vSlug => $vName) {
      echo '  <url><loc>' . h($site . '/vendre/' . $cSlug . '/' . $vSlug) . "</loc><changefreq>weekly</changefreq><priority>0.6</priority></url>\n";
    }
  }
  if ($pdo) {
    $rows = $pdo->query('SELECT id, created_at FROM listings WHERE hidden IS NULL OR hidden = 0 ORDER BY created_at DESC LIMIT 5000')->fetchAll(PDO::FETCH_ASSOC);
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
    $price = number_format((int) ($l['promo_price'] ?: $l['price']), 0, ',', ' ');
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
}

// -------------------------------------------------------------- /vendeur/{id} --
if (preg_match('#/vendeur/([A-Za-z0-9-]+)#', $uri, $m) && $pdo) {
  $st = $pdo->prepare('SELECT full_name, bio, avatar_url FROM profiles WHERE id = ?');
  $st->execute([$m[1]]);
  $p = $st->fetch(PDO::FETCH_ASSOC);
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

// Rien trouvé : on renvoie vers l'app.
header('Location: ' . $site . '/');
exit;

// -----------------------------------------------------------------------------
function render_page(string $title, string $desc, string $img, string $canon, string $appUrl, ?array $l, string $price, string $loc, bool $isBot): void {
  header('Content-Type: text/html; charset=utf-8');
  $t = h($title); $d = h($desc); $i = h($img); $c = h($canon); $a = h($appUrl);
  echo "<!doctype html>\n<html lang=\"fr\">\n<head>\n";
  echo "<meta charset=\"utf-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n";
  echo "<title>$t</title>\n";
  echo "<meta name=\"description\" content=\"$d\">\n";
  echo "<link rel=\"canonical\" href=\"$c\">\n";
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
        'price' => (int) ($l['promo_price'] ?: $l['price']),
        'priceCurrency' => 'XOF', // franc CFA (FCFA)
        'availability' => empty($l['sold']) ? 'https://schema.org/InStock' : 'https://schema.org/SoldOutOfStock',
        'url' => $canon,
        'areaServed' => 'CI',
      ],
    ];
    if ($img !== '') $ld['image'] = $img;
    echo '<script type="application/ld+json">'
       . json_encode($ld, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . "</script>\n";
  }
  // Humains : redirection vers l'app. Robots : on garde le contenu.
  if (!$isBot) echo "<script>location.replace(" . json_encode($appUrl) . ");</script>\n";
  echo "<style>body{font-family:system-ui,Arial,sans-serif;margin:0;background:#f4f5f7;color:#111}"
    . ".w{max-width:520px;margin:0 auto;padding:20px}img{max-width:100%;border-radius:14px;display:block}"
    . ".p{color:#F77F00;font-size:26px;font-weight:800;margin:12px 0}"
    . "a.btn{display:inline-block;background:#F77F00;color:#fff;text-decoration:none;padding:12px 20px;border-radius:12px;font-weight:700;margin-top:14px}</style>\n";
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
  return [
    'telephones'   => ['Téléphones', 'votre téléphone'],
    'vehicules'    => ['Véhicules', 'votre voiture'],
    'immobilier'   => ['Immobilier', 'votre bien immobilier'],
    'mode'         => ['Mode & Beauté', 'vos articles mode & beauté'],
    'electronique' => ['Électronique', 'votre matériel électronique'],
    'maison'       => ['Maison & Meubles', 'vos meubles'],
    'emploi'       => ['Emploi', 'une offre d’emploi'],
    'services'     => ['Services', 'vos services'],
    'materiel-pro' => ['Matériel Pro', 'votre matériel professionnel'],
    'alimentation' => ['Alimentation & Boissons', 'vos produits alimentaires'],
    'agriculture'  => ['Agriculture', 'vos produits agricoles'],
    'animaux'      => ['Animaux', 'vos animaux'],
    'loisirs'      => ['Loisirs & Sport', 'vos articles de sport & loisirs'],
    'bebe'         => ['Bébé & Enfant', 'vos articles bébé & enfant'],
  ];
}
function chapci_seo_cities(): array {
  // slug => nom (grandes villes & communes de Côte d'Ivoire, forte intention vendeur)
  return [
    'abidjan' => 'Abidjan', 'cocody' => 'Cocody', 'yopougon' => 'Yopougon', 'abobo' => 'Abobo',
    'marcory' => 'Marcory', 'treichville' => 'Treichville', 'plateau' => 'Plateau', 'adjame' => 'Adjamé',
    'koumassi' => 'Koumassi', 'port-bouet' => 'Port-Bouët', 'anyama' => 'Anyama', 'grand-bassam' => 'Grand-Bassam',
    'bouake' => 'Bouaké', 'yamoussoukro' => 'Yamoussoukro', 'daloa' => 'Daloa', 'san-pedro' => 'San-Pédro',
    'korhogo' => 'Korhogo', 'man' => 'Man', 'gagnoa' => 'Gagnoa', 'divo' => 'Divo', 'abengourou' => 'Abengourou',
  ];
}

/**
 * Page d'atterrissage « Vendez votre {catégorie} à {ville} » — HTML crawlable,
 * identique pour robots et humains (pas de cloaking). CTA direct vers /#/publier,
 * annonces récentes de la catégorie (maillage interne) et liens vers d'autres villes.
 */
function render_sell_page(string $site, string $upub, ?PDO $pdo, string $catSlug, string $catLabel, string $sell, string $citySlug, string $cityName, array $cities): void {
  header('Content-Type: text/html; charset=utf-8');
  $place  = $cityName !== '' ? ('à ' . $cityName) : 'en Côte d’Ivoire';
  $h1     = 'Vendez ' . $sell . ' ' . $place;
  $title  = $h1 . ' — gratuit | Chap.ci';
  $desc   = 'Publiez gratuitement votre annonce ' . mb_strtolower($catLabel) . ' ' . $place
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
      $st = $pdo->prepare('SELECT id,title,price,promo_price,images,commune FROM listings
        WHERE category_id = ? AND (hidden IS NULL OR hidden = 0) AND (sold IS NULL OR sold = 0)
        ORDER BY created_at DESC LIMIT 12');
      $st->execute([$catSlug]);
      $items = $st->fetchAll(PDO::FETCH_ASSOC) ?: [];
    } catch (Throwable $e) { $items = []; }
  }

  echo "<!doctype html>\n<html lang=\"fr\">\n<head>\n";
  echo "<meta charset=\"utf-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n";
  echo "<title>$t</title>\n<meta name=\"description\" content=\"$d\">\n<link rel=\"canonical\" href=\"$c\">\n";
  echo "<meta name=\"robots\" content=\"index, follow\">\n";
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
  echo '<script type="application/ld+json">' . json_encode($ld, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . "</script>\n";
  echo "<style>"
    . "body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;margin:0;background:#FFF6EA;color:#1B1A17;line-height:1.55}"
    . ".w{max-width:820px;margin:0 auto;padding:20px 16px 48px}"
    . "header{display:flex;align-items:center;gap:8px;font-weight:800;font-size:20px}header .ci{color:#009E60}"
    . "h1{font-size:26px;margin:18px 0 6px;line-height:1.2}"
    . ".lead{color:#4b5563;font-size:15px;max-width:640px}"
    . "a.cta{display:inline-flex;align-items:center;gap:8px;background:linear-gradient(#F98A19,#D95F00);color:#fff;text-decoration:none;padding:14px 22px;border-radius:14px;font-weight:800;margin:16px 0;box-shadow:0 8px 20px -8px rgba(217,95,0,.6)}"
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
  echo "<p class=\"lead\">Vous avez " . h($sell) . " à vendre " . h($place) . " ? Sur <strong>Chap.ci</strong>, "
     . "publier une annonce est <strong>100 % gratuit</strong> et prend moins de 2 minutes. Touchez des milliers "
     . "d'acheteurs " . ($cityName !== '' ? 'à ' . h($cityName) . ' et partout en Côte d’Ivoire' : 'partout en Côte d’Ivoire') . ".</p>\n";
  echo "<a class=\"cta\" href=\"" . h($publish) . "\">➕ Publier une annonce gratuitement</a>\n";

  echo "<h2>Pourquoi vendre sur Chap.ci ?</h2>\n<ul class=\"why\">\n"
     . "<li>✅ <strong>Gratuit</strong> — aucune commission sur vos ventes.</li>\n"
     . "<li>⚡ <strong>Rapide</strong> — en ligne en moins de 2 minutes.</li>\n"
     . "<li>📍 <strong>Local</strong> — des acheteurs proches de vous" . ($cityName !== '' ? ' à ' . h($cityName) : '') . ".</li>\n"
     . "<li>🇨🇮 <strong>100 % ivoirien</strong> — paiement Mobile Money (Orange, Wave…).</li>\n"
     . "</ul>\n";

  if ($items) {
    echo "<h2>Annonces récentes en " . h($catLabel) . "</h2>\n<div class=\"grid\">\n";
    foreach ($items as $it) {
      $imgs = $it['images'] ? (json_decode($it['images'], true) ?: []) : [];
      $img  = abs_img((string) ($imgs[0] ?? ''), $site, $upub);
      $pr   = number_format((int) ($it['promo_price'] ?: $it['price']), 0, ',', ' ');
      $url  = $site . '/annonce/' . $it['id'];
      echo "<a class=\"card\" href=\"" . h($url) . "\">"
         . ($img !== '' ? "<img src=\"" . h($img) . "\" alt=\"" . h((string) $it['title']) . "\" loading=\"lazy\">" : "")
         . "<div class=\"b\"><div class=\"pr\">" . h($pr) . " FCFA</div><div class=\"ti\">" . h((string) $it['title']) . "</div></div></a>\n";
    }
    echo "</div>\n";
  }

  echo "<h2>Explorer</h2>\n<p><a href=\"" . h($explore) . "\">Voir toutes les annonces " . h($catLabel) . " sur Chap.ci →</a></p>\n";

  // Maillage interne : la même catégorie dans d'autres villes.
  echo "<h2>Vendre " . h($catLabel) . " dans d'autres villes</h2>\n<div class=\"links\">\n";
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
