<?php
// =============================================================================
//  Chap.ci — API PHP (backend auto-hébergeable sur mutualisé cPanel / TPE Cloud)
//  Remplace Supabase : comptes, annonces, messagerie, commandes, avis, photos.
//  Compatible MySQL (production) et SQLite (test local). PHP 8+.
// =============================================================================

declare(strict_types=1);
error_reporting(E_ALL & ~E_DEPRECATED & ~E_WARNING);

$config = require __DIR__ . '/config.php';

// Valeurs par défaut pour les réglages ajoutés au fil des fonctionnalités
// (crons, emails, réseaux sociaux…). Un `config.php` créé AVANT l'ajout d'une
// fonctionnalité n'a pas forcément la clé correspondante : sans ce filet, la
// valeur serait vide (ex. clé cron manquante -> « Clé invalide »). L'opérateur
// `+` ne complète QUE les clés absentes — vos réglages existants sont préservés.
$config += [
  'cron_key'             => getenv('CHAPCI_CRON_KEY')      ?: 'chapci-cron-2026-a7f3e9',
  'admin_emails'         => array_filter(array_map('trim',
    explode(',', getenv('CHAPCI_ADMIN_EMAILS') ?: 'bracknetswilliam@gmail.com'))),
  'mail_from'            => getenv('CHAPCI_MAIL_FROM')       ?: 'no-reply@chap.ci',
  'mail_from_name'       => getenv('CHAPCI_MAIL_FROM_NAME')  ?: 'Chap.ci',
  'mail_reply_to'        => getenv('CHAPCI_MAIL_REPLYTO')    ?: 'contact@chap.ci',
  'mail_newsletter_from' => getenv('CHAPCI_NEWSLETTER_FROM') ?: 'hello@chap.ci',
  'site_url'             => getenv('CHAPCI_SITE_URL')        ?: 'https://chap.ci',
  'social'               => [],
];

// Réglages SMTP éventuellement définis depuis le tableau de bord (fichier local
// prioritaire sur config.php). Permet de configurer l'email sans éditer de fichier.
if (is_file(__DIR__ . '/smtp.local.php')) {
  $smtpOverride = include __DIR__ . '/smtp.local.php';
  if (is_array($smtpOverride)) $config['smtp'] = array_merge($config['smtp'] ?? [], $smtpOverride);
}

// ---- Compatibilité PHP 7.4 (certains hébergeurs démarrent sous PHP 7.4/8.0) --
if (!function_exists('str_starts_with')) {
  function str_starts_with(string $h, string $n): bool { return $n === '' || strncmp($h, $n, strlen($n)) === 0; }
}
if (!function_exists('str_contains')) {
  function str_contains(string $h, string $n): bool { return $n === '' || strpos($h, $n) !== false; }
}
if (!function_exists('str_ends_with')) {
  function str_ends_with(string $h, string $n): bool { return $n === '' || substr($h, -strlen($n)) === $n; }
}

// Toute erreur fatale PHP (souvent : mauvaise version de PHP ou extension
// manquante) est renvoyée en JSON lisible plutôt qu'en page 500 vide.
register_shutdown_function(function () {
  $e = error_get_last();
  if ($e && in_array($e['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR], true)) {
    if (!headers_sent()) {
      http_response_code(500);
      header('Content-Type: application/json; charset=utf-8');
    }
    echo json_encode(['error' => 'Erreur PHP : ' . $e['message'] . ' (' . basename($e['file']) . ':' . $e['line'] . ')']);
  }
});

// ---- CORS -------------------------------------------------------------------
header('Access-Control-Allow-Origin: ' . $config['cors_origin']);
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Content-Type: application/json; charset=utf-8');
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') { http_response_code(204); exit; }

// ---- Helpers ----------------------------------------------------------------
function jout($data, int $code = 200) {
  http_response_code($code);
  echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  exit;
}
function jerr(string $msg, int $code = 400) { jout(['error' => $msg], $code); }
function body(): array {
  $raw = file_get_contents('php://input');
  $d = json_decode($raw ?: '{}', true);
  return is_array($d) ? $d : [];
}
function uuid(): string {
  $d = random_bytes(16);
  $d[6] = chr((ord($d[6]) & 0x0f) | 0x40);
  $d[8] = chr((ord($d[8]) & 0x3f) | 0x80);
  return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($d), 4));
}
function now_iso(): string { return gmdate('Y-m-d\TH:i:s\Z'); }
function iso_to_ms(?string $iso): int { return $iso ? (int) (strtotime($iso) * 1000) : 0; }
function b64url(string $s): string { return rtrim(strtr(base64_encode($s), '+/', '-_'), '='); }
function b64url_dec(string $s): string { return base64_decode(strtr($s, '-_', '+/')); }

// ---- JWT (HS256) ------------------------------------------------------------
function jwt_sign(array $payload, string $secret): string {
  $h = b64url(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
  $p = b64url(json_encode($payload));
  $sig = b64url(hash_hmac('sha256', "$h.$p", $secret, true));
  return "$h.$p.$sig";
}
function jwt_verify(string $token, string $secret): ?array {
  $parts = explode('.', $token);
  if (count($parts) !== 3) return null;
  [$h, $p, $sig] = $parts;
  $expected = b64url(hash_hmac('sha256', "$h.$p", $secret, true));
  if (!hash_equals($expected, $sig)) return null;
  $payload = json_decode(b64url_dec($p), true);
  if (!is_array($payload)) return null;
  if (isset($payload['exp']) && time() > $payload['exp']) return null;
  return $payload;
}

// ---- Base de données --------------------------------------------------------
function db(array $config): PDO {
  static $pdo = null;
  if ($pdo) return $pdo;
  $c = $config['db'];
  $port = !empty($c['port']) ? ";port={$c['port']}" : '';
  if ($c['driver'] === 'sqlite') {
    @mkdir(dirname($c['sqlite_path']), 0775, true);
    $pdo = new PDO('sqlite:' . $c['sqlite_path']);
    $pdo->exec('PRAGMA foreign_keys = ON');
  } elseif ($c['driver'] === 'pgsql') {
    // PostgreSQL (proposé par certains cPanel, ex. TPE Cloud / paloma.hostns.io)
    $dsn = "pgsql:host={$c['host']}$port;dbname={$c['name']}";
    $pdo = new PDO($dsn, $c['user'], $c['pass']);
    $pdo->exec("SET client_encoding TO 'UTF8'");
  } else {
    $dsn = "mysql:host={$c['host']}$port;dbname={$c['name']};charset=utf8mb4";
    $pdo = new PDO($dsn, $c['user'], $c['pass']);
  }
  $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
  $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
  migrate($pdo);
  return $pdo;
}
function migrate(PDO $pdo): void {
  $drv    = $pdo->getAttribute(PDO::ATTR_DRIVER_NAME);
  $sqlite = $drv === 'sqlite';
  $pg     = $drv === 'pgsql';
  $id   = $sqlite ? 'TEXT' : 'VARCHAR(36)';
  $txt  = 'TEXT';
  $intT = 'INTEGER';
  $real = $sqlite ? 'REAL' : ($pg ? 'DOUBLE PRECISION' : 'DOUBLE');
  $ts   = $sqlite ? 'TEXT' : 'VARCHAR(32)';
  // PostgreSQL et SQLite n'ont pas de clause moteur/charset façon MySQL.
  $eng  = ($sqlite || $pg) ? '' : ' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4';
  $stmts = [
    "CREATE TABLE IF NOT EXISTS users (
      id $id PRIMARY KEY, email VARCHAR(190) UNIQUE, password_hash $txt, status $txt, created_at $ts
    )$eng",
    "CREATE TABLE IF NOT EXISTS profiles (
      id $id PRIMARY KEY, full_name $txt, first_name $txt, last_name $txt, gender $txt,
      birth_date $txt, phone $txt, bio $txt, avatar_url $txt, region_id $txt, city_id $txt,
      commune $txt, address $txt, lat $real, lng $real, created_at $ts
    )$eng",
    "CREATE TABLE IF NOT EXISTS listings (
      id $id PRIMARY KEY, user_id $id, title $txt, description $txt, price $intT,
      negotiable $intT, category_id $txt, subcategory $txt, condition_v $txt, images $txt,
      region_id $txt, city_id $txt, commune $txt, lat $real, lng $real, seller_name $txt,
      seller_phone $txt, delivery $intT, featured $intT, promo_price $intT, promo_until $ts,
      attributes $txt, hidden $intT, created_at $ts
    )$eng",
    "CREATE TABLE IF NOT EXISTS conversations (
      id $id PRIMARY KEY, listing_id $id, buyer_id $id, seller_id $id, created_at $ts
    )$eng",
    "CREATE TABLE IF NOT EXISTS messages (
      id $id PRIMARY KEY, conversation_id $id, sender_id $id, body $txt, created_at $ts
    )$eng",
    "CREATE TABLE IF NOT EXISTS orders (
      id $id PRIMARY KEY, buyer_id $id, seller_id $id, conversation_id $id, status $txt, created_at $ts
    )$eng",
    "CREATE TABLE IF NOT EXISTS order_items (
      id $id PRIMARY KEY, order_id $id, listing_id $id, title $txt, price $intT, image $txt
    )$eng",
    "CREATE TABLE IF NOT EXISTS reviews (
      id $id PRIMARY KEY, listing_id $id, seller_id $id, reviewer_id $id, rating $intT,
      comment $txt, created_at $ts
    )$eng",
    "CREATE TABLE IF NOT EXISTS newsletter (
      id $id PRIMARY KEY, email VARCHAR(190) UNIQUE, created_at $ts
    )$eng",
    "CREATE TABLE IF NOT EXISTS admins (
      email VARCHAR(190) PRIMARY KEY, created_at $ts
    )$eng",
    "CREATE TABLE IF NOT EXISTS user_interests (
      user_id $id, category_id $txt, weight $intT, subcategory $txt, updated_at $ts,
      PRIMARY KEY (user_id, category_id)
    )$eng",
    "CREATE TABLE IF NOT EXISTS reports (
      id $id PRIMARY KEY, listing_id $id, reporter_id $id, reason $txt, details $txt,
      status $txt, created_at $ts
    )$eng",
  ];
  foreach ($stmts as $s) $pdo->exec($s);

  // Colonnes ajoutées après coup : on les crée sur les bases déjà existantes.
  // (CREATE TABLE IF NOT EXISTS ne touche pas une table déjà présente.)
  try { $pdo->exec("ALTER TABLE user_interests ADD COLUMN subcategory $txt"); }
  catch (Throwable $e) { /* colonne déjà présente : on ignore */ }
  try { $pdo->exec("ALTER TABLE listings ADD COLUMN attributes $txt"); }
  catch (Throwable $e) { /* colonne déjà présente : on ignore */ }
  try { $pdo->exec("ALTER TABLE listings ADD COLUMN hidden $intT"); }
  catch (Throwable $e) { /* colonne déjà présente : on ignore */ }
  try { $pdo->exec("ALTER TABLE users ADD COLUMN status $txt"); }
  catch (Throwable $e) { /* colonne déjà présente : on ignore */ }
}

