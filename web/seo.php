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