// ---- Auth courant -----------------------------------------------------------
function current_user(PDO $pdo, string $secret): ?array {
  $hdr = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
  if (!$hdr && function_exists('apache_request_headers')) {
    $h = apache_request_headers();
    $hdr = $h['Authorization'] ?? $h['authorization'] ?? '';
  }
  if (!preg_match('/Bearer\s+(.+)/i', $hdr, $m)) return null;
  $payload = jwt_verify(trim($m[1]), $secret);
  if (!$payload || empty($payload['sub'])) return null;
  $st = $pdo->prepare('SELECT id, email FROM users WHERE id = ?');
  $st->execute([$payload['sub']]);
  return $st->fetch() ?: null;
}
function require_user(PDO $pdo, string $secret): array {
  $u = current_user($pdo, $secret);
  if (!$u) jerr('Non authentifié.', 401);
  return $u;
}
function user_public(PDO $pdo, array $u): array {
  $st = $pdo->prepare('SELECT full_name FROM profiles WHERE id = ?');
  $st->execute([$u['id']]);
  $name = ($st->fetch()['full_name'] ?? null);
  $status = $u['status'] ?? null;
  if ($status === null) {
    $s = $pdo->prepare('SELECT status FROM users WHERE id = ?'); $s->execute([$u['id']]);
    $status = $s->fetch()['status'] ?? null;
  }
  return ['id' => $u['id'], 'email' => $u['email'], 'status' => $status ?: 'active',
          'user_metadata' => ['full_name' => $name]];
}
/** Emails « propriétaires » (config.php) : admins permanents, non supprimables. */
function owner_emails(array $config): array {
  return array_values(array_map('strtolower', $config['admin_emails'] ?? []));
}
/** L'utilisateur est-il administrateur ? Propriétaire (config) OU modérateur (table admins). */
function is_admin(array $config, PDO $pdo, array $u): bool {
  $email = strtolower($u['email'] ?? '');
  if ($email === '') return false;
  if (in_array($email, owner_emails($config), true)) return true;
  $st = $pdo->prepare('SELECT 1 FROM admins WHERE email = ?');
  $st->execute([$email]);
  return (bool) $st->fetch();
}

// ---- Emails -----------------------------------------------------------------
function mime_h(string $s): string { return '=?UTF-8?B?' . base64_encode($s) . '?='; }

/** Envoi authentifié via SMTP (fiable sur mutualisé). Renvoie false en cas d'échec. */
function smtp_send(array $s, string $from, string $fromName, string $to, string $subject, string $html, string $replyTo): bool {
  $host   = $s['host'] ?? 'localhost';
  $port   = (int) ($s['port'] ?? 465);
  $secure = strtolower($s['secure'] ?? 'ssl');
  $remote = ($secure === 'ssl' ? 'ssl://' : '') . $host . ':' . $port;
  $ctx = stream_context_create(['ssl' => ['verify_peer' => false, 'verify_peer_name' => false, 'allow_self_signed' => true]]);
  $fp = @stream_socket_client($remote, $errno, $errstr, 15, STREAM_CLIENT_CONNECT, $ctx);
  if (!$fp) return false;
  stream_set_timeout($fp, 15);
  $read = function () use ($fp) {
    $data = '';
    while (($line = fgets($fp, 515)) !== false) { $data .= $line; if (isset($line[3]) && $line[3] === ' ') break; }
    return $data;
  };
  $cmd = function ($c) use ($fp, $read) { fwrite($fp, $c . "\r\n"); return $read(); };
  $ok = fn($r, $code) => strncmp(ltrim($r), $code, 3) === 0 || strpos($r, "\n$code") !== false || substr($r, 0, 3) === $code;
  $read();
  $cmd('EHLO chap.ci');
  if ($secure === 'tls') {
    $cmd('STARTTLS');
    if (!@stream_socket_enable_crypto($fp, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) { fclose($fp); return false; }
    $cmd('EHLO chap.ci');
  }
  $cmd('AUTH LOGIN');
  $cmd(base64_encode($s['user'] ?? ''));
  $auth = $cmd(base64_encode($s['pass'] ?? ''));
  if (substr(ltrim($auth), 0, 3) !== '235') { $cmd('QUIT'); fclose($fp); return false; }
  $cmd('MAIL FROM:<' . $from . '>');
  $cmd('RCPT TO:<' . $to . '>');
  $d = $cmd('DATA');
  if (substr(ltrim($d), 0, 3) !== '354') { $cmd('QUIT'); fclose($fp); return false; }
  // En-têtes complets (Date + Message-ID sont EXIGÉS par les serveurs stricts
  // comme ProtonMail ; sans eux le message est rejeté ou classé en spam).
  $dom = substr(strrchr($from, '@'), 1) ?: 'chap.ci';
  $headers = 'Date: ' . date('r') . "\r\n"
    . 'Message-ID: <' . bin2hex(random_bytes(12)) . '@' . $dom . ">\r\n"
    . 'From: ' . mime_h($fromName) . ' <' . $from . ">\r\n"
    . 'Reply-To: ' . $replyTo . "\r\n"
    . 'To: <' . $to . ">\r\n"
    . 'Subject: ' . mime_h($subject) . "\r\n"
    . 'MIME-Version: 1.0' . "\r\n"
    . 'Content-Type: text/html; charset=UTF-8' . "\r\n"
    . 'Content-Transfer-Encoding: base64' . "\r\n"
    . 'X-Mailer: Chap.ci' . "\r\n";
  // Corps en base64 (lignes de 76 car.) : évite l'erreur « message has lines too
  // long for transport » (limite ~2048 car./ligne des serveurs mail).
  $body = chunk_split(base64_encode($html));
  fwrite($fp, $headers . "\r\n" . $body . ".\r\n");
  $sent = $read();
  $cmd('QUIT');
  fclose($fp);
  return substr(ltrim($sent), 0, 3) === '250';
}

/**
 * Envoie un email HTML. Utilise SMTP si un mot de passe SMTP est configuré
 * (fiable), sinon la fonction mail() de PHP. Best-effort : renvoie false sans
 * lever d'erreur si l'envoi échoue.
 */
function send_mail(array $config, string $to, string $subject, string $html, ?string $from = null, ?string $replyTo = null): bool {
  $from     = $from ?: ($config['mail_from'] ?? 'no-reply@chap.ci');
  $fromName = $config['mail_from_name'] ?? 'Chap.ci';
  $replyTo  = $replyTo ?: ($config['mail_reply_to'] ?? 'contact@chap.ci');
  $smtp     = $config['smtp'] ?? [];
  if (!empty($smtp['pass'])) {
    if (smtp_send($smtp, $from, $fromName, $to, $subject, $html, $replyTo)) return true;
    // Repli sur mail() si le SMTP échoue.
  }
  if (!function_exists('mail')) return false;
  $dom = substr(strrchr($from, '@'), 1) ?: 'chap.ci';
  $headers = implode("\r\n", [
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    'Date: ' . date('r'),
    'Message-ID: <' . bin2hex(random_bytes(12)) . '@' . $dom . '>',
    'From: ' . mime_h($fromName) . ' <' . $from . '>',
    'Reply-To: ' . $replyTo,
    'X-Mailer: Chap.ci',
  ]);
  // Corps en base64 (lignes de 76 car.) : évite « lines too long for transport ».
  return @mail($to, mime_h($subject), chunk_split(base64_encode($html)), $headers, '-f' . $from);
}
/** Bouton d'action réutilisable pour les emails. */
function email_button(string $href, string $label): string {
  return '<table role="presentation" cellpadding="0" cellspacing="0" style="margin:26px auto">'
    . '<tr><td style="border-radius:12px;background:#F77F00">'
    . '<a href="' . htmlspecialchars($href) . '" style="display:inline-block;padding:13px 30px;color:#fff;'
    . 'text-decoration:none;font-weight:bold;font-size:15px;border-radius:12px">' . htmlspecialchars($label) . '</a>'
    . '</td></tr></table>';
}
/** Gabarit HTML commun (logo + contenu + pied de page contact/réseaux/légal). */
function email_layout(array $config, string $inner, string $preheader = ''): string {
  $site    = rtrim($config['site_url'] ?? 'https://chap.ci', '/');
  $name    = $config['mail_from_name'] ?? 'Chap.ci';
  $logo    = $site . '/icons/icon-192.png';
  $contact = $config['mail_reply_to'] ?? 'contact@chap.ci';
  // Texte d'aperçu (masqué) affiché par les boîtes mail à côté de l'objet.
  $pre = $preheader
    ? '<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:#f4f5f7">' . htmlspecialchars($preheader) . '</div>'
    : '';
  // Réseaux sociaux (config.php 'social' => ['Facebook'=>'https://…', …]).
  $social = '';
  foreach (($config['social'] ?? []) as $label => $url) {
    if ($url) $social .= '<a href="' . htmlspecialchars($url) . '" style="color:#F77F00;text-decoration:none;margin:0 7px">' . htmlspecialchars($label) . '</a>';
  }
  $socialRow = $social ? '<p style="margin:8px 0">' . $social . '</p>' : '';
  $domain = preg_replace('#^https?://#', '', $site); // ex : chap.ci
  return $pre
    . '<div style="background:#f4f5f7;padding:24px 12px;font-family:Arial,Helvetica,sans-serif">'
    . '<div style="max-width:520px;margin:auto;color:#1f2937">'
    // En-tête : logo + nom (cliquables → site)
    . '<div style="text-align:center;padding:8px 0 14px">'
    . '<a href="' . $site . '" style="text-decoration:none;color:inherit;display:inline-block">'
    . '<img src="' . $logo . '" alt="' . htmlspecialchars($name) . '" width="60" height="60" style="border-radius:15px;display:inline-block">'
    . '<div style="font-size:20px;font-weight:bold;color:#111827;margin-top:8px">' . htmlspecialchars($name) . '</div>'
    . '</a></div>'
    // Carte : filet orange en haut + contenu
    . '<div style="background:#fff;border:1px solid #eef0f2;border-top:4px solid #F77F00;'
    . 'padding:26px 24px;border-radius:14px;box-shadow:0 1px 3px rgba(16,24,40,0.06)">' . $inner . '</div>'
    // Pied de page
    . '<div style="text-align:center;color:#9ca3af;font-size:12px;padding:18px 8px 4px">'
    . '<p style="margin:8px 0">Visitez notre site : <a href="' . $site . '" style="color:#F77F00;text-decoration:none;font-weight:bold">' . htmlspecialchars($domain) . '</a></p>'
    . '<p style="margin:8px 0">Nous contacter : <a href="mailto:' . $contact . '" style="color:#F77F00;text-decoration:none">' . $contact . '</a></p>'
    . $socialRow
    . '<p style="margin:8px 0"><a href="' . $site . '/#/confidentialite" style="color:#9ca3af">Confidentialité</a> · '
    . '<a href="' . $site . '/#/conditions" style="color:#9ca3af">Conditions d’utilisation</a></p>'
    . '<p style="margin:10px 0 0">' . htmlspecialchars($name) . ' — 100% ivoirien 🇨🇮</p>'
    . '</div></div></div>';
}
/** Email de bienvenue envoyé à la création d'un compte. */
function send_welcome_email(array $config, string $to, string $fullName = ''): bool {
  $site  = rtrim($config['site_url'] ?? 'https://chap.ci', '/');
  $name  = $config['mail_from_name'] ?? 'Chap.ci';
  $hi    = trim($fullName) !== '' ? 'Bonjour ' . htmlspecialchars($fullName) . ',' : 'Bonjour,';
  $inner =
    '<h2 style="margin-top:0;color:#111827">Bienvenue sur ' . htmlspecialchars($name) . ' 🎉</h2>'
    . '<p>' . $hi . '</p>'
    . '<p>Votre compte est prêt. Achetez et vendez <b>chap-chap</b>, partout en Côte d’Ivoire :</p>'
    . '<ul style="padding-left:18px;line-height:1.8">'
    . '<li>📸 Publiez une annonce en quelques secondes.</li>'
    . '<li>📍 Trouvez les bonnes affaires près de chez vous.</li>'
    . '<li>💬 Échangez en toute sécurité avec la messagerie.</li>'
    . '</ul>'
    . email_button($site, 'Découvrir ' . htmlspecialchars($name))
    . '<p style="margin-top:22px">Bonne découverte,<br><b>L’équipe ' . htmlspecialchars($name) . '</b></p>'
    . '<p style="color:#6b7280;font-size:13px;margin-top:14px">Une question ? Répondez simplement à cet email.</p>';
  return send_mail($config, $to, "Bienvenue sur $name 🎉",
    email_layout($config, $inner, "Votre compte $name est prêt — achetez et vendez chap-chap partout en Côte d’Ivoire."));
}
/** Résumé lisible des articles d'une commande (ex : « Vélo » (+2 autres)). */
function items_summary(array $items): string {
  $titles = array_values(array_filter(array_map(fn($it) => trim((string) ($it['title'] ?? '')), $items)));
  if (!$titles) return 'votre article';
  $more = count($titles) - 1;
  return $more > 0 ? '« ' . $titles[0] . ' » (+' . $more . ' autre' . ($more > 1 ? 's' : '') . ')' : '« ' . $titles[0] . ' »';
}
/** Confirmation d'inscription à la newsletter (à l'abonné). */
function send_newsletter_email(array $config, string $to): bool {
  $site = rtrim($config['site_url'] ?? 'https://chap.ci', '/');
  $name = $config['mail_from_name'] ?? 'Chap.ci';
  $inner =
    '<h2 style="margin-top:0">C’est confirmé 🎉</h2>'
    . '<p>Bonjour,</p>'
    . '<p>Vous êtes bien inscrit(e) à la newsletter de <b>' . htmlspecialchars($name) . '</b>. '
    . 'Recevez nos meilleures annonces et bons plans, avant tout le monde.</p>'
    . email_button($site, 'Voir les annonces')
    . '<p style="margin-top:22px">À très vite,<br><b>L’équipe ' . htmlspecialchars($name) . '</b></p>';
  // La newsletter part de hello@ (réponse possible), pas de no-reply@.
  $from = $config['mail_newsletter_from'] ?? 'hello@chap.ci';
  return send_mail($config, $to, "Bienvenue dans la newsletter $name",
    email_layout($config, $inner, "Votre inscription à la newsletter $name est confirmée."), $from, $from);
}
/** Notification au vendeur : une nouvelle demande d'achat. */
function send_order_seller_email(array $config, string $to, array $items): bool {
  $site = rtrim($config['site_url'] ?? 'https://chap.ci', '/');
  $name = $config['mail_from_name'] ?? 'Chap.ci';
  $inner =
    '<h2 style="margin-top:0">Nouvelle demande d’achat 🛍️</h2>'
    . '<p>Bonjour,</p>'
    . '<p>Bonne nouvelle ! Un acheteur souhaite acheter ' . htmlspecialchars(items_summary($items)) . '.</p>'
    . '<p>Répondez-lui vite via la messagerie pour conclure la vente.</p>'
    . email_button($site . '/#/messages', 'Répondre à l’acheteur')
    . '<p style="margin-top:22px">Bonne vente,<br><b>L’équipe ' . htmlspecialchars($name) . '</b></p>';
  return send_mail($config, $to, "Nouvelle demande d’achat sur $name",
    email_layout($config, $inner, 'Un acheteur est intéressé par votre annonce.'));
}
/** Confirmation à l'acheteur : demande envoyée au vendeur. */
function send_order_buyer_email(array $config, string $to, array $items): bool {
  $site = rtrim($config['site_url'] ?? 'https://chap.ci', '/');
  $name = $config['mail_from_name'] ?? 'Chap.ci';
  $inner =
    '<h2 style="margin-top:0">Demande envoyée ✅</h2>'
    . '<p>Bonjour,</p>'
    . '<p>Votre demande d’achat pour ' . htmlspecialchars(items_summary($items)) . ' a bien été transmise au vendeur. '
    . 'Il vous répondra directement via la messagerie.</p>'
    . email_button($site . '/#/compte', 'Suivre ma demande')
    . '<p style="margin-top:22px">Bon achat,<br><b>L’équipe ' . htmlspecialchars($name) . '</b></p>';
  return send_mail($config, $to, 'Votre demande a bien été envoyée',
    email_layout($config, $inner, 'Votre demande d’achat a été transmise au vendeur.'));
}
/** Construit l'email HTML d'une campagne à partir d'un message texte libre. */
function campaign_html(array $config, string $message): string {
  $site = rtrim($config['site_url'] ?? 'https://chap.ci', '/');
  $name = $config['mail_from_name'] ?? 'Chap.ci';
  // Texte libre -> paragraphes HTML sûrs (les sauts de ligne sont conservés).
  $paras = array_filter(array_map('trim', preg_split('/\n\s*\n/', $message)));
  $body = '';
  foreach ($paras as $p) $body .= '<p>' . nl2br(htmlspecialchars($p)) . '</p>';
  if ($body === '') $body = '<p>' . nl2br(htmlspecialchars($message)) . '</p>';
  $inner = $body
    . email_button($site, 'Voir les annonces')
    . '<p style="margin-top:20px">À très vite,<br><b>L’équipe ' . htmlspecialchars($name) . '</b></p>';
  return email_layout($config, $inner, mb_substr(trim(strip_tags($message)), 0, 90));
}
/** Sélectionne les annonces à mettre en avant (promos d'abord, puis récentes). */
function digest_listings(PDO $pdo, int $limit = 6): array {
  $rows = $pdo->query(
    'SELECT id,title,price,images,commune,city_id,promo_price,promo_until FROM listings
     ORDER BY (CASE WHEN promo_price IS NOT NULL THEN 0 ELSE 1 END), created_at DESC
     LIMIT ' . (int) $limit
  )->fetchAll();
  return $rows;
}
/** Construit l'email « offres » avec des cartes d'annonces cliquables (type OLX/eBay). */
function digest_html(array $config, array $rows, string $type, string $context = ''): string {
  $site = rtrim($config['site_url'] ?? 'https://chap.ci', '/');
  $name = $config['mail_from_name'] ?? 'Chap.ci';
  $title = $type === 'weekly' ? '✨ La sélection de la semaine'
    : ($type === 'perso' ? '✨ Sélectionné pour vous' : '🔥 Les bonnes affaires du jour');
  if ($type === 'perso') {
    // Message précis : on nomme la catégorie qui a motivé la sélection.
    $intro = $context !== ''
      ? 'Parce que vous vous intéressez à <b>' . htmlspecialchars($context) . '</b>, voici des articles similaires qui pourraient vous plaire 👇'
      : 'Voici une sélection d’articles qui pourraient vous plaire 👇';
  } else {
    $intro = 'Voici les annonces à ne pas manquer sur <b>' . htmlspecialchars($name) . '</b> 👇';
  }
  $cards = '';
  foreach ($rows as $r) {
    $imgs = $r['images'] ? (json_decode($r['images'], true) ?: []) : [];
    $img = $imgs[0] ?? '';
    if ($img && $img[0] === '/') $img = $site . $img; // /uploads/... -> URL absolue
    $imgCell = ($img && (str_starts_with($img, 'http')))
      ? '<img src="' . htmlspecialchars($img) . '" width="92" height="92" style="width:92px;height:92px;object-fit:cover;display:block;border-radius:10px">'
      : '<div style="width:92px;height:92px;border-radius:10px;background:#fff3e6;text-align:center;line-height:92px;font-size:34px">🛍️</div>';
    $promoActive = !empty($r['promo_price']) && (empty($r['promo_until']) || $r['promo_until'] > now_iso());
    $price = $promoActive
      ? '<span style="color:#F77F00;font-weight:bold;font-size:16px">' . number_format((int) $r['promo_price'], 0, ',', ' ') . ' FCFA</span>'
        . ' <span style="color:#aaa;text-decoration:line-through;font-size:12px">' . number_format((int) $r['price'], 0, ',', ' ') . '</span>'
      : '<span style="color:#F77F00;font-weight:bold;font-size:16px">' . number_format((int) $r['price'], 0, ',', ' ') . ' FCFA</span>';
    $loc = $r['commune'] ?: ($r['city_id'] ?: '');
    $cards .=
      '<a href="' . $site . '/#/annonce/' . htmlspecialchars($r['id']) . '" style="display:block;text-decoration:none;color:inherit;border:1px solid #eef0f2;border-radius:12px;overflow:hidden;margin-bottom:12px">'
      . '<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse"><tr>'
      . '<td style="width:92px;padding:8px" valign="top">' . $imgCell . '</td>'
      . '<td style="padding:10px 12px 10px 4px" valign="top">'
      . '<div style="font-weight:bold;color:#111827;font-size:15px">' . htmlspecialchars(mb_strimwidth($r['title'], 0, 60, '…')) . '</div>'
      . '<div style="margin-top:4px">' . $price . ($promoActive ? ' <span style="background:#F77F00;color:#fff;border-radius:6px;padding:1px 6px;font-size:11px;font-weight:bold">PROMO</span>' : '') . '</div>'
      . ($loc ? '<div style="color:#9ca3af;font-size:12px;margin-top:3px">📍 ' . htmlspecialchars($loc) . '</div>' : '')
      . '</td></tr></table></a>';
  }
  $inner =
    '<h2 style="margin-top:0">' . $title . '</h2>'
    . '<p>' . $intro . '</p>'
    . $cards
    . email_button($site, 'Voir toutes les annonces')
    . '<p style="margin-top:20px">Bonnes affaires,<br><b>L’équipe ' . htmlspecialchars($name) . '</b></p>';
  return email_layout($config, $inner, $title . ' sur ' . $name);
}
/** Envoie l'email « offres » à tous les abonnés (par lots). Renvoie le nb envoyé. */
function send_digest(array $config, PDO $pdo, string $type): array {
  $rows = digest_listings($pdo, 6);
  if (!$rows) return ['sent' => 0, 'listings' => 0, 'reason' => 'aucune annonce'];
  $html = digest_html($config, $rows, $type);
  $subject = $type === 'weekly' ? 'La sélection de la semaine ✨' : 'Les bonnes affaires du jour 🔥';
  $from = $config['mail_newsletter_from'] ?? 'hello@chap.ci';
  $subs = $pdo->query('SELECT email FROM newsletter')->fetchAll();
  $sent = 0;
  foreach ($subs as $s) { if (send_mail($config, $s['email'], $subject, $html, $from, $from)) $sent++; }
  return ['sent' => $sent, 'listings' => count($rows), 'subscribers' => count($subs)];
}
/** Libellé français d'une catégorie (miroir de src/data/categories.ts) pour les emails. */
function category_label(?string $id): string {
  static $labels = [
    'vehicules' => 'Véhicules', 'immobilier' => 'Immobilier', 'telephones' => 'Téléphones',
    'electronique' => 'Électronique', 'maison' => 'Maison & Meubles', 'mode' => 'Mode & Beauté',
    'emploi' => 'Emploi', 'services' => 'Services', 'materiel-pro' => 'Matériel Pro',
    'alimentation' => 'Alimentation & Boissons', 'agriculture' => 'Agriculture',
    'animaux' => 'Animaux', 'loisirs' => 'Loisirs & Sport', 'bebe' => 'Bébé & Enfant',
  ];
  return $labels[$id] ?? '';
}

/**
 * « Agent » de recommandation : annonces des catégories préférées de l'utilisateur,
 * classées finement — catégorie la plus aimée d'abord, puis MÊME SOUS-CATÉGORIE
 * (produits similaires), puis promotions, puis les plus récentes.
 */
function suggestions_for_user(PDO $pdo, string $userId, int $limit = 6): array {
  $c = $pdo->prepare('SELECT category_id, subcategory, weight FROM user_interests WHERE user_id = ? ORDER BY weight DESC, updated_at DESC LIMIT 3');
  $c->execute([$userId]);
  $interests = $c->fetchAll();
  $cats = array_values(array_filter(array_column($interests, 'category_id')));
  if (!$cats) return [];
  // Sous-catégorie et poids mémorisés par catégorie (pour scorer la similarité).
  $subByCat = []; $weightByCat = [];
  foreach ($interests as $it) {
    $subByCat[$it['category_id']]    = (string) ($it['subcategory'] ?? '');
    $weightByCat[$it['category_id']] = (int) $it['weight'];
  }
  $in = implode(',', array_fill(0, count($cats), '?'));
  // Vivier large, classé ensuite en PHP (portable MySQL/PostgreSQL/SQLite).
  $st = $pdo->prepare(
    "SELECT id,title,price,images,commune,city_id,promo_price,promo_until,category_id,subcategory,created_at
     FROM listings WHERE category_id IN ($in) AND (user_id IS NULL OR user_id <> ?)
     ORDER BY created_at DESC LIMIT 60"
  );
  $st->execute(array_merge($cats, [$userId]));
  $rows = $st->fetchAll();
  if (!$rows) return [];
  $now = now_iso();
  $score = function (array $r) use ($subByCat, $weightByCat, $now): int {
    $s = ($weightByCat[$r['category_id']] ?? 0) * 10;          // catégorie préférée
    $wantSub = $subByCat[$r['category_id']] ?? '';
    if ($wantSub !== '' && (string) ($r['subcategory'] ?? '') === $wantSub) $s += 100; // similaire
    $promo = !empty($r['promo_price']) && (empty($r['promo_until']) || $r['promo_until'] > $now);
    if ($promo) $s += 5;                                        // promo
    return $s;
  };
  usort($rows, function ($a, $b) use ($score) {
    $d = $score($b) <=> $score($a);
    return $d !== 0 ? $d : strcmp((string) $b['created_at'], (string) $a['created_at']); // récence
  });
  return array_slice($rows, 0, $limit);
}
/**
 * Envoie l'email de suggestions personnalisées à un utilisateur.
 *
 * $preview : mode « aperçu » réservé au test admin. Si l'utilisateur n'a pas
 * encore d'historique — ou si les seules annonces disponibles sont les siennes
 * (exclues de ses propres suggestions) — on montre les annonces récentes pour
 * visualiser le rendu de l'email. Le cron réel appelle SANS ce mode : les vrais
 * abonnés ne reçoivent que des suggestions authentiquement personnalisées.
 */
function send_suggestions(array $config, PDO $pdo, array $user, bool $preview = false): array {
  if (empty($user['email'])) return ['sent' => 0, 'listings' => 0, 'reason' => 'email manquant'];
  $rows = suggestions_for_user($pdo, $user['id'], 6);
  $personalized = !empty($rows);
  if (!$rows && $preview) $rows = digest_listings($pdo, 6); // aperçu : annonces récentes
  if (!$rows) return ['sent' => 0, 'listings' => 0, 'personalized' => false, 'reason' => 'aucune annonce à suggérer'];
  // Catégorie dominante (1re annonce classée) = ce qui motive la sélection.
  $context = $personalized ? category_label($rows[0]['category_id'] ?? null) : '';
  $html = digest_html($config, $rows, 'perso', $context);
  $from = $config['mail_newsletter_from'] ?? 'hello@chap.ci';
  $ok = send_mail($config, $user['email'], 'Des annonces pour vous ✨', $html, $from, $from);
  return ['sent' => $ok ? 1 : 0, 'listings' => count($rows), 'personalized' => $personalized,
          'category' => $context, 'titles' => array_column($rows, 'title')];
}
/** Notifie une personne qu'elle est devenue modératrice du site. */
function send_moderator_email(array $config, string $to): bool {
  $site  = rtrim($config['site_url'] ?? 'https://chap.ci', '/');
  $name  = $config['mail_from_name'] ?? 'Chap.ci';
  $admin = $site . '/#/admin';
  $inner =
    '<h2 style="margin-top:0">Bienvenue dans l’équipe 🎉</h2>'
    . '<p>Bonjour,</p>'
    . '<p>Vous rejoignez la modération de <b>' . htmlspecialchars($name) . '</b>. Merci de votre confiance !</p>'
    . email_button($admin, 'Ouvrir le tableau de bord')
    . '<p>Connectez-vous avec cette adresse (<b>' . htmlspecialchars($to) . '</b>) pour y accéder depuis votre profil.</p>'
    . '<p style="margin-top:22px">À très vite,<br><b>L’équipe ' . htmlspecialchars($name) . '</b></p>';
  return send_mail($config, $to, "Bienvenue dans l’équipe $name",
    email_layout($config, $inner, "Vous rejoignez l’équipe de modération de $name."));
}
/** Notifie les administrateurs qu'une annonce a été signalée. */
function send_report_email(array $config, string $reporter, string $title, string $listingId, string $reason, string $details): void {
  $admins = $config['admin_emails'] ?? [];
  if (!$admins) return;
  $site = rtrim($config['site_url'] ?? 'https://chap.ci', '/');
  $name = $config['mail_from_name'] ?? 'Chap.ci';
  $link = $site . '/#/annonce/' . rawurlencode($listingId);
  $row = function (string $k, string $v): string {
    return '<tr><td style="padding:4px 0;color:#6b7280;width:110px">' . $k . '</td><td style="padding:4px 0">' . $v . '</td></tr>';
  };
  $inner =
    '<h2 style="margin-top:0">🚩 Nouveau signalement</h2>'
    . '<p>Une annonce vient d’être signalée sur <b>' . htmlspecialchars($name) . '</b>.</p>'
    . '<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:10px 0">'
    . $row('Annonce', '<b>' . htmlspecialchars($title) . '</b>')
    . $row('Motif', '<b>' . htmlspecialchars($reason) . '</b>')
    . ($details !== '' ? $row('Détails', htmlspecialchars($details)) : '')
    . $row('Signalé par', htmlspecialchars($reporter))
    . '</table>'
    . email_button($link, 'Voir l’annonce')
    . '<p style="color:#6b7280;font-size:13px;margin-top:14px">Gérez les signalements depuis votre tableau de bord : '
    . '<a href="' . $site . '/#/admin" style="color:#F77F00">Modération</a>.</p>';
  $html = email_layout($config, $inner, 'Nouveau signalement sur ' . $name);
  $subject = '🚩 Signalement — ' . mb_strimwidth($title, 0, 40, '…');
  foreach ($admins as $to) send_mail($config, $to, $subject, $html);
}

// ---- Photos : enregistre une data-URI base64 en fichier, renvoie l'URL -------
function save_data_uri(array $config, string $dataUri): ?string {
  // Déjà une URL (http/https ou /uploads/…) : on la garde telle quelle.
  if (str_starts_with($dataUri, 'http') || str_starts_with($dataUri, '/')) return $dataUri;
  // data:<meta>,<données> — on coupe au PREMIER virgule (le SVG peut contenir des virgules).
  if (!str_starts_with($dataUri, 'data:')) return null;
  $comma = strpos($dataUri, ',');
  if ($comma === false) return null;
  $meta = substr($dataUri, 5, $comma - 5); // ex: image/svg+xml;utf8  ou  image/png;base64
  $data = substr($dataUri, $comma + 1);
  if (!str_starts_with($meta, 'image/')) return null;
  $isB64 = str_contains($meta, ';base64');
  $mime = strtolower(explode(';', substr($meta, 6))[0]); // après "image/", avant le 1er ";"
  $ext = str_contains($mime, 'svg') ? 'svg'
       : (str_contains($mime, 'jpeg') || str_contains($mime, 'jpg') ? 'jpg'
       : (str_contains($mime, 'webp') ? 'webp'
       : (str_contains($mime, 'gif') ? 'gif' : (str_contains($mime, 'png') ? 'png' : 'img'))));
  $bin = $isB64 ? base64_decode($data) : rawurldecode($data);
  if ($bin === false || $bin === '') return null;
  $dir = $config['uploads_dir'];
  if (!is_dir($dir)) @mkdir($dir, 0775, true);
  // Sécurité : interdire l'exécution de scripts dans le dossier des photos.
  $ht = "$dir/.htaccess";
  if (!file_exists($ht)) {
    @file_put_contents($ht, "Options -ExecCGI\n<FilesMatch \"\\.(php|phtml|phar|cgi|pl)$\">\n  Require all denied\n</FilesMatch>\n");
  }
  $name = date('Ym') . '-' . uuid() . '.' . $ext;
  if (@file_put_contents("$dir/$name", $bin) === false) return null;
  return rtrim($config['uploads_path'], '/') . '/' . $name;
}

// ---- Mise en forme des lignes -> JSON attendu par le frontend ---------------
function listing_out(array $r): array {
  return [
    'id' => $r['id'], 'title' => $r['title'], 'description' => $r['description'],
    'price' => (int) $r['price'], 'negotiable' => (bool) $r['negotiable'], 'currency' => 'FCFA',
    'categoryId' => $r['category_id'], 'subcategory' => $r['subcategory'] ?: null,
    'condition' => $r['condition_v'] === 'neuf' ? 'neuf' : 'occasion',
    'images' => $r['images'] ? (json_decode($r['images'], true) ?: []) : [],
    'regionId' => $r['region_id'], 'cityId' => $r['city_id'] ?: '', 'commune' => $r['commune'] ?: null,
    'lat' => $r['lat'] !== null ? (float) $r['lat'] : null,
    'lng' => $r['lng'] !== null ? (float) $r['lng'] : null,
    'sellerName' => $r['seller_name'], 'sellerPhone' => $r['seller_phone'],
    'sellerId' => $r['user_id'] ?: null,
    'createdAt' => iso_to_ms($r['created_at']),
    'delivery' => (bool) $r['delivery'], 'featured' => (bool) $r['featured'],
    'promoPrice' => $r['promo_price'] !== null ? (int) $r['promo_price'] : null,
    'promoUntil' => $r['promo_until'] ? iso_to_ms($r['promo_until']) : null,
    'attributes' => !empty($r['attributes']) ? (json_decode($r['attributes'], true) ?: null) : null,
    'hidden' => !empty($r['hidden']),
  ];
}

// =============================================================================
//  Routeur
// =============================================================================
try {
  $pdo = db($config);
} catch (Throwable $e) {
  // Cause la plus fréquente à l'installation : identifiants MySQL erronés dans
  // config.php. On renvoie un message clair plutôt qu'une erreur 500 brute.
  jerr('Connexion à la base de données impossible. Vérifiez les identifiants dans api/config.php (driver mysql/pgsql, host, name, user, pass). Détail : ' . $e->getMessage(), 500);
}
$secret = $config['jwt_secret'];
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

// Chemin après /api
$uri  = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?? '/';
$path = preg_replace('#^.*/api/?#', '', $uri);
$path = trim($path, '/');
$seg  = $path === '' ? [] : explode('/', $path);

try {
  // ---------- AUTH ----------
  if ($path === 'auth/signup' && $method === 'POST') {
    $b = body();
    $email = strtolower(trim($b['email'] ?? ''));
    $pass  = (string) ($b['password'] ?? '');
    $name  = trim($b['full_name'] ?? '');
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) jerr('Adresse email invalide.');
    if (strlen($pass) < 8) jerr('Le mot de passe doit faire au moins 8 caractères.');
    $ex = $pdo->prepare('SELECT id FROM users WHERE email = ?'); $ex->execute([$email]);
    if ($ex->fetch()) jerr('Cet email a déjà un compte. Connectez-vous.');
    $id = uuid();
    $pdo->prepare('INSERT INTO users (id,email,password_hash,created_at) VALUES (?,?,?,?)')
        ->execute([$id, $email, password_hash($pass, PASSWORD_BCRYPT), now_iso()]);
    $pdo->prepare('INSERT INTO profiles (id,full_name,created_at) VALUES (?,?,?)')
        ->execute([$id, $name, now_iso()]);
    // Email de bienvenue (best-effort : n'empêche jamais la création du compte).
    send_welcome_email($config, $email, $name);
    $token = jwt_sign(['sub' => $id, 'email' => $email, 'exp' => time() + 60 * 60 * 24 * 30], $secret);
    jout(['token' => $token, 'user' => user_public($pdo, ['id' => $id, 'email' => $email])]);
  }

  if ($path === 'auth/login' && $method === 'POST') {
    $b = body();
    $email = strtolower(trim($b['email'] ?? ''));
    $st = $pdo->prepare('SELECT id,email,password_hash,status FROM users WHERE email = ?');
    $st->execute([$email]); $u = $st->fetch();
    if (!$u || !password_verify((string) ($b['password'] ?? ''), $u['password_hash']))
      jerr('Email ou mot de passe incorrect.', 401);
    if (($u['status'] ?? 'active') === 'blocked')
      jerr('Votre compte a été bloqué. Contactez le support à contact@chap.ci.', 403);
    $token = jwt_sign(['sub' => $u['id'], 'email' => $u['email'], 'exp' => time() + 60 * 60 * 24 * 30], $secret);
    jout(['token' => $token, 'user' => user_public($pdo, $u)]);
  }

  if ($path === 'auth/me' && $method === 'GET') {
    $u = current_user($pdo, $secret);
    jout(['user' => $u ? user_public($pdo, $u) : null]);
  }

  if ($path === 'auth/password' && $method === 'POST') {
    $u = require_user($pdo, $secret); $b = body();
    if (strlen((string) ($b['password'] ?? '')) < 8) jerr('Mot de passe trop court.');
    $pdo->prepare('UPDATE users SET password_hash = ? WHERE id = ?')
        ->execute([password_hash($b['password'], PASSWORD_BCRYPT), $u['id']]);
    jout(['ok' => true]);
  }

  if ($path === 'auth/delete' && $method === 'POST') {
    $u = require_user($pdo, $secret); $id = $u['id']; $b = body();
    // Vérification : on redemande le mot de passe avant toute suppression.
    $st = $pdo->prepare('SELECT password_hash FROM users WHERE id = ?'); $st->execute([$id]);
    $hash = $st->fetch()['password_hash'] ?? '';
    if (!password_verify((string) ($b['password'] ?? ''), $hash))
      jerr('Mot de passe incorrect. Suppression annulée.', 403);
    $pdo->prepare('DELETE FROM reports WHERE reporter_id = ?')->execute([$id]);
    $pdo->prepare('DELETE FROM messages WHERE sender_id = ?')->execute([$id]);
    $pdo->prepare('DELETE FROM conversations WHERE buyer_id = ? OR seller_id = ?')->execute([$id, $id]);
    $pdo->prepare('DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE buyer_id = ? OR seller_id = ?)')->execute([$id, $id]);
    $pdo->prepare('DELETE FROM orders WHERE buyer_id = ? OR seller_id = ?')->execute([$id, $id]);
    $pdo->prepare('DELETE FROM reviews WHERE reviewer_id = ? OR seller_id = ?')->execute([$id, $id]);
    $pdo->prepare('DELETE FROM listings WHERE user_id = ?')->execute([$id]);
    $pdo->prepare('DELETE FROM profiles WHERE id = ?')->execute([$id]);
    $pdo->prepare('DELETE FROM users WHERE id = ?')->execute([$id]);
    jout(['ok' => true]);
  }

  // ---------- LISTINGS ----------
  if ($path === 'listings' && $method === 'GET') {
    // Le public ne voit pas les annonces masquées (par le vendeur ou la modération).
    $rows = $pdo->query('SELECT * FROM listings WHERE hidden IS NULL OR hidden = 0 ORDER BY created_at DESC LIMIT 500')->fetchAll();
    jout(array_map('listing_out', $rows));
  }

  if ($path === 'listings' && $method === 'POST') {
    $u = require_user($pdo, $secret); $b = body();
    // Comptes restreints/bloqués : publication interdite.
    $stt = $pdo->prepare('SELECT status FROM users WHERE id = ?'); $stt->execute([$u['id']]);
    $ustatus = $stt->fetch()['status'] ?? 'active';
    if (in_array($ustatus, ['blocked', 'restricted'], true))
      jerr('Votre compte ne peut pas publier d’annonce pour le moment. Contactez le support.', 403);
    if (!trim($b['title'] ?? '')) jerr('Titre manquant.');
    $images = [];
    foreach ((array) ($b['images'] ?? []) as $img) {
      $url = save_data_uri($config, (string) $img);
      if ($url) $images[] = $url;
    }
    $id = uuid();
    $promoUntil = !empty($b['promoUntil']) ? gmdate('Y-m-d\TH:i:s\Z', (int) ($b['promoUntil'] / 1000)) : null;
    // Attributs spécifiques à la catégorie (marque, année, surface…) : on ne
    // garde que des paires clé/valeur textuelles non vides.
    $attrs = [];
    if (!empty($b['attributes']) && is_array($b['attributes'])) {
      foreach ($b['attributes'] as $k => $v) {
        $k = substr(trim((string) $k), 0, 40);
        $v = substr(trim((string) $v), 0, 120);
        if ($k !== '' && $v !== '') $attrs[$k] = $v;
      }
    }
    $attrsJson = $attrs ? json_encode($attrs, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) : null;
    $pdo->prepare('INSERT INTO listings
      (id,user_id,title,description,price,negotiable,category_id,subcategory,condition_v,images,
       region_id,city_id,commune,lat,lng,seller_name,seller_phone,delivery,featured,promo_price,promo_until,attributes,created_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)')
      ->execute([
        $id, $u['id'], trim($b['title']), trim($b['description'] ?? ''), (int) ($b['price'] ?? 0),
        !empty($b['negotiable']) ? 1 : 0, $b['categoryId'] ?? '', $b['subcategory'] ?? null,
        ($b['condition'] ?? 'occasion'), json_encode($images, JSON_UNESCAPED_SLASHES),
        $b['regionId'] ?? '', $b['cityId'] ?? '', $b['commune'] ?? null,
        isset($b['lat']) ? (float) $b['lat'] : null, isset($b['lng']) ? (float) $b['lng'] : null,
        $b['sellerName'] ?? '', $b['sellerPhone'] ?? '', !empty($b['delivery']) ? 1 : 0, 0,
        isset($b['promoPrice']) ? (int) $b['promoPrice'] : null, $promoUntil, $attrsJson, now_iso(),
      ]);
    $st = $pdo->prepare('SELECT * FROM listings WHERE id = ?'); $st->execute([$id]);
    jout(listing_out($st->fetch()));
  }

  // Mes annonces — inclut les annonces masquées (gestion par le vendeur).
  if ($path === 'listings/mine' && $method === 'GET') {
    $u = require_user($pdo, $secret);
    $st = $pdo->prepare('SELECT * FROM listings WHERE user_id = ? ORDER BY created_at DESC');
    $st->execute([$u['id']]);
    jout(array_map('listing_out', $st->fetchAll()));
  }

  // Modifier son annonce.
  if (count($seg) === 2 && $seg[0] === 'listings' && $method === 'PUT') {
    $u = require_user($pdo, $secret); $b = body();
    $st = $pdo->prepare('SELECT user_id FROM listings WHERE id = ?'); $st->execute([$seg[1]]);
    $row = $st->fetch();
    if (!$row) jerr('Annonce introuvable.', 404);
    if ($row['user_id'] !== $u['id']) jerr('Non autorisé.', 403);
    if (!trim($b['title'] ?? '')) jerr('Titre manquant.');
    // Images : on garde les URLs existantes, on enregistre les nouvelles (data-URI).
    $images = [];
    foreach ((array) ($b['images'] ?? []) as $img) {
      $img = (string) $img;
      if ($img === '') continue;
      if (strncmp($img, 'data:', 5) === 0) { $url = save_data_uri($config, $img); if ($url) $images[] = $url; }
      else $images[] = $img;
    }
    $attrs = [];
    if (!empty($b['attributes']) && is_array($b['attributes'])) {
      foreach ($b['attributes'] as $k => $v) {
        $k = substr(trim((string) $k), 0, 40); $v = substr(trim((string) $v), 0, 120);
        if ($k !== '' && $v !== '') $attrs[$k] = $v;
      }
    }
    $attrsJson = $attrs ? json_encode($attrs, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) : null;
    $promoUntil = !empty($b['promoUntil']) ? gmdate('Y-m-d\TH:i:s\Z', (int) ($b['promoUntil'] / 1000)) : null;
    $pdo->prepare('UPDATE listings SET title=?,description=?,price=?,negotiable=?,category_id=?,subcategory=?,
        condition_v=?,images=?,region_id=?,city_id=?,commune=?,lat=?,lng=?,seller_name=?,seller_phone=?,
        delivery=?,promo_price=?,promo_until=?,attributes=? WHERE id=?')
      ->execute([
        trim($b['title']), trim($b['description'] ?? ''), (int) ($b['price'] ?? 0),
        !empty($b['negotiable']) ? 1 : 0, $b['categoryId'] ?? '', $b['subcategory'] ?? null,
        ($b['condition'] ?? 'occasion'), json_encode($images, JSON_UNESCAPED_SLASHES),
        $b['regionId'] ?? '', $b['cityId'] ?? '', $b['commune'] ?? null,
        isset($b['lat']) ? (float) $b['lat'] : null, isset($b['lng']) ? (float) $b['lng'] : null,
        $b['sellerName'] ?? '', $b['sellerPhone'] ?? '', !empty($b['delivery']) ? 1 : 0,
        isset($b['promoPrice']) ? (int) $b['promoPrice'] : null, $promoUntil, $attrsJson, $seg[1],
      ]);
    $st = $pdo->prepare('SELECT * FROM listings WHERE id = ?'); $st->execute([$seg[1]]);
    jout(listing_out($st->fetch()));
  }

  // Masquer / réafficher son annonce (le vendeur, ou un admin).
  if (count($seg) === 3 && $seg[0] === 'listings' && $seg[2] === 'visibility' && $method === 'POST') {
    $u = require_user($pdo, $secret); $b = body();
    $st = $pdo->prepare('SELECT user_id FROM listings WHERE id = ?'); $st->execute([$seg[1]]);
    $row = $st->fetch();
    if (!$row) jerr('Annonce introuvable.', 404);
    if ($row['user_id'] !== $u['id'] && !is_admin($config, $pdo, $u)) jerr('Non autorisé.', 403);
    $hidden = !empty($b['hidden']) ? 1 : 0;
    $pdo->prepare('UPDATE listings SET hidden = ? WHERE id = ?')->execute([$hidden, $seg[1]]);
    jout(['ok' => true, 'hidden' => (bool) $hidden]);
  }

  if (count($seg) === 2 && $seg[0] === 'listings' && $method === 'DELETE') {
    $u = require_user($pdo, $secret);
    $st = $pdo->prepare('SELECT user_id FROM listings WHERE id = ?'); $st->execute([$seg[1]]);
    $row = $st->fetch();
    if (!$row) jerr('Annonce introuvable.', 404);
    if ($row['user_id'] !== $u['id']) jerr('Non autorisé.', 403);
    $pdo->prepare('DELETE FROM listings WHERE id = ?')->execute([$seg[1]]);
    jout(['ok' => true]);
  }

  // ---------- SIGNALEMENTS ----------
  if ($path === 'reports' && $method === 'POST') {
    $u = require_user($pdo, $secret); $b = body();
    $listingId = trim((string) ($b['listingId'] ?? ''));
    $reason = substr(trim((string) ($b['reason'] ?? '')), 0, 80);
    $details = substr(trim((string) ($b['details'] ?? '')), 0, 500);
    if ($listingId === '' || $reason === '') jerr('Signalement incomplet (motif requis).');
    $st = $pdo->prepare('SELECT title FROM listings WHERE id = ?'); $st->execute([$listingId]);
    $title = $st->fetch()['title'] ?? '(annonce introuvable)';
    $pdo->prepare('INSERT INTO reports (id,listing_id,reporter_id,reason,details,status,created_at) VALUES (?,?,?,?,?,?,?)')
        ->execute([uuid(), $listingId, $u['id'], $reason, $details ?: null, 'open', now_iso()]);
    send_report_email($config, $u['email'], $title, $listingId, $reason, $details);
    jout(['ok' => true]);
  }

  // ---------- CONVERSATIONS & MESSAGES ----------
  if ($path === 'conversations' && $method === 'GET') {
    $u = require_user($pdo, $secret); $id = $u['id'];
    $st = $pdo->prepare('SELECT * FROM conversations WHERE buyer_id = ? OR seller_id = ? ORDER BY created_at DESC');
    $st->execute([$id, $id]); $convs = $st->fetchAll();
    $out = [];
    foreach ($convs as $c) {
      $otherId = $c['buyer_id'] === $id ? $c['seller_id'] : $c['buyer_id'];
      $pn = $pdo->prepare('SELECT full_name FROM profiles WHERE id = ?'); $pn->execute([$otherId]);
      $otherName = $pn->fetch()['full_name'] ?? 'Utilisateur';
      $lm = $pdo->prepare('SELECT body,sender_id,created_at FROM messages WHERE conversation_id = ? ORDER BY created_at DESC LIMIT 1');
      $lm->execute([$c['id']]); $last = $lm->fetch();
      $li = null; $lt = null;
      if ($c['listing_id']) {
        $ls = $pdo->prepare('SELECT title,images FROM listings WHERE id = ?'); $ls->execute([$c['listing_id']]);
        if ($lr = $ls->fetch()) { $lt = $lr['title']; $imgs = json_decode($lr['images'] ?: '[]', true); $li = $imgs[0] ?? null; }
      }
      $out[] = [
        'id' => $c['id'], 'listingId' => $c['listing_id'], 'buyerId' => $c['buyer_id'],
        'sellerId' => $c['seller_id'], 'createdAt' => iso_to_ms($c['created_at']),
        'listingTitle' => $lt, 'listingImage' => $li, 'otherName' => $otherName ?: 'Utilisateur',
        'lastMessage' => $last['body'] ?? null,
        'lastAt' => iso_to_ms($last['created_at'] ?? $c['created_at']),
        'lastSenderId' => $last['sender_id'] ?? null,
      ];
    }
    jout($out);
  }

  if ($path === 'conversations' && $method === 'POST') {
    $u = require_user($pdo, $secret); $b = body();
    $listingId = $b['listingId'] ?? null; $sellerId = $b['sellerId'] ?? null;
    if (!$sellerId) jerr('Vendeur manquant.');
    $st = $pdo->prepare('SELECT id FROM conversations WHERE listing_id = ? AND buyer_id = ?');
    $st->execute([$listingId, $u['id']]);
    if ($ex = $st->fetch()) jout(['id' => $ex['id']]);
    $id = uuid();
    $pdo->prepare('INSERT INTO conversations (id,listing_id,buyer_id,seller_id,created_at) VALUES (?,?,?,?,?)')
        ->execute([$id, $listingId, $u['id'], $sellerId, now_iso()]);
    jout(['id' => $id]);
  }

  if (count($seg) === 3 && $seg[0] === 'conversations' && $seg[2] === 'messages') {
    $u = require_user($pdo, $secret); $convId = $seg[1];
    $cs = $pdo->prepare('SELECT * FROM conversations WHERE id = ?'); $cs->execute([$convId]);
    $conv = $cs->fetch();
    if (!$conv) jerr('Conversation introuvable.', 404);
    if ($conv['buyer_id'] !== $u['id'] && $conv['seller_id'] !== $u['id']) jerr('Non autorisé.', 403);

    if ($method === 'GET') {
      $ms = $pdo->prepare('SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC');
      $ms->execute([$convId]);
      jout(array_map(fn($m) => [
        'id' => $m['id'], 'conversationId' => $m['conversation_id'], 'senderId' => $m['sender_id'],
        'body' => $m['body'], 'createdAt' => iso_to_ms($m['created_at']),
      ], $ms->fetchAll()));
    }
    if ($method === 'POST') {
      $b = body(); $bodyTxt = trim($b['body'] ?? '');
      if (!$bodyTxt) jerr('Message vide.');
      $id = uuid(); $ts = now_iso();
      $pdo->prepare('INSERT INTO messages (id,conversation_id,sender_id,body,created_at) VALUES (?,?,?,?,?)')
          ->execute([$id, $convId, $u['id'], $bodyTxt, $ts]);
      jout(['id' => $id, 'conversationId' => $convId, 'senderId' => $u['id'], 'body' => $bodyTxt, 'createdAt' => iso_to_ms($ts)]);
    }
  }

  // ---------- ORDERS ----------
  if ($path === 'orders' && $method === 'POST') {
    $u = require_user($pdo, $secret); $b = body();
    $sellerId = $b['sellerId'] ?? null;
    if (!$sellerId) jerr('Vendeur manquant.');
    $oid = uuid();
    $pdo->prepare('INSERT INTO orders (id,buyer_id,seller_id,conversation_id,status,created_at) VALUES (?,?,?,?,?,?)')
        ->execute([$oid, $u['id'], $sellerId, $b['conversationId'] ?? null, 'en_cours', now_iso()]);
    $items = (array) ($b['items'] ?? []);
    foreach ($items as $it) {
      $pdo->prepare('INSERT INTO order_items (id,order_id,listing_id,title,price,image) VALUES (?,?,?,?,?,?)')
          ->execute([uuid(), $oid, $it['listingId'] ?? null, $it['title'] ?? '', (int) ($it['price'] ?? 0), $it['image'] ?? null]);
    }
    // Notifications email (best-effort) : vendeur + acheteur.
    $se = $pdo->prepare('SELECT email FROM users WHERE id = ?'); $se->execute([$sellerId]);
    $sellerEmail = $se->fetch()['email'] ?? null;
    if ($sellerEmail) send_order_seller_email($config, $sellerEmail, $items);
    if (!empty($u['email'])) send_order_buyer_email($config, $u['email'], $items);
    jout(['id' => $oid]);
  }

  if ($path === 'orders' && $method === 'GET') {
    $u = require_user($pdo, $secret);
    $role = ($_GET['role'] ?? 'buyer') === 'seller' ? 'seller' : 'buyer';
    $col = $role === 'buyer' ? 'buyer_id' : 'seller_id';
    $st = $pdo->prepare("SELECT * FROM orders WHERE $col = ? ORDER BY created_at DESC");
    $st->execute([$u['id']]); $orders = $st->fetchAll();
    $out = [];
    foreach ($orders as $o) {
      $its = $pdo->prepare('SELECT * FROM order_items WHERE order_id = ?'); $its->execute([$o['id']]);
      $items = array_map(fn($i) => [
        'listingId' => $i['listing_id'], 'title' => $i['title'], 'price' => (int) $i['price'],
        'image' => $i['image'] ?: null,
      ], $its->fetchAll());
      $otherId = $role === 'buyer' ? $o['seller_id'] : $o['buyer_id'];
      $pn = $pdo->prepare('SELECT full_name FROM profiles WHERE id = ?'); $pn->execute([$otherId]);
      $out[] = [
        'id' => $o['id'], 'buyerId' => $o['buyer_id'], 'sellerId' => $o['seller_id'],
        'conversationId' => $o['conversation_id'], 'status' => $o['status'] ?: 'en_cours',
        'createdAt' => iso_to_ms($o['created_at']), 'items' => $items,
        'otherName' => ($pn->fetch()['full_name'] ?? null) ?: 'Utilisateur',
      ];
    }
    jout($out);
  }

  if (count($seg) === 2 && $seg[0] === 'orders' && $method === 'PATCH') {
    $u = require_user($pdo, $secret); $b = body();
    $st = $pdo->prepare('SELECT seller_id FROM orders WHERE id = ?'); $st->execute([$seg[1]]);
    $o = $st->fetch();
    if (!$o) jerr('Commande introuvable.', 404);
    if ($o['seller_id'] !== $u['id']) jerr('Non autorisé.', 403);
    $pdo->prepare('UPDATE orders SET status = ? WHERE id = ?')->execute([$b['status'] ?? 'en_cours', $seg[1]]);
    jout(['ok' => true]);
  }

  if ($path === 'purchased' && $method === 'GET') {
    $u = require_user($pdo, $secret);
    $st = $pdo->prepare('SELECT DISTINCT oi.listing_id FROM order_items oi
      JOIN orders o ON o.id = oi.order_id WHERE o.buyer_id = ? AND oi.listing_id IS NOT NULL');
    $st->execute([$u['id']]);
    jout(array_values(array_filter(array_column($st->fetchAll(), 'listing_id'))));
  }

  // ---------- REVIEWS ----------
  if ($path === 'reviews' && $method === 'GET') {
    $sellerId = $_GET['seller_id'] ?? null; $listingId = $_GET['listing_id'] ?? null;
    if ($sellerId) { $st = $pdo->prepare('SELECT * FROM reviews WHERE seller_id = ? ORDER BY created_at DESC'); $st->execute([$sellerId]); }
    elseif ($listingId) { $st = $pdo->prepare('SELECT * FROM reviews WHERE listing_id = ? ORDER BY created_at DESC'); $st->execute([$listingId]); }
    else jout([]);
    $rows = $st->fetchAll(); $out = [];
    foreach ($rows as $r) {
      $pn = $pdo->prepare('SELECT full_name FROM profiles WHERE id = ?'); $pn->execute([$r['reviewer_id']]);
      $out[] = [
        'id' => $r['id'], 'listingId' => $r['listing_id'], 'sellerId' => $r['seller_id'],
        'reviewerId' => $r['reviewer_id'], 'rating' => (int) $r['rating'], 'comment' => $r['comment'] ?: null,
        'createdAt' => iso_to_ms($r['created_at']), 'reviewerName' => ($pn->fetch()['full_name'] ?? null) ?: 'Utilisateur',
      ];
    }
    jout($out);
  }

  if ($path === 'reviews' && $method === 'POST') {
    $u = require_user($pdo, $secret); $b = body();
    $listingId = $b['listingId'] ?? null;
    // Autorisation : seul un acheteur de cette annonce peut laisser un avis.
    $chk = $pdo->prepare('SELECT 1 FROM order_items oi JOIN orders o ON o.id = oi.order_id
      WHERE o.buyer_id = ? AND oi.listing_id = ? LIMIT 1');
    $chk->execute([$u['id'], $listingId]);
    if (!$chk->fetch()) jerr('Vous devez avoir commandé cet article pour laisser un avis.', 403);
    $pdo->prepare('INSERT INTO reviews (id,listing_id,seller_id,reviewer_id,rating,comment,created_at) VALUES (?,?,?,?,?,?,?)')
        ->execute([uuid(), $listingId, $b['sellerId'] ?? '', $u['id'], (int) ($b['rating'] ?? 5), $b['comment'] ?? null, now_iso()]);
    jout(['ok' => true]);
  }

  // ---------- PROFILES ----------
  if (count($seg) === 2 && $seg[0] === 'profile' && $method === 'GET') {
    $st = $pdo->prepare('SELECT id,full_name,bio,avatar_url FROM profiles WHERE id = ?');
    $st->execute([$seg[1]]); $p = $st->fetch();
    if (!$p) jout(null);
    jout(['id' => $p['id'], 'fullName' => $p['full_name'] ?: 'Vendeur', 'bio' => $p['bio'] ?: null, 'avatarUrl' => $p['avatar_url'] ?: null]);
  }

  if ($path === 'profile' && $method === 'PUT') {
    $u = require_user($pdo, $secret); $b = body();
    $fields = ['full_name','first_name','last_name','gender','birth_date','phone','bio',
               'avatar_url','region_id','city_id','commune','address','lat','lng'];
    $set = []; $vals = [];
    foreach ($fields as $f) {
      if (array_key_exists($f, $b)) {
        $v = $b[$f];
        if ($f === 'avatar_url' && is_string($v) && str_starts_with($v, 'data:image')) {
          $v = save_data_uri($config, $v) ?? $v;
        }
        $set[] = "$f = ?"; $vals[] = $v;
      }
    }
    // upsert : crée la ligne profil si absente
    $ex = $pdo->prepare('SELECT id FROM profiles WHERE id = ?'); $ex->execute([$u['id']]);
    if (!$ex->fetch()) $pdo->prepare('INSERT INTO profiles (id,created_at) VALUES (?,?)')->execute([$u['id'], now_iso()]);
    if ($set) { $vals[] = $u['id']; $pdo->prepare('UPDATE profiles SET ' . implode(',', $set) . ' WHERE id = ?')->execute($vals); }
    jout(['ok' => true]);
  }

  // ---------- NEWSLETTER ----------
  // Inscription publique : n'importe quel visiteur peut s'abonner.
  if ($path === 'newsletter' && $method === 'POST') {
    $b = body();
    $email = strtolower(trim($b['email'] ?? ''));
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) jerr('Adresse email invalide.');
    $ex = $pdo->prepare('SELECT id FROM newsletter WHERE email = ?'); $ex->execute([$email]);
    if (!$ex->fetch()) {
      $pdo->prepare('INSERT INTO newsletter (id,email,created_at) VALUES (?,?,?)')
          ->execute([uuid(), $email, now_iso()]);
      send_newsletter_email($config, $email); // confirmation (best-effort)
    }
    jout(['ok' => true]); // idempotent : déjà inscrit = succès aussi
  }

  // L'utilisateur connecté est-il abonné à la newsletter ? (pour le popup)
  if ($path === 'newsletter/status' && $method === 'GET') {
    $u = require_user($pdo, $secret);
    $st = $pdo->prepare('SELECT 1 FROM newsletter WHERE email = ?');
    $st->execute([strtolower($u['email'] ?? '')]);
    jout(['subscribed' => (bool) $st->fetch()]);
  }

  // Liste des abonnés : réservée aux administrateurs (export CSV côté app).
  if ($path === 'newsletter' && $method === 'GET') {
    $u = require_user($pdo, $secret);
    if (!is_admin($config, $pdo, $u)) jerr('Accès réservé à l’administrateur.', 403);
    $rows = $pdo->query('SELECT email, created_at FROM newsletter ORDER BY created_at DESC')->fetchAll();
    $out = array_map(fn($r) => ['email' => $r['email'], 'createdAt' => iso_to_ms($r['created_at'])], $rows);
    jout(['count' => count($out), 'subscribers' => $out]);
  }

  // ---------- ADMINISTRATION ----------
  // Toutes les routes /api/admin/* exigent un compte administrateur.
  if (($seg[0] ?? '') === 'admin') {
    $u = require_user($pdo, $secret);
    $userIsAdmin = is_admin($config, $pdo, $u);
    // Vérification légère : indique si l'utilisateur connecté est admin
    // (sans erreur 403) — sert à afficher/masquer le lien dans l'app.
    if ($path === 'admin/check') jout(['admin' => $userIsAdmin]);
    if (!$userIsAdmin) jerr('Accès réservé à l’administrateur.', 403);

    // Vue d'ensemble : compteurs + activité récente.
    if ($path === 'admin/stats' && $method === 'GET') {
      $count = fn(string $t) => (int) $pdo->query("SELECT COUNT(*) AS c FROM $t")->fetch()['c'];
      $ordersByStatus = [];
      foreach ($pdo->query('SELECT status, COUNT(*) AS c FROM orders GROUP BY status')->fetchAll() as $r) {
        $ordersByStatus[$r['status'] ?: 'inconnu'] = (int) $r['c'];
      }
      $ordersValue = (int) ($pdo->query('SELECT COALESCE(SUM(price),0) AS s FROM order_items')->fetch()['s']);
      $recentListings = array_map('listing_out',
        $pdo->query('SELECT * FROM listings ORDER BY created_at DESC LIMIT 5')->fetchAll());
      $recentUsers = array_map(
        fn($r) => ['id' => $r['id'], 'email' => $r['email'], 'fullName' => $r['full_name'] ?: '—', 'createdAt' => iso_to_ms($r['created_at'])],
        $pdo->query('SELECT u.id, u.email, u.created_at, p.full_name FROM users u LEFT JOIN profiles p ON p.id = u.id ORDER BY u.created_at DESC LIMIT 5')->fetchAll());
      jout([
        'users' => $count('users'), 'listings' => $count('listings'),
        'conversations' => $count('conversations'), 'messages' => $count('messages'),
        'orders' => $count('orders'), 'reviews' => $count('reviews'),
        'newsletter' => $count('newsletter'),
        'reportsOpen' => (int) ($pdo->query("SELECT COUNT(*) AS c FROM reports WHERE status = 'open'")->fetch()['c']),
        'ordersByStatus' => $ordersByStatus, 'ordersValue' => $ordersValue,
        'recentListings' => $recentListings, 'recentUsers' => $recentUsers,
      ]);
    }

    // Utilisateurs.
    if ($path === 'admin/users' && $method === 'GET') {
      $rows = $pdo->query('SELECT u.id, u.email, u.created_at, u.status, p.full_name, p.phone, p.commune,
          (SELECT COUNT(*) FROM listings l WHERE l.user_id = u.id) AS listings
        FROM users u LEFT JOIN profiles p ON p.id = u.id ORDER BY u.created_at DESC')->fetchAll();
      jout(array_map(fn($r) => [
        'id' => $r['id'], 'email' => $r['email'], 'fullName' => $r['full_name'] ?: '—',
        'phone' => $r['phone'] ?: null, 'commune' => $r['commune'] ?: null,
        'status' => $r['status'] ?: 'active',
        'listings' => (int) $r['listings'], 'createdAt' => iso_to_ms($r['created_at']),
      ], $rows));
    }

    // Détail d'un utilisateur : profil complet + ses annonces (toutes, même masquées).
    if (count($seg) === 3 && $seg[1] === 'users' && $method === 'GET') {
      $st = $pdo->prepare('SELECT u.id, u.email, u.created_at, u.status, p.full_name, p.phone,
          p.commune, p.city_id, p.region_id, p.bio, p.avatar_url
        FROM users u LEFT JOIN profiles p ON p.id = u.id WHERE u.id = ?');
      $st->execute([$seg[2]]); $r = $st->fetch();
      if (!$r) jerr('Utilisateur introuvable.', 404);
      $ls = $pdo->prepare('SELECT * FROM listings WHERE user_id = ? ORDER BY created_at DESC');
      $ls->execute([$seg[2]]);
      jout([
        'id' => $r['id'], 'email' => $r['email'], 'fullName' => $r['full_name'] ?: '—',
        'phone' => $r['phone'] ?: null, 'commune' => $r['commune'] ?: null,
        'cityId' => $r['city_id'] ?: null, 'regionId' => $r['region_id'] ?: null,
        'bio' => $r['bio'] ?: null, 'avatarUrl' => $r['avatar_url'] ?: null,
        'status' => $r['status'] ?: 'active', 'createdAt' => iso_to_ms($r['created_at']),
        'listings' => array_map('listing_out', $ls->fetchAll()),
      ]);
    }

    // Changer le statut d'un compte : active / restricted / blocked.
    if (count($seg) === 4 && $seg[1] === 'users' && $seg[3] === 'status' && $method === 'POST') {
      $b = body();
      $status = in_array($b['status'] ?? '', ['active', 'restricted', 'blocked'], true) ? $b['status'] : null;
      if (!$status) jerr('Statut invalide.');
      // On ne peut pas bloquer un propriétaire (admin config permanent).
      $st = $pdo->prepare('SELECT email FROM users WHERE id = ?'); $st->execute([$seg[2]]);
      $target = $st->fetch();
      if (!$target) jerr('Utilisateur introuvable.', 404);
      if (in_array(strtolower($target['email']), array_map('strtolower', $config['admin_emails'] ?? []), true))
        jerr('Ce compte administrateur ne peut pas être modifié.', 403);
      $pdo->prepare('UPDATE users SET status = ? WHERE id = ?')->execute([$status, $seg[2]]);
      // Bloqué : on masque aussi ses annonces ; réactivé : on les réaffiche.
      $pdo->prepare('UPDATE listings SET hidden = ? WHERE user_id = ?')
          ->execute([$status === 'blocked' ? 1 : 0, $seg[2]]);
      jout(['ok' => true, 'status' => $status]);
    }

    // Supprimer un compte (et tout son contenu).
    if (count($seg) === 3 && $seg[1] === 'users' && $method === 'DELETE') {
      $st = $pdo->prepare('SELECT email FROM users WHERE id = ?'); $st->execute([$seg[2]]);
      $target = $st->fetch();
      if (!$target) jerr('Utilisateur introuvable.', 404);
      if (in_array(strtolower($target['email']), array_map('strtolower', $config['admin_emails'] ?? []), true))
        jerr('Ce compte administrateur ne peut pas être supprimé.', 403);
      $id = $seg[2];
      $pdo->prepare('DELETE FROM reports WHERE reporter_id = ?')->execute([$id]);
      $pdo->prepare('DELETE FROM messages WHERE sender_id = ?')->execute([$id]);
      $pdo->prepare('DELETE FROM conversations WHERE buyer_id = ? OR seller_id = ?')->execute([$id, $id]);
      $pdo->prepare('DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE buyer_id = ? OR seller_id = ?)')->execute([$id, $id]);
      $pdo->prepare('DELETE FROM orders WHERE buyer_id = ? OR seller_id = ?')->execute([$id, $id]);
      $pdo->prepare('DELETE FROM reviews WHERE reviewer_id = ? OR seller_id = ?')->execute([$id, $id]);
      $pdo->prepare('DELETE FROM listings WHERE user_id = ?')->execute([$id]);
      $pdo->prepare('DELETE FROM user_interests WHERE user_id = ?')->execute([$id]);
      $pdo->prepare('DELETE FROM profiles WHERE id = ?')->execute([$id]);
      $pdo->prepare('DELETE FROM users WHERE id = ?')->execute([$id]);
      jout(['ok' => true]);
    }

    // Annonces (avec email du vendeur, pour la modération).
    if ($path === 'admin/listings' && $method === 'GET') {
      $rows = $pdo->query('SELECT l.*, u.email AS seller_email FROM listings l
        LEFT JOIN users u ON u.id = l.user_id ORDER BY l.created_at DESC')->fetchAll();
      jout(array_map(function ($r) {
        $o = listing_out($r);
        $o['sellerEmail'] = $r['seller_email'] ?: null;
        return $o;
      }, $rows));
    }

    // Modération : suppression d'une annonce par l'administrateur.
    if (count($seg) === 3 && $seg[1] === 'listings' && $method === 'DELETE') {
      $pdo->prepare('DELETE FROM listings WHERE id = ?')->execute([$seg[2]]);
      jout(['ok' => true]);
    }

    // Signalements : liste pour la modération (les ouverts d'abord).
    if ($path === 'admin/reports' && $method === 'GET') {
      $rows = $pdo->query("SELECT r.*, l.title AS listing_title, l.hidden AS listing_hidden,
          u.email AS reporter_email
        FROM reports r
        LEFT JOIN listings l ON l.id = r.listing_id
        LEFT JOIN users u ON u.id = r.reporter_id
        ORDER BY (CASE WHEN r.status = 'open' THEN 0 ELSE 1 END), r.created_at DESC LIMIT 200")->fetchAll();
      jout(array_map(fn($r) => [
        'id' => $r['id'], 'listingId' => $r['listing_id'],
        'listingTitle' => $r['listing_title'] ?: '(annonce supprimée)',
        'listingHidden' => !empty($r['listing_hidden']),
        'reason' => $r['reason'], 'details' => $r['details'] ?: null,
        'reporterEmail' => $r['reporter_email'] ?: null,
        'status' => $r['status'] ?: 'open', 'createdAt' => iso_to_ms($r['created_at']),
      ], $rows));
    }

    // Marquer un signalement comme traité.
    if (count($seg) === 3 && $seg[1] === 'reports' && $method === 'POST') {
      $pdo->prepare('UPDATE reports SET status = ? WHERE id = ?')->execute(['resolved', $seg[2]]);
      jout(['ok' => true]);
    }

    // Commandes (avec emails acheteur/vendeur et articles).
    if ($path === 'admin/orders' && $method === 'GET') {
      $orders = $pdo->query('SELECT o.*, b.email AS buyer_email, s.email AS seller_email
        FROM orders o LEFT JOIN users b ON b.id = o.buyer_id LEFT JOIN users s ON s.id = o.seller_id
        ORDER BY o.created_at DESC')->fetchAll();
      $itemsStmt = $pdo->prepare('SELECT title, price, image FROM order_items WHERE order_id = ?');
      $out = [];
      foreach ($orders as $o) {
        $itemsStmt->execute([$o['id']]);
        $its = $itemsStmt->fetchAll();
        $out[] = [
          'id' => $o['id'], 'status' => $o['status'] ?: 'pending',
          'buyerEmail' => $o['buyer_email'] ?: null, 'sellerEmail' => $o['seller_email'] ?: null,
          'createdAt' => iso_to_ms($o['created_at']),
          'items' => array_map(fn($it) => ['title' => $it['title'], 'price' => (int) $it['price'], 'image' => $it['image'] ?: null], $its),
          'total' => array_sum(array_map(fn($it) => (int) $it['price'], $its)),
        ];
      }
      jout($out);
    }

    // Modérateurs : lister / ajouter / retirer (mêmes droits que l'admin).
    if ($path === 'admin/moderators' && $method === 'GET') {
      $mods = array_map(
        fn($r) => ['email' => $r['email'], 'createdAt' => iso_to_ms($r['created_at'])],
        $pdo->query('SELECT email, created_at FROM admins ORDER BY created_at DESC')->fetchAll());
      jout(['owners' => owner_emails($config), 'moderators' => $mods]);
    }
    if ($path === 'admin/moderators' && $method === 'POST') {
      $b = body();
      $email = strtolower(trim($b['email'] ?? ''));
      if (!filter_var($email, FILTER_VALIDATE_EMAIL)) jerr('Adresse email invalide.');
      if (in_array($email, owner_emails($config), true)) jerr('Cet email est déjà propriétaire du site.');
      $ex = $pdo->prepare('SELECT 1 FROM admins WHERE email = ?'); $ex->execute([$email]);
      $already = (bool) $ex->fetch();
      if (!$already) {
        $pdo->prepare('INSERT INTO admins (email, created_at) VALUES (?,?)')->execute([$email, now_iso()]);
      }
      // Envoie (ou renvoie) la notification à chaque ajout. Best-effort.
      $emailed = send_moderator_email($config, $email);
      jout(['ok' => true, 'emailed' => $emailed, 'already' => $already]);
    }
    if ($path === 'admin/moderators' && $method === 'DELETE') {
      $b = body();
      $email = strtolower(trim($b['email'] ?? ''));
      if (in_array($email, owner_emails($config), true)) jerr('Le propriétaire ne peut pas être retiré.', 403);
      $pdo->prepare('DELETE FROM admins WHERE email = ?')->execute([$email]);
      jout(['ok' => true]);
    }

    // Réglages SMTP : lecture (sans le mot de passe).
    if ($path === 'admin/smtp' && $method === 'GET') {
      $s = $config['smtp'] ?? [];
      jout([
        'host'       => $s['host'] ?? 'localhost',
        'port'       => (string) ($s['port'] ?? '465'),
        'secure'     => $s['secure'] ?? 'ssl',
        'user'       => $s['user'] ?? 'no-reply@chap.ci',
        'configured' => !empty($s['pass']),
      ]);
    }
    // Réglages SMTP : enregistrement (écrit api/smtp.local.php, protégé).
    if ($path === 'admin/smtp' && $method === 'POST') {
      $b = body();
      $arr = [
        'host'   => trim((string) ($b['host'] ?? 'localhost')) ?: 'localhost',
        'port'   => trim((string) ($b['port'] ?? '465')) ?: '465',
        'secure' => in_array(($b['secure'] ?? 'ssl'), ['ssl', 'tls'], true) ? $b['secure'] : 'ssl',
        'user'   => trim((string) ($b['user'] ?? '')),
        'pass'   => (string) ($b['pass'] ?? ''),
      ];
      if (!filter_var($arr['user'], FILTER_VALIDATE_EMAIL)) jerr('Utilisateur SMTP (email) invalide.');
      if ($arr['pass'] === '') jerr('Renseignez le mot de passe de la boîte email.');
      $php = "<?php\n// Réglages SMTP générés depuis le tableau de bord. Ne pas partager.\nreturn "
        . var_export($arr, true) . ";\n";
      if (@file_put_contents(__DIR__ . '/smtp.local.php', $php) === false) {
        jerr('Écriture impossible dans le dossier api/ (droits). Renseignez plutôt le bloc smtp dans config.php.', 500);
      }
      jout(['ok' => true]);
    }

    // Campagnes : nombre d'abonnés destinataires.
    if ($path === 'admin/campaign/count' && $method === 'GET') {
      jout(['total' => (int) $pdo->query('SELECT COUNT(*) AS c FROM newsletter')->fetch()['c']]);
    }
    // Campagnes : envoi d'un LOT (l'app boucle avec offset croissant).
    if ($path === 'admin/campaign/send' && $method === 'POST') {
      $b = body();
      $subject = trim((string) ($b['subject'] ?? ''));
      $message = trim((string) ($b['message'] ?? ''));
      if ($subject === '' || $message === '') jerr('Objet et message obligatoires.');
      $offset = max(0, (int) ($b['offset'] ?? 0));
      $limit  = min(40, max(1, (int) ($b['limit'] ?? 25)));
      $total  = (int) $pdo->query('SELECT COUNT(*) AS c FROM newsletter')->fetch()['c'];
      $rows = $pdo->query("SELECT email FROM newsletter ORDER BY created_at ASC LIMIT $limit OFFSET $offset")->fetchAll();
      $html = campaign_html($config, $message);
      $from = $config['mail_newsletter_from'] ?? 'hello@chap.ci';
      $sent = 0;
      foreach ($rows as $r) { if (send_mail($config, $r['email'], $subject, $html, $from, $from)) $sent++; }
      $processed = $offset + count($rows);
      jout(['sent' => $sent, 'processed' => $processed, 'total' => $total, 'done' => (count($rows) < $limit || $processed >= $total)]);
    }

    // Offres automatiques : infos pour la commande cron.
    if ($path === 'admin/digest-info' && $method === 'GET') {
      jout([
        'cronKey' => $config['cron_key'] ?? '',
        'site'    => rtrim($config['site_url'] ?? 'https://chap.ci', '/'),
      ]);
    }
    // Offres automatiques : envoi manuel immédiat (pour tester).
    if ($path === 'admin/digest-send' && $method === 'POST') {
      $b = body();
      $type = (($b['type'] ?? 'daily') === 'weekly') ? 'weekly' : 'daily';
      jout(send_digest($config, $pdo, $type));
    }
    // Suggestions personnalisées : test sur son propre compte (mode aperçu).
    if ($path === 'admin/suggestions-test' && $method === 'POST') {
      jout(send_suggestions($config, $pdo, $u, true));
    }

    // Diagnostic : envoie un email de test à l'administrateur connecté.
    if ($path === 'admin/test-email' && $method === 'POST') {
      $name = $config['mail_from_name'] ?? 'Chap.ci';
      $inner = '<h2 style="margin-top:0">Email de test ✅</h2>'
        . '<p>Bravo ! Si vous lisez ce message, l’envoi des emails de <b>' . htmlspecialchars($name) . '</b> '
        . 'fonctionne correctement.</p>'
        . '<p style="color:#6b7280;font-size:13px">Vous pouvez maintenant ajouter des modérateurs et vos '
        . 'utilisateurs recevront bien leurs emails (bienvenue, notifications…).</p>';
      $sent = send_mail($config, $u['email'], "Test d’envoi — $name", email_layout($config, $inner, 'Email de test Chap.ci'));
      jout(['sent' => $sent, 'to' => $u['email'], 'via' => empty($config['smtp']['pass']) ? 'mail()' : 'smtp']);
    }

    jerr('Route admin inconnue: ' . $path, 404);
  }

  // ---------- CENTRES D'INTÉRÊT (l'« agent » observe) ----------
  // Enregistre un signal d'intérêt (favori, recherche, catégorie consultée).
  if ($path === 'interests' && $method === 'POST') {
    $u = current_user($pdo, $secret); // silencieux si non connecté
    $b = body();
    $cat = trim((string) ($b['categoryId'] ?? ''));
    $sub = trim((string) ($b['subcategory'] ?? ''));
    if ($u && $cat !== '') {
      $w = max(1, min(5, (int) ($b['weight'] ?? 1)));
      $ex = $pdo->prepare('SELECT weight, subcategory FROM user_interests WHERE user_id = ? AND category_id = ?');
      $ex->execute([$u['id'], $cat]);
      $row = $ex->fetch();
      if ($row) {
        // On conserve la dernière sous-catégorie précise consultée (sinon l'ancienne).
        $subToStore = $sub !== '' ? $sub : ($row['subcategory'] ?? null);
        $pdo->prepare('UPDATE user_interests SET weight = ?, subcategory = ?, updated_at = ? WHERE user_id = ? AND category_id = ?')
            ->execute([min(1000, (int) $row['weight'] + $w), $subToStore, now_iso(), $u['id'], $cat]);
      } else {
        $pdo->prepare('INSERT INTO user_interests (user_id, category_id, weight, subcategory, updated_at) VALUES (?,?,?,?,?)')
            ->execute([$u['id'], $cat, $w, $sub !== '' ? $sub : null, now_iso()]);
      }
    }
    jout(['ok' => true]);
  }

  // ---------- TÂCHE PLANIFIÉE : offres du jour / de la semaine ----------
  // Appelée par une tâche cron cPanel. Authentifiée par clé (pas de JWT).
  if ($path === 'cron/digest' && $method === 'GET') {
    if (!hash_equals((string) ($config['cron_key'] ?? '__none__'), (string) ($_GET['key'] ?? ''))) {
      jerr('Clé invalide.', 403);
    }
    $type = (($_GET['type'] ?? 'daily') === 'weekly') ? 'weekly' : 'daily';
    jout(send_digest($config, $pdo, $type));
  }

  // ---------- TÂCHE PLANIFIÉE : suggestions personnalisées (2×/semaine) ----------
  if ($path === 'cron/suggestions' && $method === 'GET') {
    if (!hash_equals((string) ($config['cron_key'] ?? '__none__'), (string) ($_GET['key'] ?? ''))) {
      jerr('Clé invalide.', 403);
    }
    $users = $pdo->query('SELECT DISTINCT ui.user_id AS id, u.email
      FROM user_interests ui JOIN users u ON u.id = ui.user_id')->fetchAll();
    $reached = 0; $emailed = 0;
    foreach ($users as $usr) {
      $r = send_suggestions($config, $pdo, $usr);
      $reached++;
      if ($r['sent']) $emailed++;
    }
    jout(['users' => $reached, 'emailed' => $emailed]);
  }

  if ($path === '' || $path === 'health') jout(['ok' => true, 'name' => 'Chap.ci API', 'time' => now_iso(), 'php' => PHP_VERSION]);

  jerr('Route inconnue: ' . $path, 404);
} catch (Throwable $e) {
  jerr('Erreur serveur: ' . $e->getMessage(), 500);
}
