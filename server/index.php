<?php
// =============================================================================
//  Chap.ci — API PHP (backend auto-hébergeable sur mutualisé cPanel / TPE Cloud)
//  Remplace Supabase : comptes, annonces, messagerie, commandes, avis, photos.
//  Compatible MySQL (production) et SQLite (test local). PHP 8+.
// =============================================================================

declare(strict_types=1);
error_reporting(E_ALL & ~E_DEPRECATED & ~E_WARNING);

$config = require __DIR__ . '/config.php';
// Rendu accessible aux quelques fonctions qui ne reçoivent pas $config en
// argument (user_public, appelée depuis une dizaine d'endroits) : le passer
// partout aurait demandé de toucher chaque appelant pour un seul besoin.
$GLOBALS['chapci_config'] = $config;

// Valeurs par défaut pour les réglages ajoutés au fil des fonctionnalités
// (crons, emails, réseaux sociaux…). Un `config.php` créé AVANT l'ajout d'une
// fonctionnalité n'a pas forcément la clé correspondante : sans ce filet, la
// valeur serait vide (ex. clé cron manquante -> « Clé invalide »). L'opérateur
// `+` ne complète QUE les clés absentes — vos réglages existants sont préservés.
$config += [
  // P1 · Aucun secret « en dur » dans le code public : vide = généré aléatoirement
  // et persisté hors du code (voir chapci_hardened_secret plus bas).
  'cron_key'             => getenv('CHAPCI_CRON_KEY')      ?: '',
  'admin_emails'         => array_filter(array_map('trim',
    explode(',', getenv('CHAPCI_ADMIN_EMAILS') ?: 'bracknetswilliam@gmail.com'))),
  // Destinataire des RAPPORTS automatiques (signalements, sauvegardes, alertes du
  // « Bureau des développeurs »). Distinct des admins (qui gardent l'accès au site).
  'report_email'         => array_filter(array_map('trim',
    explode(',', getenv('CHAPCI_REPORT_EMAIL') ?: 'contact@chap.ci'))),
  'mail_from'            => getenv('CHAPCI_MAIL_FROM')       ?: 'no-reply@chap.ci',
  'mail_from_name'       => getenv('CHAPCI_MAIL_FROM_NAME')  ?: 'Chap.ci',
  'mail_reply_to'        => getenv('CHAPCI_MAIL_REPLYTO')    ?: 'contact@chap.ci',
  'mail_newsletter_from' => getenv('CHAPCI_NEWSLETTER_FROM') ?: 'hello@chap.ci',
  'site_url'             => getenv('CHAPCI_SITE_URL')        ?: 'https://chap.ci',
  // Emplacement des photos téléversées : le dossier sur le disque, et le chemin
  // par lequel le navigateur les demande. Ces deux clés vivaient uniquement dans
  // config.php — elles manquaient ici, et c'étaient les SEULES dans ce cas. Un
  // config.php antérieur à leur introduction faisait donc rtrim(null) à chaque
  // photo enregistrée : sous PHP 8.1 une simple obsolescence qui renvoie une URL
  // amputée (« /nom.jpg » au lieu de « /uploads/nom.jpg », photo introuvable),
  // sous PHP 8.3+ une erreur fatale — c'est-à-dire au moment précis où la mise à
  // jour de PHP recommandée chaque semaine serait faite.
  'uploads_dir'          => getenv('CHAPCI_UPLOADS_DIR')  ?: __DIR__ . '/../uploads',
  'uploads_path'         => getenv('CHAPCI_UPLOADS_PATH') ?: '/uploads',
  // Mode debug (P13) : n'affiche les détails techniques des erreurs QUE si activé
  // explicitement. En production (défaut), les erreurs restent génériques côté
  // client et les détails sont journalisés (error_log) côté serveur.
  'debug'                => (getenv('CHAPCI_DEBUG') ?: '') === '1',
  // P3 · Cookie de session HttpOnly. « Secure » (HTTPS obligatoire) par défaut ;
  // seul CHAPCI_COOKIE_SECURE=0 le désactive (test local sur http). NB : on teste
  // « !== '0' » et non « ?: » car la chaîne '0' est falsy en PHP.
  'cookie_secure'        => getenv('CHAPCI_COOKIE_SECURE') !== '0',
  // Sécurité : IP ou préfixes à IGNORER dans les stats « suspectes » (monitoring
  // interne, Claude/Anthropic, ton IP fixe…). Virgules ; un préfixe finit par un
  // point (ex. « 160.79. » ignore 160.79.*.*). Surchargeable via env/config.php.
  'security_ignore_ips'  => getenv('CHAPCI_SECURITY_IGNORE_IPS') ?: '160.79.',
  'social'               => [],
  // Connexion Google (Sign-In) : ID client OAuth « Web ». Vide = désactivé.
  'google_client_id'     => getenv('CHAPCI_GOOGLE_CLIENT_ID') ?: '',
  // Connexion Facebook : App ID (public) + App Secret (secret). Vide = désactivé.
  'facebook_app_id'      => getenv('CHAPCI_FACEBOOK_APP_ID')     ?: '',
  'facebook_app_secret'  => getenv('CHAPCI_FACEBOOK_APP_SECRET') ?: '',
  // Filigrane « Chap.ci » au centre des photos d'annonce (1 = activé).
  'watermark'            => (getenv('CHAPCI_WATERMARK') ?: '1') === '1',
  // Connexion par téléphone (code SMS). provider : 'orange' | 'twilio' | 'http' | '' (off).
  'sms'                  => [
    'provider'      => getenv('CHAPCI_SMS_PROVIDER')     ?: '',
    'debug'         => (getenv('CHAPCI_SMS_DEBUG')       ?: '') === '1',
    'twilio_sid'    => getenv('CHAPCI_TWILIO_SID')       ?: '',
    'twilio_token'  => getenv('CHAPCI_TWILIO_TOKEN')     ?: '',
    'twilio_from'   => getenv('CHAPCI_TWILIO_FROM')      ?: '',
    // Orange SMS API (Côte d'Ivoire) — recommandé pour la CI.
    'orange_auth'   => getenv('CHAPCI_ORANGE_AUTH')      ?: '', // en-tête « Basic … » d'Orange Developer
    'orange_sender' => getenv('CHAPCI_ORANGE_SENDER')    ?: '', // ex. « tel:+2250000 » (fourni par Orange)
    'orange_name'   => getenv('CHAPCI_ORANGE_NAME')      ?: '', // nom affiché (facultatif, 11 car.)
    'http_method'   => getenv('CHAPCI_SMS_HTTP_METHOD')  ?: 'GET',
    'http_url'      => getenv('CHAPCI_SMS_HTTP_URL')     ?: '',
    'http_auth'     => getenv('CHAPCI_SMS_HTTP_AUTH')    ?: '',
    'sender'        => getenv('CHAPCI_SMS_SENDER')       ?: 'Chap.ci',
  ],
];
// Un config.php antérieur peut définir 'sms' partiellement : on complète les
// sous-clés manquantes sans écraser celles déjà renseignées.
$config['sms'] = ($config['sms'] ?? []) + [
  'provider' => '', 'debug' => false, 'twilio_sid' => '', 'twilio_token' => '',
  'twilio_from' => '', 'orange_auth' => '', 'orange_sender' => '', 'orange_name' => '',
  'http_method' => 'GET', 'http_url' => '', 'http_auth' => '', 'sender' => 'Chap.ci',
];
// ID client Google du projet Chap.ci (public, non secret). Utilisé par défaut
// tant que config.php n'en fournit pas un (permet d'activer la connexion Google
// sans éditer config.php). Une variable d'env ou un config.php renseigné priment.
if (empty($config['google_client_id'])) {
  $config['google_client_id'] = getenv('CHAPCI_GOOGLE_CLIENT_ID')
    ?: '564942885290-f1v7caemq0838kp6qickrsirk46vk4dl.apps.googleusercontent.com';
}

// ---- P1 · Secrets forts, uniques par installation (JAMAIS en clair) ----------
// Le jeton de connexion (JWT) et la clé des tâches automatiques (cron) ne doivent
// jamais rester sur une valeur « par défaut » présente dans le code public : cela
// permettrait à quiconque lit le code d'usurper n'importe quel compte ou de
// déclencher les tâches (export de la base, emails en masse). Si l'opérateur n'a
// pas défini un secret propre (assez long, non standard), on en génère un
// aléatoire, rangé HORS du code (dossier data protégé), réutilisé ensuite : le
// site continue de fonctionner sans intervention et sans secret devinable.
function chapci_secret_dir(array $config): string {
  // La vraie clé est $config['db']['sqlite_path'] (et non 'sqlite_path' à la
  // racine) : sinon le secret n'était jamais rangé à côté de la base.
  $base = (string) ($config['db']['sqlite_path'] ?? $config['sqlite_path'] ?? '');
  $dir  = $base !== '' ? dirname($base) : (__DIR__ . '/data');
  if (!is_dir($dir)) @mkdir($dir, 0700, true);
  // Interdit l'accès web direct au dossier (secrets + base SQLite éventuelle).
  $ht = $dir . '/.htaccess';
  if (!file_exists($ht)) @file_put_contents($ht, "Require all denied\nDeny from all\n");
  return $dir;
}
function chapci_hardened_secret(array $config, string $label, string $configured, bool $urlSafe = false): string {
  // Valeurs faibles/connues à ne jamais accepter en production.
  $weak = ['', 'CHANGEZ-MOI-mettez-un-secret-long-et-aleatoire', 'chapci-cron-2026-a7f3e9',
           'changeme', 'secret', 'chapci', 'password', 'test'];
  $configured = trim($configured);
  // Un secret qui VOYAGE (clé cron : URL, en-tête, commande shell) ne doit
  // contenir que des caractères sans signification particulière. Sinon il est
  // mutilé en chemin — « $VAR » avalé par le shell, « % » mal décodé, « ? & ; »
  // qui coupent l'URL — et provoque des 403 « Clé invalide » incompréhensibles.
  // Une clé configurée hors de cet alphabet est REFUSÉE : on retombe alors sur
  // le secret aléatoire persistant (hexadécimal, sûr par construction).
  $shapeOk = !$urlSafe || preg_match('/^[A-Za-z0-9._~-]+$/', $configured) === 1;
  if ($configured !== '' && strlen($configured) >= 24 && !in_array($configured, $weak, true) && $shapeOk) {
    return $configured; // l'opérateur gère déjà un vrai secret : on le respecte
  }
  // Sinon : charge (ou crée une seule fois) un secret aléatoire persistant.
  $file = chapci_secret_dir($config) . '/.secret_' . $label;
  $val  = @is_readable($file) ? trim((string) @file_get_contents($file)) : '';
  if (strlen($val) < 32) {
    try { $val = bin2hex(random_bytes(32)); }
    catch (Throwable $e) { $val = hash('sha256', uniqid((string) mt_rand(), true) . $label . __DIR__); }
    if (@file_put_contents($file, $val) !== false) @chmod($file, 0600);
  }
  // Repli ultime (dossier non inscriptible) : stable par installation, jamais la
  // valeur publique du code.
  return $val !== '' ? $val : hash('sha256', __DIR__ . '|' . $label);
}
// Code d'accès au TABLEAU DE BORD administrateur (serrure en plus du compte admin).
// Vit côté serveur uniquement : l'admin principal le récupère par `cat` du fichier
// api/data/.secret_admincode (Terminal / Gestionnaire de fichiers cPanel) OU en se
// l'envoyant par email (/admin/unlock/email). Personne ne peut ouvrir le tableau de
// bord sans ce code — même un compte administrateur compromis. Auto-généré, stable,
// 8 caractères non ambigus (ni O/0 ni I/1). Surchargeable via CHAPCI_ADMIN_CODE.
function chapci_admin_code(array $config): string {
  $configured = strtoupper(trim((string) (getenv('CHAPCI_ADMIN_CODE') ?: ($config['admin_code'] ?? ''))));
  if ($configured !== '' && strlen($configured) >= 6) return $configured;
  $file = chapci_secret_dir($config) . '/.secret_admincode';
  $val = @is_readable($file) ? strtoupper(trim((string) @file_get_contents($file))) : '';
  if (strlen($val) < 6) {
    $A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; $val = ''; // 32 caractères non ambigus
    for ($i = 0; $i < 8; $i++) {
      try { $r = random_int(0, 31); } catch (Throwable $e) { $r = mt_rand(0, 31); }
      $val .= $A[$r];
    }
    if (@file_put_contents($file, $val) !== false) @chmod($file, 0600);
  }
  return $val;
}
// Code d'accès du PROPRIÉTAIRE : à USAGE UNIQUE et EXPIRANT (60 s par défaut).
// Généré à la demande (bouton « Recevoir le code »), envoyé par email. Stocké hors
// web (dossier data protégé) au format « CODE|EXPIRATION ». Remplace le code fixe :
// un code volé devient inutile en 1 minute.
function admin_otp_file(array $config): string { return chapci_secret_dir($config) . '/.admin_otp'; }
function admin_otp_ttl(array $config): int { return max(30, (int) ($config['admin_otp_ttl'] ?? 60)); }
function admin_otp_generate(array $config): string {
  try { $n = random_int(0, 999999); } catch (Throwable $e) { $n = mt_rand(0, 999999); }
  $code = str_pad((string) $n, 6, '0', STR_PAD_LEFT);
  $f = admin_otp_file($config);
  if (@file_put_contents($f, $code . '|' . (time() + admin_otp_ttl($config))) !== false) @chmod($f, 0600);
  return $code;
}
/** Vérifie un code : correct ET non expiré. Consommé (supprimé) si correct (usage unique). */
function admin_otp_valid(array $config, string $input): bool {
  $input = preg_replace('/\D/', '', (string) $input) ?? '';
  $f = admin_otp_file($config);
  if ($input === '' || !@is_readable($f)) return false;
  $parts = explode('|', trim((string) @file_get_contents($f)));
  if (count($parts) !== 2) return false;
  if (time() > (int) $parts[1]) { @unlink($f); return false; }  // expiré
  if (!hash_equals((string) $parts[0], $input)) return false;   // mauvais code
  @unlink($f);                                                  // usage unique
  return true;
}
$config['jwt_secret'] = chapci_hardened_secret($config, 'jwt',
  (string) (getenv('CHAPCI_JWT_SECRET') ?: ($config['jwt_secret'] ?? '')));
// urlSafe = true : la clé cron circule en URL / en-tête / commande shell.
$config['cron_key'] = chapci_hardened_secret($config, 'cron',
  (string) (getenv('CHAPCI_CRON_KEY') ?: ($config['cron_key'] ?? '')), true);

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
  global $config;
  $e = error_get_last();
  if ($e && in_array($e['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR], true)) {
    if (!headers_sent()) {
      http_response_code(500);
      header('Content-Type: application/json; charset=utf-8');
    }
    $detail = 'Erreur PHP : ' . $e['message'] . ' (' . basename($e['file']) . ':' . $e['line'] . ')';
    error_log('[chapci] ' . $detail);
    // P13 : détails techniques réservés au mode debug ; sinon message générique.
    echo json_encode(['error' => !empty($config['debug']) ? $detail : 'Erreur interne du serveur. Réessayez plus tard.']);
  }
});

// ---- CORS + en-têtes de sécurité (P21) --------------------------------------
// Origine autorisée : celle du site (pas « * »). Un « * » ou une valeur vide
// (config.php ancien) est ramené à l'adresse du site.
if (empty($config['cors_origin']) || $config['cors_origin'] === '*') {
  $config['cors_origin'] = rtrim((string) ($config['site_url'] ?? 'https://chap.ci'), '/');
}
header('Access-Control-Allow-Origin: ' . $config['cors_origin']);
header('Vary: Origin');
// P3 · L'origine est fixe (pas « * ») : on peut autoriser l'envoi du cookie de
// session sur les appels croisés légitimes (ex. future app native).
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Admin-Unlock');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('Referrer-Policy: strict-origin-when-cross-origin');
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

// ---- Sécurité : IP client, journal d'audit, limitation de débit ------------
/** IP réelle du visiteur (tient compte de Cloudflare / proxys). */
/** Vrai si $ip (IPv4) appartient à une plage Cloudflare (liste publique stable). */
function ip_in_cloudflare(string $ip): bool {
  static $ranges = [
    // IPv4 (https://www.cloudflare.com/ips-v4)
    '173.245.48.0/20','103.21.244.0/22','103.22.200.0/22','103.31.4.0/22',
    '141.101.64.0/18','108.162.192.0/18','190.93.240.0/20','188.114.96.0/20','197.234.240.0/22',
    '198.41.128.0/17','162.158.0.0/15','104.16.0.0/13','104.24.0.0/14','172.64.0.0/13','131.0.72.0/22',
    // IPv6 (https://www.cloudflare.com/ips-v6) — sinon un visiteur IPv6 derrière
    // Cloudflare n'était pas reconnu → CF-Connecting-IP ignoré → rate-limiting
    // regroupé à tort sur quelques IP edge partagées.
    '2400:cb00::/32','2606:4700::/32','2803:f800::/32','2405:b500::/32',
    '2405:8100::/32','2a06:98c0::/29','2c0f:f248::/32',
  ];
  // Comparaison CIDR binaire générique (IPv4 = 4 octets, IPv6 = 16 octets).
  $bin = @inet_pton($ip);
  if ($bin === false) return false;
  $len = strlen($bin);
  foreach ($ranges as $r) {
    [$net, $bits] = explode('/', $r);
    $netBin = @inet_pton($net);
    if ($netBin === false || strlen($netBin) !== $len) continue; // familles d'IP différentes
    $bits  = (int) $bits;
    $bytes = intdiv($bits, 8);
    $rem   = $bits % 8;
    if ($bytes > 0 && substr($bin, 0, $bytes) !== substr($netBin, 0, $bytes)) continue;
    if ($rem !== 0) {
      $maskByte = chr((0xFF << (8 - $rem)) & 0xFF);
      if ((substr($bin, $bytes, 1) & $maskByte) !== (substr($netBin, $bytes, 1) & $maskByte)) continue;
    }
    return true;
  }
  return false;
}
/**
 * IP réelle du client. P10 : on ne fait confiance à l'en-tête « vraie IP » de
 * Cloudflare QUE si la connexion vient effectivement d'une IP Cloudflare — sinon
 * un attaquant falsifierait l'en-tête (ou X-Forwarded-For) pour changer d'IP à
 * chaque requête et contourner la limitation de débit. En direct, on utilise
 * REMOTE_ADDR, que le client ne peut pas usurper au niveau TCP.
 */
function client_ip(): string {
  $remote = substr(trim((string) ($_SERVER['REMOTE_ADDR'] ?? '')), 0, 45);
  if (!empty($_SERVER['HTTP_CF_CONNECTING_IP']) && $remote !== '' && ip_in_cloudflare($remote)) {
    return substr(trim((string) $_SERVER['HTTP_CF_CONNECTING_IP']), 0, 45);
  }
  return $remote !== '' ? $remote : '0.0.0.0';
}
/** Journalise un événement de sécurité. Ne casse JAMAIS la requête en cas d'erreur. */
function log_security_event(PDO $pdo, string $kind, ?string $email = null, string $detail = ''): void {
  try {
    $pdo->prepare('INSERT INTO security_events (id,kind,email,ip,ua,detail,created_at) VALUES (?,?,?,?,?,?,?)')
        ->execute([uuid(), $kind, $email ? strtolower($email) : null, client_ip(),
                   substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 200), substr($detail, 0, 200), now_iso()]);
  } catch (Throwable $e) { /* le journal ne doit jamais bloquer l'utilisateur */ }
}
/** Bloque en 429 si trop d'événements d'un type pour cette IP ou cet email dans la fenêtre. */
function rate_limit(PDO $pdo, string $kind, ?string $email, int $limit, int $windowSec): void {
  try {
    $since = gmdate('Y-m-d\TH:i:s\Z', time() - $windowSec);
    $sql = 'SELECT COUNT(*) FROM security_events WHERE kind = ? AND created_at >= ? AND (ip = ?'
         . ($email ? ' OR email = ?' : '') . ')';
    $params = [$kind, $since, client_ip()];
    if ($email) $params[] = strtolower($email);
    $st = $pdo->prepare($sql); $st->execute($params);
    if ((int) $st->fetchColumn() >= $limit) {
      log_security_event($pdo, 'rate_limited', $email, $kind);
      jerr('Trop de tentatives. Pour votre sécurité, réessayez dans quelques minutes.', 429);
    }
  } catch (Throwable $e) { /* en cas d'erreur DB, ne pas pénaliser un utilisateur légitime */ }
}
/** Une IP correspond-elle à un motif d'exclusion (exact, ou préfixe finissant par '.') ? */
function ip_ignored(string $ip, $patterns): bool {
  if (is_string($patterns)) $patterns = array_filter(array_map('trim', explode(',', $patterns)));
  foreach ((array) $patterns as $p) {
    $p = (string) $p; if ($p === '') continue;
    if ($ip === $p) return true;
    if (substr($p, -1) === '.' && strncmp($ip, $p, strlen($p)) === 0) return true;
  }
  return false;
}
/** Synthèse sécurité NETTOYÉE (IP de monitoring exclues) sur la fenêtre $since→maintenant. */
function security_stats(PDO $pdo, array $config, string $since): array {
  $ignore = $config['security_ignore_ips'] ?? [];
  $counts = [];
  $st = $pdo->prepare('SELECT kind, COUNT(*) AS n FROM security_events WHERE created_at >= ? GROUP BY kind');
  $st->execute([$since]);
  foreach ($st->fetchAll() as $r) $counts[$r['kind']] = (int) $r['n'];
  // IP suspectes (login_fail + rate_limited), hors IP ignorées, ≥ 5 événements.
  $ipsSt = $pdo->prepare("SELECT ip, COUNT(*) AS n FROM security_events WHERE kind IN ('login_fail','rate_limited') AND created_at >= ? GROUP BY ip ORDER BY n DESC");
  $ipsSt->execute([$since]);
  $suspicious = [];
  foreach ($ipsSt->fetchAll() as $r) {
    if ((int) $r['n'] >= 5 && !ip_ignored((string) $r['ip'], $ignore)) $suspicious[] = ['ip' => $r['ip'], 'n' => (int) $r['n']];
    if (count($suspicious) >= 10) break;
  }
  // login_fail hors IP ignorées → ratio honnête (pas faussé par le monitoring).
  $fbi = $pdo->prepare("SELECT ip, COUNT(*) AS n FROM security_events WHERE kind = 'login_fail' AND created_at >= ? GROUP BY ip");
  $fbi->execute([$since]);
  $loginFail = 0;
  foreach ($fbi->fetchAll() as $r) if (!ip_ignored((string) $r['ip'], $ignore)) $loginFail += (int) $r['n'];
  $loginOk = $counts['login_ok'] ?? 0;
  // Détail par motif, pour les seules catégories de DIAGNOSTIC.
  //
  // log_security_event() enregistre déjà la route dans « detail » — cron_fail
  // stocke par exemple « cron/backup ». Mais rien ne l'exposait : le bureau
  // Sécurité voyait le compteur monter sans pouvoir dire QUELLE tâche échouait,
  // et l'a signalé comme « limite connue » trois rondes de suite. C'est ce
  // trou qui a laissé la sauvegarde quotidienne muette pendant douze jours.
  //
  // Volontairement limité à ces trois types : ce sont des motifs techniques
  // (route, cause). On n'expose PAS le détail de login_fail ou mfa_fail, qui
  // peut contenir une adresse e-mail — la clé cron n'est pas un accès admin.
  $byDetail = [];
  $dSt = $pdo->prepare("SELECT kind, detail, COUNT(*) AS n FROM security_events
                        WHERE kind IN ('cron_fail','mtoken_fail','rate_limited') AND created_at >= ?
                        GROUP BY kind, detail ORDER BY n DESC");
  $dSt->execute([$since]);
  foreach ($dSt->fetchAll() as $r) {
    $k = (string) $r['kind'];
    if (!isset($byDetail[$k])) $byDetail[$k] = [];
    if (count($byDetail[$k]) >= 10) continue;   // top 10 par type, pas de déluge
    $d = trim((string) ($r['detail'] ?? ''));
    $byDetail[$k][] = ['detail' => $d === '' ? '(non renseigné)' : $d, 'n' => (int) $r['n']];
  }
  return ['counts' => $counts, 'loginOk' => $loginOk, 'loginFail' => $loginFail,
          'ratio' => ($loginOk + $loginFail) ? round($loginFail / ($loginOk + $loginFail), 2) : 0,
          'suspicious' => $suspicious, 'byDetail' => $byDetail];
}
function iso_to_ms(?string $iso): int { return $iso ? (int) (strtotime($iso) * 1000) : 0; }

// ---- Modération automatique (Le Gardien de publication) ---------------------
/** Normalise un texte pour l'analyse : minuscules, sans accents, ponctuation -> espaces. */
function mod_norm(string $s): string {
  $s = mb_strtolower($s, 'UTF-8');
  $s = strtr($s, [
    'à'=>'a','â'=>'a','ä'=>'a','á'=>'a','é'=>'e','è'=>'e','ê'=>'e','ë'=>'e',
    'î'=>'i','ï'=>'i','í'=>'i','ô'=>'o','ö'=>'o','ó'=>'o','ù'=>'u','û'=>'u','ü'=>'u','ç'=>'c','ñ'=>'n',
  ]);
  $s = preg_replace('/[^a-z0-9]+/', ' ', $s);         // ponctuation/emoji -> espace
  return ' ' . trim(preg_replace('/\s+/', ' ', $s)) . ' ';
}
/**
 * Analyse le texte d'une annonce ou d'un message (anti-arnaque + contenu
 * interdit). 100 % local, sans coût. Renvoie
 *   ['ok' => bool, 'reasons' => [['code','label','advice'], ...]].
 * Filtre les cas évidents ; la modération humaine (admin) reste le filet.
 */
function moderate_text(string $text): array {
  $t = mod_norm($text);
  $groups = [
    ['code'=>'drogue','label'=>'Produits stupéfiants / drogues',
     'advice'=>'La vente de drogues est illégale et strictement interdite sur Chap.ci.',
     'terms'=>[' drogue',' stupefiant',' cannabis',' chanvre indien',' weed ',' marijuana',' ganja',' cocaine',' heroine',' crack ',' ecstasy',' mdma',' amphetamine',' methamphet',' kush ',' hashich',' hashish',' shabu']],
    ['code'=>'arme','label'=>'Armes et munitions',
     'advice'=>'La vente d’armes, de munitions ou d’explosifs est interdite.',
     'terms'=>[' arme a feu',' pistolet',' revolver',' kalachnikov',' ak 47',' fusil d assaut',' munition',' cartouche a balle',' grenade',' explosif']],
    ['code'=>'medicament','label'=>'Médicaments / produits pharmaceutiques',
     'advice'=>'La vente de médicaments hors pharmacie agréée est interdite (réglementation AIRP).',
     'terms'=>[' medicament',' viagra',' cialis',' cytotec',' misoprostol',' tramadol',' pilule abortive',' produit abortif']],
    ['code'=>'cosmetique','label'=>'Cosmétiques dépigmentants / éclaircissants dangereux',
     'advice'=>'La vente de produits dépigmentants ou éclaircissants pour la peau (hydroquinone, mercure, corticoïdes…) est interdite et dangereuse pour la santé (contrôles AIRP).',
     'terms'=>[' hydroquinone',' depigment',' clobetasol',' corticoide',' tchatcho',' blanchiment de la peau',' blanchir la peau',' eclaircir la peau',' creme eclaircissante',' savon eclaircissant',' lait eclaircissant',' gel eclaircissant']],
    ['code'=>'faux','label'=>'Faux documents / fausse monnaie',
     'advice'=>'Les faux papiers, faux diplômes ou la fausse monnaie sont illégaux.',
     'terms'=>[' faux papier',' faux document',' faux diplome',' faux permis',' faux passeport',' vrai faux',' faux billet',' fausse monnaie',' faux argent']],
    ['code'=>'sexuel_service','label'=>'Services à caractère sexuel',
     'advice'=>'Les services de plaisir contre argent (escorte, prostitution…) sont interdits et illégaux.',
     'terms'=>[' escort',' escorte',' prostitu',' plan cul',' coup d un soir',' call girl',' callgirl',' service de plaisir',' services de plaisir',' massage sexuel',' massage sensuel',' sexe contre',' sexe en echange',' gigolo',' sugar daddy',' sugar mummy',' rencontre coquine',' michetonnage']],
    ['code'=>'contenu_sexuel','label'=>'Contenu sexuel / nudité',
     'advice'=>'Les contenus pornographiques ou de nudité sont interdits sur Chap.ci.',
     'terms'=>[' porno',' pornographie',' xxx ',' photo nue',' photos nues',' nudite',' sextape',' film x ',' contenu adulte',' nudes ',' hentai']],
    ['code'=>'especes','label'=>'Espèces protégées',
     'advice'=>'Le commerce d’ivoire, d’écailles ou d’espèces protégées est interdit.',
     'terms'=>[' defense d ivoire',' ivoire d elephant',' ecaille de tortue',' pangolin',' corne de rhinoceros',' peau de leopard',' peau de panthere']],
    ['code'=>'arnaque_avance','label'=>'Paiement à l’avance (signe d’arnaque)',
     'advice'=>'Ne demandez jamais de paiement avant livraison. Retirez toute mention d’acompte, de frais d’avance ou de Western Union.',
     'terms'=>[' payer d avance',' payez d avance',' paiement avant livraison',' paiement a l avance',' acompte avant',' frais de dossier',' frais d avance',' western union',' moneygram',' envoyez l argent',' caution avant',' payer avant de recevoir']],
    ['code'=>'arnaque_gain','label'=>'Fausse promesse de gain (signe d’arnaque)',
     'advice'=>'Les offres « argent facile », loteries ou placements garantis sont des arnaques interdites.',
     'terms'=>[' argent facile',' gagnez de l argent facilement',' vous avez gagne',' loterie',' heritage a reclamer',' doublez votre argent',' placement garanti',' investissement garanti',' rendement garanti']],
  ];
  $reasons = [];
  foreach ($groups as $g) {
    foreach ($g['terms'] as $term) {
      if (strpos($t, $term) !== false) {
        $reasons[] = ['code'=>$g['code'], 'label'=>$g['label'], 'advice'=>$g['advice']];
        break;
      }
    }
  }
  return ['ok' => count($reasons) === 0, 'reasons' => $reasons];
}

// ---- Notifications in-app ----------------------------------------------------
/** Crée une notification pour un utilisateur, en respectant ses préférences. */
function notify(PDO $pdo, string $userId, string $type, string $title, string $body, string $link = ''): void {
  if ($userId === '') return;
  try {
    $st = $pdo->prepare('SELECT notif_prefs FROM profiles WHERE id = ?'); $st->execute([$userId]);
    $prefs = json_decode((string) ($st->fetch()['notif_prefs'] ?? ''), true) ?: [];
    if (isset($prefs[$type]) && !$prefs[$type]) return; // ce type est désactivé par l'utilisateur
    $pdo->prepare('INSERT INTO notifications (id,user_id,type,title,body,link,read_flag,created_at) VALUES (?,?,?,?,?,?,0,?)')
        ->execute([uuid(), $userId, $type, substr($title, 0, 120), substr($body, 0, 240), substr($link, 0, 200), now_iso()]);
  } catch (Throwable $e) { /* une notification ne doit jamais casser l'action */ }
}
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
/**
 * Émet un jeton de session pour un utilisateur, en y incluant sa version de
 * session courante (P12). Un changement de mot de passe incrémente cette version
 * → tous les jetons plus anciens deviennent invalides.
 */
function mk_token(PDO $pdo, string $userId, string $email, string $secret): string {
  $sv = 0;
  try {
    $st = $pdo->prepare('SELECT session_version FROM users WHERE id = ?');
    $st->execute([$userId]);
    $sv = (int) ($st->fetchColumn() ?: 0);
  } catch (Throwable $e) { /* colonne absente : version 0 */ }
  return jwt_sign(['sub' => $userId, 'email' => $email, 'sv' => $sv, 'exp' => time() + 60 * 60 * 24 * 30], $secret);
}

// ---- 2FA / TOTP (RFC 6238 — compatible Google Authenticator / Authy) --------
// Secret en base32, code à 6 chiffres, pas de 30 s, tolérance ±1 pas (petites
// dérives d'horloge). Aucune dépendance externe : tout tient dans ce fichier.
function totp_b32_encode(string $bin): string {
  $A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'; $out = ''; $bits = 0; $val = 0;
  for ($i = 0, $n = strlen($bin); $i < $n; $i++) {
    $val = ($val << 8) | ord($bin[$i]); $bits += 8;
    while ($bits >= 5) { $bits -= 5; $out .= $A[($val >> $bits) & 31]; }
  }
  if ($bits > 0) $out .= $A[($val << (5 - $bits)) & 31];
  return $out;
}
function totp_b32_decode(string $b32): string {
  $A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  $b32 = strtoupper(preg_replace('/[^A-Za-z2-7]/', '', $b32) ?? '');
  $out = ''; $bits = 0; $val = 0;
  for ($i = 0, $n = strlen($b32); $i < $n; $i++) {
    $idx = strpos($A, $b32[$i]); if ($idx === false) continue;
    $val = ($val << 5) | $idx; $bits += 5;
    if ($bits >= 8) { $bits -= 8; $out .= chr(($val >> $bits) & 0xFF); }
  }
  return $out;
}
function totp_secret_new(): string {
  try { $bin = random_bytes(20); }
  catch (Throwable $e) { $bin = ''; for ($i = 0; $i < 20; $i++) $bin .= chr(mt_rand(0, 255)); }
  return totp_b32_encode($bin);
}
function totp_at(string $b32, int $counter): string {
  $key = totp_b32_decode($b32);
  $bin = pack('N', 0) . pack('N', $counter); // compteur 64 bits big-endian
  $h = hash_hmac('sha1', $bin, $key, true);
  $o = ord($h[19]) & 0x0F;
  $num = ((ord($h[$o]) & 0x7F) << 24) | ((ord($h[$o + 1]) & 0xFF) << 16)
       | ((ord($h[$o + 2]) & 0xFF) << 8) | (ord($h[$o + 3]) & 0xFF);
  return str_pad((string) ($num % 1000000), 6, '0', STR_PAD_LEFT);
}
function totp_check(string $b32, string $code, int $window = 1): bool {
  $code = preg_replace('/\D/', '', $code) ?? '';
  if ($b32 === '' || strlen($code) !== 6) return false;
  $t = (int) floor(time() / 30);
  for ($i = -$window; $i <= $window; $i++) {
    if (hash_equals(totp_at($b32, $t + $i), $code)) return true;
  }
  return false;
}
function totp_uri(string $b32, string $email): string {
  $issuer = 'Chap.ci';
  $label = rawurlencode($issuer) . ':' . rawurlencode($email);
  $q = http_build_query(['secret' => $b32, 'issuer' => $issuer, 'algorithm' => 'SHA1', 'digits' => 6, 'period' => 30]);
  return "otpauth://totp/$label?$q";
}
// Codes de secours (perte du téléphone) : 8 chiffres, stockés hachés (bcrypt).
function recovery_codes_new(): array {
  $codes = [];
  for ($i = 0; $i < 8; $i++) {
    try { $n = random_int(0, 99999999); } catch (Throwable $e) { $n = mt_rand(0, 99999999); }
    $codes[] = str_pad((string) $n, 8, '0', STR_PAD_LEFT);
  }
  return $codes;
}
// Vérifie un code de secours ; s'il correspond, le retire de la liste (à usage unique).
function recovery_consume(PDO $pdo, string $userId, string $recoveryJson, string $code): bool {
  $code = preg_replace('/\D/', '', $code) ?? '';
  if (strlen($code) !== 8 || $recoveryJson === '') return false;
  $list = json_decode($recoveryJson, true);
  if (!is_array($list)) return false;
  foreach ($list as $i => $hash) {
    if (is_string($hash) && $hash !== '' && password_verify($code, $hash)) {
      unset($list[$i]);
      $pdo->prepare('UPDATE users SET totp_recovery = ? WHERE id = ?')
          ->execute([json_encode(array_values($list)), $userId]);
      return true;
    }
  }
  return false;
}

// ---- Session en cookie HttpOnly (P3) ---------------------------------------
/** Nom du cookie qui porte le jeton d'authentification. */
function session_cookie_name(): string { return 'chapci_session'; }
/**
 * P3 — Pose le jeton dans un cookie HttpOnly + Secure + SameSite=Lax : il devient
 * inaccessible au JavaScript, donc involable par une éventuelle injection (XSS).
 * Le navigateur le renvoie automatiquement sur chaque appel à l'API (même origine).
 * SameSite=Lax + CORS verrouillé (P21) couvrent le risque CSRF.
 */
function set_session_cookie(array $config, string $token): void {
  setcookie(session_cookie_name(), $token, [
    'expires'  => time() + 60 * 60 * 24 * 30,
    'path'     => '/',
    'secure'   => !empty($config['cookie_secure']),
    'httponly' => true,
    'samesite' => 'Lax',
  ]);
  $_COOKIE[session_cookie_name()] = $token; // visible dès la requête courante
}
/** Efface le cookie de session (déconnexion). */
function clear_session_cookie(array $config): void {
  setcookie(session_cookie_name(), '', [
    'expires'  => time() - 3600,
    'path'     => '/',
    'secure'   => !empty($config['cookie_secure']),
    'httponly' => true,
    'samesite' => 'Lax',
  ]);
  unset($_COOKIE[session_cookie_name()]);
}

// ---- Déverrouillage du tableau de bord admin (2ᵉ serrure : code d'accès) -----
// Après un déverrouillage réussi, la session porte un jeton « au » (admin unlock)
// de courte durée (12 h), transmis soit par l'en-tête X-Admin-Unlock (app/web),
// soit par un cookie HttpOnly. Il est lié à l'utilisateur (sub) : le jeton d'un
// admin ne déverrouille pas la session d'un autre.
function admin_unlock_token(): string {
  $hdr = $_SERVER['HTTP_X_ADMIN_UNLOCK'] ?? '';
  if (!$hdr && function_exists('apache_request_headers')) {
    $h = apache_request_headers();
    $hdr = $h['X-Admin-Unlock'] ?? $h['x-admin-unlock'] ?? '';
  }
  if ($hdr) return trim($hdr);
  return (string) ($_COOKIE['chapci_admin'] ?? '');
}
function admin_unlocked(array $config, PDO $pdo, string $secret, array $u): bool {
  $tok = admin_unlock_token();
  if ($tok === '') return false;
  $p = jwt_verify($tok, $secret);
  if (!$p || empty($p['au']) || (string) ($p['sub'] ?? '') !== (string) ($u['id'] ?? '')) return false;
  // Un MODÉRATEUR bloqué par l'admin perd l'accès immédiatement, même si son jeton
  // de déverrouillage est encore valide (accès « permanent jusqu'au blocage »).
  $email = strtolower((string) ($u['email'] ?? ''));
  if (!in_array($email, owner_emails($config), true)) {
    try {
      $st = $pdo->prepare('SELECT blocked FROM admins WHERE email = ?'); $st->execute([$email]);
      if ((int) ($st->fetchColumn() ?: 0) === 1) return false;
    } catch (Throwable $e) { /* colonne absente : pas de blocage */ }
  }
  return true;
}
function set_admin_unlock_cookie(array $config, string $token, int $maxAge = 43200): void {
  setcookie('chapci_admin', $token, [
    'expires'  => time() + $maxAge,
    'path'     => '/',
    'secure'   => !empty($config['cookie_secure']),
    'httponly' => true,
    'samesite' => 'Lax',
  ]);
  $_COOKIE['chapci_admin'] = $token;
}
function clear_admin_unlock_cookie(array $config): void {
  setcookie('chapci_admin', '', [
    'expires' => time() - 3600, 'path' => '/',
    'secure' => !empty($config['cookie_secure']), 'httponly' => true, 'samesite' => 'Lax',
  ]);
  unset($_COOKIE['chapci_admin']);
}

// ---- Requêtes HTTP sortantes (SMS, JWKS Google) -----------------------------
/** Petit client HTTP (cURL si dispo, sinon flux). Renvoie ['status'=>int,'body'=>string]. */
function http_fetch(string $url, array $opts = []): array {
  $method  = strtoupper($opts['method'] ?? 'GET');
  $headers = $opts['headers'] ?? [];
  $body    = $opts['body']    ?? null;
  $userpwd = $opts['userpwd'] ?? null; // "user:pass" pour l'auth Basic
  if (function_exists('curl_init')) {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 15);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    if ($headers) curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    if ($body !== null) curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
    if ($userpwd) curl_setopt($ch, CURLOPT_USERPWD, $userpwd);
    $resp = curl_exec($ch);
    $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return $resp === false ? ['status' => 0, 'body' => ''] : ['status' => $status, 'body' => (string) $resp];
  }
  // Repli sans cURL (allow_url_fopen).
  $hdr = $headers;
  if ($userpwd) $hdr[] = 'Authorization: Basic ' . base64_encode($userpwd);
  $ctx = stream_context_create([
    'http' => ['method' => $method, 'header' => implode("\r\n", $hdr), 'content' => $body, 'timeout' => 15, 'ignore_errors' => true],
    'ssl'  => ['verify_peer' => true, 'verify_peer_name' => true],
  ]);
  $resp = @file_get_contents($url, false, $ctx);
  $status = 0;
  if (isset($http_response_header[0]) && preg_match('#\s(\d{3})\s#', $http_response_header[0], $m)) $status = (int) $m[1];
  return ['status' => $status, 'body' => $resp === false ? '' : $resp];
}

// ---- IndexNow : indexation instantanée (Bing, Yandex, Seznam…) --------------
// Quand une annonce est publiée ou modifiée, on prévient tout de suite les moteurs
// via IndexNow : l'annonce est indexée en minutes au lieu d'attendre le crawl.
// (Google ne consomme pas IndexNow mais suit le sitemap + les liens.)

/** Clé IndexNow stable (auto-générée une fois, rangée à côté des autres secrets). */
function chapci_indexnow_key(array $config): string {
  $configured = trim((string) (getenv('CHAPCI_INDEXNOW_KEY') ?: ($config['indexnow_key'] ?? '')));
  if (strlen($configured) >= 8 && ctype_alnum($configured)) return $configured;
  $file = chapci_secret_dir($config) . '/.indexnow_key';
  $val  = @is_readable($file) ? trim((string) @file_get_contents($file)) : '';
  if (strlen($val) < 16 || !ctype_alnum($val)) {
    try { $val = bin2hex(random_bytes(16)); }
    catch (Throwable $e) { $val = substr(hash('sha256', uniqid((string) mt_rand(), true) . __DIR__), 0, 32); }
    if (@file_put_contents($file, $val) !== false) @chmod($file, 0600);
  }
  return $val;
}

/** Signale une ou plusieurs URLs neuves/modifiées à IndexNow. Silencieux, non bloquant. */
function chapci_indexnow_ping(array $config, array $urls): void {
  try {
    $urls = array_values(array_filter(array_unique($urls)));
    if (!$urls) return;
    $site = rtrim((string) ($config['site_url'] ?? 'https://chap.ci'), '/');
    $host = parse_url($site, PHP_URL_HOST);
    if (!$host) return;
    $key = chapci_indexnow_key($config);
    $payload = json_encode([
      'host'        => $host,
      'key'         => $key,
      'keyLocation' => $site . '/' . $key . '.txt',
      'urlList'     => $urls,
    ], JSON_UNESCAPED_SLASHES);
    // Timeout court : la publication ne doit jamais attendre le moteur.
    http_fetch('https://api.indexnow.org/indexnow', [
      'method'  => 'POST',
      'headers' => ['Content-Type: application/json; charset=utf-8'],
      'body'    => $payload,
    ]);
  } catch (Throwable $e) { /* jamais bloquer la publication d'une annonce */ }
}

// ---- Téléphone & SMS (connexion par code) -----------------------------------
/** Normalise un numéro au format international (+225… pour la Côte d'Ivoire). */
function normalize_phone(string $p): string {
  $p = preg_replace('/[^0-9+]/', '', $p);
  if ($p === '') return '';
  if (strncmp($p, '00', 2) === 0) $p = '+' . substr($p, 2);       // 00225… -> +225…
  if ($p[0] !== '+') {
    if (strlen($p) === 10 && $p[0] === '0') $p = '+225' . $p;     // 07XXXXXXXX (10 ch.) -> +225…
    elseif (strlen($p) === 8) $p = '+225' . $p;                    // ancien format 8 chiffres
    else $p = '+' . $p;
  }
  return substr($p, 0, 20);
}
/** Envoie un SMS via le fournisseur configuré. Renvoie true si accepté. */
function sms_send(array $config, string $to, string $text): bool {
  $sms = $config['sms'] ?? [];
  $provider = $sms['provider'] ?? '';
  if ($provider === 'twilio') {
    $sid = $sms['twilio_sid'] ?? ''; $token = $sms['twilio_token'] ?? ''; $from = $sms['twilio_from'] ?? '';
    if ($sid === '' || $token === '' || $from === '') return false;
    $url = 'https://api.twilio.com/2010-04-01/Accounts/' . rawurlencode($sid) . '/Messages.json';
    // Un identifiant commençant par « MG » est un Messaging Service Twilio,
    // sinon c'est un numéro d'expéditeur (ou un Sender ID alphanumérique).
    $params = strncmp($from, 'MG', 2) === 0
      ? ['To' => $to, 'MessagingServiceSid' => $from, 'Body' => $text]
      : ['To' => $to, 'From' => $from, 'Body' => $text];
    $r = http_fetch($url, [
      'method' => 'POST', 'body' => http_build_query($params), 'userpwd' => "$sid:$token",
      'headers' => ['Content-Type: application/x-www-form-urlencoded'],
    ]);
    $ok = $r['status'] >= 200 && $r['status'] < 300;
    // En cas d'échec, on journalise la réponse Twilio (code + message) pour le
    // débogage côté serveur — jamais renvoyée au client.
    if (!$ok) error_log('[chapci] Twilio SMS échec (' . ($r['status'] ?? '?') . ') : ' . substr((string) ($r['body'] ?? ''), 0, 300));
    return $ok;
  }
  if ($provider === 'orange') {
    // API Orange SMS (Afrique / Côte d'Ivoire) : OAuth2 « client_credentials »
    // (jeton valable ~1 h) puis POST JSON. Idéal pour la CI : livraison locale,
    // Sender ID déjà approuvé chez Orange, activation en self-service (~10 min).
    $auth   = $sms['orange_auth']   ?? '';   // en-tête « Basic … » fourni par Orange Developer
    $sender = $sms['orange_sender'] ?? '';    // adresse expéditeur fournie par Orange, ex. « tel:+2250000 »
    $name   = $sms['orange_name']   ?? '';    // nom d'expéditeur affiché (facultatif, 11 car. max)
    if ($auth === '' || $sender === '') return false;
    // 1) Jeton d'accès — mis en cache pour la durée du process (évite de le
    //    redemander à chaque SMS).
    static $otok = null, $oexp = 0;
    if ($otok === null || time() >= $oexp) {
      $tr = http_fetch('https://api.orange.com/oauth/v3/token', [
        'method'  => 'POST',
        'headers' => ['Authorization: ' . $auth, 'Content-Type: application/x-www-form-urlencoded', 'Accept: application/json'],
        'body'    => 'grant_type=client_credentials',
      ]);
      $j = json_decode((string) ($tr['body'] ?? ''), true);
      if (empty($j['access_token'])) {
        error_log('[chapci] Orange OAuth échec (' . ($tr['status'] ?? '?') . ') : ' . substr((string) ($tr['body'] ?? ''), 0, 300));
        return false;
      }
      $otok = (string) $j['access_token'];
      $oexp = time() + max(60, (int) ($j['expires_in'] ?? 3600) - 60);
    }
    // 2) Envoi. La senderAddress doit être identique dans le corps et dans l'URL.
    $req = [
      'address'                => 'tel:+' . ltrim($to, '+'),
      'senderAddress'          => $sender,
      'outboundSMSTextMessage' => ['message' => $text],
    ];
    if ($name !== '') $req['senderName'] = substr($name, 0, 11);
    $endpoint = 'https://api.orange.com/smsmessaging/v1/outbound/' . rawurlencode($sender) . '/requests';
    $r = http_fetch($endpoint, [
      'method'  => 'POST',
      'headers' => ['Authorization: Bearer ' . $otok, 'Content-Type: application/json'],
      'body'    => json_encode(['outboundSMSMessageRequest' => $req], JSON_UNESCAPED_UNICODE),
    ]);
    $ok = $r['status'] >= 200 && $r['status'] < 300;
    if (!$ok) error_log('[chapci] Orange SMS échec (' . ($r['status'] ?? '?') . ') : ' . substr((string) ($r['body'] ?? ''), 0, 300));
    return $ok;
  }
  if ($provider === 'http') {
    $url = $sms['http_url'] ?? '';
    if ($url === '') return false;
    $repl = ['{to}' => rawurlencode($to), '{text}' => rawurlencode($text), '{sender}' => rawurlencode($sms['sender'] ?? '')];
    $url = strtr($url, $repl);
    $headers = [];
    if (!empty($sms['http_auth'])) $headers[] = 'Authorization: ' . $sms['http_auth'];
    $r = http_fetch($url, ['method' => strtoupper($sms['http_method'] ?? 'GET'), 'headers' => $headers]);
    return $r['status'] >= 200 && $r['status'] < 300;
  }
  return false;
}

// ---- Vérification d'un jeton Google (Sign-In) -------------------------------
/** Encode une longueur en DER (ASN.1). */
function der_len(int $len): string {
  if ($len < 0x80) return chr($len);
  $b = '';
  while ($len > 0) { $b = chr($len & 0xff) . $b; $len >>= 8; }
  return chr(0x80 | strlen($b)) . $b;
}
/** Construit une clé publique PEM (SubjectPublicKeyInfo) depuis un JWK RSA (n,e). */
function jwk_to_pem(string $n_b64, string $e_b64): ?string {
  $n = b64url_dec($n_b64); $e = b64url_dec($e_b64);
  if ($n === '' || $e === '') return null;
  $encInt = function (string $x): string {
    if ($x === '') $x = "\x00";
    if (ord($x[0]) & 0x80) $x = "\x00" . $x;   // entier positif
    return "\x02" . der_len(strlen($x)) . $x;
  };
  $seq    = $encInt($n) . $encInt($e);
  $rsaPub = "\x30" . der_len(strlen($seq)) . $seq;
  $algId  = "\x30\x0d\x06\x09\x2a\x86\x48\x86\xf7\x0d\x01\x01\x01\x05\x00"; // rsaEncryption
  $bitStr = "\x03" . der_len(strlen($rsaPub) + 1) . "\x00" . $rsaPub;
  $spki   = "\x30" . der_len(strlen($algId) + strlen($bitStr)) . $algId . $bitStr;
  return "-----BEGIN PUBLIC KEY-----\r\n" . chunk_split(base64_encode($spki), 64) . "-----END PUBLIC KEY-----\r\n";
}
/** Récupère (avec cache 1 h) les clés publiques de Google. */
function google_jwks(): array {
  $cache = sys_get_temp_dir() . '/chapci_google_jwks.json';
  if (is_file($cache) && (time() - filemtime($cache)) < 3600) {
    $j = json_decode((string) @file_get_contents($cache), true);
    if (!empty($j['keys'])) return $j['keys'];
  }
  $r = http_fetch('https://www.googleapis.com/oauth2/v3/certs');
  if ($r['status'] === 200) {
    $j = json_decode($r['body'], true);
    if (!empty($j['keys'])) { @file_put_contents($cache, $r['body']); return $j['keys']; }
  }
  if (is_file($cache)) { $j = json_decode((string) @file_get_contents($cache), true); if (!empty($j['keys'])) return $j['keys']; }
  return [];
}
/**
 * Vérifie un jeton d'identité Google (credential de Google Identity Services).
 * 1) vérification locale RS256 via JWKS ; 2) repli sur l'endpoint tokeninfo.
 * Renvoie les revendications si valide (email, name, picture…), sinon null.
 */
function google_verify_id_token(array $config, string $idToken): ?array {
  $clientId = $config['google_client_id'] ?? '';
  if ($clientId === '' || $idToken === '') return null;
  $parts = explode('.', $idToken);
  if (count($parts) !== 3) return null;
  $header  = json_decode(b64url_dec($parts[0]), true);
  $payload = json_decode(b64url_dec($parts[1]), true);
  if (!is_array($header) || !is_array($payload)) return null;

  $verified = false;
  if (($header['alg'] ?? '') === 'RS256' && !empty($header['kid']) && function_exists('openssl_verify')) {
    $pem = null;
    foreach (google_jwks() as $k) {
      if (($k['kid'] ?? '') === $header['kid'] && ($k['kty'] ?? '') === 'RSA') { $pem = jwk_to_pem($k['n'] ?? '', $k['e'] ?? ''); break; }
    }
    if ($pem) {
      $ok = openssl_verify($parts[0] . '.' . $parts[1], b64url_dec($parts[2]), $pem, OPENSSL_ALGO_SHA256);
      $verified = ($ok === 1);
    }
  }
  // Repli : Google valide lui-même la signature via tokeninfo.
  if (!$verified) {
    $r = http_fetch('https://oauth2.googleapis.com/tokeninfo?id_token=' . urlencode($idToken));
    if ($r['status'] === 200) {
      $ti = json_decode($r['body'], true);
      if (is_array($ti) && !empty($ti['sub'])) { $payload = $ti; $verified = true; }
    }
  }
  if (!$verified) return null;

  // Contrôle des revendications.
  $iss = $payload['iss'] ?? '';
  if ($iss !== 'accounts.google.com' && $iss !== 'https://accounts.google.com') return null;
  if (($payload['aud'] ?? '') !== $clientId) return null;
  $exp = (int) ($payload['exp'] ?? 0);
  if ($exp && time() > $exp + 60) return null;   // 60 s de tolérance d'horloge
  $ev = $payload['email_verified'] ?? false;
  if ($ev !== true && $ev !== 'true' && $ev !== 1 && $ev !== '1') return null;
  if (empty($payload['email'])) return null;
  return $payload;
}

/**
 * Vérifie un jeton d'accès Facebook et renvoie l'identité { id, name, email }.
 * 1) /debug_token (avec le jeton d'application) : le jeton est-il valide ET émis
 *    pour NOTRE application ? 2) /me : récupère le profil. null si invalide.
 */
function facebook_verify_token(array $config, string $accessToken): ?array {
  $appId  = $config['facebook_app_id'] ?? '';
  $secret = $config['facebook_app_secret'] ?? '';
  if ($appId === '' || $secret === '' || $accessToken === '') return null;
  $appToken = $appId . '|' . $secret; // app access token
  $r = http_fetch('https://graph.facebook.com/debug_token?input_token=' . urlencode($accessToken)
    . '&access_token=' . urlencode($appToken));
  if (($r['status'] ?? 0) !== 200) return null;
  $d = json_decode((string) ($r['body'] ?? ''), true);
  $data = is_array($d) ? ($d['data'] ?? null) : null;
  if (!is_array($data) || empty($data['is_valid']) || (string) ($data['app_id'] ?? '') !== (string) $appId) return null;
  $p = http_fetch('https://graph.facebook.com/me?fields=id,name,email&access_token=' . urlencode($accessToken));
  if (($p['status'] ?? 0) !== 200) return null;
  $me = json_decode((string) ($p['body'] ?? ''), true);
  if (!is_array($me) || empty($me['id'])) return null;
  return $me; // { id, name, email? }
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
    // Robustesse SQLite (hébergements cPanel sans MySQL) : le mode WAL autorise
    // des lectures concurrentes pendant une écriture, et busy_timeout fait
    // patienter une requête au lieu de renvoyer « database is locked » (500)
    // quand deux visiteurs écrivent en même temps (rate-limit, security_events…).
    $pdo->exec('PRAGMA journal_mode = WAL');
    $pdo->exec('PRAGMA busy_timeout = 5000');
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
    "CREATE TABLE IF NOT EXISTS ads (
      id $id PRIMARY KEY, user_id $id, title $txt, description $txt, link $txt,
      images $txt, formule $txt, qty $intT, price $intT, pay_method $txt,
      pay_number $txt, status $txt, starts_at $ts, expires_at $ts, ip $txt, created_at $ts
    )$eng",
    "CREATE TABLE IF NOT EXISTS contact_messages (
      id $id PRIMARY KEY, name $txt, email $txt, subject $txt, message $txt,
      ip $txt, handled $intT, created_at $ts
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
    "CREATE TABLE IF NOT EXISTS visits (
      id $id PRIMARY KEY, visitor_id $txt, path $txt, referrer $txt, created_at $ts
    )$eng",
    // Dernier passage RÉUSSI de chaque tâche planifiée. Sans cette trace, une
    // tâche cron qui échoue est totalement silencieuse : le 26/07, la sauvegarde
    // quotidienne ne tournait plus depuis douze jours sans que rien ne l'indique.
    "CREATE TABLE IF NOT EXISTS cron_runs (
      path VARCHAR(64) PRIMARY KEY, last_ok_at $ts, runs $intT
    )$eng",
    // Violations de la politique de sécurité du contenu, AGRÉGÉES.
    // La CSP tourne en « Report-Only » : elle n'empêche rien, elle raconte. On
    // ne garde donc pas chaque rapport (un navigateur peut en envoyer des
    // milliers) mais un compteur par couple directive + origine bloquée. C'est
    // ce relevé qui permettra de la durcir sur des faits plutôt qu'au jugé.
    // Audience des publicites, AGREGEE PAR JOUR.
    // Sans elle, aucun rapport n'est possible : on ne peut pas dire a un
    // annonceur combien de fois sa banniere a ete vue si personne ne compte.
    // Une ligne par pub et par jour — pas un evenement par vue : a 2 000
    // visites par mois, la table reste minuscule et les totaux sont immediats.
    "CREATE TABLE IF NOT EXISTS ad_stats (
      ad_id $id, day VARCHAR(10), views $intT, clicks $intT,
      PRIMARY KEY (ad_id, day)
    )$eng",
    // Journal des e-mails envoyes a un annonceur.
    // Motif : le 28/07, un annonceur a paye et n'a recu aucun e-mail. Impossible
    // de dire si l'envoi avait echoue ou si le message etait parti dans les
    // indesirables — send_mail renvoyait un booleen que PERSONNE n'enregistrait.
    // On garde desormais la trace de chaque tentative, avec son resultat.
    "CREATE TABLE IF NOT EXISTS ad_mails (
      id $id PRIMARY KEY, ad_id $id, kind VARCHAR(24), email $txt,
      ok $intT, created_at $ts
    )$eng",
    // Recettes SAISIES A LA MAIN — dons, virements, tout ce que le site ne peut
    // pas connaitre tout seul.
    //
    // Un don ne laisse AUCUNE trace ici : la page /don affiche un numero, le
    // donateur envoie l'argent depuis son telephone, et l'operation se passe
    // entierement entre lui et Orange Money. Chap.ci n'est jamais dans la
    // boucle. La seule facon honnete de les compter est donc de les relever sur
    // le compte Mobile Money et de les inscrire ici. « confirmed » marque une
    // ligne effectivement retrouvee sur le releve.
    "CREATE TABLE IF NOT EXISTS revenues (
      id $id PRIMARY KEY, kind VARCHAR(16), label $txt, amount $intT,
      method VARCHAR(16), number $txt, occurred_at $ts, note $txt,
      confirmed $intT, confirmed_at $ts, created_at $ts, created_by $txt
    )$eng",
    // ------------------------------------------------------------------------
    //  LE GRAND LIVRE — recettes ET dépenses, dans un seul registre.
    //
    //  Ce que la loi ivoirienne demande à un entreprenant, mot pour mot : deux
    //  registres chronologiques, l'un consignant les factures d'achats et de
    //  dépenses, l'autre consignant SELON L'ORDRE NUMÉRIQUE les factures de
    //  ventes et de prestations. Conservés trois ans, présentables à toute
    //  réquisition du service des Impôts. Le résultat de fin d'exercice se
    //  présente selon le Système Minimal de Trésorerie du SYSCOHADA révisé.
    //
    //  D'où cette table, et ses trois choix :
    //
    //  1. UNE SEULE TABLE, deux sens. Les deux registres se tirent d'un
    //     `WHERE sens = …`. Deux tables auraient signifié deux numérotations à
    //     tenir, deux totaux à réconcilier, et un jour deux vérités.
    //
    //  2. UN NUMÉRO PAR EXERCICE ET PAR SENS, attribué à l'écriture et jamais
    //     recalculé. « L'ordre numérique » exigé par le texte n'a de valeur que
    //     si le numéro ne bouge plus : un numéro recalculé à l'affichage se
    //     décale dès qu'on saisit une opération antidatée, et le registre
    //     imprimé le mois dernier ne correspond plus à celui d'aujourd'hui.
    //
    //  3. LA SOURCE EST GARDÉE. Une publicité encaissée entre ici toute seule,
    //     avec `source = 'ads'` et l'identifiant de la publicité. C'est ce qui
    //     rend la reprise idempotente — on ne compte jamais deux fois — et ce
    //     qui permet, devant un contrôleur, de remonter de la ligne du registre
    //     à l'opération qui l'a produite.
    //
    //  `verrouille` marque un exercice clos : plus aucune écriture ne s'y
    //  ajoute ni ne s'y modifie. Une comptabilité qu'on peut réécrire après
    //  coup ne vaut rien devant l'administration.
    // ------------------------------------------------------------------------
    "CREATE TABLE IF NOT EXISTS compta (
      id $id PRIMARY KEY, exercice $intT, sens VARCHAR(8), numero $intT,
      date_op $ts, libelle $txt, montant $intT, categorie VARCHAR(32),
      mode VARCHAR(16), reference $txt, tiers $txt, piece $txt, note $txt,
      source VARCHAR(16), source_id $txt, verrouille $intT,
      pointe $intT, pointe_le $ts,
      cree_le $ts, cree_par $txt
    )$eng",
    "CREATE TABLE IF NOT EXISTS exercices (
      annee $intT PRIMARY KEY, cloture_le $ts, cloture_par $txt,
      total_recettes $intT, total_depenses $intT
    )$eng",
    "CREATE TABLE IF NOT EXISTS csp_reports (
      k VARCHAR(190) PRIMARY KEY, directive VARCHAR(64), blocked VARCHAR(190),
      n $intT, first_at $ts, last_at $ts
    )$eng",
    "CREATE TABLE IF NOT EXISTS saved_searches (
      id $id PRIMARY KEY, user_id $id, label $txt, params $txt, last_notified_at $ts, created_at $ts
    )$eng",
    // Journal d'audit de sécurité : connexions, inscriptions, blocages… (Le Greffier).
    "CREATE TABLE IF NOT EXISTS security_events (
      id $id PRIMARY KEY, kind $txt, email $txt, ip $txt, ua $txt, detail $txt, created_at $ts
    )$eng",
    // Codes de vérification par SMS (connexion par téléphone). Usage unique, expirent.
    // Codes de verification envoyes par e-mail (6 chiffres).
    // Meme forme que otp_codes (telephone) : une table separee plutot qu'une
    // colonne « type », parce que les deux n'ont ni la meme duree de vie ni les
    // memes limites, et qu'on veut pouvoir purger l'une sans toucher l'autre.
    "CREATE TABLE IF NOT EXISTS email_codes (
      id $id PRIMARY KEY, email $txt, code_hash $txt, attempts $intT, created_at $ts, expires_at $ts
    )$eng",
    "CREATE TABLE IF NOT EXISTS otp_codes (
      id $id PRIMARY KEY, phone $txt, code_hash $txt, attempts $intT, created_at $ts, expires_at $ts
    )$eng",
    // Favoris (côté serveur) : permet de notifier le vendeur.
    "CREATE TABLE IF NOT EXISTS favorites (
      user_id $id, listing_id $id, created_at $ts, PRIMARY KEY (user_id, listing_id)
    )$eng",
    // Notifications in-app (favoris, messages, modération…).
    "CREATE TABLE IF NOT EXISTS notifications (
      id $id PRIMARY KEY, user_id $id, type $txt, title $txt, body $txt, link $txt,
      read_flag $intT, created_at $ts
    )$eng",
    // Vues quotidiennes par annonce — suivi analytique du tableau de bord vendeur
    // (série des vues par jour, tendances par période).
    "CREATE TABLE IF NOT EXISTS listing_view_days (
      listing_id $id, day VARCHAR(10), n $intT, PRIMARY KEY (listing_id, day)
    )$eng",
    // Jetons de service CLOISONNÉS (ex. modération automatique par « Le Gardien »).
    // N'ouvrent QUE les routes /mod/* de leur périmètre (scope) : jamais de session,
    // ni de compte, réglage ou sauvegarde. Révocables et rotatifs depuis l'admin.
    "CREATE TABLE IF NOT EXISTS service_tokens (
      id $id PRIMARY KEY, label $txt, scope $txt, token_hash $txt, prefix $txt,
      created_at $ts, last_used_at $ts, uses $intT, revoked_at $ts
    )$eng",
    // Journal d'audit des actions de modération automatique (masquer / signaler).
    "CREATE TABLE IF NOT EXISTS mod_actions (
      id $id PRIMARY KEY, token_id $id, action $txt, listing_id $id, reason $txt,
      confidence $txt, meta $txt, created_at $ts
    )$eng",
    // Annonces déjà examinées ET jugées OK par la modération auto : évite de les
    // re-servir dans la file à chaque passage (les actions réelles restent, elles,
    // dans mod_actions et le journal d'audit).
    "CREATE TABLE IF NOT EXISTS mod_seen (
      listing_id $id PRIMARY KEY, created_at $ts
    )$eng",
  ];
  foreach ($stmts as $s) $pdo->exec($s);

  // Index d'exclusion de la file de modération : la file écarte les annonces déjà
  // traitées via mod_actions.listing_id. Idempotent (try/catch : MySQL ne connaît
  // pas « CREATE INDEX IF NOT EXISTS »).
  try { $pdo->exec("CREATE INDEX idx_mod_actions_listing ON mod_actions (listing_id)"); }
  catch (Throwable $e) { /* index déjà présent : on ignore */ }

  // Colonnes ajoutées après coup : on les crée sur les bases déjà existantes.
  // (CREATE TABLE IF NOT EXISTS ne touche pas une table déjà présente.)
  try { $pdo->exec("ALTER TABLE user_interests ADD COLUMN subcategory $txt"); }
  catch (Throwable $e) { /* colonne déjà présente : on ignore */ }
  // Préférences de notification, par type. Cette colonne était LUE par notify()
  // et par /notifications/prefs, mais créée nulle part : la requête levait une
  // exception, notify() l'avalait (« une notification ne doit jamais casser
  // l'action ») et AUCUNE notification interne n'arrivait — ni « Annonce
  // publiée », ni les statuts de publicité. Une panne muette, par construction.
  try { $pdo->exec("ALTER TABLE profiles ADD COLUMN notif_prefs $txt"); }
  catch (Throwable $e) { /* colonne déjà présente : on ignore */ }
  try { $pdo->exec("ALTER TABLE listings ADD COLUMN attributes $txt"); }
  catch (Throwable $e) { /* colonne déjà présente : on ignore */ }
  try { $pdo->exec("ALTER TABLE listings ADD COLUMN hidden $intT"); }
  catch (Throwable $e) { /* colonne déjà présente : on ignore */ }
  // Motif du masquage, montré au vendeur dans « Mes annonces ». Une annonce
  // masquée sans explication est une annonce abandonnée.
  try { $pdo->exec("ALTER TABLE listings ADD COLUMN hidden_reason $txt"); }
  catch (Throwable $e) { /* colonne déjà présente : on ignore */ }
  try { $pdo->exec("ALTER TABLE users ADD COLUMN status $txt"); }
  catch (Throwable $e) { /* colonne déjà présente : on ignore */ }
  // Suivi de transaction : annonce vendue, confirmation vendeur, relance d'avis.
  try { $pdo->exec("ALTER TABLE listings ADD COLUMN sold $intT"); }
  catch (Throwable $e) { /* colonne déjà présente : on ignore */ }
  try { $pdo->exec("ALTER TABLE orders ADD COLUMN listing_id $id"); }
  catch (Throwable $e) { /* colonne déjà présente : on ignore */ }
  try { $pdo->exec("ALTER TABLE orders ADD COLUMN seller_confirmed $intT"); }
  catch (Throwable $e) { /* colonne déjà présente : on ignore */ }
  try { $pdo->exec("ALTER TABLE orders ADD COLUMN review_reminded_at $ts"); }
  catch (Throwable $e) { /* colonne déjà présente : on ignore */ }
  try { $pdo->exec("ALTER TABLE orders ADD COLUMN reminder_count $intT"); }
  catch (Throwable $e) { /* colonne déjà présente : on ignore */ }
  // Suivi : la vue de page a-t-elle été faite en étant CONNECTÉ (1) ou en simple
  // visiteur (0) ? Un drapeau, pas un identifiant : on n'écrit jamais QUI a vu la
  // page, seulement s'il avait un compte ouvert. Aucune donnée personnelle
  // nouvelle n'est donc collectée. Sans ce drapeau, « 133 vues sur /publier » est
  // illisible : on ne sait pas si les gens butent sur l'écran d'invitation à créer
  // un compte, ou sur le formulaire lui-même — deux problèmes opposés.
  try { $pdo->exec("ALTER TABLE visits ADD COLUMN authed $intT"); }
  catch (Throwable $e) { /* colonne déjà présente : on ignore */ }
  // Avis à double sens : qui est noté (target_id) et à quel titre (kind).
  try { $pdo->exec("ALTER TABLE reviews ADD COLUMN target_id $id"); }
  catch (Throwable $e) { /* colonne déjà présente : on ignore */ }
  try { $pdo->exec("ALTER TABLE reviews ADD COLUMN kind $txt"); }
  catch (Throwable $e) { /* colonne déjà présente : on ignore */ }
  // Rétro-compat : les avis existants notaient le vendeur.
  try { $pdo->exec("UPDATE reviews SET target_id = seller_id WHERE target_id IS NULL OR target_id = ''"); } catch (Throwable $e) {}
  try { $pdo->exec("UPDATE reviews SET kind = 'seller' WHERE kind IS NULL OR kind = ''"); } catch (Throwable $e) {}
  // Consentement horodaté à l'inscription (Le Gardien du Consentement — loi 2013-450/2013-546).
  try { $pdo->exec("ALTER TABLE users ADD COLUMN consent_at $ts"); } catch (Throwable $e) {}
  try { $pdo->exec("ALTER TABLE users ADD COLUMN cgu_version $txt"); } catch (Throwable $e) {}
  // Connexion par téléphone / Google : numéro et méthode d'inscription du compte.
  try { $pdo->exec("ALTER TABLE users ADD COLUMN phone VARCHAR(20)"); } catch (Throwable $e) {}
  try { $pdo->exec("ALTER TABLE users ADD COLUMN auth_provider $txt"); } catch (Throwable $e) {}
  // P12 · Version de session : incrémentée à chaque changement de mot de passe
  // pour invalider les anciens jetons (déconnexion des sessions ouvertes).
  try { $pdo->exec("ALTER TABLE users ADD COLUMN session_version $intT DEFAULT 0"); } catch (Throwable $e) {}
  // Double authentification (2FA / TOTP) : secret actif, secret en cours
  // d'enrôlement (non confirmé), interrupteur d'activation, codes de secours hachés.
  try { $pdo->exec("ALTER TABLE users ADD COLUMN totp_secret $txt"); } catch (Throwable $e) {}
  try { $pdo->exec("ALTER TABLE users ADD COLUMN totp_pending $txt"); } catch (Throwable $e) {}
  try { $pdo->exec("ALTER TABLE users ADD COLUMN totp_enabled $intT DEFAULT 0"); } catch (Throwable $e) {}
  try { $pdo->exec("ALTER TABLE users ADD COLUMN totp_recovery $txt"); } catch (Throwable $e) {}
  // Badge de vérification bleu : compte fidèle (≥ 1 an) et actif (vend et/ou paie).
  try { $pdo->exec("ALTER TABLE users ADD COLUMN verified $intT DEFAULT 0"); } catch (Throwable $e) {}
  try { $pdo->exec("ALTER TABLE users ADD COLUMN verified_at $ts"); } catch (Throwable $e) {}
  // Relance d'activation : date d'envoi de l'e-mail « publiez votre 1ʳᵉ annonce »
  // (envoyé UNE seule fois par compte — jamais de spam).
  try { $pdo->exec("ALTER TABLE users ADD COLUMN activation_emailed $ts"); } catch (Throwable $e) {}
  // Verification de l'adresse e-mail : date de confirmation du code a 6 chiffres.
  try { $pdo->exec("ALTER TABLE users ADD COLUMN email_verified_at $ts"); } catch (Throwable $e) {}
  // La reprise de l'existant se fait ailleurs (backfill_email_verifie), APRES
  // migrate() : elle doit s'exécuter UNE SEULE FOIS, et migrate() tourne à
  // chaque requête. Premier essai le 29/07 : la clause « created_at <=
  // aujourd'hui » rattrapait les comptes créés le jour même — un compte ouvert
  // à l'instant ressortait déjà vérifié à la requête suivante, et le code
  // n'était jamais demandé. Une date ne borne pas ce qu'un marqueur borne.

  try { $pdo->exec("CREATE INDEX idx_users_phone ON users (phone)"); } catch (Throwable $e) {}
  try { $pdo->exec("CREATE INDEX idx_otp_phone ON otp_codes (phone)"); } catch (Throwable $e) {}
  // Anti-flood du suivi de visites : rend le plafond par visiteur/heure peu coûteux.
  try { $pdo->exec("CREATE INDEX idx_visits_visitor ON visits (visitor_id, created_at)"); } catch (Throwable $e) {}
  // Requêtes par plage de dates du tableau de bord vendeur.
  try { $pdo->exec("CREATE INDEX idx_view_days_day ON listing_view_days (day)"); } catch (Throwable $e) {}
  // Comptabilité : on lit toujours par exercice et par sens, et on remonte de
  // la ligne du registre à l'opération d'origine pour ne pas la compter deux fois.
  try { $pdo->exec("CREATE INDEX idx_compta_ex ON compta (exercice, sens, numero)"); } catch (Throwable $e) {}
  try { $pdo->exec("CREATE INDEX idx_compta_src ON compta (source, source_id)"); } catch (Throwable $e) {}
}

// ---- Auth courant -----------------------------------------------------------
function current_user(PDO $pdo, string $secret): ?array {
  // P3 · Source principale : le cookie HttpOnly (protégé de l'XSS). Repli sur
  // l'en-tête Authorization: Bearer pour les clients API, l'app native et les
  // sessions « héritées » (avant migration vers le cookie).
  $tok = '';
  if (!empty($_COOKIE[session_cookie_name()])) {
    $tok = (string) $_COOKIE[session_cookie_name()];
  } else {
    $hdr = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (!$hdr && function_exists('apache_request_headers')) {
      $h = apache_request_headers();
      $hdr = $h['Authorization'] ?? $h['authorization'] ?? '';
    }
    if (preg_match('/Bearer\s+(.+)/i', $hdr, $m)) $tok = trim($m[1]);
  }
  if ($tok === '') return null;
  $payload = jwt_verify($tok, $secret);
  if (!$payload || empty($payload['sub'])) return null;
  // Un « jeton de défi » 2FA (émis entre le mot de passe et le code) ne vaut PAS
  // une session : il ne sert qu'à /auth/2fa/verify. On le refuse partout ailleurs.
  if (!empty($payload['mfa'])) return null;
  $st = $pdo->prepare('SELECT id, email, session_version FROM users WHERE id = ?');
  $st->execute([$payload['sub']]);
  $row = $st->fetch();
  if (!$row) return null;
  // P12 : un jeton dont la version de session ne correspond plus (mot de passe
  // changé depuis) est rejeté → les anciennes sessions sont déconnectées.
  if ((int) ($payload['sv'] ?? 0) !== (int) ($row['session_version'] ?? 0)) return null;
  return ['id' => $row['id'], 'email' => $row['email']];
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
  $vf = $pdo->prepare('SELECT verified FROM users WHERE id = ?'); $vf->execute([$u['id']]);
  return ['id' => $u['id'], 'email' => $u['email'], 'status' => $status ?: 'active',
          'verified' => ((int) ($vf->fetchColumn() ?: 0)) === 1,
          // « emailVerified » commande le droit de publier ; « badge » ne
          // commande rien, il se contente de dire ce qu'on est.
          'emailVerified' => email_verifie($pdo, (string) $u['id']),
          'badge' => badge_of($GLOBALS['chapci_config'] ?? [], $pdo, $u),
          'user_metadata' => ['full_name' => $name]];
}
/**
 * Le badge d'un compte — CALCULÉ, jamais stocké.
 *
 * Trois états, et un seul est un badge « mérité » :
 *
 *   'admin'       BLEU  · l'équipe Chap.ci. Il ne se gagne pas, il se constate :
 *                        c'est la liste des administrateurs qui fait foi. Son
 *                        rôle est de dire « ce message vient bien du site »,
 *                        pas de récompenser quelqu'un.
 *   'anciennete'  VERT  · six mois de présence, adresse e-mail confirmée. Il ne
 *                        se demande pas : il apparaît le jour dû, tout seul.
 *   ''            aucun · tout le monde d'autre, y compris un compte dont
 *                        l'adresse est vérifiée. Vérifier son e-mail est une
 *                        CONDITION POUR PUBLIER, pas une distinction — donner
 *                        un badge à chacun reviendrait à n'en donner à personne.
 *
 * Pourquoi calculer plutôt que stocker : un badge d'ancienneté rangé dans une
 * colonne se décale du jour où quelqu'un oublie de faire tourner la mise à jour.
 * Ici il n'y a rien à faire tourner — la date de création du compte suffit, et
 * elle ne ment jamais.
 */
function badge_of(array $config, PDO $pdo, array $u): string {
  try {
    if (is_admin($config, $pdo, $u)) return 'admin';
  } catch (Throwable $e) { /* la table admins peut manquer : on continue */ }
  try {
    $st = $pdo->prepare('SELECT created_at, email_verified_at FROM users WHERE id = ?');
    $st->execute([$u['id']]);
    $r = $st->fetch();
    if (!$r || empty($r['email_verified_at'])) return '';
    $mois = (time() - (int) strtotime((string) $r['created_at'])) / (30.44 * 86400);
    return $mois >= 6 ? 'anciennete' : '';
  } catch (Throwable $e) { return ''; }
}

/** Le compte a-t-il confirmé son adresse e-mail ? Condition pour publier. */
function email_verifie(PDO $pdo, string $uid): bool {
  try {
    $st = $pdo->prepare('SELECT email_verified_at FROM users WHERE id = ?');
    $st->execute([$uid]);
    return !empty($st->fetchColumn());
  } catch (Throwable $e) { return true; } // colonne absente : on ne bloque personne
}

/** Éligibilité au badge « vérifié » : ≥ 1 an d'ancienneté ET actif (vend et/ou paie). */
function verify_eligibility(PDO $pdo, array $u): array {
  $uid = $u['id'];
  $st = $pdo->prepare('SELECT created_at FROM users WHERE id = ?'); $st->execute([$uid]);
  $created = (string) ($st->fetchColumn() ?: now_iso());
  $ageDays = (time() - (int) strtotime($created)) / 86400;
  $months  = max(0, (int) floor($ageDays / 30.4));
  $count = function (string $sql, array $args) use ($pdo): int {
    try { $s = $pdo->prepare($sql); $s->execute($args); return (int) $s->fetchColumn(); }
    catch (Throwable $e) { return 0; }
  };
  $listings = $count('SELECT COUNT(*) FROM listings WHERE user_id = ?', [$uid]);               // vend
  $sold     = $count('SELECT COUNT(*) FROM orders WHERE seller_id = ?', [$uid]);               // a vendu
  $paidAds  = $count("SELECT COUNT(*) FROM ads WHERE user_id = ? AND status IN ('active','expired')", [$uid]); // paie
  $ageOk = $ageDays >= 365;
  $activityOk = ($listings > 0) || ($sold > 0) || ($paidAds > 0);
  return [
    'ageOk' => $ageOk, 'activityOk' => $activityOk, 'eligible' => $ageOk && $activityOk,
    'memberSince' => $created, 'months' => $months,
    'listings' => $listings, 'sold' => $sold, 'paidAds' => $paidAds,
  ];
}
/** Emails « propriétaires » (config.php) : admins permanents, non supprimables. */
function owner_emails(array $config): array {
  return array_values(array_map('strtolower', $config['admin_emails'] ?? []));
}
/** Destinataires des rapports automatiques (repli sur les admins si non défini). */
function report_recipients(array $config): array {
  $r = array_filter((array) ($config['report_email'] ?? []));
  return $r ? array_values($r) : ($config['admin_emails'] ?? []);
}
/**
 * Destinataires des notifications de SÉCURITÉ (code d'accès admin, alertes du
 * scan) : le PROPRIÉTAIRE (admin_emails) ET l'adresse de rapport (report_email,
 * ex. contact@chap.ci), dédupliqués. N.B. : cela n'accorde AUCUN droit — c'est
 * uniquement la liste des adresses qui reçoivent les emails.
 */
function security_notify_recipients(array $config): array {
  $all = array_merge(owner_emails($config), array_filter((array) ($config['report_email'] ?? [])));
  return array_values(array_unique(array_map('strtolower', array_map('trim', $all))));
}
/** L'utilisateur est-il administrateur ? Propriétaire (config) OU modérateur (table admins). */
function is_admin(array $config, PDO $pdo, array $u): bool {
  $email = strtolower($u['email'] ?? '');
  if ($email === '') return false;
  // Un compte BLOQUÉ ne peut jamais être admin (même s'il est propriétaire config
  // ou modérateur dans la table `admins`). On vérifie le statut à la source.
  $ss = $pdo->prepare('SELECT status FROM users WHERE email = ?');
  $ss->execute([$email]);
  if ((string) ($ss->fetchColumn() ?: 'active') === 'blocked') return false;
  if (in_array($email, owner_emails($config), true)) return true;
  $st = $pdo->prepare('SELECT 1 FROM admins WHERE email = ?');
  $st->execute([$email]);
  return (bool) $st->fetch();
}

// ---- Rôles fins des modérateurs (permissions par fonctionnalité) ------------
// Le PROPRIÉTAIRE (email de config) a TOUT. Un modérateur n'a que les
// fonctionnalités que l'admin lui a cochées ; certaines restent réservées au
// propriétaire (jamais délégables).
/** Fonctionnalités qu'un modérateur PEUT recevoir (cochables par l'admin). */
function admin_grantable_features(): array {
  return ['visitors','listings','users','reports','contact','ads','orders','conversations','reviews','newsletter','campaigns'];
}
/** Fonctionnalités RÉSERVÉES au propriétaire (jamais délégables à un modérateur). */
function admin_owner_only_features(): array {
  return ['moderators','emails','backup','automation'];
}
/** Libellés FR (pour les cases à cocher de l'UI). */
function admin_feature_labels(): array {
  return [
    'visitors' => 'Visiteurs', 'listings' => 'Annonces', 'users' => 'Utilisateurs',
    'reports' => 'Signalements', 'contact' => 'Messages de contact', 'ads' => 'Publicités', 'orders' => 'Commandes',
    'conversations' => 'Conversations', 'reviews' => 'Avis', 'newsletter' => 'Abonnés',
    'campaigns' => 'Campagnes',
  ];
}
/** Fonctionnalité requise par une route /admin/* (« » = pas de restriction fine). */
function admin_feature_for_path(string $path): string {
  if ($path === 'admin/check' || $path === 'admin/me' || str_starts_with($path, 'admin/unlock')) return '';
  if ($path === 'admin/stats') return 'overview';
  if ($path === 'admin/visits' || $path === 'admin/response-time') return 'visitors';
  if (str_starts_with($path, 'admin/listings')) return 'listings';
  if (str_starts_with($path, 'admin/users')) return 'users';
  if (str_starts_with($path, 'admin/reports')) return 'reports';
  if (str_starts_with($path, 'admin/contact-messages')) return 'contact';
  if (str_starts_with($path, 'admin/ads')) return 'ads';
  if ($path === 'admin/orders') return 'orders';
  if ($path === 'admin/conversations') return 'conversations';
  if (str_starts_with($path, 'admin/reviews')) return 'reviews';
  if (str_starts_with($path, 'admin/campaign')) return 'campaigns';
  if ($path === 'admin/newsletter') return 'newsletter';
  if (str_starts_with($path, 'admin/moderators')) return 'moderators';
  if ($path === 'admin/smtp' || $path === 'admin/test-email') return 'emails';
  if (str_starts_with($path, 'admin/backup') || $path === 'admin/backups' || $path === 'admin/reset') return 'backup';
  if (str_starts_with($path, 'admin/digest') || $path === 'admin/suggestions-test') return 'automation';
  if (str_starts_with($path, 'admin/seo')) return 'automation';
  // Gestion des jetons de service (modération auto) : réservée au propriétaire.
  if (str_starts_with($path, 'admin/service-tokens') || $path === 'admin/mod-audit') return 'automation';
  // Fail-closed : une route /admin/* non répertoriée renvoie 'unknown' → refusée
  // pour un modérateur (seul le propriétaire y accède). Évite un oubli = trou.
  return 'unknown';
}
/** Permissions (tableau) d'un modérateur, depuis la table admins. */
function admin_permissions_for(PDO $pdo, string $email): array {
  $st = $pdo->prepare('SELECT permissions FROM admins WHERE email = ?');
  $st->execute([strtolower($email)]);
  $p = json_decode((string) ($st->fetchColumn() ?: '[]'), true);
  return is_array($p) ? array_values(array_filter($p, 'is_string')) : [];
}
/** L'utilisateur a-t-il le droit sur cette fonctionnalité ? Propriétaire = tout. */
function admin_can(array $config, PDO $pdo, array $u, string $feature): bool {
  $email = strtolower((string) ($u['email'] ?? ''));
  if (in_array($email, owner_emails($config), true)) return true;      // propriétaire : tout
  if ($feature === '' || $feature === 'overview') return true;         // aperçu : toujours permis
  if (in_array($feature, admin_owner_only_features(), true)) return false; // réservé proprio
  return in_array($feature, admin_permissions_for($pdo, $email), true);
}

// ---- Intégrité de la table admins (détection d'une ligne « admin » injectée) --
// Empreinte de l'ensemble des admins (emails triés). L'app enregistre l'empreinte
// « légitime » dans un fichier protégé à CHAQUE changement passé par le tableau de
// bord. Le scan sécurité recompare : si la base a été modifiée AUTREMENT que par
// l'app (injection, accès direct à la base), l'empreinte ne correspond plus → alerte.
function admins_fingerprint(PDO $pdo): string {
  try { $rows = $pdo->query('SELECT email FROM admins ORDER BY email')->fetchAll(PDO::FETCH_COLUMN); }
  catch (Throwable $e) { $rows = []; }
  return hash('sha256', implode('|', array_map('strtolower', (array) $rows)));
}
function admins_fp_file(array $config): string { return chapci_secret_dir($config) . '/.admins_fp'; }
/** Rebaseline : enregistre l'empreinte courante comme « légitime » (après un
 *  changement fait via l'app). */
function admins_fp_save(array $config, PDO $pdo): void {
  $f = admins_fp_file($config);
  if (@file_put_contents($f, admins_fingerprint($pdo)) !== false) @chmod($f, 0600);
}

// ---- Jetons de service cloisonnés (modération automatique « Le Gardien ») ----
// Un jeton de service n'accorde AUCUNE session utilisateur. Il n'ouvre QUE les
// routes /mod/* dont le périmètre (scope) correspond : lire la file, masquer,
// signaler. Il ne peut jamais toucher aux comptes, réglages ni sauvegardes.
function service_token_hash(string $raw): string { return hash('sha256', $raw); }

/**
 * Authentifie un jeton de service pour un périmètre (scope) donné, ex. 'moderation'.
 * Le jeton est lu UNIQUEMENT dans l'en-tête HTTP X-Service-Token — jamais dans
 * l'URL : un secret en query-string finirait en clair dans les journaux d'accès
 * du serveur/CDN (CWE-598). Renvoie la ligne du jeton ou coupe (401/403/429).
 */
function require_service_token(PDO $pdo, string $scope): array {
  // Anti-force-brute : borne les échecs par IP (comme le reste du site).
  rate_limit($pdo, 'mtoken_fail', null, 20, 600);
  $raw = trim((string) ($_SERVER['HTTP_X_SERVICE_TOKEN'] ?? ''));
  if ($raw === '' && function_exists('apache_request_headers')) {
    $h = apache_request_headers();
    $raw = trim((string) ($h['X-Service-Token'] ?? $h['x-service-token'] ?? ''));
  }
  if (strlen($raw) < 24) { log_security_event($pdo, 'mtoken_fail', null, 'missing'); jerr('Jeton de service requis (en-tête X-Service-Token).', 401); }
  $st = $pdo->prepare('SELECT * FROM service_tokens WHERE token_hash = ? LIMIT 1');
  $st->execute([service_token_hash($raw)]);
  $tok = $st->fetch();
  if (!$tok)                        { log_security_event($pdo, 'mtoken_fail', null, 'unknown'); jerr('Jeton invalide.', 403); }
  if (!empty($tok['revoked_at']))   { log_security_event($pdo, 'mtoken_fail', null, 'revoked'); jerr('Jeton révoqué.', 403); }
  if ((string) $tok['scope'] !== $scope) { log_security_event($pdo, 'mtoken_fail', null, 'scope'); jerr('Jeton hors périmètre.', 403); }
  try { $pdo->prepare('UPDATE service_tokens SET last_used_at = ?, uses = COALESCE(uses,0) + 1 WHERE id = ?')->execute([now_iso(), $tok['id']]); }
  catch (Throwable $e) { /* traçabilité best-effort */ }
  return $tok;
}

/** Écrit une action de modération automatique au journal d'audit (inviolable côté app). */
function mod_audit(PDO $pdo, string $tokenId, string $action, ?string $listingId, string $reason, string $confidence = '', array $meta = []): void {
  try {
    $pdo->prepare('INSERT INTO mod_actions (id,token_id,action,listing_id,reason,confidence,meta,created_at) VALUES (?,?,?,?,?,?,?,?)')
        ->execute([uuid(), $tokenId, $action, $listingId, mb_substr($reason, 0, 300), mb_substr($confidence, 0, 20), json_encode($meta, JSON_UNESCAPED_UNICODE), now_iso()]);
  } catch (Throwable $e) { /* audit best-effort */ }
}

/** Destinataires du digest de modération : propriétaire(s) + modérateurs (table admins). */
function moderation_notify_recipients(array $config, PDO $pdo): array {
  $emails = owner_emails($config);
  try { foreach ($pdo->query('SELECT email FROM admins')->fetchAll(PDO::FETCH_COLUMN) as $e) $emails[] = strtolower(trim((string) $e)); }
  catch (Throwable $e) { /* table admins vide/absente : on garde les propriétaires */ }
  return array_values(array_unique(array_filter($emails)));
}

/**
 * Analyse de risque déterministe d'une annonce (mots-clés FR / Nouchi). Sert de
 * PRÉ-TRI : « Le Gardien » garde le dernier mot (il masque via /mod/hide selon SON
 * jugement). Renvoie { score, level: high|medium|ok, reasons[], categories[] }.
 * Volontairement conservateur : on évite les collisions (ex. « ivoire » ≠ « Côte
 * d'Ivoire » → on n'utilise QUE des expressions précises comme « ivoire d'éléphant »).
 */
function moderation_risk(array $listing): array {
  $hay = ' ' . mb_strtolower(trim(((string) ($listing['title'] ?? '')) . ' ' . ((string) ($listing['description'] ?? '')))) . ' ';
  $reasons = []; $cats = []; $score = 0;
  $firstHit = function (array $words) use ($hay): ?string {
    foreach ($words as $w) { if ($w !== '' && mb_strpos($hay, $w) !== false) return $w; }
    return null;
  };
  // [niveau, catégorie, points, expressions] — HIGH = illégal manifeste.
  $rules = [
    ['high', 'armes',        60, ['arme à feu', 'kalachnikov', 'ak-47', 'ak47', 'munition', 'grenade', 'explosif', 'lance-roquette', "fusil d'assaut"]],
    ['high', 'drogues',      60, ['cocaïne', 'cocaine', 'héroïne', 'heroine', 'ecstasy', 'méthamphétamine', 'chanvre indien', 'tramadol', 'tramol']],
    ['high', 'faune',        55, ["ivoire d'éléphant", "défense d'éléphant", 'corne de rhinocéros', 'corne de rhino', 'écaille de pangolin', 'pangolin', 'peau de léopard', 'perroquet gris du gabon']],
    ['high', 'faux',         55, ['faux billet', 'faux billets', 'vrai-faux', 'faux passeport', 'faux diplôme', 'faux permis', "fausse carte d'identité"]],
    ['high', 'humain',       70, ['bébé à vendre', 'vente de bébé', 'rein à vendre', 'organe à vendre']],
    ['high', 'sexuel',       50, ['service sexuel', 'plan cul', ' nudes ']],
    ['medium', 'arnaque',    30, ['western union', 'frais de douane', 'frais de transitaire', 'transitaire', 'payer avant livraison', "multiplication d'argent", 'marabout', 'richesse rapide', 'prêt entre particuliers', 'vous avez gagné', 'félicitations vous avez']],
    ['medium', 'contrefaçon',25, ['réplique', ' replica', 'premium copy', 'copie 1:1', 'contrefaçon', 'première copie']],
    ['medium', 'paiement',   20, ['code de recharge', 'carte de recharge', 'transcash', 'coupon pcs']],
  ];
  foreach ($rules as [$lvl, $cat, $pts, $words]) {
    $hit = $firstHit($words);
    if ($hit !== null) { $score += $pts; $reasons[] = ($lvl === 'high' ? '⛔ ' : '⚠️ ') . $cat . ' : « ' . trim($hit) . ' »'; $cats[] = $cat; }
  }
  $level = $score >= 55 ? 'high' : ($score >= 20 ? 'medium' : 'ok');
  return ['score' => $score, 'level' => $level, 'reasons' => $reasons, 'categories' => array_values(array_unique($cats))];
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

/**
 * IA du site pour Admin → Contact : propose des messages de réponse en toute
 * AUTONOMIE — aucun service externe, aucune clé API. Le moteur détecte les
 * intentions du message (mots-clés FR sur sujet + corps, insensible aux
 * accents, plusieurs intentions possibles), assemble des paragraphes adaptés
 * et renvoie PLUSIEURS propositions (complète, puis courte) que l'admin peut
 * modifier avant envoi. La signature est ajoutée automatiquement à l'envoi.
 */
function contact_ai_draft(array $config, string $name, string $subject, string $message): array {
  $prenom = trim($name) !== '' ? ' ' . preg_split('/\s+/u', trim($name))[0] : '';
  // Normalisation : minuscules + accents retirés → « arnaqué », « Média »… détectés.
  $norm = strtr(mb_strtolower($subject . ' ' . $message), [
    'à' => 'a', 'â' => 'a', 'ä' => 'a', 'é' => 'e', 'è' => 'e', 'ê' => 'e', 'ë' => 'e',
    'î' => 'i', 'ï' => 'i', 'ô' => 'o', 'ö' => 'o', 'ù' => 'u', 'û' => 'u', 'ü' => 'u', 'ç' => 'c',
  ]);
  $has = function (string ...$kws) use ($norm): bool {
    foreach ($kws as $k) { if (str_contains($norm, $k)) return true; }
    return false;
  };

  // Intentions détectées (cumulables) → paragraphes de la réponse complète,
  // et phrase principale de la variante courte (première intention trouvée).
  $paras = [];
  $short = null;
  if ($has('arnaqu', 'escro', 'fraude', 'suspect', 'signal', 'faux profil', 'voleur')) {
    $paras[] = "Merci d’avoir pris le temps de nous alerter : votre signalement a bien été transmis à notre équipe de modération. Nous vérifions l’annonce et le compte concernés, et nous les masquerons ou bloquerons si nécessaire.";
    $paras[] = "Petit rappel de prudence : ne payez jamais d’avance une personne que vous ne connaissez pas, privilégiez la remise en main propre dans un lieu public, et gardez vos échanges dans la messagerie Chap.ci.";
    $short = "Votre signalement est bien transmis à notre équipe de modération : nous vérifions et agirons si nécessaire. Merci de nous aider à garder Chap.ci sûr.";
  }
  if ($has('mot de passe', 'connexion', 'connecter', 'mon compte', 'compte bloque', '2fa', 'double authentification', 'inscription', 'supprimer mon compte')) {
    $paras[] = "Concernant votre compte : pouvez-vous nous préciser l’adresse email utilisée sur Chap.ci et, si possible, une capture d’écran du problème ? Nous vérifierons rapidement de notre côté et reviendrons vers vous avec une solution.";
    $short = $short ?? "Pour vous aider sur votre compte, indiquez-nous l’adresse email utilisée sur Chap.ci et, si possible, une capture d’écran du problème.";
  }
  if ($has('paiement', 'payer', 'mobile money', 'orange money', 'wave', 'mtn', 'moov', 'rembours')) {
    $paras[] = "Au sujet du paiement : Chap.ci ne gère pas les paiements entre acheteurs et vendeurs — ils se font directement entre vous, en main propre ou par Mobile Money. Vérifiez toujours l’article avant de payer, et ne versez jamais d’acompte à une personne inconnue.";
    $short = $short ?? "Les paiements se font directement entre acheteur et vendeur (main propre ou Mobile Money) : vérifiez toujours l’article avant de payer.";
  }
  if ($has('publier', 'publication', 'mon annonce', 'mes annonces', 'photo', 'modifier', 'masquer', 'vendre')) {
    $paras[] = "Pour vos annonces : vous pouvez les publier, modifier, masquer ou supprimer depuis Compte → Mes annonces. Si quelque chose bloque, dites-nous à quelle étape et nous regarderons ensemble.";
    $short = $short ?? "Vos annonces se gèrent depuis Compte → Mes annonces ; dites-nous à quelle étape ça bloque et nous vous aiderons.";
  }
  if ($has('livraison', 'livrer', 'colis', 'expedi')) {
    $paras[] = "Pour la livraison : elle se convient directement avec le vendeur dans la messagerie (lieu, heure, frais éventuels). Nous recommandons la remise en main propre dans un lieu public, avec paiement au moment de la remise.";
    $short = $short ?? "La livraison se convient directement avec le vendeur via la messagerie ; privilégiez la remise en main propre dans un lieu public.";
  }
  if ($has('partenariat', 'presse', 'media', 'publicite', 'sponsor', 'collaborat', 'boutique pro', 'entreprise')) {
    $paras[] = "Merci de votre intérêt pour Chap.ci ! Votre demande a été transmise à la personne en charge des partenariats, qui reviendra vers vous rapidement. N’hésitez pas à nous en dire plus sur votre structure et ce que vous imaginez ensemble.";
    $short = $short ?? "Merci pour votre proposition : elle est transmise au responsable des partenariats, qui revient vers vous rapidement.";
  }
  if ($has('suggestion', 'suggere', 'idee', 'ameliorer', 'ajouter', 'fonctionnalite')) {
    $paras[] = "Un grand merci pour votre idée : nous lisons chaque suggestion, et c’est grâce à ces retours que Chap.ci s’améliore. Nous l’avons notée pour une prochaine évolution du site.";
    $short = $short ?? "Merci pour votre suggestion, elle est bien notée : c’est grâce à ces idées que Chap.ci avance.";
  }
  if (!$paras && $has('merci', 'felicitation', 'bravo', 'super site', 'genial')) {
    $paras[] = "Merci beaucoup pour votre message, il fait très plaisir à toute l’équipe ! C’est pour des utilisateurs comme vous que nous faisons grandir Chap.ci chaque jour.";
    $short = "Merci beaucoup, votre message fait très plaisir à toute l’équipe !";
  }
  if (!$paras) {
    $paras[] = "Merci pour votre message, nous l’avons bien reçu. Notre équipe l’examine et revient vers vous rapidement avec une réponse précise.";
    $short = "Merci pour votre message : notre équipe l’examine et revient vers vous rapidement.";
  }
  $paras = array_slice($paras, 0, 3); // réponse lisible : 3 paragraphes max

  $bonjour  = "Bonjour{$prenom},";
  $fin      = "Si besoin, répondez simplement à cet email : nous restons à votre écoute.";
  $complete = $bonjour . "\n\n" . implode("\n\n", $paras) . "\n\n" . $fin;
  $courte   = $bonjour . "\n\n" . $short . "\n\n" . $fin;
  $drafts   = $courte === $complete ? [$complete] : [$complete, $courte];
  return ['draft' => $drafts[0], 'drafts' => $drafts, 'ai' => true];
}

// ---- Bureau de Croissance SEO : diffusions quotidiennes automatiques --------
// Un « employé virtuel » qui publie CHAQUE JOUR une diffusion sur l'écran
// publicitaire (une annonce mise en avant, une publication éditoriale ou un
// message d'action), au service des objectifs du site : SEO (mots-clés,
// communes, catégories), croissance (publier, parrainer) et confiance.

function seo_state_file(array $config): string { return chapci_secret_dir($config) . '/.seo_auto'; }
/** Le Bureau SEO est-il activé ? Oui par défaut (dès qu'un cron l'appelle). */
function seo_auto_enabled(array $config): bool {
  $f = seo_state_file($config);
  return !is_file($f) || trim((string) @file_get_contents($f)) !== '0';
}
function seo_auto_set(array $config, bool $on): void {
  $f = seo_state_file($config);
  if (@file_put_contents($f, $on ? '1' : '0') !== false) @chmod($f, 0600);
}

/** Libellés FR des catégories (pour les diffusions SEO). */
function seo_category_labels(): array {
  return [
    'telephones' => 'téléphones', 'vehicules' => 'voitures', 'immobilier' => 'biens immobiliers',
    'mode' => 'articles mode & beauté', 'electronique' => 'appareils électroniques',
    'maison' => 'meubles & articles maison', 'emploi' => 'offres d’emploi', 'services' => 'services',
    'materiel-pro' => 'matériels pro', 'alimentation' => 'produits alimentaires',
    'agriculture' => 'produits agricoles', 'animaux' => 'animaux', 'loisirs' => 'articles loisirs & sport',
    'bebe' => 'articles bébé & enfant',
  ];
}

/**
 * Compose la diffusion SEO du jour à partir de l'état RÉEL du site. Le « but »
 * tourne d'un jour à l'autre (déterministe via le jour de l'année) pour couvrir
 * tous les objectifs sans se répéter. Renvoie titre + texte + style + animation.
 */
function seo_daily_broadcast(array $config, PDO $pdo): array {
  $fmt = fn(int $n) => number_format($n, 0, ',', "\u{00A0}"); // « 1 234 »
  $count = function (string $sql, array $p = []) use ($pdo): int {
    try { $st = $pdo->prepare($sql); $st->execute($p); return (int) $st->fetchColumn(); }
    catch (Throwable $e) { return 0; }
  };
  $listings = $count("SELECT COUNT(*) FROM listings WHERE hidden IS NULL OR hidden = 0");
  $users    = $count("SELECT COUNT(*) FROM users");
  // Catégorie la plus fournie (mise en avant SEO).
  $topCat = null; $topCatN = 0;
  try {
    $r = $pdo->query("SELECT category_id, COUNT(*) AS n FROM listings
      WHERE (hidden IS NULL OR hidden = 0) AND category_id <> '' GROUP BY category_id ORDER BY n DESC LIMIT 1")->fetch();
    if ($r) { $topCat = (string) $r['category_id']; $topCatN = (int) $r['n']; }
  } catch (Throwable $e) { /* base vide */ }
  $labels = seo_category_labels();
  $catLabel = $topCat && isset($labels[$topCat]) ? $labels[$topCat] : 'bonnes affaires';

  $styles = ['ivoire', 'impact', 'neon', 'classique', 'script'];
  $anims  = ['fondu', 'glissement', 'pulse', 'defilement', 'machine'];
  $day = (int) gmdate('z');           // jour de l'année (0-365)
  $style = $styles[$day % count($styles)];
  $anim  = $anims[($day + 2) % count($anims)];
  $site  = rtrim($config['site_url'] ?? 'https://chap.ci', '/');

  // Événements datés (prioritaires) : fête de l'indépendance ivoirienne (7 août).
  $md = gmdate('m-d');
  if ($md === '08-07') {
    return ['goal' => 'message', 'title' => 'Bonne fête de l’indépendance 🇨🇮',
      'description' => 'Chap.ci célèbre la Côte d’Ivoire — achetez et vendez chap-chap, partout au pays.',
      'link' => null, 'style' => 'ivoire', 'anim' => 'pulse'];
  }

  // 6 buts en rotation (annonce · publication · message).
  $goals = [
    // 0 · Annonce : met en avant la catégorie la plus fournie (SEO catégorie).
    ['goal' => 'annonce',
     'title' => $topCatN > 0 ? $fmt($topCatN) . ' ' . $catLabel . ' à saisir 🔥' : 'Des milliers d’annonces à saisir 🔥',
     'description' => 'Trouvez les meilleures offres près de chez vous, à Abidjan et partout en Côte d’Ivoire.',
     'link' => $site . '/#/explorer' . ($topCat ? '?cat=' . rawurlencode($topCat) : '')],
    // 1 · Message : croissance — inciter à publier (gratuit).
    ['goal' => 'message',
     'title' => 'Vendez chap-chap — c’est gratuit ! 🧡',
     'description' => 'Publiez votre annonce en 2 minutes et touchez des milliers d’acheteurs ivoiriens.',
     'link' => $site . '/#/publier'],
    // 2 · Publication : preuve sociale (confiance + croissance).
    ['goal' => 'publication',
     'title' => $users > 0 ? 'Déjà ' . $fmt($users) . ' Ivoiriens sur Chap.ci' : 'Rejoignez la communauté Chap.ci',
     'description' => 'La marketplace 100 % ivoirienne où l’on achète et vend en toute confiance.',
     'link' => $site . '/#/inscription'],
    // 3 · Message : SEO local (près de moi / communes).
    ['goal' => 'message',
     'title' => 'Les bonnes affaires près de chez vous 📍',
     'description' => 'De Cocody à Yopougon, d’Abidjan à Bouaké — trouvez et vendez dans votre commune.',
     'link' => $site . '/#/explorer?tri=distance'],
    // 4 · Publication : Mobile Money / sécurité (confiance).
    ['goal' => 'publication',
     'title' => 'Payez en toute sécurité, chap-chap 🔒',
     'description' => 'Orange Money, MTN, Wave, Moov ou en main propre : échangez sereinement sur Chap.ci.',
     'link' => $site . '/#/aide?rubrique=securite'],
    // 5 · Annonce : catalogue global (SEO généraliste).
    ['goal' => 'annonce',
     'title' => $listings > 0 ? $fmt($listings) . ' annonces en ligne aujourd’hui' : 'De nouvelles annonces chaque jour',
     'description' => 'Voitures, téléphones, immobilier, mode… tout se trouve sur Chap.ci.',
     'link' => $site . '/#/explorer'],
  ];
  $g = $goals[$day % count($goals)];
  $g['style'] = $style;
  $g['anim']  = $anim;
  return $g;
}

/**
 * Tarifs de l'écran publicitaire (FCFA). Plein tarif : 2 000 F la semaine
 * (400 F le jour, 6 000 F le mois). MOITIÉ PRIX pour un membre « actif » :
 * compte créé depuis au moins 30 jours ET au moins une annonce active
 * (ni masquée, ni vendue). Le prix est TOUJOURS recalculé côté serveur.
 */
function ad_tariff(PDO $pdo, ?array $u): array {
  $member = false;
  if ($u) {
    $created = strtotime((string) ($u['created_at'] ?? '')) ?: time();
    if (time() - $created >= 30 * 86400) {
      try {
        $st = $pdo->prepare('SELECT COUNT(*) AS c FROM listings WHERE user_id = ?
          AND (hidden IS NULL OR hidden = 0) AND (sold IS NULL OR sold = 0)');
        $st->execute([$u['id']]);
        $member = ((int) $st->fetchColumn()) > 0;
      } catch (Throwable $e) { /* prudence : plein tarif */ }
    }
  }
  $prices = $member
    ? ['day' => 200, 'week' => 1000, 'month' => 3000]
    : ['day' => 400, 'week' => 2000, 'month' => 6000];
  return ['member' => $member, 'prices' => $prices];
}

/**
 * Construit un corps MIME multipart/mixed : partie HTML + une pièce jointe PDF.
 * $pdfB64 = contenu du PDF déjà encodé en base64. L'en-tête Content-Type complet
 * (avec la frontière) est renvoyé via $ctype.
 */
function mime_multipart(string $html, string $pdfB64, string $filename, string &$ctype): string {
  $bnd = 'chapci_' . bin2hex(random_bytes(10));
  $ctype = 'multipart/mixed; boundary="' . $bnd . '"';
  $pdfB64 = preg_replace('/\s+/', '', $pdfB64); // base64 propre, on re-scinde ensuite
  $nl = "\r\n";
  $b  = '--' . $bnd . $nl;
  $b .= 'Content-Type: text/html; charset=UTF-8' . $nl;
  $b .= 'Content-Transfer-Encoding: base64' . $nl . $nl;
  $b .= chunk_split(base64_encode($html)) . $nl;
  $b .= '--' . $bnd . $nl;
  $b .= 'Content-Type: application/pdf; name="' . $filename . '"' . $nl;
  $b .= 'Content-Transfer-Encoding: base64' . $nl;
  $b .= 'Content-Disposition: attachment; filename="' . $filename . '"' . $nl . $nl;
  $b .= chunk_split($pdfB64) . $nl;
  $b .= '--' . $bnd . '--' . $nl;
  return $b;
}

/** Comme smtp_send, mais avec un Content-Type et un corps MIME déjà préparés (pièces jointes). */
function smtp_send_mime(array $s, string $from, string $fromName, string $to, string $subject, string $replyTo, string $ctype, string $body): bool {
  $host   = $s['host'] ?? 'localhost';
  $port   = (int) ($s['port'] ?? 465);
  $secure = strtolower($s['secure'] ?? 'ssl');
  $remote = ($secure === 'ssl' ? 'ssl://' : '') . $host . ':' . $port;
  $ctx = stream_context_create(['ssl' => ['verify_peer' => false, 'verify_peer_name' => false, 'allow_self_signed' => true]]);
  $fp = @stream_socket_client($remote, $errno, $errstr, 20, STREAM_CLIENT_CONNECT, $ctx);
  if (!$fp) return false;
  stream_set_timeout($fp, 20);
  $read = function () use ($fp) {
    $data = '';
    while (($line = fgets($fp, 515)) !== false) { $data .= $line; if (isset($line[3]) && $line[3] === ' ') break; }
    return $data;
  };
  $cmd = function ($c) use ($fp, $read) { fwrite($fp, $c . "\r\n"); return $read(); };
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
  $dom = substr(strrchr($from, '@'), 1) ?: 'chap.ci';
  $headers = 'Date: ' . date('r') . "\r\n"
    . 'Message-ID: <' . bin2hex(random_bytes(12)) . '@' . $dom . ">\r\n"
    . 'From: ' . mime_h($fromName) . ' <' . $from . ">\r\n"
    . 'Reply-To: ' . $replyTo . "\r\n"
    . 'To: <' . $to . ">\r\n"
    . 'Subject: ' . mime_h($subject) . "\r\n"
    . 'MIME-Version: 1.0' . "\r\n"
    . 'Content-Type: ' . $ctype . "\r\n"
    . 'X-Mailer: Chap.ci' . "\r\n";
  fwrite($fp, $headers . "\r\n" . $body . ".\r\n");
  $sent = $read();
  $cmd('QUIT');
  fclose($fp);
  return substr(ltrim($sent), 0, 3) === '250';
}

/** Envoie un email HTML AVEC une pièce jointe PDF (SMTP, repli sur mail()). */
function send_report_mail(array $config, string $to, string $subject, string $html, string $pdfB64, string $filename): bool {
  $from     = $config['mail_from'] ?? 'no-reply@chap.ci';
  $fromName = $config['mail_from_name'] ?? 'Chap.ci';
  $replyTo  = $config['mail_reply_to'] ?? 'contact@chap.ci';
  $ctype = '';
  $body  = mime_multipart($html, $pdfB64, $filename, $ctype);
  $smtp  = $config['smtp'] ?? [];
  if (!empty($smtp['pass'])) {
    if (smtp_send_mime($smtp, $from, $fromName, $to, $subject, $replyTo, $ctype, $body)) return true;
  }
  if (!function_exists('mail')) return false;
  $dom = substr(strrchr($from, '@'), 1) ?: 'chap.ci';
  $headers = implode("\r\n", [
    'MIME-Version: 1.0',
    'Content-Type: ' . $ctype,
    'Date: ' . date('r'),
    'Message-ID: <' . bin2hex(random_bytes(12)) . '@' . $dom . '>',
    'From: ' . mime_h($fromName) . ' <' . $from . '>',
    'Reply-To: ' . $replyTo,
    'X-Mailer: Chap.ci',
  ]);
  return @mail($to, mime_h($subject), $body, $headers, '-f' . $from);
}
/** Bouton d'action réutilisable pour les emails. */
function email_button(string $href, string $label): string {
  return '<table role="presentation" cellpadding="0" cellspacing="0" style="margin:26px auto">'
    . '<tr><td style="border-radius:12px;background:#F77F00">'
    . '<a href="' . htmlspecialchars($href) . '" style="display:inline-block;padding:13px 30px;color:#fff;'
    . 'text-decoration:none;font-weight:bold;font-size:15px;border-radius:12px">' . htmlspecialchars($label) . '</a>'
    . '</td></tr></table>';
}
// =============================================================================
//  Dossier foncier — la contrepartie serveur de src/data/foncier.ts.
//
//  Le formulaire du site vérifie déjà tout cela ; s'arrêter là laisserait la
//  règle à la merci d'un curl. Ce qui est exigé de l'écran est donc exigé ici.
//
//  On ne duplique QUE ce qui sert au contrôle : l'identifiant de chaque
//  document, et s'il porte un numéro. Les descriptions, les verdicts et les
//  conseils à l'acheteur restent côté client, où ils sont affichés.
// =============================================================================

/**
 * Photos exigées pour publier une annonce.
 *
 * Ce nombre est écrit à deux endroits — ici et dans src/pages/PostAd.tsx — et
 * c'est volontaire : le client doit pouvoir le dire AVANT que le vendeur ne
 * remplisse vingt champs, le serveur doit le faire respecter APRÈS. Si vous
 * changez l'un, changez l'autre : sinon le formulaire laisse passer ce que la
 * route refuse, et le vendeur reçoit un refus qu'il ne comprend pas.
 */
const LISTING_MIN_PHOTOS = 3;

/**
 * Efface les annonces qui n'ont AUCUNE photo.
 *
 * La publication exige déjà LISTING_MIN_PHOTOS photos, et la modification ne
 * laisse jamais retomber une annonce à zéro. Restent celles d'avant la règle :
 * une annonce sans photo ne se vend pas, elle occupe une place dans les
 * résultats et elle donne du site l'image d'un catalogue vide. Le Patron a
 * tranché — on les efface, on ne les masque pas.
 *
 * Trois précautions, parce que supprimer ne se rattrape pas :
 *
 *  1. On ne regarde QUE la colonne `images` en base, jamais le disque. Si
 *     `uploads/` tombait ou changeait de chemin, les URL resteraient en base :
 *     une panne de stockage ne peut donc pas déclencher d'effacement.
 *  2. Les annonces VENDUES sont épargnées. Ce sont des pièces d'historique —
 *     une vente, un avis, une commande s'y rattachent, et la comptabilité vit
 *     de cette traçabilité. Une annonce vendue ne s'affiche plus au catalogue,
 *     elle ne gêne donc personne.
 *  3. Le vendeur est prévenu, avec le titre de son annonce et la raison. Une
 *     annonce qui disparaît sans un mot, c'est un vendeur qui croit à un bug.
 *
 * Les favoris pointant sur l'annonce partent avec elle : un favori sans
 * annonce s'affiche comme une carte vide dans « Mes favoris ».
 *
 * @return int nombre d'annonces effacées
 */
function listings_purge_sans_photo(PDO $pdo): int {
  $efface = 0;
  try {
    // On relit et on décode en PHP plutôt que de filtrer en SQL : la colonne
    // peut contenir NULL, '', '[]', ou un JSON abîmé, et chaque base écrit ces
    // cas à sa façon. Le décodage tranche pareil partout.
    $st = $pdo->query("SELECT id, user_id, title, images FROM listings
                       WHERE (sold IS NULL OR sold = 0)");
    $sansPhoto = [];
    foreach ($st->fetchAll() as $r) {
      $brut = (string) ($r['images'] ?? '');
      $liste = $brut === '' ? [] : (json_decode($brut, true) ?: []);
      // Une entrée vide ne compte pas pour une photo.
      $liste = array_filter((array) $liste, fn($u) => trim((string) $u) !== '');
      if (count($liste) === 0) $sansPhoto[] = $r;
    }
    if (!$sansPhoto) return 0;

    $del = $pdo->prepare('DELETE FROM listings WHERE id = ?');
    $delFav = $pdo->prepare('DELETE FROM favorites WHERE listing_id = ?');
    foreach ($sansPhoto as $r) {
      notify(
        $pdo, (string) ($r['user_id'] ?? ''), 'listing',
        'Annonce retirée — aucune photo',
        'Votre annonce « ' . mb_substr((string) $r['title'], 0, 60) . ' » a été retirée : '
        . 'elle ne portait aucune photo. Republiez-la avec au moins '
        . LISTING_MIN_PHOTOS . ' photos de l’objet, elle repartira aussitôt.',
        '/#/publier'
      );
      $del->execute([$r['id']]);
      try { $delFav->execute([$r['id']]); } catch (Throwable $e) { /* table absente */ }
      $efface++;
    }
  } catch (Throwable $e) { /* le ménage ne doit jamais casser la route */ }
  return $efface;
}

/** id => le document porte-t-il un numéro à saisir ? */
const FONCIER_DOCS = [
  'tf' => 'du titre foncier',
  'acd' => 'de l’ACD',
  'tfr' => 'du titre foncier rural',
  'cf' => 'du certificat foncier',
  'acp' => 'de l’ACP',
  'adu' => 'de l’ADU',
  'lettre' => 'de la lettre d’attribution',
  'village' => 'de l’attestation villageoise',
  'aucun' => '', // aucun numéro : c'est justement l'absence de document
];

/**
 * L'annonce relève-t-elle du dossier foncier ? Une VENTE immobilière.
 * Les annonces d'avant la réforme n'ont pas d'attribut `transaction` : on ne
 * les traite comme des locations que lorsqu'elles le disent, explicitement ou
 * par leur sous-catégorie. Le doute penche du côté de l'acheteur.
 */
function foncier_concerne(string $categoryId, ?string $subcategory, array $attrs): bool {
  if ($categoryId !== 'immobilier') return false;
  $t = $attrs['transaction'] ?? '';
  if ($t !== '') return $t === 'Vente';
  return !in_array((string) $subcategory, ['Location', 'Colocation', 'Location vacances'], true);
}

/**
 * Ce qui manque au dossier foncier. Tableau vide = complet.
 * Les libellés sont ceux que verra le vendeur : ils doivent être lisibles tels
 * quels dans un message d'erreur.
 */
function foncier_manques(array $attrs): array {
  $out = [];
  $docs = array_values(array_filter(
    array_map('trim', explode(',', (string) ($attrs['docs'] ?? ''))),
    fn($d) => $d !== '' && array_key_exists($d, FONCIER_DOCS),
  ));
  if (!$docs) $out[] = 'le ou les documents de propriété que vous détenez';
  foreach ($docs as $d) {
    if (FONCIER_DOCS[$d] !== '' && trim((string) ($attrs['num_' . $d] ?? '')) === '') {
      $out[] = 'le numéro ' . FONCIER_DOCS[$d];
    }
  }
  if (trim((string) ($attrs['idufci'] ?? '')) === '') $out[] = 'l’identifiant IDUFCI de la parcelle';
  if (trim((string) ($attrs['titulaire'] ?? '')) === '') $out[] = 'le nom porté sur vos documents';
  if (trim((string) ($attrs['bornage'] ?? '')) === '') $out[] = 'le bornage du terrain';
  if (trim((string) ($attrs['juridique'] ?? '')) === '') $out[] = 'la situation juridique';
  if (trim((string) ($attrs['occupation'] ?? '')) === '') $out[] = 'l’occupation du bien';
  if (trim((string) ($attrs['nature'] ?? '')) === '') $out[] = 'la nature du bien';
  if (trim((string) ($attrs['vendeur'] ?? '')) === '') $out[] = 'votre qualité (propriétaire, héritier…)';
  if (($attrs['engagement'] ?? '') !== 'oui') $out[] = 'les trois engagements du vendeur';
  return $out;
}

/**
 * Refuse la publication d'une vente immobilière au dossier incomplet.
 * Le message énumère ce qui manque : un refus qui ne dit pas quoi corriger
 * fait abandonner le vendeur, et une annonce abandonnée ne protège personne.
 */
function foncier_exiger(string $categoryId, ?string $subcategory, array $attrs): void {
  if (!foncier_concerne($categoryId, $subcategory, $attrs)) return;
  $m = foncier_manques($attrs);
  if (!$m) return;
  jout([
    'error' => 'Vente immobilière : le dossier foncier est incomplet. Il manque ' . implode(', ', $m) . '.',
    'foncier' => true, 'manques' => $m,
  ], 422);
}

// =============================================================================
//  COMPTABILITÉ — le grand livre, ses règles, et le cadre fiscal ivoirien.
//
//  Ce bloc sert une seule chose : qu'un contrôle des Impôts se passe bien.
//  Tout ce qu'il produit doit pouvoir être imprimé, daté, numéroté, et
//  rapproché d'un relevé Mobile Money.
// =============================================================================

/**
 * Les catégories de dépense, adossées au plan comptable SYSCOHADA révisé.
 *
 * Le numéro entre parenthèses est le compte SYSCOHADA correspondant. Il ne
 * sert à rien au quotidien — mais le jour où un comptable reprend ces
 * registres pour établir un bilan, il retrouve ses comptes sans avoir à
 * réinterpréter des libellés maison. C'est ce qui distingue un tableur d'une
 * comptabilité.
 */
const COMPTA_DEPENSES = [
  'hebergement'   => ['Hébergement et nom de domaine', '6281'],
  'logiciel'      => ['Logiciels, licences et abonnements', '6288'],
  'boutique'      => ['Frais de boutique d’applications (Google Play, Apple)', '6288'],
  'sms'           => ['SMS et communications', '6262'],
  'publicite'     => ['Publicité et promotion', '6271'],
  'honoraires'    => ['Honoraires (comptable, juriste, développeur)', '6324'],
  'banque'        => ['Frais bancaires et Mobile Money', '6312'],
  'materiel'      => ['Matériel et petit équipement', '6055'],
  'transport'     => ['Transport et déplacements', '6131'],
  'impots'        => ['Impôts et taxes', '6411'],
  'autre'         => ['Autres charges', '6580'],
];

/** Les catégories de recette. */
const COMPTA_RECETTES = [
  'publicite' => ['Vente d’espace publicitaire', '7062'],
  'mise_avant'=> ['Mise en avant d’annonce', '7062'],
  'don'       => ['Dons et soutiens', '7588'],
  'autre'     => ['Autres produits', '7588'],
];

/** Les moyens de paiement réellement utilisés en Côte d'Ivoire. */
const COMPTA_MODES = ['orange', 'mtn', 'moov', 'wave', 'especes', 'virement', 'carte', 'autre'];

/**
 * Le régime fiscal qui s'applique à un chiffre d'affaires annuel.
 *
 * Seuils du Code général des impôts ivoirien, en francs CFA toutes taxes
 * comprises. Ils décident de l'impôt dû ET des obligations comptables : en
 * dessous de 50 millions, deux registres chronologiques suffisent ; au-delà,
 * une comptabilité complète devient obligatoire et cet écran ne suffit plus.
 *
 * ⚠️ Ce calcul INFORME, il ne remplace pas un comptable. Il est là pour qu'on
 * voie venir le seuil avant de le franchir, pas pour établir une déclaration.
 */
function compta_regime(int $caAnnuel): array {
  if ($caAnnuel <= 5000000) return [
    'code' => 'entreprenant_communal',
    'nom' => 'Taxe communale de l’entreprenant',
    'seuil' => 5000000,
    'obligation' => 'Deux registres chronologiques (recettes, dépenses), conservés 3 ans.',
  ];
  if ($caAnnuel <= 50000000) return [
    'code' => 'entreprenant_etat',
    'nom' => 'Taxe d’État de l’entreprenant',
    'seuil' => 50000000,
    'obligation' => 'Deux registres chronologiques + résultat de fin d’exercice au Système Minimal de Trésorerie (SYSCOHADA révisé).',
  ];
  if ($caAnnuel <= 200000000) return [
    'code' => 'microentreprise',
    'nom' => 'Régime des microentreprises (impôt de 7 % du chiffre d’affaires TTC)',
    'seuil' => 200000000,
    'obligation' => 'Comptabilité SYSCOHADA. Faites-vous accompagner par un comptable : cet écran ne suffit plus.',
  ];
  if ($caAnnuel <= 500000000) return [
    'code' => 'reel_simplifie',
    'nom' => 'Régime du réel simplifié',
    'seuil' => 500000000,
    'obligation' => 'Comptabilité complète et états financiers annuels. Un expert-comptable est indispensable.',
  ];
  return [
    'code' => 'reel_normal',
    'nom' => 'Régime du réel normal',
    'seuil' => null,
    'obligation' => 'Comptabilité complète, états financiers certifiés. Un expert-comptable est indispensable.',
  ];
}

/** L'exercice comptable d'une date ISO — l'année civile, comme le veut le CGI. */
function compta_exercice(?string $iso): int {
  $t = $iso ? strtotime($iso) : false;
  return (int) gmdate('Y', $t !== false ? $t : time());
}

/** Cet exercice est-il clos ? Un exercice clos ne reçoit plus rien. */
function compta_clos(PDO $pdo, int $annee): bool {
  try {
    $st = $pdo->prepare('SELECT cloture_le FROM exercices WHERE annee = ?');
    $st->execute([$annee]);
    return !empty($st->fetchColumn());
  } catch (Throwable $e) { return false; }
}

/**
 * Remet les numéros dans l'ordre des dates, pour un exercice et un sens.
 *
 * Le Code général des impôts demande un registre à la fois CHRONOLOGIQUE et
 * tenu « selon l'ordre numérique » : les deux ordres doivent coïncider. Donner
 * simplement le numéro suivant à chaque écriture ne suffit pas — la facture
 * d'hébergement de janvier retrouvée en août arriverait en n° 12 tout en étant
 * datée avant le n° 1, et un contrôleur qui feuillette le registre y verrait
 * exactement ce qu'il cherche : une pièce ajoutée après coup. Une suppression
 * laisserait de même un trou (n° 1, n° 3) tout aussi parlant.
 *
 * On renumérote donc le registre entier après chaque écriture et après chaque
 * suppression. C'est sans danger tant que l'exercice est ouvert : le registre
 * n'est définitif qu'à la clôture, et un exercice clos n'accepte plus ni
 * écriture ni suppression — donc plus aucune renumérotation. Le registre
 * imprimé après la clôture dira la même chose dans trois ans.
 *
 * À date égale, l'ordre de saisie départage : deux dépenses du même jour
 * gardent l'ordre dans lequel le propriétaire les a inscrites.
 */
function compta_renumeroter(PDO $pdo, int $exercice, string $sens): void {
  // Garde-fou : un exercice clos ne bouge plus, jamais, quoi qu'on lui demande.
  // Les trois appelants vérifient déjà la clôture avant d'écrire ou d'effacer ;
  // la garantie tient à ce que ce registre-là ne change plus, et une garantie
  // pareille se tient à un seul endroit, pas à trois.
  if (compta_clos($pdo, $exercice)) return;
  try {
    $st = $pdo->prepare('SELECT id, numero FROM compta WHERE exercice = ? AND sens = ?
                         ORDER BY date_op ASC, cree_le ASC, id ASC');
    $st->execute([$exercice, $sens]);
    $lignes = $st->fetchAll();
    $maj = $pdo->prepare('UPDATE compta SET numero = ? WHERE id = ?');
    foreach ($lignes as $i => $l) {
      $voulu = $i + 1;
      if ((int) $l['numero'] !== $voulu) $maj->execute([$voulu, $l['id']]);
    }
  } catch (Throwable $e) { /* le registre reste lisible même si la remise en ordre échoue */ }
}

/**
 * Inscrit une écriture au grand livre et lui donne son numéro.
 *
 * Le numéro provisoire est le suivant disponible ; `compta_renumeroter()` le
 * remet ensuite à sa place chronologique. Deux saisies simultanées pourraient
 * en théorie viser le même numéro ; à l'échelle de ce site — quelques écritures
 * par mois, un seul propriétaire — le cas ne se présente pas, et la
 * renumérotation qui suit chaque écriture le corrigerait de toute façon.
 */
function compta_ecrire(PDO $pdo, array $e): ?string {
  $exercice = (int) ($e['exercice'] ?? compta_exercice($e['date_op'] ?? null));
  if (compta_clos($pdo, $exercice)) return null;
  $sens = ($e['sens'] ?? 'recette') === 'depense' ? 'depense' : 'recette';

  // Idempotence : une publicité déjà reprise ne revient pas une seconde fois.
  if (!empty($e['source']) && !empty($e['source_id'])) {
    $st = $pdo->prepare('SELECT id FROM compta WHERE source = ? AND source_id = ?');
    $st->execute([$e['source'], $e['source_id']]);
    if ($st->fetchColumn()) return null;
  }

  $st = $pdo->prepare('SELECT MAX(numero) FROM compta WHERE exercice = ? AND sens = ?');
  $st->execute([$exercice, $sens]);
  $numero = (int) $st->fetchColumn() + 1;

  $id = uuid();
  $pdo->prepare('INSERT INTO compta
      (id,exercice,sens,numero,date_op,libelle,montant,categorie,mode,reference,tiers,piece,note,source,source_id,verrouille,pointe,pointe_le,cree_le,cree_par)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,0,?,?,?,?)')
    ->execute([
      $id, $exercice, $sens, $numero,
      $e['date_op'] ?? now_iso(),
      mb_substr(trim((string) ($e['libelle'] ?? '')), 0, 160) ?: 'Opération',
      max(0, (int) ($e['montant'] ?? 0)),
      mb_substr((string) ($e['categorie'] ?? 'autre'), 0, 32),
      in_array($e['mode'] ?? '', COMPTA_MODES, true) ? $e['mode'] : 'autre',
      mb_substr(trim((string) ($e['reference'] ?? '')), 0, 60),
      mb_substr(trim((string) ($e['tiers'] ?? '')), 0, 120),
      mb_substr(trim((string) ($e['piece'] ?? '')), 0, 120),
      mb_substr(trim((string) ($e['note'] ?? '')), 0, 300),
      mb_substr((string) ($e['source'] ?? 'manuel'), 0, 16),
      mb_substr((string) ($e['source_id'] ?? ''), 0, 60),
      // Une publicité dont le paiement a déjà été pointé sur le relevé arrive
      // pointée : le rapprochement déjà fait ne se refait pas.
      !empty($e['pointe']) ? 1 : 0,
      !empty($e['pointe']) ? now_iso() : null,
      now_iso(), mb_substr((string) ($e['cree_par'] ?? ''), 0, 190),
    ]);
  // Une écriture antidatée doit reprendre sa place dans la chronologie, pas
  // rester en queue de registre.
  if (empty($e['sans_renumerotation'])) compta_renumeroter($pdo, $exercice, $sens);
  return $id;
}

/**
 * Fait entrer au grand livre ce qui a été encaissé sans passer par lui.
 *
 * Les publicités payées et les recettes relevées à la main existaient AVANT ce
 * registre. Elles doivent y figurer, sinon le registre ment par omission — et
 * un registre incomplet est pire qu'un registre absent devant un contrôleur.
 *
 * Idempotent par construction (voir `compta_ecrire`) : on peut l'appeler à
 * chaque ouverture de l'écran sans jamais rien compter deux fois. C'est
 * volontaire — un rapprochement qui demande de penser à le lancer finit par ne
 * plus être lancé.
 */
function compta_reprise(PDO $pdo, string $par = 'reprise automatique'): int {
  $candidats = [];

  // Publicités réellement encaissées. Une diffusion maison (kind admin/seo) ou
  // une demande refusée n'a jamais rapporté un franc : elle n'entre pas.
  try {
    $st = $pdo->query("SELECT id,title,price,pay_method,pay_number,email,starts_at,created_at,pay_confirmed
                       FROM ads
                       WHERE price > 0 AND (kind IS NULL OR kind NOT IN ('admin','seo'))
                         AND status IN ('active','expired','merged')");
    foreach ($st->fetchAll() as $a) {
      $quand = $a['starts_at'] ?: $a['created_at'];
      $candidats[] = [
        'sens' => 'recette', 'date_op' => $quand,
        'libelle' => 'Publicité — ' . (($a['title'] ?? '') ?: 'bannière image'),
        'montant' => (int) $a['price'], 'categorie' => 'publicite',
        'mode' => strtolower((string) ($a['pay_method'] ?? 'autre')),
        'reference' => (string) ($a['pay_number'] ?? ''),
        'tiers' => (string) ($a['email'] ?? ''),
        'pointe' => (int) ($a['pay_confirmed'] ?? 0) === 1,
        'source' => 'ads', 'source_id' => (string) $a['id'], 'cree_par' => $par,
      ];
    }
  } catch (Throwable $e) { /* colonne absente sur une base ancienne */ }

  // Recettes saisies à la main avant l'existence du registre (dons, virements).
  try {
    $st = $pdo->query('SELECT * FROM revenues');
    foreach ($st->fetchAll() as $r) {
      $k = (string) ($r['kind'] ?? 'don');
      $candidats[] = [
        'sens' => 'recette', 'date_op' => $r['occurred_at'] ?: $r['created_at'],
        'libelle' => (string) ($r['label'] ?? 'Recette'),
        'montant' => (int) $r['amount'],
        'categorie' => isset(COMPTA_RECETTES[$k]) ? $k : ($k === 'pub' ? 'publicite' : 'autre'),
        'mode' => strtolower((string) ($r['method'] ?? 'autre')),
        'reference' => (string) ($r['number'] ?? ''),
        'note' => (string) ($r['note'] ?? ''),
        'pointe' => (int) ($r['confirmed'] ?? 0) === 1,
        'source' => 'revenues', 'source_id' => (string) $r['id'],
        'cree_par' => (string) ($r['created_by'] ?? $par),
      ];
    }
  } catch (Throwable $e) { /* table absente */ }

  // ⚠️ TRIER PAR DATE AVANT D'ÉCRIRE, et non source par source.
  //
  // Le texte parle d'un registre CHRONOLOGIQUE consigné selon l'ordre
  // NUMÉRIQUE : les deux vont ensemble. Reprendre d'abord toutes les
  // publicités puis tous les dons produisait un registre où la pièce n° 2
  // était datée de janvier et la n° 1 de mars — exactement ce qu'un
  // contrôleur relève en premier. Le numéro suit désormais la date.
  usort($candidats, function (array $a, array $b): int {
    $ta = strtotime((string) $a['date_op']) ?: 0;
    $tb = strtotime((string) $b['date_op']) ?: 0;
    // À date égale, l'identifiant d'origine départage : deux reprises
    // successives rendent alors exactement le même ordre.
    return $ta <=> $tb ?: strcmp((string) $a['source_id'], (string) $b['source_id']);
  });

  // Les candidats sont déjà triés : chacun arrive à sa place, inutile de
  // renuméroter tout le registre à chaque ligne. On le fait une fois à la fin,
  // pour chaque couple (exercice, sens) touché — ce qui remet aussi en ordre
  // les écritures manuelles déjà présentes.
  $n = 0;
  $touches = [];
  foreach ($candidats as $c) {
    $c['sans_renumerotation'] = true;
    if (compta_ecrire($pdo, $c)) {
      $n++;
      $touches[compta_exercice($c['date_op']) . '|' . $c['sens']] = true;
    }
  }
  foreach (array_keys($touches) as $cle) {
    [$ex, $sens] = explode('|', $cle);
    compta_renumeroter($pdo, (int) $ex, $sens);
  }
  return $n;
}

/** Motif inscrit sur les annonces masquées par la campagne de mise à jour. */
const FONCIER_MOTIF = 'Nouvelle règle sur les ventes immobilières : votre annonce doit indiquer '
  . 'le ou les documents de propriété que vous détenez, leur numéro et l’identifiant IDUFCI de la parcelle. '
  . 'Modifiez-la avec le nouveau formulaire, elle repartira en ligne aussitôt.';

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
/**
 * Annonce immobilière masquée en attendant sa mise à jour : on explique
 * pourquoi, on dit exactement quoi faire, et on donne le lien qui ouvre le
 * formulaire sur la bonne annonce. Un message qui se contente d'annoncer un
 * masquage fait perdre un vendeur ; celui-ci lui rend son annonce.
 */
function send_foncier_update_email(array $config, string $to, array $listing): bool {
  $site = rtrim($config['site_url'] ?? 'https://chap.ci', '/');
  $titre = htmlspecialchars(mb_substr((string) $listing['title'], 0, 80));
  $lien = $site . '/#/modifier/' . rawurlencode((string) $listing['id']);
  $inner = '<h2 style="margin:0 0 12px;font-size:19px;color:#111827">Votre annonce immobilière doit être mise à jour</h2>'
    . '<p style="margin:0 0 14px;font-size:15px;line-height:1.6">Bonjour,</p>'
    . '<p style="margin:0 0 14px;font-size:15px;line-height:1.6">Votre annonce '
    . '<b>« ' . $titre . ' »</b> a été <b>temporairement masquée</b>. Elle n’est pas supprimée : '
    . 'vos photos, votre texte et votre prix sont intacts.</p>'
    . '<p style="margin:0 0 14px;font-size:15px;line-height:1.6">En Côte d’Ivoire, sept documents circulent '
    . 'couramment pour un terrain, et trois seulement donnent la propriété. Depuis le 1<sup>er</sup> janvier 2025, '
    . 'l’ADU à QR code est le seul document d’entrée accepté pour demander un ACD, et depuis le 31 mars 2025 '
    . 'l’attestation villageoise n’ouvre plus de dossier. Un acheteur doit l’apprendre <b>avant</b> d’appeler, '
    . 'pas après avoir versé un acompte.</p>'
    . '<p style="margin:0 0 6px;font-size:15px;line-height:1.6">Le formulaire vous demande maintenant :</p>'
    . '<ul style="margin:0 0 14px;padding-left:20px;font-size:15px;line-height:1.7;color:#374151">'
    . '<li>le ou les documents que vous détenez — vous pouvez en cocher plusieurs ;</li>'
    . '<li>leur numéro ;</li>'
    . '<li>l’identifiant IDUFCI de la parcelle ;</li>'
    . '<li>le bornage, la situation juridique et l’occupation du bien.</li>'
    . '</ul>'
    . '<p style="margin:0 0 4px;font-size:15px;line-height:1.6">Cela prend deux minutes. '
    . 'Dès que c’est enregistré, votre annonce <b>repart en ligne automatiquement</b> — et elle affichera '
    . 'votre dossier en clair, ce qui rassure les acheteurs sérieux.</p>'
    . email_button($lien, 'Mettre mon annonce à jour')
    . '<p style="margin:0;font-size:13px;line-height:1.6;color:#6b7280">Vous n’avez pas le numéro IDUFCI ? '
    . 'Il figure sur les documents récents. Sinon, votre notaire ou votre géomètre agréé peut vous le '
    . 'communiquer : eux seuls ont accès à la plateforme qui le délivre.</p>';
  return send_mail($config, $to, 'Votre annonce immobilière doit être mise à jour — Chap.ci',
    email_layout($config, $inner, 'Deux minutes pour remettre votre annonce en ligne.'));
}

/**
 * Campagne de mise en conformité : masque les ventes immobilières publiées
 * avant la nouvelle règle, inscrit le motif et prévient chaque vendeur.
 *
 * Idempotente — une annonce déjà masquée pour ce motif n'est pas retraitée, et
 * personne ne reçoit deux fois le même message. Bornée par $max pour ne jamais
 * faire expirer la requête qui la déclenche.
 */
function foncier_campagne(array $config, PDO $pdo, int $max = 200, bool $simulation = false): array {
  $st = $pdo->query("SELECT id, user_id, title, category_id, subcategory, attributes, hidden, hidden_reason
                     FROM listings WHERE category_id = 'immobilier' ORDER BY created_at DESC");
  $vues = 0; $conformes = 0; $masquees = 0; $mails = 0; $echecs = 0;
  $dejaTraitees = 0; $masqueesAilleurs = 0; $sansCompte = 0; $restantes = 0;
  foreach ($st->fetchAll() as $l) {
    $attrs = !empty($l['attributes']) ? (json_decode((string) $l['attributes'], true) ?: []) : [];
    if (!foncier_concerne('immobilier', $l['subcategory'] ?? null, $attrs)) continue;
    $vues++;
    if (!foncier_manques($attrs)) { $conformes++; continue; }

    if (!empty($l['hidden'])) {
      // Déjà traitée par cette campagne : on ne réécrit rien, et surtout on
      // n'envoie pas un second message.
      if ((string) ($l['hidden_reason'] ?? '') === FONCIER_MOTIF) { $dejaTraitees++; continue; }
      // Masquée pour une AUTRE raison — décision d'un modérateur, ou choix du
      // vendeur. On n'y touche pas : écraser le motif effacerait la décision, et
      // la remise en ligne automatique republierait ensuite une annonce que
      // quelqu'un avait retirée. Elle n'est de toute façon vue par personne.
      $masqueesAilleurs++;
      continue;
    }

    if ($masquees >= $max) { $restantes++; continue; }
    if ($simulation) { $masquees++; continue; } // état des lieux : on n'écrit rien

    $pdo->prepare('UPDATE listings SET hidden = 1, hidden_reason = ? WHERE id = ?')
        ->execute([FONCIER_MOTIF, $l['id']]);
    $masquees++;

    notify($pdo, (string) $l['user_id'], 'listing', 'Annonce à mettre à jour',
      'Votre annonce « ' . mb_substr((string) $l['title'], 0, 60) . ' » est masquée en attendant son dossier foncier. '
      . 'Modifiez-la : elle repartira en ligne aussitôt.',
      '#/modifier/' . $l['id']);

    $email = '';
    if (!empty($l['user_id'])) {
      $q = $pdo->prepare('SELECT email FROM users WHERE id = ?');
      $q->execute([$l['user_id']]);
      $email = (string) ($q->fetch()['email'] ?? '');
    }
    if ($email === '') {
      // Annonce sans compte rattaché : masquée quand même — un acheteur ne doit
      // pas la voir — mais PERSONNE ne peut la corriger. Elle est comptée à part
      // pour que le Patron le sache au lieu de la découvrir des mois plus tard.
      $sansCompte++;
    } elseif (send_foncier_update_email($config, $email, $l)) {
      $mails++;
    } else {
      $echecs++;
    }
  }
  return [
    'examinees' => $vues, 'conformes' => $conformes, 'masquees' => $masquees,
    'emails' => $mails, 'echecs' => $echecs, 'sansCompte' => $sansCompte,
    'dejaTraitees' => $dejaTraitees, 'masqueesAilleurs' => $masqueesAilleurs,
    'restantes' => $restantes, 'simulation' => $simulation,
  ];
}

/**
 * Renvoie le message aux vendeurs dont l'annonce est déjà masquée par la
 * campagne. Ne masque rien, ne touche à rien d'autre.
 *
 * Raison d'être : le premier passage s'exécute au fil d'une requête web
 * ordinaire. Si l'envoi échoue à ce moment-là — SMTP momentanément muet,
 * quota de l'hébergeur — l'annonce est masquée et son propriétaire n'en sait
 * rien. Sans cette relance, il n'existerait aucun moyen de rattraper : la
 * campagne, elle, considère l'annonce comme déjà traitée et se tait.
 *
 * Déclenchée à la main par le propriétaire, jamais automatiquement : c'est
 * précisément parce qu'elle peut envoyer deux fois le même message qu'elle
 * doit rester une décision.
 */
function foncier_relance(array $config, PDO $pdo): array {
  $st = $pdo->prepare('SELECT id, user_id, title FROM listings WHERE hidden = 1 AND hidden_reason = ?');
  $st->execute([FONCIER_MOTIF]);
  $envoyes = 0; $echecs = 0; $sansCompte = 0; $total = 0;
  foreach ($st->fetchAll() as $l) {
    $total++;
    $email = '';
    if (!empty($l['user_id'])) {
      $q = $pdo->prepare('SELECT email FROM users WHERE id = ?');
      $q->execute([$l['user_id']]);
      $email = (string) ($q->fetch()['email'] ?? '');
    }
    if ($email === '') { $sansCompte++; continue; }
    if (send_foncier_update_email($config, $email, $l)) $envoyes++; else $echecs++;
  }
  return ['concernees' => $total, 'envoyes' => $envoyes, 'echecs' => $echecs, 'sansCompte' => $sansCompte];
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
/** Notification e-mail à l'annonceur selon le statut de sa publicité. Best-effort. */
/** Totaux d'audience d'une publicite (vues, clics) sur toute sa vie. */
function ad_audience(PDO $pdo, string $adId): array {
  try {
    $st = $pdo->prepare('SELECT COALESCE(SUM(views),0) v, COALESCE(SUM(clicks),0) c FROM ad_stats WHERE ad_id = ?');
    $st->execute([$adId]);
    $r = $st->fetch() ?: [];
    $v = (int) ($r['v'] ?? 0); $c = (int) ($r['c'] ?? 0);
    return ['views' => $v, 'clicks' => $c, 'ctr' => $v > 0 ? round($c / $v * 100, 1) : 0.0];
  } catch (Throwable $e) { return ['views' => 0, 'clicks' => 0, 'ctr' => 0.0]; }
}

/**
 * Enregistre une tentative d'envoi a un annonceur.
 *
 * Le 28/07, un annonceur a paye et n'a rien recu. On ne pouvait meme pas dire
 * si l'e-mail etait parti : send_mail renvoyait un booleen que personne ne
 * gardait. Desormais chaque tentative laisse une ligne, avec son resultat.
 */
function log_ad_mail(?PDO $pdo, string $adId, string $kind, string $email, bool $ok): void {
  if (!$pdo) return;
  try {
    $pdo->prepare('INSERT INTO ad_mails (id,ad_id,kind,email,ok,created_at) VALUES (?,?,?,?,?,?)')
        ->execute([uuid(), $adId, mb_substr($kind, 0, 24), mb_substr($email, 0, 190), $ok ? 1 : 0, now_iso()]);
  } catch (Throwable $e) { /* le journal ne doit jamais empecher un envoi */ }
}

/** Bloc HTML « chiffres de votre publicite », partage par plusieurs e-mails. */
function ad_stats_block(array $a): string {
  $v = (int) ($a['views'] ?? 0); $c = (int) ($a['clicks'] ?? 0); $ctr = (float) ($a['ctr'] ?? 0);
  $n = fn($x) => number_format($x, 0, ',', "\u{00A0}");
  return '<table role="presentation" style="width:100%;margin:14px 0;border-collapse:separate;border-spacing:8px 0">'
    . '<tr>'
    . '<td style="width:33%;background:#FFF6EC;border-radius:12px;padding:12px;text-align:center">'
    . '<div style="font-size:22px;font-weight:800;color:#1a1f2b">' . $n($v) . '</div>'
    . '<div style="font-size:12px;color:#6b7280">affichages</div></td>'
    . '<td style="width:33%;background:#FFF6EC;border-radius:12px;padding:12px;text-align:center">'
    . '<div style="font-size:22px;font-weight:800;color:#1a1f2b">' . $n($c) . '</div>'
    . '<div style="font-size:12px;color:#6b7280">clics</div></td>'
    . '<td style="width:33%;background:#FFF6EC;border-radius:12px;padding:12px;text-align:center">'
    . '<div style="font-size:22px;font-weight:800;color:#1a1f2b">' . str_replace('.', ',', (string) $ctr) . '&nbsp;%</div>'
    . '<div style="font-size:12px;color:#6b7280">taux de clic</div></td>'
    . '</tr></table>';
}

/**
 * E-mails du cycle de vie d'une publicite.
 *
 * Sept moments, du paiement a l'expiration :
 *   pending   paiement recu, en attente de validation
 *   active    validee, en ligne, avec la date ET l'heure de fin
 *   rejected  refusee, AVEC LE MOTIF (saisi par l'administrateur)
 *   report    tous les 3 jours : audience + invitation a prolonger
 *   expiring  la veille de la fin : audience + date et heure exactes
 *   expired   apres la fin : bilan complet
 *
 * $pdo sert uniquement a journaliser l'envoi (table ad_mails). Sans lui, la
 * fonction marche toujours — mais on perd la trace, et c'est precisement ce
 * qui a empeche de comprendre pourquoi un annonceur n'avait rien recu le 28/07.
 */
function send_ad_status_email(array $config, array $ad, string $kind, ?PDO $pdo = null, array $extra = []): bool {
  $to = trim((string) ($ad['email'] ?? ''));
  if ($to === '' || !filter_var($to, FILTER_VALIDATE_EMAIL)) {
    log_ad_mail($pdo, (string) ($ad['id'] ?? ''), $kind, $to, false);
    return false;
  }
  $site  = rtrim($config['site_url'] ?? 'https://chap.ci', '/');
  $name  = $config['mail_from_name'] ?? 'Chap.ci';
  $price = number_format((int) ($ad['price'] ?? 0), 0, ',', "\u{00A0}");
  $titleTxt = trim((string) ($ad['title'] ?? '')) !== '' ? '« ' . htmlspecialchars((string) $ad['title']) . ' »' : 'votre bannière';
  $ts = !empty($ad['expires_at']) ? (int) strtotime((string) $ad['expires_at']) : 0;
  // Date ET heure : « le 04/08 » ne dit pas si la banniere tombe le matin ou le
  // soir. Un annonceur qui veut prolonger a besoin de l'heure.
  $expTxt  = $ts ? gmdate('d/m/Y', $ts) : '';
  $expFull = $ts ? gmdate('d/m/Y \à H\hi', $ts) . ' (heure d’Abidjan)' : '';
  $stats = $extra['stats'] ?? ($pdo && !empty($ad['id']) ? ad_audience($pdo, (string) $ad['id']) : null);
  $bloc  = $stats ? ad_stats_block($stats) : '';
  $pub   = $site . '/#/publicite';
  // Lien direct vers SA publicite (prolongation, suivi) — jeton signe, sans compte.
  $lien  = !empty($ad['id']) ? $site . '/#/pub/' . rawurlencode((string) $ad['id']) : $pub;

  if ($kind === 'pending') {
    $subject = "Votre publicité est bien reçue — $name";
    $inner = '<h2 style="margin-top:0;color:#111827">Publicité reçue ✅</h2>'
      . '<p>Bonjour,</p>'
      . '<p>Nous avons bien reçu ' . $titleTxt . '. Elle est <b>en attente de validation</b> : notre équipe '
      . 'vérifie votre paiement de <b>' . $price . ' FCFA</b>, puis votre bannière passe à l’écran.</p>'
      . '<p>Vous recevrez un e-mail dès qu’elle est en ligne — en général sous 24 heures. '
      . 'Si vous n’avez rien reçu d’ici là, répondez simplement à ce message.</p>';
  } elseif ($kind === 'active') {
    $subject = "Votre publicité est en ligne 🎉 — $name";
    $inner = '<h2 style="margin-top:0;color:#111827">C’est en ligne 🎉</h2>'
      . '<p>Bonjour,</p>'
      . '<p>' . ucfirst($titleTxt) . ' est <b>validée et diffusée</b> sur l’écran publicitaire de ' . htmlspecialchars($name) . '.</p>'
      . ($expFull ? '<p>Elle restera affichée jusqu’au <b>' . $expFull . '</b>.</p>' : '')
      . '<p>Vous recevrez un rapport d’audience tous les 3 jours.</p>'
      . email_button($lien, 'Voir ma publicité');
  } elseif ($kind === 'rejected') {
    // Le motif est saisi par l'administrateur au moment du refus. Sans lui,
    // l'annonceur ne sait pas quoi corriger et recommence la meme erreur.
    $motif = trim((string) ($extra['reason'] ?? ($ad['reject_reason'] ?? '')));
    $subject = "Votre publicité n’a pas été validée — $name";
    $inner = '<h2 style="margin-top:0;color:#111827">Publicité non validée</h2>'
      . '<p>Bonjour,</p>'
      . '<p>' . ucfirst($titleTxt) . ' n’a pas pu être validée.</p>'
      . ($motif !== ''
          ? '<p style="background:#FEF2F2;border-left:3px solid #DC2626;padding:10px 12px;margin:12px 0">'
            . '<b>Motif :</b> ' . nl2br(htmlspecialchars($motif)) . '</p>'
          : '<p>Motif : paiement introuvable ou visuel non conforme.</p>')
      . '<p>Si vous pensez qu’il s’agit d’une erreur, répondez simplement à cet e-mail — '
      . 'nous rouvrons le dossier.</p>'
      . email_button($pub, 'Refaire une publicité');
  } elseif ($kind === 'report') {
    $subject = "Votre publicité en chiffres — $name";
    $inner = '<h2 style="margin-top:0;color:#111827">Où en est votre publicité 📊</h2>'
      . '<p>Bonjour,</p>'
      . '<p>Voici l’audience de ' . $titleTxt . ' depuis sa mise en ligne :</p>'
      . $bloc
      . ($expFull ? '<p>Elle reste à l’écran jusqu’au <b>' . $expFull . '</b>.</p>' : '')
      . '<p>Une bannière qui reste plus longtemps est vue par des visiteurs différents : '
      . 'la même annonce touche de nouvelles personnes chaque semaine. Vous pouvez '
      . '<b>prolonger dès maintenant</b>, sans attendre la fin.</p>'
      . email_button($lien, 'Prolonger ma publicité');
  } elseif ($kind === 'expired') {
    $subject = "Votre publicité est terminée — $name";
    $inner = '<h2 style="margin-top:0;color:#111827">Campagne terminée</h2>'
      . '<p>Bonjour,</p>'
      . '<p>' . ucfirst($titleTxt) . ' est arrivée à son terme' . ($expTxt ? ' le <b>' . $expTxt . '</b>' : '') . '. '
      . 'Voici son bilan complet :</p>'
      . $bloc
      . '<p>Merci de votre confiance. Pour repartir à l’écran, il suffit de '
      . 'relancer une bannière — vos visuels sont conservés.</p>'
      . email_button($pub, 'Relancer une publicité');
  } else { // expiring — la VEILLE de la fin
    $subject = "Votre publicité se termine demain ⏳ — $name";
    $inner = '<h2 style="margin-top:0;color:#111827">Elle se termine demain ⏳</h2>'
      . '<p>Bonjour,</p>'
      . '<p>' . ucfirst($titleTxt) . ' quitte l’écran ' . ($expFull ? '<b>le ' . $expFull . '</b>' : 'demain') . '.</p>'
      . $bloc
      . '<p>Pour rester affiché <b>sans interruption</b>, prolongez avant cette heure : '
      . 'la bannière enchaîne alors sans coupure.</p>'
      . email_button($lien, 'Prolonger maintenant');
  }
  $ok = send_mail($config, $to, $subject, email_layout($config, $inner, $subject));
  log_ad_mail($pdo, (string) ($ad['id'] ?? ''), $kind, $to, $ok);
  return $ok;
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
/** Rangée de cartes d'annonces cliquables (réutilisée : offres, suggestions, alertes). */
function email_listing_cards(string $site, array $rows): string {
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
  return $cards;
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
  $cards = email_listing_cards($site, $rows);
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
  // Envoi potentiellement long à l'échelle : on lève la limite de temps globale et
  // on parcourt les abonnés PAR LOTS (borne la mémoire), en réarmant le budget à
  // chaque envoi. Évite un timeout (500) qui n'enverrait qu'une partie des emails.
  @set_time_limit(0);
  $sent = 0; $total = 0; $offset = 0; $chunk = 200;
  while (true) {
    $st = $pdo->prepare('SELECT email FROM newsletter ORDER BY created_at ASC LIMIT ? OFFSET ?');
    $st->bindValue(1, $chunk, PDO::PARAM_INT); $st->bindValue(2, $offset, PDO::PARAM_INT);
    $st->execute();
    $subs = $st->fetchAll();
    if (!$subs) break;
    foreach ($subs as $s) {
      @set_time_limit(30); // réarme le budget à chaque envoi
      $total++;
      if (send_mail($config, $s['email'], $subject, $html, $from, $from)) $sent++;
    }
    if (count($subs) < $chunk) break;
    $offset += $chunk;
  }
  return ['sent' => $sent, 'listings' => count($rows), 'subscribers' => $total];
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
  $admins = report_recipients($config);
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

// ---- Recherches sauvegardées (alertes email) --------------------------------
/** Retire les accents pour une recherche insensible (miroir de normalize() côté React). */
function search_norm(string $s): string {
  $s = function_exists('mb_strtolower') ? mb_strtolower($s, 'UTF-8') : strtolower($s);
  return strtr($s, [
    'à'=>'a','â'=>'a','ä'=>'a','é'=>'e','è'=>'e','ê'=>'e','ë'=>'e','î'=>'i','ï'=>'i',
    'ô'=>'o','ö'=>'o','û'=>'u','ü'=>'u','ù'=>'u','ç'=>'c','œ'=>'oe',
  ]);
}
/**
 * Annonces correspondant à une recherche sauvegardée. `$paramsStr` est la
 * query-string de /explorer (mêmes clés : q, cat, sub, cond, min, max, livr,
 * promo, region, ville, commune). `$sinceIso` limite aux annonces plus récentes
 * (pour n'alerter que sur les nouveautés).
 */
function search_matching_listings(PDO $pdo, string $paramsStr, string $sinceIso = ''): array {
  $p = [];
  parse_str($paramsStr, $p);
  $q       = search_norm(trim((string) ($p['q'] ?? '')));
  $cat     = trim((string) ($p['cat'] ?? ''));
  $sub     = trim((string) ($p['sub'] ?? ''));
  $cond    = trim((string) ($p['cond'] ?? ''));
  $min     = (string) ($p['min'] ?? '');
  $max     = (string) ($p['max'] ?? '');
  $livr    = trim((string) ($p['livr'] ?? ''));
  $promo   = ((string) ($p['promo'] ?? '')) === '1';
  $region  = trim((string) ($p['region'] ?? ''));
  $ville   = trim((string) ($p['ville'] ?? ''));
  $commune = trim((string) ($p['commune'] ?? ''));
  $rows = $pdo->query('SELECT * FROM listings WHERE (hidden IS NULL OR hidden = 0) AND (sold IS NULL OR sold = 0) ORDER BY created_at DESC LIMIT 500')->fetchAll();
  $now = now_iso();
  $out = [];
  foreach ($rows as $l) {
    if ($sinceIso !== '' && (string) $l['created_at'] <= $sinceIso) continue;
    if ($cat && ($l['category_id'] ?? '') !== $cat) continue;
    if ($sub && ($l['subcategory'] ?? '') !== $sub) continue;
    if ($cond && ($l['condition_v'] ?? '') !== $cond) continue;
    if ($region && ($l['region_id'] ?? '') !== $region) continue;
    if ($ville && ($l['city_id'] ?? '') !== $ville) continue;
    if ($commune && ($l['commune'] ?? '') !== $commune) continue;
    if ($min !== '' && (int) $l['price'] < (int) $min) continue;
    if ($max !== '' && (int) $l['price'] > (int) $max) continue;
    if ($livr && empty($l['delivery'])) continue;
    if ($promo) {
      $isPromo = !empty($l['promo_price']) && (empty($l['promo_until']) || $l['promo_until'] > $now);
      if (!$isPromo) continue;
    }
    if ($q !== '') {
      $hay = search_norm(($l['title'] ?? '') . ' ' . ($l['description'] ?? ''));
      if (strpos($hay, $q) === false) continue;
    }
    // Filtres par attributs de catégorie (a_<clé> = valeur ; a_<clé>_min/max = plage).
    $attrs = $l['attributes'] ? (json_decode($l['attributes'], true) ?: []) : [];
    $attrOk = true;
    foreach ($p as $k => $v) {
      if (strncmp($k, 'a_', 2) !== 0 || $v === '') continue;
      if (substr($k, -4) === '_min') {
        $key = substr($k, 2, -4);
        if (!isset($attrs[$key]) || (float) $attrs[$key] < (float) $v) { $attrOk = false; break; }
      } elseif (substr($k, -4) === '_max') {
        $key = substr($k, 2, -4);
        if (!isset($attrs[$key]) || (float) $attrs[$key] > (float) $v) { $attrOk = false; break; }
      } else {
        $key = substr($k, 2);
        if (!isset($attrs[$key]) || (string) $attrs[$key] !== (string) $v) { $attrOk = false; break; }
      }
    }
    if (!$attrOk) continue;
    $out[] = $l;
  }
  return $out;
}
/** Email « nouvelles annonces » pour une alerte (recherche sauvegardée). */
function send_search_alert(array $config, array $user, string $label, array $rows, string $paramsStr): bool {
  if (empty($user['email']) || !$rows) return false;
  $site = rtrim($config['site_url'] ?? 'https://chap.ci', '/');
  $name = $config['mail_from_name'] ?? 'Chap.ci';
  $link = $site . '/#/explorer' . ($paramsStr ? '?' . $paramsStr : '');
  $n = count($rows);
  $inner =
    '<h2 style="margin-top:0">🔔 Du nouveau pour votre alerte</h2>'
    . '<p>Bonne nouvelle ! <b>' . $n . ' nouvelle' . ($n > 1 ? 's' : '') . ' annonce' . ($n > 1 ? 's' : '')
    . '</b> correspond' . ($n > 1 ? 'ent' : '') . ' à votre recherche <b>« ' . htmlspecialchars($label) . ' »</b> 👇</p>'
    . email_listing_cards($site, $rows)
    . email_button($link, 'Voir toutes les annonces')
    . '<p style="color:#6b7280;font-size:13px;margin-top:16px">Vous recevez cet email car vous avez créé une alerte sur '
    . htmlspecialchars($name) . '. Gérez vos alertes depuis <a href="' . $site . '/#/profil" style="color:#F77F00">votre profil</a>.</p>';
  $subject = '🔔 ' . $n . ' annonce' . ($n > 1 ? 's' : '') . ' pour « ' . mb_strimwidth($label, 0, 40, '…') . ' »';
  $from = $config['mail_newsletter_from'] ?? 'hello@chap.ci';
  return send_mail($config, $user['email'], $subject, email_layout($config, $inner, $subject . ' sur ' . $name), $from, $from);
}

// ---- Sauvegarde de la base (export JSON) ------------------------------------
/** Exporte toutes les tables métier dans un tableau (pour sauvegarde / restauration). */
function export_all(PDO $pdo): array {
  $tables = ['users', 'profiles', 'listings', 'conversations', 'messages', 'orders',
             'order_items', 'reviews', 'newsletter', 'admins', 'user_interests',
             'reports', 'visits', 'saved_searches', 'contact_messages', 'ads'];
  $data = [];
  foreach ($tables as $t) {
    try { $data[$t] = $pdo->query("SELECT * FROM $t")->fetchAll(PDO::FETCH_ASSOC); }
    catch (Throwable $e) { $data[$t] = []; /* table absente : on ignore */ }
  }
  // Sécurité : on n'exporte JAMAIS les empreintes de mots de passe. Une
  // sauvegarde (téléchargeable par un admin/modérateur, ou posée sur le disque)
  // ne doit pas permettre de casser hors-ligne les mots de passe des comptes.
  if (!empty($data['users'])) {
    // On n'exporte JAMAIS les empreintes de mots de passe NI les secrets 2FA
    // (secret TOTP, secret en attente, codes de secours) : une sauvegarde ne doit
    // pas permettre de contourner l'authentification ou la double authentification.
    foreach ($data['users'] as &$row) {
      unset($row['password_hash'], $row['totp_secret'], $row['totp_pending'], $row['totp_recovery']);
    }
    unset($row);
  }
  $counts = [];
  foreach ($data as $t => $rows) $counts[$t] = count($rows);
  return ['app' => 'chap.ci', 'version' => 1, 'generated_at' => now_iso(), 'counts' => $counts, 'tables' => $data];
}
/** Prévient l'administrateur qu'une sauvegarde automatique vient d'être créée. */
function send_backup_email(array $config, array $dump, string $file, int $bytes): void {
  $admins = report_recipients($config);
  if (!$admins) return;
  $name = $config['mail_from_name'] ?? 'Chap.ci';
  $rows = '';
  foreach ($dump['counts'] as $t => $c) {
    $rows .= '<tr><td style="padding:3px 0;color:#6b7280">' . htmlspecialchars($t) . '</td>'
      . '<td style="padding:3px 0;text-align:right"><b>' . (int) $c . '</b></td></tr>';
  }
  $kb = number_format($bytes / 1024, 0, ',', ' ');
  $inner =
    '<h2 style="margin-top:0">💾 Sauvegarde effectuée</h2>'
    . '<p>Une sauvegarde automatique de la base de <b>' . htmlspecialchars($name) . '</b> a été créée sur le serveur.</p>'
    . '<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:10px 0;font-size:14px">' . $rows . '</table>'
    . '<p style="color:#6b7280;font-size:13px">Fichier : <b>' . htmlspecialchars($file) . '</b> (' . $kb . ' Ko). '
    . 'Les 7 dernières sauvegardes sont conservées. Téléchargez-les depuis votre tableau de bord.</p>';
  foreach ($admins as $to) send_mail($config, $to, "💾 Sauvegarde Chap.ci — $file", email_layout($config, $inner, 'Sauvegarde de la base'));
}

/** Invitation (ou relance) à laisser un avis après une transaction. */
function send_review_invite_email(array $config, string $to, string $counterpartName, string $listingTitle, string $convId, string $role): bool {
  if ($to === '') return false;
  $site = rtrim($config['site_url'] ?? 'https://chap.ci', '/');
  $name = $config['mail_from_name'] ?? 'Chap.ci';
  $link = $site . '/#/messages/' . rawurlencode($convId);
  $who  = htmlspecialchars($counterpartName ?: 'votre interlocuteur');
  $what = $listingTitle !== '' ? ' pour <b>« ' . htmlspecialchars(mb_strimwidth($listingTitle, 0, 50, '…')) . ' »</b>' : '';
  $intro = $role === 'seller'
    ? 'Vous avez conclu une vente avec <b>' . $who . '</b>' . $what . '. Comment s’est passée la transaction ?'
    : 'Vous avez conclu un achat avec <b>' . $who . '</b>' . $what . '. Comment s’est passée la transaction ?';
  $inner =
    '<h2 style="margin-top:0">⭐ Laissez un avis</h2>'
    . '<p>' . $intro . '</p>'
    . '<p>Votre avis aide toute la communauté <b>' . htmlspecialchars($name) . '</b> à acheter et vendre en confiance. '
    . 'Ça ne prend que 10 secondes 👇</p>'
    . email_button($link, 'Noter ' . $who)
    . '<p style="color:#6b7280;font-size:13px;margin-top:16px">Si la transaction n’a finalement pas eu lieu, ignorez simplement cet email.</p>';
  $subject = '⭐ Votre avis sur votre transaction avec ' . mb_strimwidth($counterpartName ?: 'un membre', 0, 30, '…');
  $from = $config['mail_newsletter_from'] ?? 'hello@chap.ci';
  return send_mail($config, $to, $subject, email_layout($config, $inner, $subject), $from, $from);
}

/** Série temporelle des visites selon la granularité (jour/semaine/mois/année). */
function visit_series(PDO $pdo, string $range): array {
  $now = time();
  $buckets = []; $keyOf = null; $since = '';
  if ($range === 'day') {
    for ($i = 29; $i >= 0; $i--) { $ts = $now - $i * 86400; $buckets[] = ['key' => gmdate('Y-m-d', $ts), 'label' => gmdate('d/m', $ts)]; }
    $keyOf = fn($c) => substr($c, 0, 10);
    $since = gmdate('Y-m-d', $now - 29 * 86400) . 'T00:00:00Z';
  } elseif ($range === 'week') {
    for ($i = 11; $i >= 0; $i--) { $ts = $now - $i * 7 * 86400; $d = (int) gmdate('N', $ts); $mon = $ts - ($d - 1) * 86400; $buckets[] = ['key' => gmdate('Y-m-d', $mon), 'label' => gmdate('d/m', $mon)]; }
    $keyOf = function ($c) { $t = strtotime($c); $d = (int) gmdate('N', $t); return gmdate('Y-m-d', $t - ($d - 1) * 86400); };
    $since = $buckets[0]['key'] . 'T00:00:00Z';
  } elseif ($range === 'year') {
    $y = (int) gmdate('Y', $now);
    for ($i = 4; $i >= 0; $i--) { $buckets[] = ['key' => (string) ($y - $i), 'label' => (string) ($y - $i)]; }
    $keyOf = fn($c) => substr($c, 0, 4);
    $since = ($y - 4) . '-01-01T00:00:00Z';
  } else {
    $range = 'month'; $y = (int) gmdate('Y', $now); $m = (int) gmdate('n', $now);
    for ($i = 11; $i >= 0; $i--) { $mm = $m - $i; $yy = $y; while ($mm <= 0) { $mm += 12; $yy--; } $buckets[] = ['key' => sprintf('%04d-%02d', $yy, $mm), 'label' => sprintf('%02d/%02d', $mm, $yy % 100)]; }
    $keyOf = fn($c) => substr($c, 0, 7);
    $since = $buckets[0]['key'] . '-01T00:00:00Z';
  }
  $idx = []; foreach ($buckets as $i => $b) $idx[$b['key']] = $i;
  $views = array_fill(0, count($buckets), 0);
  $vsets = array_fill(0, count($buckets), []);
  $st = $pdo->prepare('SELECT visitor_id, created_at FROM visits WHERE created_at >= ? ORDER BY created_at ASC LIMIT 200000');
  $st->execute([$since]);
  while ($row = $st->fetch()) {
    $k = $keyOf($row['created_at']);
    if (isset($idx[$k])) { $i = $idx[$k]; $views[$i]++; $vsets[$i][$row['visitor_id']] = true; }
  }
  $series = []; $totalViews = 0;
  foreach ($buckets as $i => $b) { $series[] = ['label' => $b['label'], 'views' => $views[$i], 'visitors' => count($vsets[$i])]; $totalViews += $views[$i]; }
  $tv = $pdo->prepare('SELECT COUNT(DISTINCT visitor_id) AS c FROM visits WHERE created_at >= ?');
  $tv->execute([$since]);
  return ['range' => $range, 'series' => $series, 'totalViews' => $totalViews, 'totalVisitors' => (int) $tv->fetch()['c']];
}

/** Temps de réponse moyen/médian aux messages (à chaque changement d'expéditeur). */
function avg_response_time(PDO $pdo): array {
  $rows = $pdo->query('SELECT conversation_id, sender_id, created_at FROM messages ORDER BY conversation_id, created_at ASC')->fetchAll();
  $deltas = []; $curConv = null; $prevSender = null; $prevTs = null;
  foreach ($rows as $r) {
    if ($r['conversation_id'] !== $curConv) { $curConv = $r['conversation_id']; $prevSender = $r['sender_id']; $prevTs = strtotime($r['created_at']); continue; }
    if ($r['sender_id'] !== $prevSender) {
      $d = strtotime($r['created_at']) - $prevTs;
      if ($d >= 0 && $d < 30 * 86400) $deltas[] = $d;
    }
    $prevSender = $r['sender_id']; $prevTs = strtotime($r['created_at']);
  }
  if (!$deltas) return ['count' => 0, 'avgSeconds' => null, 'medianSeconds' => null];
  sort($deltas); $n = count($deltas);
  $median = $n % 2 ? $deltas[intdiv($n, 2)] : ($deltas[$n / 2 - 1] + $deltas[$n / 2]) / 2;
  return ['count' => $n, 'avgSeconds' => (int) round(array_sum($deltas) / $n), 'medianSeconds' => (int) round($median)];
}

// ---- Photos : enregistre une data-URI base64 en fichier, renvoie l'URL -------
/**
 * Applique le filigrane « Chap.ci » (api/watermark.png) au centre d'une image
 * raster, en semi-transparent. Best-effort : ne lève jamais d'erreur, ne casse
 * jamais l'upload (si GD absent ou format non géré, l'image reste inchangée).
 *  $scale  = largeur du filigrane en fraction de la largeur de la photo.
 *  $opacity< 1 réduit encore l'opacité (le PNG est déjà semi-transparent).
 */
function apply_watermark(string $file, string $ext, string $wmPath, float $opacity = 1.0, float $scale = 0.42): bool {
  if (!function_exists('imagecreatetruecolor') || !is_file($wmPath)) return false;
  $src = null;
  if ($ext === 'jpg') $src = @imagecreatefromjpeg($file);
  elseif ($ext === 'png') $src = @imagecreatefrompng($file);
  elseif ($ext === 'webp' && function_exists('imagecreatefromwebp')) $src = @imagecreatefromwebp($file);
  elseif ($ext === 'gif') $src = @imagecreatefromgif($file);
  if (!$src) return false;
  $wm = @imagecreatefrompng($wmPath);
  if (!$wm) { imagedestroy($src); return false; }
  $iw = imagesx($src); $ih = imagesy($src);
  $ww = imagesx($wm); $wh = imagesy($wm);
  if ($ww < 1 || $wh < 1) { imagedestroy($src); imagedestroy($wm); return false; }
  if ($opacity < 0.999) wm_apply_opacity($wm, $opacity);
  $tw = max(1, (int) round($iw * $scale));
  $th = max(1, (int) round($wh * $tw / $ww));
  $dx = (int) round(($iw - $tw) / 2);
  $dy = (int) round(($ih - $th) / 2);
  imagealphablending($src, true);
  imagesavealpha($src, false);
  imagecopyresampled($src, $wm, $dx, $dy, 0, 0, $tw, $th, $ww, $wh);
  $ok = false;
  if ($ext === 'jpg') $ok = @imagejpeg($src, $file, 82);
  elseif ($ext === 'png') $ok = @imagepng($src, $file);
  elseif ($ext === 'webp' && function_exists('imagewebp')) $ok = @imagewebp($src, $file, 82);
  elseif ($ext === 'gif') $ok = @imagegif($src, $file);
  imagedestroy($src); imagedestroy($wm);
  return (bool) $ok;
}
/** Réduit l'opacité d'un filigrane PNG (GD : alpha 0=opaque … 127=transparent). */
function wm_apply_opacity($wm, float $opacity): void {
  imagealphablending($wm, false);
  imagesavealpha($wm, true);
  $w = imagesx($wm); $h = imagesy($wm);
  for ($y = 0; $y < $h; $y++) {
    for ($x = 0; $x < $w; $x++) {
      $c = imagecolorat($wm, $x, $y);
      $a = ($c >> 24) & 0x7F;
      if ($a === 0x7F) continue;
      $na = (int) min(127, 127 - (127 - $a) * $opacity);
      imagesetpixel($wm, $x, $y, ($na << 24) | ($c & 0xFFFFFF));
    }
  }
}
function save_data_uri(array $config, string $dataUri, bool $watermark = false): ?string {
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
  $bin = $isB64 ? base64_decode($data) : rawurldecode($data);
  if ($bin === false || $bin === '') return null;
  // P8 · Taille maximale par image (anti-saturation du disque du serveur).
  if (strlen($bin) > 8 * 1024 * 1024) return null;
  // P8 · Ne stocker que de VRAIES images. SVG : refuser tout contenu actif
  // (script / gestionnaires d'événements / références externes). Raster :
  // vérifier avec getimagesizefromstring et déduire l'extension du type réel.
  if (str_contains($mime, 'svg')) {
    // Refuse tout contenu ACTIF ou référence externe/embarquée. Le simple
    // « espace avant on… » d'avant était contournable (<svg/onload=…>) : on
    // bloque désormais les gestionnaires d'événements quel que soit le séparateur,
    // les éléments dangereux (script, use, set, animate, image, a, iframe…) et les
    // URLs javascript/data dans href/xlink:href.
    if (preg_match('/<\s*(script|foreignobject|iframe|use|set|animate|animatetransform|animatemotion|image|a)\b/i', $bin)
        || preg_match('/\bon[a-z][a-z0-9_-]*\s*=/i', $bin)
        || preg_match('/(?:javascript|vbscript)\s*:/i', $bin)
        || preg_match('/(?:xlink:)?href\s*=\s*["\']?\s*(?:https?|data|javascript)\s*:/i', $bin)) return null;
    $ext = 'svg';
  } else {
    $info = @getimagesizefromstring($bin);
    $imap = [IMAGETYPE_JPEG => 'jpg', IMAGETYPE_PNG => 'png', IMAGETYPE_GIF => 'gif', IMAGETYPE_WEBP => 'webp'];
    if ($info === false || !isset($imap[$info[2]])) return null; // pas une image raster reconnue
    $ext = $imap[$info[2]];
  }
  $dir = $config['uploads_dir'];
  if (!is_dir($dir)) @mkdir($dir, 0775, true);
  // Sécurité (P8) : interdire l'exécution de scripts ET neutraliser tout SVG
  // servi (aucun script actif), même sur d'anciens fichiers déjà présents.
  $ht = "$dir/.htaccess";
  $htWant = "Options -ExecCGI\n"
    . "<FilesMatch \"\\.(php|phtml|phar|cgi|pl|py|svgz)$\">\n  Require all denied\n</FilesMatch>\n"
    . "<IfModule mod_headers.c>\n  Header set X-Content-Type-Options \"nosniff\"\n"
    . "  <FilesMatch \"\\.svg$\">\n    Header set Content-Security-Policy \"script-src 'none'; object-src 'none'\"\n  </FilesMatch>\n"
    . "</IfModule>\n";
  $htHave = @is_readable($ht) ? (string) @file_get_contents($ht) : '';
  if (strpos($htHave, "script-src 'none'") === false) @file_put_contents($ht, $htWant);
  $name = date('Ym') . '-' . uuid() . '.' . $ext;
  $full = "$dir/$name";
  if (@file_put_contents($full, $bin) === false) return null;
  // Filigrane « Chap.ci » au centre des photos d'annonce (jamais les SVG).
  if ($watermark && $ext !== 'svg' && !empty($config['watermark'])) {
    try { apply_watermark($full, $ext, __DIR__ . '/watermark.png'); }
    catch (Throwable $e) { /* le filigrane ne doit jamais bloquer l'upload */ }
  }
  return rtrim($config['uploads_path'], '/') . '/' . $name;
}

// ---- Mise en forme des lignes -> JSON attendu par le frontend ---------------
//
// $withPhone : le téléphone du vendeur n'est JAMAIS renvoyé par défaut. Il ne
// sort que pour le propriétaire de l'annonce (formulaire de modification) et
// pour l'administration. Auparavant il partait dans /api/listings, route
// PUBLIQUE et non authentifiée : un simple curl suffisait à récolter le numéro
// de tous les vendeurs du site — matière première du démarchage et de la fraude
// par SMS, et promesse inverse de celle faite dans la FAQ.
function listing_out(array $r, bool $withPhone = false): array {
  return [
    'id' => $r['id'], 'title' => $r['title'], 'description' => $r['description'],
    'price' => (int) $r['price'], 'negotiable' => (bool) $r['negotiable'], 'currency' => 'FCFA',
    'categoryId' => $r['category_id'], 'subcategory' => $r['subcategory'] ?: null,
    'condition' => $r['condition_v'] === 'neuf' ? 'neuf' : 'occasion',
    'images' => $r['images'] ? (json_decode($r['images'], true) ?: []) : [],
    'regionId' => $r['region_id'], 'cityId' => $r['city_id'] ?: '', 'commune' => $r['commune'] ?: null,
    'lat' => $r['lat'] !== null ? (float) $r['lat'] : null,
    'lng' => $r['lng'] !== null ? (float) $r['lng'] : null,
    'sellerName' => $r['seller_name'], 'sellerPhone' => $withPhone ? $r['seller_phone'] : null,
    'sellerId' => $r['user_id'] ?: null,
    // Vendeur vérifié (badge bleu) : présent quand la requête joint users.verified.
    'sellerVerified' => !empty($r['seller_verified']),
    'createdAt' => iso_to_ms($r['created_at']),
    'delivery' => (bool) $r['delivery'], 'featured' => (bool) $r['featured'],
    'promoPrice' => $r['promo_price'] !== null ? (int) $r['promo_price'] : null,
    'promoUntil' => $r['promo_until'] ? iso_to_ms($r['promo_until']) : null,
    'attributes' => !empty($r['attributes']) ? (json_decode($r['attributes'], true) ?: null) : null,
    'hidden' => !empty($r['hidden']),
    'hiddenReason' => !empty($r['hidden']) ? ($r['hidden_reason'] ?: null) : null,
    'sold' => !empty($r['sold']),
    'views' => (int) ($r['views'] ?? 0),
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
  error_log('[chapci] DB: ' . $e->getMessage());
  jerr('Connexion à la base de données impossible. Vérifiez les identifiants dans api/config.php (driver mysql/pgsql, host, name, user, pass).'
    . (!empty($config['debug']) ? ' Détail : ' . $e->getMessage() : ''), 500);
}

// Réinitialisation UNIQUE (post-déploiement) des rôles : on vide la table admins
// une seule fois. Le PROPRIÉTAIRE (email de config) reste admin (il ne dépend pas
// de cette table) ; tous les autres comptes perdent leurs droits admin/modérateur
// et devront être recréés via le nouveau système (permissions + code). Un marqueur
// garantit que ça ne s'exécute qu'une fois (sinon on effacerait les modérateurs
// recréés à chaque requête).
/**
 * Reprise de l'existant pour la vérification par e-mail — UNE SEULE FOIS.
 *
 * Tous les comptes présents le jour où la règle arrive sont considérés comme
 * vérifiés. On ne bloque pas rétroactivement quelqu'un inscrit sous d'autres
 * conditions : un vendeur actif qui trouverait soudain sa publication interdite
 * ne viendrait pas demander pourquoi, il partirait.
 *
 * Le marqueur sur disque est ce qui rend l'opération unique. Sans lui, la
 * reprise se rejouerait à chaque requête et rattraperait les comptes ouverts
 * après la règle — ils n'auraient jamais à confirmer quoi que ce soit, et la
 * fonctionnalité entière serait un décor.
 */
function backfill_email_verifie(array $config, PDO $pdo): void {
  $marque = chapci_secret_dir($config) . '/.email_verify_v1';
  if (@is_file($marque)) return;
  try {
    $pdo->exec("UPDATE users SET email_verified_at = COALESCE(created_at, '2026-07-29T00:00:00Z')
                WHERE email_verified_at IS NULL");
    @file_put_contents($marque, gmdate('c'));
    @chmod($marque, 0600);
  } catch (Throwable $e) { /* colonne absente : on réessaiera au prochain passage */ }
}
backfill_email_verifie($config, $pdo);

/**
 * Mise en conformité des ventes immobilières — UNE SEULE FOIS, au déploiement.
 *
 * Le marqueur sur disque est indispensable : migrate() tourne à chaque requête,
 * et sans lui la campagne repartirait en boucle. Elle est aussi idempotente en
 * elle-même (une annonce déjà masquée pour ce motif est ignorée), mais deux
 * garde-fous valent mieux qu'un quand il s'agit d'envoyer des e-mails.
 *
 * Le propriétaire peut la relancer à la demande : POST /api/admin/foncier/campagne.
 */
function foncier_campagne_initiale(array $config, PDO $pdo): void {
  $marque = chapci_secret_dir($config) . '/.foncier_v1';
  if (@is_file($marque)) return;
  // On pose le marqueur AVANT d'agir : si l'envoi des e-mails échoue à
  // mi-parcours, on ne veut surtout pas que la requête suivante recommence tout
  // et double les messages déjà partis. Le reliquat se rattrape par la route.
  @file_put_contents($marque, gmdate('c'));
  @chmod($marque, 0600);
  try {
    // Le résultat est écrit dans le journal ET dans le marqueur : une campagne
    // qui masque des annonces et envoie des e-mails ne doit pas s'exécuter sans
    // laisser de trace de ce qu'elle a fait. Sans cela, un e-mail non parti
    // resterait invisible à jamais.
    $r = foncier_campagne($config, $pdo, 200);
    $ligne = gmdate('c') . ' ' . json_encode($r, JSON_UNESCAPED_UNICODE);
    error_log('[chapci] foncier campagne: ' . $ligne);
    @file_put_contents($marque, $ligne);
  } catch (Throwable $e) { error_log('[chapci] foncier: ' . $e->getMessage()); }
}
foncier_campagne_initiale($config, $pdo);

/**
 * Reclassement des annonces après la fusion des catégories — UNE SEULE FOIS.
 *
 * Deux catégories ont disparu parce qu'elles disaient la même chose qu'une
 * autre : « Téléphones » (un téléphone EST un appareil électronique) et
 * « Agriculture » (un régime de bananes se vendait aussi en Alimentation ;
 * personne ne savait lequel des deux rayons regarder). Plusieurs
 * sous-catégories ont par ailleurs été renommées pour dire ce qu'elles
 * contiennent vraiment.
 *
 * Sans ce reclassement, toute annonce publiée avant la fusion resterait
 * accrochée à un identifiant que plus aucun écran ne connaît : elle
 * disparaîtrait des filtres, de la page catégorie et des alertes — invisible,
 * mais toujours facturée à son vendeur s'il l'avait mise en avant. On ne
 * supprime rien et on ne masque rien : on déplace.
 *
 * Le marqueur sur disque est indispensable — ce fichier est exécuté à chaque
 * requête. La campagne est de toute façon idempotente (elle ne cherche que
 * les anciens noms, qu'elle fait disparaître), mais deux garde-fous valent
 * mieux qu'un quand on écrit dans la table des annonces.
 */
function fusion_categories(array $config, PDO $pdo): void {
  $marque = chapci_secret_dir($config) . '/.fusion_categories_v1';
  if (@is_file($marque)) return;
  @file_put_contents($marque, gmdate('c'));
  @chmod($marque, 0600);

  // [ancienne catégorie, ancienne sous-catégorie (null = toutes),
  //  nouvelle catégorie, nouvelle sous-catégorie (null = inchangée)]
  $regles = [
    // --- Téléphones → Électronique -----------------------------------------
    ['telephones', 'Smartphones',      'electronique', 'Smartphones'],
    ['telephones', 'Tablettes',        'electronique', 'Tablettes'],
    ['telephones', 'Téléphones fixes', 'electronique', 'Téléphones fixes'],
    ['telephones', 'Accessoires',      'electronique', 'Accessoires téléphone'],
    ['telephones', 'Réparation',       'electronique', 'Réparation & Dépannage'],
    // Le reste (« Toutes », ou une valeur qu'on n'avait pas prévue) atterrit
    // sur la sous-catégorie la plus fréquente plutôt que dans le vide.
    ['telephones', null,               'electronique', 'Smartphones'],

    // --- Agriculture → répartie selon ce qui est vendu ----------------------
    ['agriculture', 'Produits vivriers',   'alimentation', 'Produits vivriers'],
    ['agriculture', 'Cacao & Café',        'alimentation', 'Cacao & Café'],
    ['agriculture', 'Semences & Intrants', 'alimentation', 'Semences & Intrants'],
    ['agriculture', 'Élevage',             'animaux',      'Bétail & Élevage'],
    ['agriculture', 'Matériel agricole',   'materiel-pro', 'Agriculture & Élevage'],
    ['agriculture', null,                  'alimentation', 'Produits vivriers'],

    // --- Sous-catégories renommées, à catégorie inchangée -------------------
    ['vehicules',    'Location de véhicules',      'vehicules',    'Location'],
    ['electronique', 'Accessoires',                'electronique', 'Accessoires téléphone'],
    ['electronique', 'Réparation',                 'electronique', 'Réparation & Dépannage'],
    ['services',     'Informatique',               'services',     'Informatique & Digital'],
    ['services',     'Couture',                    'services',     'Couture & Artisanat'],
    ['materiel-pro', 'Agriculture',                'materiel-pro', 'Agriculture & Élevage'],
    ['materiel-pro', 'Restauration',               'materiel-pro', 'Restauration & Maquis'],
    ['materiel-pro', 'Industrie',                  'materiel-pro', 'Industrie & Atelier'],
    ['materiel-pro', 'Fournitures de bureau',      'materiel-pro', 'Bureau & Informatique'],
    ['alimentation', 'Miel & Confitures',          'alimentation', 'Produits du terroir'],
    ['animaux',      'Oiseaux & Poissons',         'animaux',      'Oiseaux, Poissons & Reptiles'],
    ['animaux',      'Accessoires & Alimentation', 'animaux',      'Accessoires & Matériel'],
    ['loisirs',      'Livres',                     'loisirs',      'Livres & BD'],
    ['loisirs',      'Vélos',                      'loisirs',      'Vélos & Trottinettes'],
    // « Jeux & Jouets » mélangeait deux marchés. On garde la catégorie plutôt
    // que de déménager d'office chez Bébé : déplacer l'annonce de quelqu'un
    // dans un autre rayon sans le lui dire est pire que de la laisser où elle
    // est, et le vendeur peut la corriger en deux touches.
    ['loisirs',      'Jeux & Jouets',              'loisirs',      'Jeux de société & Puzzles'],
    ['bebe',         'Vêtements bébé',             'bebe',         'Vêtements bébé & enfant'],
    ['bebe',         'Poussettes',                 'bebe',         'Poussettes & Sièges auto'],
    ['bebe',         'Jouets',                     'bebe',         'Jouets & Éveil'],
    ['bebe',         'Mobilier bébé',              'bebe',         'Mobilier & Chambre'],
    ['bebe',         'Matériel de puériculture',   'bebe',         'Puériculture & Repas'],
    ['sante',        'Compléments alimentaires',   'sante',        'Compléments & Tisanes'],
    ['sante',        'Matériel médical & Paramédical', 'sante',    'Matériel médical de confort'],
  ];

  $bilan = [];
  try {
    foreach ($regles as [$cat, $sub, $ncat, $nsub]) {
      if ($sub === null) {
        $st = $pdo->prepare('UPDATE listings SET category_id = ?, subcategory = ? WHERE category_id = ?');
        $st->execute([$ncat, $nsub, $cat]);
      } else {
        $st = $pdo->prepare('UPDATE listings SET category_id = ?, subcategory = ? WHERE category_id = ? AND subcategory = ?');
        $st->execute([$ncat, $nsub, $cat, $sub]);
      }
      $n = $st->rowCount();
      if ($n > 0) $bilan[] = "$cat/" . ($sub ?? '*') . " → $ncat/$nsub : $n";
    }
    // Les centres d'intérêt suivent les annonces — sinon les alertes de
    // l'acheteur ne se déclencheraient plus jamais, sans rien signaler.
    //
    // La clé primaire est (user_id, category_id) : un acheteur qui suivait À LA
    // FOIS « Téléphones » et « Électronique » ferait échouer la mise à jour sur
    // un doublon, et TOUTE la reprise s'arrêterait là. On efface donc d'abord
    // l'ancienne ligne de ceux qui ont déjà la nouvelle — ils ne perdent rien,
    // c'est le même centre d'intérêt — avant de déplacer les autres.
    foreach ([['telephones', 'electronique'], ['agriculture', 'alimentation']] as [$vieux, $neuf]) {
      try {
        $pdo->prepare('DELETE FROM user_interests WHERE category_id = ? AND user_id IN
                       (SELECT user_id FROM (SELECT user_id FROM user_interests WHERE category_id = ?) AS t)')
            ->execute([$vieux, $neuf]);
        $st = $pdo->prepare('UPDATE user_interests SET category_id = ? WHERE category_id = ?');
        $st->execute([$neuf, $vieux]);
        if ($st->rowCount() > 0) $bilan[] = "alertes $vieux → $neuf : " . $st->rowCount();
      } catch (Throwable $e) { /* table ou colonne absente : rien à reprendre */ }
    }
    $ligne = gmdate('c') . ' ' . json_encode($bilan, JSON_UNESCAPED_UNICODE);
    error_log('[chapci] fusion categories: ' . $ligne);
    @file_put_contents($marque, $ligne);
  } catch (Throwable $e) {
    error_log('[chapci] fusion categories: ' . $e->getMessage());
  }
}
fusion_categories($config, $pdo);

$resetMarker = chapci_secret_dir($config) . '/.reset_admins_v2';
if (!file_exists($resetMarker)) {
  try { $pdo->exec('DELETE FROM admins'); } catch (Throwable $e) { /* table absente : rien à faire */ }
  admins_fp_save($config, $pdo); // référence d'intégrité = ensemble vide (propriétaire seul)
  @file_put_contents($resetMarker, now_iso());
}
$secret = $config['jwt_secret'];
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

// Chemin après /api
$uri  = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?? '/';
$path = preg_replace('#^.*/api/?#', '', $uri);
$path = trim($path, '/');
$seg  = $path === '' ? [] : explode('/', $path);

try {
  // ---------- CONFIG PUBLIQUE ----------
  // Réglages non secrets exposés au frontend (l'ID client Google est public).
  // Permet d'activer la connexion Google / téléphone sans reconstruire le site.
  if ($path === 'config' && $method === 'GET') {
    $sms = $config['sms'] ?? [];
    jout([
      'googleClientId' => (string) ($config['google_client_id'] ?? ''),
      'facebookAppId'  => (string) ($config['facebook_app_id'] ?? ''),
      'phoneAuth'      => (($sms['provider'] ?? '') !== '' || !empty($sms['debug'])),
    ]);
  }

  // ---------- AUTH ----------
  if ($path === 'auth/signup' && $method === 'POST') {
    $b = body();
    $email = strtolower(trim($b['email'] ?? ''));
    $pass  = (string) ($b['password'] ?? '');
    $name  = trim($b['full_name'] ?? '');
    // Anti-abus : max 6 créations de compte par IP et par heure.
    rate_limit($pdo, 'signup', null, 6, 3600);
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) jerr('Adresse email invalide.');
    if (strlen($pass) < 8) jerr('Le mot de passe doit faire au moins 8 caractères.');
    // Consentement obligatoire et horodaté (loi 2013-450 / 2013-546).
    if (empty($b['consent'])) jerr('Vous devez accepter les CGU et la Politique de confidentialité.');
    $ex = $pdo->prepare('SELECT id FROM users WHERE email = ?'); $ex->execute([$email]);
    if ($ex->fetch()) jerr('Cet email a déjà un compte. Connectez-vous.');
    $id = uuid();
    $cguVersion = substr((string) ($b['cguVersion'] ?? '2026-07-14'), 0, 32);
    $pdo->prepare('INSERT INTO users (id,email,password_hash,created_at,consent_at,cgu_version) VALUES (?,?,?,?,?,?)')
        ->execute([$id, $email, password_hash($pass, PASSWORD_BCRYPT), now_iso(), now_iso(), $cguVersion]);
    $pdo->prepare('INSERT INTO profiles (id,full_name,created_at) VALUES (?,?,?)')
        ->execute([$id, $name, now_iso()]);
    log_security_event($pdo, 'signup', $email);
    // Email de bienvenue (best-effort : n'empêche jamais la création du compte).
    send_welcome_email($config, $email, $name);
    $token = mk_token($pdo, $id, $email, $secret);
    set_session_cookie($config, $token); // P3 : ouvre la session via cookie HttpOnly
    jout(['token' => $token, 'user' => user_public($pdo, ['id' => $id, 'email' => $email])]);
  }

  if ($path === 'auth/login' && $method === 'POST') {
    $b = body();
    $email = strtolower(trim($b['email'] ?? ''));
    // Anti-force brute : max 8 tentatives par IP/email sur 15 minutes.
    rate_limit($pdo, 'login_fail', $email, 8, 900);
    $st = $pdo->prepare('SELECT id,email,password_hash,status FROM users WHERE email = ?');
    $st->execute([$email]); $u = $st->fetch();
    // Un compte créé via Google ou Facebook n'a PAS de mot de passe : la colonne
    // password_hash reste NULL. Le fichier déclare strict_types, donc
    // password_verify(..., null) levait une TypeError — l'utilisateur recevait
    // « Erreur serveur. Réessayez plus tard. » au lieu d'un message utile.
    //
    // Deux dégâts, l'un visible, l'autre non :
    //  - quelqu'un qui s'était inscrit avec Google et revenait par e-mail +
    //    mot de passe se heurtait à une erreur incompréhensible et repartait ;
    //  - la réponse DIFFÉRAIT de celle d'un e-mail inconnu, ce qui permettait
    //    d'énumérer les comptes existants en comparant les deux messages.
    // On traite donc l'absence de mot de passe comme un échec ordinaire.
    $hash = $u ? (string) ($u['password_hash'] ?? '') : '';
    if (!$u || $hash === '' || !password_verify((string) ($b['password'] ?? ''), $hash)) {
      log_security_event($pdo, 'login_fail', $email);
      // Le message dit la sortie, pas seulement l'échec.
      //
      // L'application Android ne montre PAS le bouton « Continuer avec Google »
      // (src/pages/Login.tsx:41, `!isNative`) : Google refuse l'authentification
      // dans une vue web embarquée. Quelqu'un qui a ouvert son compte avec Google
      // sur chap.ci n'a donc, dans l'application, ni bouton Google, ni mot de
      // passe — et lisait « Email ou mot de passe incorrect » sans savoir qu'il
      // n'en a jamais eu. Il réessayait jusqu'à se faire bloquer 15 minutes.
      //
      // La phrase reste STRICTEMENT LA MÊME pour tout le monde, e-mail inconnu
      // compris : c'est ce qui empêche d'énumérer les comptes existants en
      // comparant deux réponses (voir le commentaire ci-dessus). On ne révèle
      // rien de plus ; on indique simplement où aller.
      jerr('Email ou mot de passe incorrect. Si vous vous êtes inscrit avec Google ou Facebook, ouvrez chap.ci dans votre navigateur, connectez-vous, puis choisissez un mot de passe dans votre profil : il vous servira ensuite ici.', 401);
    }
    if (($u['status'] ?? 'active') === 'blocked') {
      log_security_event($pdo, 'login_blocked', $email);
      jerr('Votre compte a été bloqué. Contactez le support à contact@chap.ci.', 403);
    }
    log_security_event($pdo, 'login_ok', $email);
    // 2FA activée : on ne délivre PAS encore la session. On renvoie un « jeton de
    // défi » de courte durée (5 min) ; la session n'est ouverte qu'après avoir
    // validé un code sur /auth/2fa/verify.
    $tf = $pdo->prepare('SELECT totp_enabled FROM users WHERE id = ?'); $tf->execute([$u['id']]);
    if ((int) ($tf->fetchColumn() ?: 0) === 1) {
      $chal = jwt_sign(['sub' => $u['id'], 'mfa' => 1, 'exp' => time() + 300], $secret);
      jout(['mfa_required' => true, 'mfa_token' => $chal]);
    }
    $token = mk_token($pdo, $u['id'], $u['email'], $secret);
    set_session_cookie($config, $token); // P3
    jout(['token' => $token, 'user' => user_public($pdo, $u)]);
  }

  // ---- Double authentification (2FA / TOTP) ---------------------------------
  // État : la 2FA est-elle active sur mon compte ?
  if ($path === 'auth/2fa/status' && $method === 'GET') {
    $u = require_user($pdo, $secret);
    $st = $pdo->prepare('SELECT totp_enabled FROM users WHERE id = ?'); $st->execute([$u['id']]);
    jout(['enabled' => (int) ($st->fetchColumn() ?: 0) === 1]);
  }
  // Étape 1 — génère un secret (non encore activé) + l'URI otpauth à scanner/ouvrir.
  if ($path === 'auth/2fa/setup' && $method === 'POST') {
    $u = require_user($pdo, $secret);
    $sec = totp_secret_new();
    $pdo->prepare('UPDATE users SET totp_pending = ? WHERE id = ?')->execute([$sec, $u['id']]);
    jout(['factorId' => 'totp', 'secret' => $sec, 'uri' => totp_uri($sec, (string) ($u['email'] ?? ''))]);
  }
  // Étape 2 — vérifie un premier code contre le secret en attente → active la 2FA
  // et renvoie (UNE seule fois) les codes de secours à conserver.
  if ($path === 'auth/2fa/activate' && $method === 'POST') {
    $u = require_user($pdo, $secret); $b = body();
    $st = $pdo->prepare('SELECT totp_pending FROM users WHERE id = ?'); $st->execute([$u['id']]);
    $pending = (string) ($st->fetchColumn() ?: '');
    if ($pending === '') jerr('Commencez par générer un secret (étape 1).');
    if (!totp_check($pending, (string) ($b['code'] ?? ''))) {
      jerr('Code incorrect. Vérifiez l’heure de votre téléphone, puis réessayez.', 401);
    }
    $codes = recovery_codes_new();
    $hashed = array_map(fn($c) => password_hash($c, PASSWORD_BCRYPT), $codes);
    $pdo->prepare('UPDATE users SET totp_secret = ?, totp_pending = NULL, totp_enabled = 1, totp_recovery = ? WHERE id = ?')
        ->execute([$pending, json_encode($hashed), $u['id']]);
    log_security_event($pdo, '2fa_enabled', $u['email'] ?? null);
    jout(['ok' => true, 'recoveryCodes' => $codes]);
  }
  // Désactive la 2FA — exige un code valide (TOTP ou code de secours).
  if ($path === 'auth/2fa/disable' && $method === 'POST') {
    $u = require_user($pdo, $secret); $b = body();
    $st = $pdo->prepare('SELECT totp_secret, totp_recovery, totp_enabled FROM users WHERE id = ?'); $st->execute([$u['id']]);
    $row = $st->fetch();
    if (!$row || (int) ($row['totp_enabled'] ?? 0) !== 1) jout(['ok' => true]); // déjà désactivée
    $code = (string) ($b['code'] ?? '');
    if (!totp_check((string) $row['totp_secret'], $code)
        && !recovery_consume($pdo, $u['id'], (string) ($row['totp_recovery'] ?? ''), $code)) {
      jerr('Code incorrect.', 401);
    }
    $pdo->prepare('UPDATE users SET totp_secret = NULL, totp_pending = NULL, totp_enabled = 0, totp_recovery = NULL WHERE id = ?')
        ->execute([$u['id']]);
    log_security_event($pdo, '2fa_disabled', $u['email'] ?? null);
    jout(['ok' => true]);
  }
  // Connexion — étape 2FA : échange le jeton de défi + un code contre une session.
  if ($path === 'auth/2fa/verify' && $method === 'POST') {
    $b = body();
    $payload = jwt_verify((string) ($b['mfaToken'] ?? ''), $secret);
    if (!$payload || empty($payload['sub']) || empty($payload['mfa'])) jerr('Session expirée. Reconnectez-vous.', 401);
    $st = $pdo->prepare('SELECT id, email, status, totp_secret, totp_recovery FROM users WHERE id = ?');
    $st->execute([$payload['sub']]); $u = $st->fetch();
    if (!$u) jerr('Session expirée. Reconnectez-vous.', 401);
    // Anti-force brute sur le code (6 chiffres) : 6 essais / 15 min par IP+email.
    rate_limit($pdo, 'mfa_fail', (string) $u['email'], 6, 900);
    if (($u['status'] ?? 'active') === 'blocked') jerr('Votre compte a été bloqué. Contactez le support à contact@chap.ci.', 403);
    $code = (string) ($b['code'] ?? '');
    if (!totp_check((string) $u['totp_secret'], $code)
        && !recovery_consume($pdo, (string) $u['id'], (string) ($u['totp_recovery'] ?? ''), $code)) {
      log_security_event($pdo, 'mfa_fail', $u['email'] ?? null);
      jerr('Code incorrect.', 401);
    }
    log_security_event($pdo, 'mfa_ok', $u['email'] ?? null);
    $token = mk_token($pdo, (string) $u['id'], (string) $u['email'], $secret);
    set_session_cookie($config, $token);
    jout(['token' => $token, 'user' => user_public($pdo, $u)]);
  }

  if ($path === 'auth/me' && $method === 'GET') {
    $u = current_user($pdo, $secret);
    // P3 · Rafraîchit le cookie à chaque chargement (session « glissante ») ET
    // migre en douceur une session héritée (jeton Bearer) vers le cookie HttpOnly.
    if ($u) set_session_cookie($config, mk_token($pdo, $u['id'], $u['email'] ?? '', $secret));
    jout(['user' => $u ? user_public($pdo, $u) : null]);
  }

  // P3 · Déconnexion côté serveur : efface le cookie HttpOnly (le JavaScript ne
  // peut pas le faire lui-même). Toujours « ok », même sans session.
  if ($path === 'auth/logout' && $method === 'POST') {
    clear_session_cookie($config);
    clear_admin_unlock_cookie($config); // referme aussi la serrure du tableau de bord
    jout(['ok' => true]);
  }

  if ($path === 'auth/password' && $method === 'POST') {
    $u = require_user($pdo, $secret); $b = body();
    $new = (string) ($b['password'] ?? '');
    if (strlen($new) < 8) jerr('Mot de passe trop court.');
    // P12 · Si le compte a déjà un mot de passe, exiger et vérifier l'actuel
    // (les comptes Google/téléphone sans mot de passe peuvent en définir un).
    $cur = $pdo->prepare('SELECT password_hash FROM users WHERE id = ?'); $cur->execute([$u['id']]);
    $hash = (string) ($cur->fetchColumn() ?: '');
    if ($hash !== '') {
      $old = (string) ($b['currentPassword'] ?? $b['oldPassword'] ?? '');
      if ($old === '' || !password_verify($old, $hash)) {
        log_security_event($pdo, 'password_change_denied', $u['email'] ?? null);
        jerr('Mot de passe actuel incorrect.', 403);
      }
    }
    // Met à jour + incrémente la version de session (déconnecte les autres
    // sessions ouvertes).
    $pdo->prepare('UPDATE users SET password_hash = ?, session_version = COALESCE(session_version,0) + 1 WHERE id = ?')
        ->execute([password_hash($new, PASSWORD_BCRYPT), $u['id']]);
    log_security_event($pdo, 'password_changed', $u['email'] ?? null);
    // Nouveau jeton pour la session courante (les anciens sont désormais invalides).
    $token = mk_token($pdo, $u['id'], $u['email'] ?? '', $secret);
    set_session_cookie($config, $token); // P3 : la session courante reste ouverte
    jout(['ok' => true, 'token' => $token]);
  }

  if ($path === 'auth/delete' && $method === 'POST') {
    $u = require_user($pdo, $secret); $id = $u['id']; $b = body();
    // Vérification : on redemande le mot de passe avant toute suppression.
    // Les comptes créés via Google ou par téléphone n'ont pas de mot de passe :
    // le jeton d'authentification (Bearer) suffit alors à prouver l'identité.
    $st = $pdo->prepare('SELECT password_hash FROM users WHERE id = ?'); $st->execute([$id]);
    $hash = $st->fetch()['password_hash'] ?? '';
    if ($hash !== '' && $hash !== null && !password_verify((string) ($b['password'] ?? ''), $hash))
      jerr('Mot de passe incorrect. Suppression annulée.', 403);
    $pdo->prepare('DELETE FROM reports WHERE reporter_id = ?')->execute([$id]);
    $pdo->prepare('DELETE FROM messages WHERE sender_id = ?')->execute([$id]);
    $pdo->prepare('DELETE FROM conversations WHERE buyer_id = ? OR seller_id = ?')->execute([$id, $id]);
    $pdo->prepare('DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE buyer_id = ? OR seller_id = ?)')->execute([$id, $id]);
    $pdo->prepare('DELETE FROM orders WHERE buyer_id = ? OR seller_id = ?')->execute([$id, $id]);
    $pdo->prepare('DELETE FROM reviews WHERE reviewer_id = ? OR seller_id = ? OR target_id = ?')->execute([$id, $id, $id]);
    // Nettoyage RGPD complet : aucune donnée liée ne doit survivre au compte
    // (loi 2013-450, droit à l'effacement). Robuste si une table est absente.
    foreach (['favorites' => 'user_id', 'notifications' => 'user_id',
              'saved_searches' => 'user_id', 'user_interests' => 'user_id'] as $tbl => $col) {
      try { $pdo->prepare("DELETE FROM $tbl WHERE $col = ?")->execute([$id]); } catch (Throwable $e) {}
    }
    $pdo->prepare('DELETE FROM listings WHERE user_id = ?')->execute([$id]);
    $pdo->prepare('DELETE FROM profiles WHERE id = ?')->execute([$id]);
    $pdo->prepare('DELETE FROM users WHERE id = ?')->execute([$id]);
    clear_session_cookie($config); // P3 : ferme la session du compte supprimé
    jout(['ok' => true]);
  }

  // Connexion / inscription via Google (Sign-In). Reçoit le « credential »
  // (jeton d'identité) de Google Identity Services, le vérifie, puis ouvre la
  // session. Crée le compte à la première connexion.
  if ($path === 'auth/google' && $method === 'POST') {
    $b = body();
    rate_limit($pdo, 'oauth', null, 30, 3600);
    if (($config['google_client_id'] ?? '') === '')
      jerr('La connexion Google n’est pas encore activée sur le serveur.', 400);
    $cred = (string) ($b['credential'] ?? '');
    if ($cred === '') jerr('Jeton Google manquant.');
    $claims = google_verify_id_token($config, $cred);
    if (!$claims) { log_security_event($pdo, 'oauth_fail', null, 'google'); jerr('Connexion Google invalide. Réessayez.', 401); }
    $email = strtolower(trim((string) ($claims['email'] ?? '')));
    $name  = trim((string) ($claims['name'] ?? ''));
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) jerr('Ce compte Google n’a pas d’adresse email valide.', 400);
    // `auth_provider` est lu ici parce qu'il décide, plus bas, s'il faut effacer
    // le mot de passe local — voir le commentaire « anti-pré-détournement ».
    $st = $pdo->prepare('SELECT id,email,status,password_hash,auth_provider FROM users WHERE email = ?'); $st->execute([$email]); $u = $st->fetch();
    if (!$u) {
      $id = uuid();
      // email_verified_at pose d'emblee : Google et Facebook ont DEJA verifie
      // l'adresse avant de nous la transmettre. Redemander un code serait une
      // formalite vide, et un obstacle de plus a l'inscription la plus fluide.
      $pdo->prepare('INSERT INTO users (id,email,password_hash,created_at,consent_at,cgu_version,auth_provider,email_verified_at) VALUES (?,?,?,?,?,?,?,?)')
          ->execute([$id, $email, null, now_iso(), now_iso(), '2026-07-14', 'google', now_iso()]);
      $pdo->prepare('INSERT INTO profiles (id,full_name,avatar_url,created_at) VALUES (?,?,?,?)')
          ->execute([$id, $name, (string) ($claims['picture'] ?? '') ?: null, now_iso()]);
      log_security_event($pdo, 'signup', $email, 'google');
      send_welcome_email($config, $email, $name);
      $u = ['id' => $id, 'email' => $email, 'status' => 'active'];
    } else {
      if (($u['status'] ?? 'active') === 'blocked') { log_security_event($pdo, 'login_blocked', $email, 'google'); jerr('Votre compte a été bloqué. Contactez le support à contact@chap.ci.', 403); }
      // Anti-pré-détournement : si ce compte possédait un mot de passe local
      // (potentiellement défini par un tiers AVANT que le vrai propriétaire ne se
      // connecte via Google — qui, lui, prouve la possession de l'email), on
      // l'invalide et on incrémente session_version pour couper toute session
      // ouverte avec cet ancien mot de passe.
      //
      // MAIS PAS QUAND C'EST GOOGLE QUI A CRÉÉ LE COMPTE.
      // La règle ne vise que le compte ouvert par mot de passe puis revendiqué
      // par Google. Appliquée à un compte que Google a lui-même ouvert, elle
      // efface le mot de passe que son propriétaire légitime vient de choisir —
      // et il n'a pas d'autre moyen d'entrer dans l'application Android, où le
      // bouton Google n'existe pas. Le scénario était : il pose un mot de passe
      // depuis chap.ci, se reconnecte une fois avec le bouton Google qu'il
      // connaît, et se retrouve dehors le lendemain sans comprendre.
      // Un compte marqué `auth_provider = 'google'` n'a jamais eu de mot de
      // passe d'origine : il n'y a rien à s'y pré-détourner.
      $creeParGoogle = ($u['auth_provider'] ?? '') === 'google';
      if (!$creeParGoogle && ($u['password_hash'] ?? null) !== null && (string) $u['password_hash'] !== '') {
        $pdo->prepare('UPDATE users SET password_hash = NULL, auth_provider = ?, session_version = COALESCE(session_version,0) + 1 WHERE id = ?')
            ->execute(['google', $u['id']]);
        log_security_event($pdo, 'oauth_password_reset', $email, 'google');
      }
      log_security_event($pdo, 'login_ok', $email, 'google');
    }
    $token = mk_token($pdo, $u['id'], $u['email'], $secret);
    set_session_cookie($config, $token); // P3
    jout(['token' => $token, 'user' => user_public($pdo, $u)]);
  }

  // Connexion / inscription via Facebook. Reçoit le jeton d'accès du SDK
  // Facebook, le vérifie (débog + profil), puis ouvre la session.
  if ($path === 'auth/facebook' && $method === 'POST') {
    $b = body();
    rate_limit($pdo, 'oauth', null, 30, 3600);
    if (($config['facebook_app_id'] ?? '') === '' || ($config['facebook_app_secret'] ?? '') === '')
      jerr('La connexion Facebook n’est pas encore activée sur le serveur.', 400);
    $tok = (string) ($b['accessToken'] ?? $b['token'] ?? '');
    if ($tok === '') jerr('Jeton Facebook manquant.');
    $fb = facebook_verify_token($config, $tok);
    if (!$fb) { log_security_event($pdo, 'oauth_fail', null, 'facebook'); jerr('Connexion Facebook invalide. Réessayez.', 401); }
    $fbId  = (string) ($fb['id'] ?? '');
    $email = strtolower(trim((string) ($fb['email'] ?? '')));
    $name  = trim((string) ($fb['name'] ?? ''));
    // Facebook ne partage pas toujours l'email (permission « email » non validée
    // pour le grand public). On se rabat alors sur une clé stable dérivée de
    // l'identifiant Facebook, pour que la connexion marche quand même et retrouve
    // toujours le même compte. Aucun email n'est envoyé vers cette adresse fictive.
    $realEmail = filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
    if (!$realEmail) {
      if ($fbId === '') { log_security_event($pdo, 'oauth_fail', null, 'facebook'); jerr('Connexion Facebook invalide. Réessayez.', 401); }
      $email = 'fb_' . $fbId . '@facebook.chapci';
    }
    // `auth_provider` est lu ici parce qu'il décide, plus bas, s'il faut effacer
    // le mot de passe local — voir le commentaire « anti-pré-détournement ».
    $st = $pdo->prepare('SELECT id,email,status,password_hash,auth_provider FROM users WHERE email = ?'); $st->execute([$email]); $u = $st->fetch();
    if (!$u) {
      $id = uuid();
      // email_verified_at pose d'emblee : Google et Facebook ont DEJA verifie
      // l'adresse avant de nous la transmettre. Redemander un code serait une
      // formalite vide, et un obstacle de plus a l'inscription la plus fluide.
      $pdo->prepare('INSERT INTO users (id,email,password_hash,created_at,consent_at,cgu_version,auth_provider,email_verified_at) VALUES (?,?,?,?,?,?,?,?)')
          ->execute([$id, $email, null, now_iso(), now_iso(), '2026-07-14', 'facebook', now_iso()]);
      $pdo->prepare('INSERT INTO profiles (id,full_name,created_at) VALUES (?,?,?)')
          ->execute([$id, $name, now_iso()]);
      log_security_event($pdo, 'signup', $email, 'facebook');
      if ($realEmail) send_welcome_email($config, $email, $name); // pas d'email vers une adresse fictive
      $u = ['id' => $id, 'email' => $email, 'status' => 'active'];
    } else {
      if (($u['status'] ?? 'active') === 'blocked') { log_security_event($pdo, 'login_blocked', $email, 'facebook'); jerr('Votre compte a été bloqué. Contactez le support à contact@chap.ci.', 403); }
      // Anti-pré-détournement (voir Google) : invalide un mot de passe local
      // éventuel — sauf si c'est Facebook qui a ouvert le compte, auquel cas le
      // mot de passe est celui que son propriétaire vient de choisir pour
      // pouvoir entrer dans l'application Android.
      $creeParFb = ($u['auth_provider'] ?? '') === 'facebook';
      if (!$creeParFb && ($u['password_hash'] ?? null) !== null && (string) $u['password_hash'] !== '') {
        $pdo->prepare('UPDATE users SET password_hash = NULL, auth_provider = ?, session_version = COALESCE(session_version,0) + 1 WHERE id = ?')
            ->execute(['facebook', $u['id']]);
        log_security_event($pdo, 'oauth_password_reset', $email, 'facebook');
      }
      log_security_event($pdo, 'login_ok', $email, 'facebook');
    }
    $token = mk_token($pdo, $u['id'], $u['email'], $secret);
    set_session_cookie($config, $token);
    jout(['token' => $token, 'user' => user_public($pdo, $u)]);
  }

  // Connexion par téléphone — étape 1 : envoi d'un code à 6 chiffres par SMS.
  if ($path === 'auth/phone/start' && $method === 'POST') {
    $b = body();
    $phone = normalize_phone((string) ($b['phone'] ?? ''));
    if (strlen($phone) < 8) jerr('Numéro de téléphone invalide.');
    // Anti-abus : max 5 envois par numéro/IP et par heure.
    rate_limit($pdo, 'otp_send', $phone, 5, 3600);
    $sms   = $config['sms'] ?? [];
    $prov  = $sms['provider'] ?? '';
    $debug = !empty($sms['debug']);
    if ($prov === '' && !$debug)
      jerr('La connexion par téléphone n’est pas encore activée sur le serveur.', 400);
    $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
    $pdo->prepare('DELETE FROM otp_codes WHERE phone = ?')->execute([$phone]);
    $pdo->prepare('INSERT INTO otp_codes (id,phone,code_hash,attempts,created_at,expires_at) VALUES (?,?,?,?,?,?)')
        ->execute([uuid(), $phone, password_hash($code, PASSWORD_BCRYPT), 0, now_iso(), gmdate('Y-m-d\TH:i:s\Z', time() + 600)]);
    log_security_event($pdo, 'otp_send', $phone);
    $text = "Chap.ci : votre code de verification est $code (valable 10 minutes). Ne le partagez avec personne.";
    $delivered = ($prov !== '') ? sms_send($config, $phone, $text) : false;
    if (!$delivered && !$debug) jerr('Envoi du SMS impossible pour le moment. Réessayez plus tard.', 502);
    $resp = ['delivered' => $delivered];
    // P11 : ne JAMAIS renvoyer le code au client en production. Il n'est révélé
    // que si le mode debug GLOBAL est explicitement activé (développement).
    if ($debug && !empty($config['debug'])) $resp['debugCode'] = $code;
    jout($resp);
  }

  // Connexion par téléphone — étape 2 : vérification du code + ouverture de session.
  if ($path === 'auth/phone/verify' && $method === 'POST') {
    $b = body();
    $phone = normalize_phone((string) ($b['phone'] ?? ''));
    $code  = preg_replace('/\D/', '', (string) ($b['code'] ?? ''));
    $name  = trim((string) ($b['full_name'] ?? ''));
    rate_limit($pdo, 'otp_verify_fail', $phone, 10, 900);
    if ($phone === '' || $code === '') jerr('Numéro ou code manquant.');
    $st = $pdo->prepare('SELECT id,code_hash,attempts,expires_at FROM otp_codes WHERE phone = ? ORDER BY created_at DESC');
    $st->execute([$phone]); $row = $st->fetch();
    if (!$row) jerr('Aucun code en attente. Demandez un nouveau code.', 400);
    if (strtotime((string) $row['expires_at']) < time()) {
      $pdo->prepare('DELETE FROM otp_codes WHERE phone = ?')->execute([$phone]);
      jerr('Code expiré. Demandez un nouveau code.', 400);
    }
    if ((int) $row['attempts'] >= 5) {
      $pdo->prepare('DELETE FROM otp_codes WHERE phone = ?')->execute([$phone]);
      jerr('Trop d’essais. Demandez un nouveau code.', 429);
    }
    if (!password_verify($code, (string) $row['code_hash'])) {
      $pdo->prepare('UPDATE otp_codes SET attempts = attempts + 1 WHERE id = ?')->execute([$row['id']]);
      log_security_event($pdo, 'otp_verify_fail', $phone);
      jerr('Code incorrect.', 401);
    }
    // Code valide : on le consomme, puis on trouve/crée le compte lié au numéro.
    $pdo->prepare('DELETE FROM otp_codes WHERE phone = ?')->execute([$phone]);
    $st = $pdo->prepare('SELECT id,email,status FROM users WHERE phone = ?'); $st->execute([$phone]); $u = $st->fetch();
    if (!$u) {
      $id = uuid();
      $pdo->prepare('INSERT INTO users (id,email,phone,password_hash,created_at,consent_at,cgu_version,auth_provider) VALUES (?,?,?,?,?,?,?,?)')
          ->execute([$id, null, $phone, null, now_iso(), now_iso(), '2026-07-14', 'phone']);
      $pdo->prepare('INSERT INTO profiles (id,full_name,phone,created_at) VALUES (?,?,?,?)')
          ->execute([$id, $name, $phone, now_iso()]);
      log_security_event($pdo, 'signup', $phone, 'phone');
      $u = ['id' => $id, 'email' => null, 'status' => 'active'];
    } else {
      if (($u['status'] ?? 'active') === 'blocked') { log_security_event($pdo, 'login_blocked', $phone, 'phone'); jerr('Votre compte a été bloqué. Contactez le support à contact@chap.ci.', 403); }
      log_security_event($pdo, 'login_ok', $phone, 'phone');
    }
    $token = mk_token($pdo, $u['id'], $u['email'] ?? '', $secret);
    set_session_cookie($config, $token); // P3
    jout(['token' => $token, 'user' => user_public($pdo, $u)]);
  }

  // ---------- LISTINGS ----------
  if ($path === 'listings' && $method === 'GET') {
    // Le public ne voit pas les annonces masquées (par le vendeur ou la modération).
    // Jointure users.verified → badge « vendeur vérifié » affiché sur la carte.
    $rows = $pdo->query('SELECT l.*, u.verified AS seller_verified FROM listings l
      LEFT JOIN users u ON u.id = l.user_id
      WHERE (l.hidden IS NULL OR l.hidden = 0) AND (l.sold IS NULL OR l.sold = 0)
      ORDER BY l.created_at DESC LIMIT 500')->fetchAll();
    jout(array_map('listing_out', $rows));
  }

  if ($path === 'listings' && $method === 'POST') {
    $u = require_user($pdo, $secret); $b = body();
    // Comptes restreints/bloqués : publication interdite.
    $stt = $pdo->prepare('SELECT status FROM users WHERE id = ?'); $stt->execute([$u['id']]);
    $ustatus = $stt->fetch()['status'] ?? 'active';
    if (in_array($ustatus, ['blocked', 'restricted'], true))
      jerr('Votre compte ne peut pas publier d’annonce pour le moment. Contactez le support.', 403);
    // Adresse e-mail confirmée : obligatoire pour PUBLIER, et là seulement.
    // Le message porte un code que l'écran sait reconnaître pour ouvrir la
    // saisie du code au lieu d'afficher une erreur sèche.
    if (!email_verifie($pdo, (string) $u['id'])) {
      jout(['error' => 'Confirmez votre adresse e-mail avant de publier : nous vous envoyons un code.',
            'emailUnverified' => true], 403);
    }
    if (!trim($b['title'] ?? '')) jerr('Titre manquant.');
    // Le Gardien : analyse anti-arnaque + contenu interdit AVANT publication.
    $mod = moderate_text(($b['title'] ?? '') . ' ' . ($b['description'] ?? ''));
    if (!$mod['ok']) {
      log_security_event($pdo, 'listing_blocked', $u['email'] ?? null, implode(',', array_map(fn($r) => $r['code'], $mod['reasons'])));
      jout([
        'error' => 'Votre annonce n’a pas pu être publiée : elle enfreint nos règles.',
        'moderation' => true, 'reasons' => $mod['reasons'],
      ], 422);
    }
    $images = [];
    foreach ((array) ($b['images'] ?? []) as $img) {
      $url = save_data_uri($config, (string) $img, true); // true = filigrane Chap.ci
      if ($url) $images[] = $url;
    }
    // Trois photos au minimum. La règle est ici, et pas seulement dans l'écran :
    // un formulaire se contourne, une route non.
    //
    // Pourquoi trois. Une annonce sans photo ne se vend pas — l'acheteur
    // ivoirien qui doit se déplacer à travers Abidjan veut voir avant de bouger.
    // Une seule photo, c'est la photo du fabricant ; deux, c'est la même sous
    // deux angles. Trois, c'est le moment où le vendeur montre l'objet qu'il a
    // réellement chez lui, avec ses défauts. C'est exactement ce qui distingue
    // une vraie annonce d'une annonce recopiée.
    //
    // On compte les images RETENUES, pas celles envoyées : une photo refusée
    // par save_data_uri (format invalide, SVG actif) ne compte pas, sans quoi
    // on publierait une annonce à deux photos en croyant en avoir trois.
    if (count($images) < LISTING_MIN_PHOTOS) {
      jerr('Ajoutez au moins ' . LISTING_MIN_PHOTOS . ' photos de l’objet. Une annonce sans photo ne se vend pas : montrez-le sous plusieurs angles, et n’hésitez pas à montrer les défauts — c’est ce qui inspire confiance.', 422);
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
    // Vente immobilière : le dossier foncier est exigé ici aussi, pas seulement
    // à l'écran. Sinon la règle ne tiendrait pas devant un simple curl.
    foncier_exiger((string) ($b['categoryId'] ?? ''), $b['subcategory'] ?? null, $attrs);
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
    // Notification de statut : l'annonce a passé la modération et est en ligne.
    notify($pdo, $u['id'], 'listing', 'Annonce publiée ✅',
      'Votre annonce « ' . mb_substr(trim($b['title']), 0, 60) . ' » est maintenant en ligne.',
      '#/annonce/' . $id);
    // Indexation instantanée : on signale la nouvelle annonce à tout le net (IndexNow).
    chapci_indexnow_ping($config, [rtrim((string) ($config['site_url'] ?? 'https://chap.ci'), '/') . '/annonce/' . $id]);
    $st = $pdo->prepare('SELECT l.*, u.verified AS seller_verified FROM listings l
      LEFT JOIN users u ON u.id = l.user_id WHERE l.id = ?'); $st->execute([$id]);
    jout(listing_out($st->fetch(), true)); // réponse au propriétaire : téléphone inclus
  }

  // Mes annonces — inclut les annonces masquées (gestion par le vendeur).
  if ($path === 'listings/mine' && $method === 'GET') {
    $u = require_user($pdo, $secret);
    $st = $pdo->prepare('SELECT * FROM listings WHERE user_id = ? ORDER BY created_at DESC');
    $st->execute([$u['id']]);
    // « Mes annonces » : le demandeur est authentifié et n'obtient que les
    // siennes — son propre téléphone peut donc lui être renvoyé.
    jout(array_map(fn($r) => listing_out($r, true), $st->fetchAll()));
  }

  // Statistiques du tableau de bord vendeur : vues (avec tendance vs période
  // précédente), annonces actives, demandes reçues, ventes, et série des vues
  // sur les 7 derniers jours (pour le graphique). Chiffres 100 % réels.
  if ($path === 'seller/analytics' && $method === 'GET') {
    $u = require_user($pdo, $secret);
    $period = $_GET['period'] ?? '7j';
    $days = $period === 'annee' ? 365 : ($period === '30j' ? 30 : 7);
    $now = time();
    $dayStr = fn(int $t) => gmdate('Y-m-d', $t);
    $tsStr  = fn(int $t) => gmdate('Y-m-d', $t) . 'T00:00:00Z';
    $startCur  = $now - ($days - 1) * 86400;   // début période courante (jour)
    $startPrev = $startCur - $days * 86400;    // début période précédente
    $fCur = $dayStr($startCur); $fPrev = $dayStr($startPrev);
    $tCur = $tsStr($startCur); $tPrev = $tsStr($startPrev);

    // Annonces du vendeur + nombre d'actives (ni masquées ni vendues).
    $ls = $pdo->prepare('SELECT id, hidden, sold FROM listings WHERE user_id = ?');
    $ls->execute([$u['id']]);
    $rows = $ls->fetchAll();
    $ids = array_column($rows, 'id');
    $active = 0;
    foreach ($rows as $r) { if (empty($r['hidden']) && empty($r['sold'])) $active++; }

    $viewsCur = 0; $viewsPrev = 0; $byDay = [];
    if ($ids) {
      $in = implode(',', array_fill(0, count($ids), '?'));
      $q = $pdo->prepare("SELECT COALESCE(SUM(n),0) AS s FROM listing_view_days WHERE day >= ? AND listing_id IN ($in)");
      $q->execute(array_merge([$fCur], $ids)); $viewsCur = (int) $q->fetch()['s'];
      $q = $pdo->prepare("SELECT COALESCE(SUM(n),0) AS s FROM listing_view_days WHERE day >= ? AND day < ? AND listing_id IN ($in)");
      $q->execute(array_merge([$fPrev, $fCur], $ids)); $viewsPrev = (int) $q->fetch()['s'];
      $chartStart = $dayStr($now - 6 * 86400);
      $q = $pdo->prepare("SELECT day, COALESCE(SUM(n),0) AS s FROM listing_view_days WHERE day >= ? AND listing_id IN ($in) GROUP BY day");
      $q->execute(array_merge([$chartStart], $ids));
      foreach ($q->fetchAll() as $r) $byDay[$r['day']] = (int) $r['s'];
    }
    // Série des 7 derniers jours (jours vides = 0).
    $series = [];
    for ($i = 6; $i >= 0; $i--) {
      $t = $now - $i * 86400; $d = $dayStr($t);
      $series[] = ['day' => $d, 'dow' => (int) gmdate('N', $t), 'n' => $byDay[$d] ?? 0];
    }

    // Demandes reçues (commandes en tant que vendeur) et ventes finalisées.
    $cnt = function (string $extra, array $args) use ($pdo, $u) {
      $q = $pdo->prepare("SELECT COUNT(*) AS c FROM orders WHERE seller_id = ? $extra");
      $q->execute(array_merge([$u['id']], $args));
      return (int) $q->fetch()['c'];
    };
    $demCur  = $cnt('AND created_at >= ?', [$tCur]);
    $demPrev = $cnt('AND created_at >= ? AND created_at < ?', [$tPrev, $tCur]);
    $venCur  = $cnt("AND status = 'finalise' AND created_at >= ?", [$tCur]);
    $venPrev = $cnt("AND status = 'finalise' AND created_at >= ? AND created_at < ?", [$tPrev, $tCur]);

    $trend = fn(int $cur, int $prev) => $prev <= 0 ? null : (int) round((($cur - $prev) / $prev) * 100);

    jout([
      'period' => $period,
      'views' => ['value' => $viewsCur, 'trend' => $trend($viewsCur, $viewsPrev)],
      'activeListings' => $active,
      'demands' => ['value' => $demCur, 'trend' => $trend($demCur, $demPrev)],
      'sales' => ['value' => $venCur, 'trend' => $trend($venCur, $venPrev)],
      'series' => $series,
    ]);
  }

  // Comptabiliser une vue d'annonce (statistiques). On n'incrémente pas les
  // vues du propriétaire ; le frontend limite à une vue par visiteur/session.
  if (count($seg) === 3 && $seg[0] === 'listings' && $seg[2] === 'view' && $method === 'POST') {
    $st = $pdo->prepare('SELECT user_id FROM listings WHERE id = ?'); $st->execute([$seg[1]]);
    $row = $st->fetch();
    if ($row) {
      $viewer = current_user($pdo, $secret);
      if (!$viewer || $viewer['id'] !== $row['user_id']) {
        $pdo->prepare('UPDATE listings SET views = COALESCE(views, 0) + 1 WHERE id = ?')->execute([$seg[1]]);
        // Série quotidienne des vues (tableau de bord vendeur). Upsert portable
        // (UPDATE puis INSERT si absent) — compatible SQLite / PostgreSQL / MySQL.
        $today = gmdate('Y-m-d');
        $up = $pdo->prepare('UPDATE listing_view_days SET n = n + 1 WHERE listing_id = ? AND day = ?');
        $up->execute([$seg[1], $today]);
        if ($up->rowCount() < 1) {
          try { $pdo->prepare('INSERT INTO listing_view_days (listing_id, day, n) VALUES (?, ?, 1)')->execute([$seg[1], $today]); }
          catch (Throwable $e) { $pdo->prepare('UPDATE listing_view_days SET n = n + 1 WHERE listing_id = ? AND day = ?')->execute([$seg[1], $today]); }
        }
      }
    }
    jout(['ok' => true]);
  }

  // Modifier son annonce.
  if (count($seg) === 2 && $seg[0] === 'listings' && $method === 'PUT') {
    $u = require_user($pdo, $secret); $b = body();
    $st = $pdo->prepare('SELECT user_id, hidden, hidden_reason, images FROM listings WHERE id = ?'); $st->execute([$seg[1]]);
    $row = $st->fetch();
    if (!$row) jerr('Annonce introuvable.', 404);
    if ($row['user_id'] !== $u['id']) jerr('Non autorisé.', 403);
    if (!trim($b['title'] ?? '')) jerr('Titre manquant.');
    // Le Gardien : re-vérifie le contenu à chaque modification.
    $mod = moderate_text(($b['title'] ?? '') . ' ' . ($b['description'] ?? ''));
    if (!$mod['ok']) {
      log_security_event($pdo, 'listing_blocked', $u['email'] ?? null, implode(',', array_map(fn($r) => $r['code'], $mod['reasons'])));
      jout([
        'error' => 'Votre annonce n’a pas pu être enregistrée : elle enfreint nos règles.',
        'moderation' => true, 'reasons' => $mod['reasons'],
      ], 422);
    }
    // Images : on garde les URLs existantes, on enregistre les nouvelles (data-URI).
    $images = [];
    foreach ((array) ($b['images'] ?? []) as $img) {
      $img = (string) $img;
      if ($img === '') continue;
      if (strncmp($img, 'data:', 5) === 0) { $url = save_data_uri($config, $img, true); if ($url) $images[] = $url; }
      else $images[] = $img;
    }
    // Trois photos minimum, comme à la publication — mais SANS piéger les
    // annonces d'avant la règle.
    //
    // Une annonce publiée hier avec une seule photo est là, en ligne, et son
    // vendeur a le droit d'en corriger le prix ou une faute. Lui refuser la
    // modification tant qu'il n'a pas trouvé deux photos de plus, c'est le
    // punir d'une règle qui n'existait pas quand il a publié — et le plus
    // souvent, il abandonne la correction plutôt que de chercher des photos.
    //
    // On exige donc le minimum aux annonces qui l'atteignaient déjà, et pour
    // les autres, on demande seulement de ne pas descendre plus bas. Le seuil
    // se resserre tout seul, sans jamais bloquer personne.
    $avant = $row['images'] ? (json_decode((string) $row['images'], true) ?: []) : [];
    $plancher = min(LISTING_MIN_PHOTOS, max(1, count($avant)));
    if (count($images) < $plancher) {
      jerr($plancher >= LISTING_MIN_PHOTOS
        ? 'Ajoutez au moins ' . LISTING_MIN_PHOTOS . ' photos de l’objet. Une annonce sans photo ne se vend pas.'
        : 'Gardez au moins ' . $plancher . ' photo' . ($plancher > 1 ? 's' : '') . ' sur cette annonce. Vous pouvez en ajouter, pas en retirer toutes.', 422);
    }
    $attrs = [];
    if (!empty($b['attributes']) && is_array($b['attributes'])) {
      foreach ($b['attributes'] as $k => $v) {
        $k = substr(trim((string) $k), 0, 40); $v = substr(trim((string) $v), 0, 120);
        if ($k !== '' && $v !== '') $attrs[$k] = $v;
      }
    }
    foncier_exiger((string) ($b['categoryId'] ?? ''), $b['subcategory'] ?? null, $attrs);
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
    // Annonce masquée pour dossier foncier incomplet : la mise à jour vient de
    // passer la validation, elle repart donc en ligne d'elle-même. Le vendeur a
    // fait ce qu'on lui demandait ; lui imposer une démarche de plus serait une
    // punition, pas une règle.
    if (!empty($row['hidden']) && (string) ($row['hidden_reason'] ?? '') === FONCIER_MOTIF) {
      $pdo->prepare('UPDATE listings SET hidden = 0, hidden_reason = NULL WHERE id = ?')->execute([$seg[1]]);
      notify($pdo, $u['id'], 'listing', 'Annonce de nouveau en ligne ✅',
        'Votre dossier foncier est complet : « ' . mb_substr(trim($b['title']), 0, 60) . ' » est de nouveau visible.',
        '#/annonce/' . $seg[1]);
    }
    // Contenu modifié : on redemande une réindexation instantanée (IndexNow).
    chapci_indexnow_ping($config, [rtrim((string) ($config['site_url'] ?? 'https://chap.ci'), '/') . '/annonce/' . $seg[1]]);
    $st = $pdo->prepare('SELECT * FROM listings WHERE id = ?'); $st->execute([$seg[1]]);
    jout(listing_out($st->fetch(), true)); // réponse au propriétaire : téléphone inclus
  }

  // Masquer / réafficher son annonce (le vendeur, ou un admin).
  if (count($seg) === 3 && $seg[0] === 'listings' && $seg[2] === 'visibility' && $method === 'POST') {
    $u = require_user($pdo, $secret); $b = body();
    $st = $pdo->prepare('SELECT user_id, category_id, subcategory, attributes, hidden_reason FROM listings WHERE id = ?');
    $st->execute([$seg[1]]);
    $row = $st->fetch();
    if (!$row) jerr('Annonce introuvable.', 404);
    if ($row['user_id'] !== $u['id'] && !is_admin($config, $pdo, $u)) jerr('Non autorisé.', 403);
    $hidden = !empty($b['hidden']) ? 1 : 0;
    // Réafficher une annonce masquée pour dossier foncier incomplet reviendrait
    // à contourner la règle d'un clic. Le seul chemin de retour est le
    // formulaire, qui remet l'annonce en ligne dès qu'il est rempli.
    if (!$hidden && (string) ($row['hidden_reason'] ?? '') === FONCIER_MOTIF) {
      $attrs = !empty($row['attributes']) ? (json_decode((string) $row['attributes'], true) ?: []) : [];
      $m = foncier_manques($attrs);
      if ($m) {
        jout(['error' => 'Complétez d’abord le dossier foncier de cette annonce : il manque '
              . implode(', ', $m) . '.', 'foncier' => true, 'manques' => $m], 422);
      }
    }
    $pdo->prepare('UPDATE listings SET hidden = ?, hidden_reason = CASE WHEN ? = 1 THEN hidden_reason ELSE NULL END WHERE id = ?')
        ->execute([$hidden, $hidden, $seg[1]]);
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
    // Auto-masquage : au-delà de 3 signalements ouverts, l'annonce est masquée
    // automatiquement en attendant la décision d'un administrateur.
    $cnt = $pdo->prepare("SELECT COUNT(*) AS c FROM reports WHERE listing_id = ? AND status = 'open'");
    $cnt->execute([$listingId]);
    $autoHidden = (int) $cnt->fetch()['c'] >= 3;
    if ($autoHidden) $pdo->prepare('UPDATE listings SET hidden = 1 WHERE id = ?')->execute([$listingId]);
    send_report_email($config, $u['email'], $title, $listingId, $reason, $details);
    jout(['ok' => true, 'autoHidden' => $autoHidden]);
  }

  // ---------- RECHERCHES SAUVEGARDÉES (alertes email) ----------
  // Liste mes alertes.
  if ($path === 'searches' && $method === 'GET') {
    $u = require_user($pdo, $secret);
    $st = $pdo->prepare('SELECT * FROM saved_searches WHERE user_id = ? ORDER BY created_at DESC');
    $st->execute([$u['id']]);
    jout(array_map(fn($r) => [
      'id' => $r['id'], 'label' => $r['label'], 'params' => $r['params'],
      'createdAt' => iso_to_ms($r['created_at']),
    ], $st->fetchAll()));
  }
  // Créer une alerte (max 20 par personne).
  if ($path === 'searches' && $method === 'POST') {
    $u = require_user($pdo, $secret); $b = body();
    $label  = substr(trim((string) ($b['label'] ?? '')), 0, 120);
    $params2 = ltrim(substr(trim((string) ($b['params'] ?? '')), 0, 600), '?');
    if ($label === '') jerr('Nom de l’alerte manquant.');
    $cnt = $pdo->prepare('SELECT COUNT(*) AS c FROM saved_searches WHERE user_id = ?');
    $cnt->execute([$u['id']]);
    if ((int) $cnt->fetch()['c'] >= 20) jerr('Vous avez atteint la limite de 20 alertes.', 400);
    $id = uuid();
    // Point de départ = maintenant : on n'alerte que sur les annonces publiées ensuite.
    $pdo->prepare('INSERT INTO saved_searches (id,user_id,label,params,last_notified_at,created_at) VALUES (?,?,?,?,?,?)')
        ->execute([$id, $u['id'], $label, $params2, now_iso(), now_iso()]);
    jout(['id' => $id, 'label' => $label, 'params' => $params2, 'createdAt' => iso_to_ms(now_iso())]);
  }
  // Supprimer une alerte.
  if (count($seg) === 2 && $seg[0] === 'searches' && $method === 'DELETE') {
    $u = require_user($pdo, $secret);
    $st = $pdo->prepare('SELECT user_id FROM saved_searches WHERE id = ?'); $st->execute([$seg[1]]);
    $row = $st->fetch();
    if (!$row) jerr('Alerte introuvable.', 404);
    if ($row['user_id'] !== $u['id']) jerr('Non autorisé.', 403);
    $pdo->prepare('DELETE FROM saved_searches WHERE id = ?')->execute([$seg[1]]);
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
    $listingId = trim((string) ($b['listingId'] ?? '')); $sellerId = trim((string) ($b['sellerId'] ?? ''));
    if ($sellerId === '') jerr('Vendeur manquant.');
    if ($sellerId === $u['id']) jerr('Vous ne pouvez pas vous contacter vous-même.', 400);
    // Sécurité : la conversation doit porter sur une annonce RÉELLE dont le vendeur
    // indiqué est bien le propriétaire. Sinon, un utilisateur pourrait fabriquer une
    // fausse relation acheteur→vendeur (spam de messages, fausses commandes/avis).
    if ($listingId === '') jerr('Annonce manquante.', 400);
    $lo = $pdo->prepare('SELECT user_id FROM listings WHERE id = ?'); $lo->execute([$listingId]);
    $lr = $lo->fetch();
    if (!$lr) jerr('Annonce introuvable.', 404);
    if ((string) $lr['user_id'] !== $sellerId) jerr('Vendeur invalide pour cette annonce.', 400);
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
      // Modération du chat : on bloque le contenu clairement illégal (drogue,
      // sexe, services de plaisir…), pas les questions de paiement légitimes.
      $mod = moderate_text($bodyTxt);
      $illegal = array_values(array_filter($mod['reasons'], fn($r) =>
        in_array($r['code'], ['drogue','arme','faux','sexuel_service','contenu_sexuel','especes','medicament'], true)));
      if ($illegal) {
        log_security_event($pdo, 'message_blocked', $u['email'] ?? null, implode(',', array_map(fn($r) => $r['code'], $illegal)));
        jout(['error' => 'Message bloqué : il contient du contenu interdit.', 'moderation' => true, 'reasons' => $illegal], 422);
      }
      $id = uuid(); $ts = now_iso();
      $pdo->prepare('INSERT INTO messages (id,conversation_id,sender_id,body,created_at) VALUES (?,?,?,?,?)')
          ->execute([$id, $convId, $u['id'], $bodyTxt, $ts]);
      // Notifie le destinataire (l'autre participant de la conversation).
      $recipient = $conv['buyer_id'] === $u['id'] ? $conv['seller_id'] : $conv['buyer_id'];
      $sn = $pdo->prepare('SELECT full_name FROM profiles WHERE id = ?'); $sn->execute([$u['id']]);
      $senderName = trim((string) ($sn->fetch()['full_name'] ?? '')) ?: 'Un utilisateur';
      notify($pdo, (string) $recipient, 'message', 'Nouveau message',
        $senderName . ' vous a envoyé un message.', '#/messages/' . $convId);
      jout(['id' => $id, 'conversationId' => $convId, 'senderId' => $u['id'], 'body' => $bodyTxt, 'createdAt' => iso_to_ms($ts)]);
    }
  }

  // ---------- FAVORIS (côté serveur) ----------
  if ($path === 'favorites' && $method === 'GET') {
    $u = require_user($pdo, $secret);
    $st = $pdo->prepare('SELECT listing_id FROM favorites WHERE user_id = ?'); $st->execute([$u['id']]);
    jout(array_map(fn($r) => $r['listing_id'], $st->fetchAll()));
  }
  if (count($seg) === 2 && $seg[0] === 'favorites' && $method === 'POST') {
    $u = require_user($pdo, $secret); $lid = $seg[1];
    $ls = $pdo->prepare('SELECT user_id,title FROM listings WHERE id = ?'); $ls->execute([$lid]); $l = $ls->fetch();
    if (!$l) jerr('Annonce introuvable.', 404);
    $ex = $pdo->prepare('SELECT 1 FROM favorites WHERE user_id = ? AND listing_id = ?'); $ex->execute([$u['id'], $lid]);
    if (!$ex->fetch()) {
      $pdo->prepare('INSERT INTO favorites (user_id,listing_id,created_at) VALUES (?,?,?)')->execute([$u['id'], $lid, now_iso()]);
      // Notifie le vendeur (anonymisé), sauf pour ses propres annonces.
      if (!empty($l['user_id']) && $l['user_id'] !== $u['id']) {
        notify($pdo, (string) $l['user_id'], 'favorite', 'Nouveau favori ❤️',
          'Une personne a ajouté « ' . $l['title'] . ' » à ses favoris.', '#/annonce/' . $lid);
      }
    }
    jout(['ok' => true]);
  }
  if (count($seg) === 2 && $seg[0] === 'favorites' && $method === 'DELETE') {
    $u = require_user($pdo, $secret);
    $pdo->prepare('DELETE FROM favorites WHERE user_id = ? AND listing_id = ?')->execute([$u['id'], $seg[1]]);
    jout(['ok' => true]);
  }

  // ---------- NOTIFICATIONS ----------
  if ($path === 'notifications' && $method === 'GET') {
    $u = require_user($pdo, $secret);
    $st = $pdo->prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50');
    $st->execute([$u['id']]);
    jout(array_map(fn($n) => [
      'id' => $n['id'], 'type' => $n['type'], 'title' => $n['title'], 'body' => $n['body'],
      'link' => $n['link'], 'read' => !empty($n['read_flag']), 'createdAt' => iso_to_ms($n['created_at']),
    ], $st->fetchAll()));
  }
  if ($path === 'notifications/count' && $method === 'GET') {
    $u = require_user($pdo, $secret);
    $st = $pdo->prepare('SELECT COUNT(*) FROM notifications WHERE user_id = ? AND (read_flag IS NULL OR read_flag = 0)');
    $st->execute([$u['id']]);
    jout(['count' => (int) $st->fetchColumn()]);
  }
  if ($path === 'notifications/read' && $method === 'POST') {
    $u = require_user($pdo, $secret); $b = body();
    if (!empty($b['id'])) $pdo->prepare('UPDATE notifications SET read_flag = 1 WHERE user_id = ? AND id = ?')->execute([$u['id'], $b['id']]);
    else $pdo->prepare('UPDATE notifications SET read_flag = 1 WHERE user_id = ?')->execute([$u['id']]);
    jout(['ok' => true]);
  }
  // Effacer des notifications : {ids:[...]} pour une sélection, sinon tout effacer.
  if ($path === 'notifications' && $method === 'DELETE') {
    $u = require_user($pdo, $secret); $b = body();
    $ids = $b['ids'] ?? null;
    if (is_array($ids) && count($ids)) {
      $ids = array_values(array_filter($ids, 'is_string'));
      if ($ids) {
        $in = implode(',', array_fill(0, count($ids), '?'));
        $pdo->prepare("DELETE FROM notifications WHERE user_id = ? AND id IN ($in)")
            ->execute(array_merge([$u['id']], $ids));
      }
    } else {
      $pdo->prepare('DELETE FROM notifications WHERE user_id = ?')->execute([$u['id']]);
    }
    jout(['ok' => true]);
  }
  if ($path === 'notifications/prefs' && $method === 'GET') {
    $u = require_user($pdo, $secret);
    $st = $pdo->prepare('SELECT notif_prefs FROM profiles WHERE id = ?'); $st->execute([$u['id']]);
    $prefs = json_decode((string) ($st->fetch()['notif_prefs'] ?? ''), true) ?: [];
    jout(['favorite' => $prefs['favorite'] ?? true, 'message' => $prefs['message'] ?? true]);
  }
  if ($path === 'notifications/prefs' && $method === 'PUT') {
    $u = require_user($pdo, $secret); $b = body();
    $prefs = ['favorite' => !empty($b['favorite']), 'message' => !empty($b['message'])];
    $pdo->prepare('UPDATE profiles SET notif_prefs = ? WHERE id = ?')->execute([json_encode($prefs), $u['id']]);
    jout(['ok' => true]);
  }

  // ---------- ORDERS ----------
  if ($path === 'orders' && $method === 'POST') {
    $u = require_user($pdo, $secret); $b = body();
    $sellerId = trim((string) ($b['sellerId'] ?? ''));
    if ($sellerId === '') jerr('Vendeur manquant.');
    if ($sellerId === $u['id']) jerr('Vous ne pouvez pas commander auprès de vous-même.', 400);
    // Le vendeur doit exister.
    $se = $pdo->prepare('SELECT email FROM users WHERE id = ?'); $se->execute([$sellerId]);
    $seller = $se->fetch();
    if (!$seller) jerr('Vendeur introuvable.', 404);
    // Anti-abus (P2) : une VRAIE relation acheteur→vendeur est exigée — le
    // demandeur doit avoir déjà contacté ce vendeur (conversation existante).
    // Sans cela, on pourrait fabriquer de fausses commandes pour poster de faux
    // avis (harcèlement) ou spammer un vendeur par email.
    $cc = $pdo->prepare('SELECT 1 FROM conversations WHERE buyer_id = ? AND seller_id = ? LIMIT 1');
    $cc->execute([$u['id'], $sellerId]);
    if (!$cc->fetch()) jerr('Contactez d’abord le vendeur avant de passer commande.', 403);
    // Chaque article commandé doit référencer une annonce RÉELLE appartenant au
    // vendeur indiqué. Une commande VIDE est refusée : sinon on pourrait créer une
    // fausse commande (sans article) pour fabriquer un faux avis (harcèlement).
    $items = (array) ($b['items'] ?? []);
    if (!$items) jerr('Commande vide.', 400);
    // SÉCURITÉ : ne JAMAIS faire confiance au prix / titre / image envoyés par le
    // client. Pour chaque article, on relit la vérité depuis l'annonce (comme le
    // flux « deal » via $ensureOrder). Sinon un acheteur pourrait forger un prix
    // arbitraire (emails de confirmation et statistique ordersValue faussés).
    $valid = [];
    foreach ($items as $it) {
      $lid = trim((string) ($it['listingId'] ?? ''));
      if ($lid === '') jerr('Article invalide (annonce manquante).', 400);
      $ls = $pdo->prepare('SELECT user_id, title, price, images FROM listings WHERE id = ?'); $ls->execute([$lid]);
      $lr = $ls->fetch();
      if (!$lr || (string) $lr['user_id'] !== $sellerId) jerr('Article invalide pour ce vendeur.', 400);
      $imgs = $lr['images'] ? (json_decode($lr['images'], true) ?: []) : [];
      $valid[] = [
        'listingId' => $lid,
        'title'     => (string) ($lr['title'] ?? ''),
        'price'     => (int) ($lr['price'] ?? 0),
        'image'     => $imgs[0] ?? null,
      ];
    }
    // Cohérence défensive : le conversationId fourni doit appartenir à CE couple
    // acheteur→vendeur, sinon on ne lie pas la commande à une conversation
    // étrangère (aucune route ne l'exploite pour l'autorisation, mais autant
    // garder des données saines).
    $convId = trim((string) ($b['conversationId'] ?? ''));
    if ($convId !== '') {
      $cv = $pdo->prepare('SELECT 1 FROM conversations WHERE id = ? AND buyer_id = ? AND seller_id = ? LIMIT 1');
      $cv->execute([$convId, $u['id'], $sellerId]);
      if (!$cv->fetch()) $convId = '';
    }
    $oid = uuid();
    $pdo->prepare('INSERT INTO orders (id,buyer_id,seller_id,conversation_id,status,created_at) VALUES (?,?,?,?,?,?)')
        ->execute([$oid, $u['id'], $sellerId, $convId !== '' ? $convId : null, 'en_cours', now_iso()]);
    foreach ($valid as $it) {
      $pdo->prepare('INSERT INTO order_items (id,order_id,listing_id,title,price,image) VALUES (?,?,?,?,?,?)')
          ->execute([uuid(), $oid, $it['listingId'], $it['title'], $it['price'], $it['image']]);
    }
    // Notifications email (best-effort) : vendeur + acheteur — à partir des
    // données serveur validées (jamais celles du client).
    $sellerEmail = $seller['email'] ?? null;
    if ($sellerEmail) send_order_seller_email($config, $sellerEmail, $valid);
    if (!empty($u['email'])) send_order_buyer_email($config, $u['email'], $valid);
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
    // Statut restreint à une liste blanche (pas de valeur arbitraire en base).
    $status = (string) ($b['status'] ?? 'en_cours');
    if (!in_array($status, ['en_cours', 'finalise', 'annule'], true)) jerr('Statut de commande invalide.', 400);
    $pdo->prepare('UPDATE orders SET status = ? WHERE id = ?')->execute([$status, $seg[1]]);
    jout(['ok' => true]);
  }

  if ($path === 'purchased' && $method === 'GET') {
    $u = require_user($pdo, $secret);
    $st = $pdo->prepare('SELECT DISTINCT oi.listing_id FROM order_items oi
      JOIN orders o ON o.id = oi.order_id WHERE o.buyer_id = ? AND oi.listing_id IS NOT NULL');
    $st->execute([$u['id']]);
    jout(array_values(array_filter(array_column($st->fetchAll(), 'listing_id'))));
  }

  // ---------- SUIVI DE TRANSACTION (« deal » lié à une conversation) ----------
  // État du deal pour l'utilisateur courant : rôle, commande, annonce vendue,
  // avis déjà laissé. Sert à afficher la bonne action dans la conversation.
  if (count($seg) === 3 && $seg[0] === 'conversations' && $seg[2] === 'deal' && $method === 'GET') {
    $u = require_user($pdo, $secret);
    $cs = $pdo->prepare('SELECT * FROM conversations WHERE id = ?'); $cs->execute([$seg[1]]);
    $conv = $cs->fetch();
    if (!$conv) jerr('Conversation introuvable.', 404);
    $isBuyer = $conv['buyer_id'] === $u['id']; $isSeller = $conv['seller_id'] === $u['id'];
    if (!$isBuyer && !$isSeller) jerr('Non autorisé.', 403);
    $otherId = $isBuyer ? $conv['seller_id'] : $conv['buyer_id'];
    $os = $pdo->prepare('SELECT * FROM orders WHERE conversation_id = ? ORDER BY created_at DESC LIMIT 1');
    $os->execute([$seg[1]]); $order = $os->fetch() ?: null;
    $listingId = $conv['listing_id']; $listingTitle = null; $sold = false;
    if ($listingId) {
      $ls = $pdo->prepare('SELECT title, sold FROM listings WHERE id = ?'); $ls->execute([$listingId]);
      if ($lr = $ls->fetch()) { $listingTitle = $lr['title']; $sold = !empty($lr['sold']); }
    }
    $rv = $pdo->prepare('SELECT rating FROM reviews WHERE reviewer_id = ? AND target_id = ? ORDER BY created_at DESC LIMIT 1');
    $rv->execute([$u['id'], $otherId]); $mine = $rv->fetch();
    $pn = $pdo->prepare('SELECT full_name FROM profiles WHERE id = ?'); $pn->execute([$otherId]);
    jout([
      'role' => $isBuyer ? 'buyer' : 'seller',
      'listingId' => $listingId, 'listingTitle' => $listingTitle,
      'sellerId' => $conv['seller_id'], 'buyerId' => $conv['buyer_id'],
      'otherId' => $otherId, 'otherName' => ($pn->fetch()['full_name'] ?? null) ?: 'Utilisateur',
      'order' => $order ? ['id' => $order['id'], 'status' => $order['status'] ?: 'en_cours',
                           'sellerConfirmed' => !empty($order['seller_confirmed'])] : null,
      'sold' => $sold,
      'iReviewed' => $mine ? true : false,
      'myRating' => $mine ? (int) $mine['rating'] : null,
    ]);
  }
  // Action sur le deal : bought / received / sold / cancel.
  if (count($seg) === 3 && $seg[0] === 'conversations' && $seg[2] === 'deal' && $method === 'POST') {
    $u = require_user($pdo, $secret); $b = body();
    $cs = $pdo->prepare('SELECT * FROM conversations WHERE id = ?'); $cs->execute([$seg[1]]);
    $conv = $cs->fetch();
    if (!$conv) jerr('Conversation introuvable.', 404);
    $isBuyer = $conv['buyer_id'] === $u['id']; $isSeller = $conv['seller_id'] === $u['id'];
    if (!$isBuyer && !$isSeller) jerr('Non autorisé.', 403);
    $action = (string) ($b['action'] ?? '');
    $listingId = $conv['listing_id'];
    $os = $pdo->prepare('SELECT * FROM orders WHERE conversation_id = ? ORDER BY created_at DESC LIMIT 1');
    $os->execute([$seg[1]]); $order = $os->fetch() ?: null;
    // Crée la commande « deal » à partir de la conversation (1 annonce).
    $ensureOrder = function (string $status) use ($pdo, $conv, $listingId, &$order): array {
      if ($order) return $order;
      $oid = uuid();
      $pdo->prepare('INSERT INTO orders (id,buyer_id,seller_id,conversation_id,listing_id,status,created_at) VALUES (?,?,?,?,?,?,?)')
          ->execute([$oid, $conv['buyer_id'], $conv['seller_id'], $conv['id'], $listingId, $status, now_iso()]);
      if ($listingId) {
        $ls = $pdo->prepare('SELECT title,price,images FROM listings WHERE id = ?'); $ls->execute([$listingId]);
        if ($lr = $ls->fetch()) {
          $imgs = json_decode($lr['images'] ?: '[]', true); $img = $imgs[0] ?? null;
          $pdo->prepare('INSERT INTO order_items (id,order_id,listing_id,title,price,image) VALUES (?,?,?,?,?,?)')
              ->execute([uuid(), $oid, $listingId, $lr['title'] ?? '', (int) ($lr['price'] ?? 0), $img]);
        }
      }
      $s = $pdo->prepare('SELECT * FROM orders WHERE id = ?'); $s->execute([$oid]);
      $order = $s->fetch();
      return $order;
    };
    if ($action === 'bought' && $isBuyer) {
      $ensureOrder('en_cours');
      jout(['ok' => true, 'status' => 'en_cours']);
    }
    if ($action === 'received' && $isBuyer) {
      $o = $ensureOrder('finalise');
      $pdo->prepare('UPDATE orders SET status = ? WHERE id = ?')->execute(['finalise', $o['id']]);
      // Achat livré = annonce vendue : on la retire du public.
      if ($listingId) $pdo->prepare('UPDATE listings SET sold = 1 WHERE id = ?')->execute([$listingId]);
      jout(['ok' => true, 'status' => 'finalise']);
    }
    if ($action === 'sold' && $isSeller) {
      if ($listingId) $pdo->prepare('UPDATE listings SET sold = 1 WHERE id = ? AND user_id = ?')->execute([$listingId, $u['id']]);
      $o = $ensureOrder('en_cours');
      $pdo->prepare('UPDATE orders SET seller_confirmed = 1 WHERE id = ?')->execute([$o['id']]);
      jout(['ok' => true, 'sold' => true]);
    }
    if ($action === 'cancel') {
      if ($order) $pdo->prepare('UPDATE orders SET status = ? WHERE id = ?')->execute(['annule', $order['id']]);
      if ($isSeller && $listingId) $pdo->prepare('UPDATE listings SET sold = 0 WHERE id = ? AND user_id = ?')->execute([$listingId, $u['id']]);
      jout(['ok' => true, 'status' => 'annule']);
    }
    jerr('Action invalide pour votre rôle.', 400);
  }

  // ---------- REVIEWS (à double sens : acheteur ↔ vendeur) ----------
  if ($path === 'reviews' && $method === 'GET') {
    $sellerId = $_GET['seller_id'] ?? null; $listingId = $_GET['listing_id'] ?? null;
    $targetId = $_GET['target_id'] ?? null;
    if ($targetId) {
      // Tous les avis REÇUS par cette personne (comme vendeur et comme acheteur).
      $st = $pdo->prepare('SELECT * FROM reviews WHERE target_id = ? ORDER BY created_at DESC');
      $st->execute([$targetId]);
    } elseif ($sellerId) {
      // Rétro-compat : avis reçus en tant que VENDEUR.
      $st = $pdo->prepare("SELECT * FROM reviews WHERE (target_id = ? OR (target_id IS NULL AND seller_id = ?))
        AND (kind = 'seller' OR kind IS NULL) ORDER BY created_at DESC");
      $st->execute([$sellerId, $sellerId]);
    } elseif ($listingId) {
      $st = $pdo->prepare('SELECT * FROM reviews WHERE listing_id = ? ORDER BY created_at DESC');
      $st->execute([$listingId]);
    } else jout([]);
    $rows = $st->fetchAll(); $out = [];
    foreach ($rows as $r) {
      $pn = $pdo->prepare('SELECT full_name FROM profiles WHERE id = ?'); $pn->execute([$r['reviewer_id']]);
      $out[] = [
        'id' => $r['id'], 'listingId' => $r['listing_id'], 'sellerId' => $r['seller_id'],
        'targetId' => $r['target_id'] ?: $r['seller_id'], 'kind' => $r['kind'] ?: 'seller',
        'reviewerId' => $r['reviewer_id'], 'rating' => (int) $r['rating'], 'comment' => $r['comment'] ?: null,
        'createdAt' => iso_to_ms($r['created_at']), 'reviewerName' => ($pn->fetch()['full_name'] ?? null) ?: 'Utilisateur',
      ];
    }
    jout($out);
  }

  if ($path === 'reviews' && $method === 'POST') {
    $u = require_user($pdo, $secret); $b = body();
    $listingId = $b['listingId'] ?? null;
    $kind = (($b['kind'] ?? 'seller') === 'buyer') ? 'buyer' : 'seller';
    // La cible : le vendeur (avis acheteur→vendeur) ou l'acheteur (avis vendeur→acheteur).
    $targetId = trim((string) ($b['targetId'] ?? ($b['sellerId'] ?? '')));
    if ($targetId === '' || $targetId === $u['id']) jerr('Destinataire de l’avis invalide.', 400);
    // Autorisation : la vente doit avoir été CONFIRMÉE PAR LE VENDEUR
    // (seller_confirmed = 1). C'est le seul signal qu'un acheteur ne peut PAS
    // falsifier : il peut créer et même « finaliser » lui-même une commande sur une
    // vraie annonce, mais pas la confirmer côté vendeur. Sans cette condition, un
    // acheteur pourrait poster un faux avis diffamatoire sur un vendeur qu'il a
    // seulement contacté (cohérent avec le garde-fou du cron review-invites).
    if ($listingId) {
      // Portée stricte (Le Gardien) : quand l'avis vise une ANNONCE précise, la
      // vente confirmée doit concerner CETTE annonce — pas n'importe quelle
      // commande entre les deux personnes.
      $chk = $pdo->prepare('SELECT 1 FROM order_items oi JOIN orders o ON o.id = oi.order_id
        WHERE oi.listing_id = ? AND o.seller_confirmed = 1 AND
          ((o.buyer_id = ? AND o.seller_id = ?) OR (o.seller_id = ? AND o.buyer_id = ?)) LIMIT 1');
      $chk->execute([$listingId, $u['id'], $targetId, $u['id'], $targetId]);
      if (!$chk->fetch()) jerr('Vous ne pouvez noter qu’après une vente confirmée par le vendeur pour cette annonce.', 403);
    } else {
      // Avis de profil (sans annonce) : une vente confirmée entre les deux suffit.
      $chk = $pdo->prepare('SELECT 1 FROM orders WHERE seller_confirmed = 1 AND
        ((buyer_id = ? AND seller_id = ?) OR (seller_id = ? AND buyer_id = ?)) LIMIT 1');
      $chk->execute([$u['id'], $targetId, $u['id'], $targetId]);
      if (!$chk->fetch()) jerr('Vous ne pouvez noter qu’après une vente confirmée par le vendeur.', 403);
    }
    // Un seul avis par personne notée (par annonce). Sinon on met à jour.
    $ex = $pdo->prepare('SELECT id FROM reviews WHERE reviewer_id = ? AND target_id = ? AND (listing_id = ? OR ? = \'\') LIMIT 1');
    $ex->execute([$u['id'], $targetId, $listingId, (string) $listingId]);
    $rating = max(1, min(5, (int) ($b['rating'] ?? 5)));
    $comment = $b['comment'] ?? null;
    if ($row = $ex->fetch()) {
      $pdo->prepare('UPDATE reviews SET rating = ?, comment = ?, created_at = ? WHERE id = ?')
          ->execute([$rating, $comment, now_iso(), $row['id']]);
    } else {
      $pdo->prepare('INSERT INTO reviews (id,listing_id,seller_id,target_id,kind,reviewer_id,rating,comment,created_at)
        VALUES (?,?,?,?,?,?,?,?,?)')
        ->execute([uuid(), $listingId, ($kind === 'seller' ? $targetId : ($b['sellerId'] ?? '')), $targetId, $kind, $u['id'], $rating, $comment, now_iso()]);
    }
    jout(['ok' => true]);
  }

  // ---------- PROFILES ----------
  if (count($seg) === 2 && $seg[0] === 'profile' && $method === 'GET') {
    $st = $pdo->prepare('SELECT id,full_name,bio,avatar_url FROM profiles WHERE id = ?');
    $st->execute([$seg[1]]); $p = $st->fetch();
    if (!$p) jout(null);
    $badge = badge_of($config, $pdo, ['id' => $p['id'], 'email' => '']);
    jout(['id' => $p['id'], 'fullName' => $p['full_name'] ?: 'Vendeur', 'bio' => $p['bio'] ?: null,
          'avatarUrl' => $p['avatar_url'] ?: null,
          'badge' => $badge, 'verified' => $badge !== '']);
  }

  // ---------- VÉRIFICATION DE L'ADRESSE E-MAIL ----------
  //
  // Un code à 6 chiffres, valable 15 minutes, 5 essais. C'est la condition
  // pour PUBLIER une annonce — pas pour s'inscrire, ni pour acheter, ni pour
  // écrire à un vendeur. On ne dresse un obstacle que devant l'action qui
  // engage : une annonce publiée est vue par tout le monde, et une adresse
  // jetable est ce qui permet de recommencer indéfiniment après un bannissement.
  if ($path === 'verify/email/send' && $method === 'POST') {
    $u = require_user($pdo, $secret);
    if (email_verifie($pdo, (string) $u['id'])) jout(['ok' => true, 'already' => true]);
    $email = strtolower(trim((string) $u['email']));
    // 5 envois par heure et par compte : de quoi se tromper, pas de quoi
    // transformer le site en distributeur d'e-mails.
    rate_limit($pdo, 'verify_email_send', $email, 5, 3600);
    try { $pdo->prepare('DELETE FROM email_codes WHERE email = ?')->execute([$email]); } catch (Throwable $e) {}
    try { $code = (string) random_int(100000, 999999); } catch (Throwable $e) { $code = (string) mt_rand(100000, 999999); }
    $pdo->prepare('INSERT INTO email_codes (id,email,code_hash,attempts,created_at,expires_at) VALUES (?,?,?,?,?,?)')
        ->execute([uuid(), $email, password_hash($code, PASSWORD_BCRYPT), 0, now_iso(),
                   gmdate('Y-m-d\TH:i:s\Z', time() + 900)]);
    $inner = '<h2 style="margin-top:0;color:#111827">Votre code de vérification</h2>'
      . '<p>Bonjour,</p>'
      . '<p>Voici le code qui confirme votre adresse sur Chap.ci :</p>'
      . '<p style="font-size:34px;font-weight:800;letter-spacing:10px;color:#1a1f2b;'
      . 'background:#FFF6EC;border-radius:14px;padding:18px;text-align:center;margin:18px 0">'
      . $code . '</p>'
      . '<p>Il est valable <b>15 minutes</b>. Si vous n\'avez rien demandé, ignorez ce message : '
      . 'votre compte reste inchangé et personne ne peut publier en votre nom.</p>';
    $ok = send_mail($config, $email, 'Votre code Chap.ci : ' . $code,
                    email_layout($config, $inner, 'Code de vérification'));
    log_security_event($pdo, 'verify_email_send', $email);
    // On ne dit PAS si l'envoi a échoué côté serveur de messagerie : l'écran
    // affiche la même chose dans les deux cas, et le journal garde la trace.
    jout(['ok' => true, 'sent' => $ok]);
  }

  if ($path === 'verify/email/confirm' && $method === 'POST') {
    $u = require_user($pdo, $secret);
    if (email_verifie($pdo, (string) $u['id'])) jout(['ok' => true, 'already' => true]);
    $email = strtolower(trim((string) $u['email']));
    rate_limit($pdo, 'verify_email_try', $email, 20, 3600);
    $saisi = preg_replace('/\D/', '', (string) (body()['code'] ?? ''));
    $st = $pdo->prepare('SELECT id, code_hash, attempts, expires_at FROM email_codes WHERE email = ? ORDER BY created_at DESC');
    $st->execute([$email]);
    $row = $st->fetch();
    if (!$row) jerr('Aucun code en cours. Demandez-en un nouveau.');
    if (strtotime((string) $row['expires_at']) < time()) {
      $pdo->prepare('DELETE FROM email_codes WHERE email = ?')->execute([$email]);
      jerr('Ce code a expiré. Demandez-en un nouveau.');
    }
    if ((int) $row['attempts'] >= 5) {
      $pdo->prepare('DELETE FROM email_codes WHERE email = ?')->execute([$email]);
      log_security_event($pdo, 'verify_email_fail', $email, 'trop_d_essais');
      jerr('Trop d’essais. Demandez un nouveau code.');
    }
    if ($saisi === '' || !password_verify($saisi, (string) $row['code_hash'])) {
      $pdo->prepare('UPDATE email_codes SET attempts = attempts + 1 WHERE id = ?')->execute([$row['id']]);
      log_security_event($pdo, 'verify_email_fail', $email, 'code_errone');
      jerr('Code incorrect.');
    }
    $pdo->prepare('DELETE FROM email_codes WHERE email = ?')->execute([$email]);
    $pdo->prepare('UPDATE users SET email_verified_at = ? WHERE id = ?')->execute([now_iso(), $u['id']]);
    log_security_event($pdo, 'verify_email_ok', $email);
    jout(['ok' => true, 'emailVerified' => true, 'badge' => badge_of($config, $pdo, $u)]);
  }

  // État de vérification et badge — tout est calculé, rien n'est à demander.
  if ($path === 'verify/status' && $method === 'GET') {
    $u = require_user($pdo, $secret);
    $st = $pdo->prepare('SELECT created_at, email_verified_at FROM users WHERE id = ?');
    $st->execute([$u['id']]);
    $r = $st->fetch() ?: [];
    $mois = (time() - (int) strtotime((string) ($r['created_at'] ?? now_iso()))) / (30.44 * 86400);
    jout([
      'emailVerified' => !empty($r['email_verified_at']),
      'badge'         => badge_of($config, $pdo, $u),
      'mois'          => (int) floor(max(0, $mois)),
      // Nombre de mois restants avant le badge vert — de quoi l'annoncer sans
      // le promettre au jour près.
      'moisRestants'  => max(0, (int) ceil(6 - $mois)),
      'membreDepuis'  => iso_to_ms($r['created_at'] ?? null),
    ]);
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

  // ---------- SUIVI DES VISITES (analytics) ----------
  // Public : le front enregistre une vue de page (visiteur anonyme).
  if ($path === 'track' && $method === 'POST') {
    $b = body();
    $vid = substr(trim((string) ($b['vid'] ?? '')), 0, 40) ?: 'anon';
    // Anti-flood léger : au-delà de 300 visites/heure pour un même visiteur, on
    // ignore silencieusement (le suivi n'est pas critique — on protège le disque).
    try {
      $since = gmdate('Y-m-d\TH:i:s\Z', time() - 3600);
      $cc = $pdo->prepare('SELECT COUNT(*) FROM visits WHERE visitor_id = ? AND created_at >= ?');
      $cc->execute([$vid, $since]);
      if ((int) $cc->fetchColumn() >= 300) jout(['ok' => true]);
    } catch (Throwable $e) { /* en cas d'erreur DB, ne pas bloquer */ }
    $p   = substr(trim((string) ($b['path'] ?? '')), 0, 200) ?: '/';
    $ref = substr(trim((string) ($b['ref'] ?? '')), 0, 200);
    // Connecté ou non ? On tranche d'abord CÔTÉ SERVEUR, à partir de la session :
    // sur le web, sendBeacon envoie le cookie HttpOnly (même origine). Repli sur le
    // drapeau du client pour l'app native, où la requête part d'une autre origine
    // et n'emporte pas le cookie. Ce drapeau n'ouvre aucun droit : au pire, une
    // statistique de fréquentation est légèrement faussée.
    $authed = current_user($pdo, $secret) ? 1 : (!empty($b['auth']) ? 1 : 0);
    $pdo->prepare('INSERT INTO visits (id,visitor_id,path,referrer,authed,created_at) VALUES (?,?,?,?,?,?)')
        ->execute([uuid(), $vid, $p, $ref ?: null, $authed, now_iso()]);
    jout(['ok' => true]);
  }

  // ---------- NEWSLETTER ----------
  // Inscription publique : n'importe quel visiteur peut s'abonner.
  if ($path === 'newsletter' && $method === 'POST') {
    $b = body();
    $email = strtolower(trim($b['email'] ?? ''));
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) jerr('Adresse email invalide.');
    // Anti-spam (P22) : max 5 inscriptions par IP/email et par heure — empêche
    // d'inscrire en masse des adresses de tiers et de déclencher des emails.
    rate_limit($pdo, 'newsletter', $email, 5, 3600);
    $ex = $pdo->prepare('SELECT id FROM newsletter WHERE email = ?'); $ex->execute([$email]);
    if (!$ex->fetch()) {
      $pdo->prepare('INSERT INTO newsletter (id,email,created_at) VALUES (?,?,?)')
          ->execute([uuid(), $email, now_iso()]);
      log_security_event($pdo, 'newsletter', $email); // compteur anti-spam
      send_newsletter_email($config, $email); // confirmation (best-effort)
    }
    jout(['ok' => true]); // idempotent : déjà inscrit = succès aussi
  }

  // Formulaire de contact : enregistre le message ET l'envoie à contact@chap.ci.
  // ---- Écran publicitaire (pubs payantes, ouvertes aux non-inscrits) --------

  // Tarif applicable au visiteur : plein tarif par défaut ; MOITIÉ PRIX pour un
  // membre « actif » (compte d'au moins 30 jours ET au moins une annonce active).
  if ($path === 'ads/tarif' && $method === 'GET') {
    jout(ad_tariff($pdo, current_user($pdo, $secret)));
  }

  // Dépôt d'une demande de pub — SANS compte requis. Le prix est recalculé côté
  // serveur (le client ne fixe jamais le montant). Statut « pending » jusqu'à
  // validation par l'admin (après réception du paiement Mobile Money).
  if ($path === 'ads' && $method === 'POST') {
    $b = body();
    // Pot de miel anti-robot.
    if (trim((string) ($b['website'] ?? '')) !== '') jout(['ok' => true]);
    $u = current_user($pdo, $secret);
    // Anti-spam : 5 demandes max par IP (ou compte) et par heure.
    rate_limit($pdo, 'ad_submit', $u['email'] ?? null, 5, 3600);
    // Titre FACULTATIF : on peut publier une pub « image seule » (sans message).
    $title = mb_substr(trim((string) ($b['title'] ?? '')), 0, 80);
    $desc  = mb_substr(trim((string) ($b['description'] ?? '')), 0, 600);
    $link  = trim((string) ($b['link'] ?? ''));
    // Lien facultatif : http(s) uniquement (pas de javascript: ni autre schéma).
    if ($link !== '' && (!preg_match('#^https?://#i', $link) || strlen($link) > 300)) {
      jerr('Le lien doit commencer par https:// (300 caractères maximum).');
    }
    // 1 à 3 visuels (data URI compressés côté client, sauvés en fichiers).
    $images = [];
    foreach (array_slice((array) ($b['images'] ?? []), 0, 3) as $img) {
      $url = save_data_uri($config, (string) $img, false);
      if ($url) $images[] = $url;
    }
    if (!$images) jerr('Ajoutez au moins un visuel pour votre bannière.');
    $formule = in_array($b['formule'] ?? '', ['day', 'week', 'month'], true) ? $b['formule'] : 'week';
    $qty = max(1, min(31, (int) ($b['qty'] ?? 1)));
    $method_ = in_array($b['payMethod'] ?? '', ['orange', 'wave'], true) ? $b['payMethod'] : 'orange';
    $payNum = preg_replace('/[^0-9+ ]/', '', (string) ($b['payNumber'] ?? ''));
    if (strlen(preg_replace('/\D/', '', $payNum)) < 8) jerr('Indiquez le numéro Mobile Money qui a effectué le paiement.');
    // Contact de l'annonceur : e-mail OBLIGATOIRE (sert aux notifications de statut).
    $email = strtolower(trim((string) ($b['email'] ?? ($u['email'] ?? ''))));
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) jerr('Indiquez un e-mail valide pour recevoir le statut de votre publicité.');
    $phone = mb_substr(preg_replace('/[^0-9+ ]/', '', (string) ($b['phone'] ?? '')), 0, 20);
    // Options d'animation du texte (mêmes réglages que le compositeur admin).
    $style = in_array($b['style'] ?? '', ['classique', 'neon', 'script', 'impact', 'ivoire'], true) ? $b['style'] : 'classique';
    $anims = [];
    foreach ((array) ($b['anims'] ?? []) as $a) { $a = (string) $a; if (preg_match('/^[a-z0-9-]{2,24}$/', $a)) $anims[] = $a; }
    $anims = array_slice(array_values(array_unique($anims)), 0, 20);
    if (!$anims) $anims = ['fondu'];
    $anim  = $anims[0];
    $gap   = (string) max(5, min(60, (int) ($b['gap'] ?? 8)));
    $loop  = array_key_exists('loop', $b) ? (!empty($b['loop']) ? '1' : '0') : '1';
    $tcol  = is_string($b['textColor'] ?? null) && preg_match('/^#[0-9a-fA-F]{3,8}$/', $b['textColor']) ? strtoupper($b['textColor']) : '';
    $tariff = ad_tariff($pdo, $u);
    $price  = $tariff['prices'][$formule] * $qty;
    $id = uuid();
    // Prolongation d'une bannière EN COURS uniquement : on vérifie que la pub
    // visée existe, qu'elle est active et qu'elle n'est pas déjà finie. Sans
    // cette vérification, n'importe qui pourrait rallonger la campagne d'un
    // autre en devinant un identifiant.
    $prolonge = null;
    $cible = trim((string) ($b['extends'] ?? ''));
    if ($cible !== '') {
      $q = $pdo->prepare("SELECT id, email, user_id FROM ads WHERE id = ? AND status = 'active' AND expires_at > ?");
      $q->execute([$cible, now_iso()]);
      $src = $q->fetch();
      if (!$src) jerr('Cette publicité n’est plus en cours : elle ne peut pas être prolongée.');
      $memeCompte = !empty($u['id']) && (string) $src['user_id'] === (string) $u['id'];
      $memeEmail  = strtolower((string) $src['email']) === $email;
      if (!$memeCompte && !$memeEmail) jerr('Cette publicité ne vous appartient pas.', 403);
      $prolonge = (string) $src['id'];
    }
    $pdo->prepare('INSERT INTO ads (id,user_id,title,description,link,images,formule,qty,price,pay_method,pay_number,status,starts_at,expires_at,ip,created_at,email,phone,style,anim,anim_loop,anims,anim_gap,text_color,extends_ad_id)
                   VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)')
        ->execute([$id, $u['id'] ?? null, $title, $desc, $link, json_encode($images), $formule, $qty,
                   $price, $method_, mb_substr($payNum, 0, 20), 'pending', null, null, client_ip(), now_iso(), $email, $phone,
                   $style, $anim, $loop, json_encode($anims), $gap, $tcol, $prolonge]);
    log_security_event($pdo, 'ad_submit', $u['email'] ?? null); // compteur anti-spam
    // Notification « reçue, en attente de validation » à l'annonceur.
    send_ad_status_email($config, ['id' => $id, 'email' => $email, 'title' => $title, 'price' => $price], 'pending', $pdo);
    jout(['ok' => true, 'id' => $id, 'price' => $price, 'member' => $tariff['member']]);
  }

  // Mes publicités (titulaire de compte) : historique, coût, performance.
  // Un annonceur sans compte suit la sienne par le lien reçu par e-mail ;
  // celui qui a un compte retrouve TOUTES les siennes, y compris les anciennes.
  if ($path === 'ads/mine' && $method === 'GET') {
    $u = require_user($pdo, $secret);
    // On retrouve aussi les publicités payées SANS être connecté : le formulaire
    // est ouvert à tous, et l'annonceur y saisit son e-mail. Sans ce second
    // critère, quelqu'un qui a un compte mais a commandé en visiteur ne verrait
    // rien ici — et conclurait, à juste titre, que Chap.ci a perdu sa campagne.
    $st = $pdo->prepare('SELECT id,title,description,images,formule,qty,price,status,starts_at,expires_at,created_at,reject_reason
                         FROM ads WHERE user_id = ? OR LOWER(email) = ? ORDER BY created_at DESC LIMIT 100');
    $st->execute([$u['id'], strtolower((string) ($u['email'] ?? ''))]);
    $out = [];
    $totalDepense = 0; $totalVues = 0; $totalClics = 0;
    foreach ($st->fetchAll() as $a) {
      $aud = ad_audience($pdo, (string) $a['id']);
      // Le coût ne compte que si la publicité a réellement été diffusée : une
      // demande refusée, ou en attente de paiement, n'est pas une dépense.
      // 'merged' EN FAIT PARTIE : c'est une prolongation payée, fondue dans la
      // bannière d'origine. L'oublier faisait afficher 2 000 F à quelqu'un qui
      // en avait versé 6 000 — il l'aurait vu avant nous.
      if (in_array($a['status'], ['active', 'expired', 'merged'], true)) $totalDepense += (int) $a['price'];
      $totalVues += $aud['views']; $totalClics += $aud['clicks'];
      $out[] = [
        'id' => $a['id'], 'title' => $a['title'], 'description' => $a['description'],
        'images' => json_decode((string) $a['images'], true) ?: [],
        'formule' => $a['formule'], 'qty' => (int) $a['qty'], 'price' => (int) $a['price'],
        'status' => $a['status'], 'rejectReason' => $a['reject_reason'] ?? '',
        'createdAt' => iso_to_ms($a['created_at'] ?? null),
        'startsAt' => iso_to_ms($a['starts_at'] ?? null),
        'expiresAt' => iso_to_ms($a['expires_at'] ?? null),
        'views' => $aud['views'], 'clicks' => $aud['clicks'], 'ctr' => $aud['ctr'],
      ];
    }
    // Courbe consolidée : toutes ses publicités confondues, 30 derniers jours.
    $courbe = [];
    try {
      $c = $pdo->prepare('SELECT s.day, SUM(s.views) v, SUM(s.clicks) c
                          FROM ad_stats s JOIN ads a ON a.id = s.ad_id
                          WHERE a.user_id = ? OR LOWER(a.email) = ? GROUP BY s.day ORDER BY s.day DESC LIMIT 30');
      $c->execute([$u['id'], strtolower((string) ($u['email'] ?? ''))]);
      $courbe = array_reverse($c->fetchAll(PDO::FETCH_ASSOC));
    } catch (Throwable $e) { $courbe = []; }
    jout([
      'ads' => $out,
      'total' => [
        'depense' => $totalDepense, 'vues' => $totalVues, 'clics' => $totalClics,
        'ctr' => $totalVues > 0 ? round($totalClics / $totalVues * 100, 1) : 0,
        'cpv' => $totalVues > 0 ? round($totalDepense / $totalVues, 1) : 0, // coût pour 1 affichage
      ],
      'courbe' => $courbe,
    ]);
  }

  // ---- MESURE D'AUDIENCE DES PUBLICITES --------------------------------------
  // Deux routes publiques : un affichage compte une VUE, un appui sur le bouton
  // compte un CLIC. Sans elles, impossible de rendre le moindre compte à un
  // annonceur — et c'est bien ce qu'on lui vend.
  //
  // Trois garde-fous, parce qu'une route publique qui écrit en base est une
  // invitation :
  //  1. l'identifiant doit correspondre à une publicité ACTIVE — sinon on
  //     laisserait n'importe qui créer des lignes à volonté ;
  //  2. les compteurs sont agrégés par jour, pas un événement par vue : la
  //     table reste minuscule quel que soit le trafic ;
  //  3. une limite par IP empêche de gonfler artificiellement les chiffres
  //     d'un annonceur — les siens comme ceux d'un concurrent.
  if (count($seg) === 3 && $seg[0] === 'ads' && in_array($seg[2], ['view', 'click'], true) && $method === 'POST') {
    $adId = $seg[1];
    $chk = $pdo->prepare("SELECT 1 FROM ads WHERE id = ? AND status = 'active'");
    $chk->execute([$adId]);
    if (!$chk->fetch()) jout(['ok' => true]);        // pub inconnue ou inactive : on ignore, sans rien dire
    rate_limit($pdo, 'ad_' . $seg[2], null, $seg[2] === 'view' ? 400 : 60, 3600);
    $col = $seg[2] === 'view' ? 'views' : 'clicks';
    $day = gmdate('Y-m-d');
    try {
      $up = $pdo->prepare("UPDATE ad_stats SET $col = $col + 1 WHERE ad_id = ? AND day = ?");
      $up->execute([$adId, $day]);
      if ($up->rowCount() === 0) {
        $pdo->prepare('INSERT INTO ad_stats (ad_id,day,views,clicks) VALUES (?,?,?,?)')
            ->execute([$adId, $day, $col === 'views' ? 1 : 0, $col === 'clicks' ? 1 : 0]);
      }
    } catch (Throwable $e) { /* une statistique perdue ne casse jamais une page */ }
    jout(['ok' => true]);
  }

  // Chiffres d'une publicité : ce que SON annonceur voit sur /pub/:id.
  //
  // Réservé au propriétaire (ou à un administrateur). Ces chiffres ne sont pas
  // publics : les laisser ouverts revenait à publier l'audience de chaque
  // annonceur — lisible par son concurrent — et à afficher le trafic réel du
  // site sur une page indexable. L'annonceur SANS compte, lui, reçoit les
  // mêmes chiffres par e-mail tous les 3 jours : il n'a rien à consulter ici.
  if (count($seg) === 3 && $seg[0] === 'ads' && $seg[2] === 'stats' && $method === 'GET') {
    $st = $pdo->prepare('SELECT id,title,status,starts_at,expires_at,formule,qty,user_id,email FROM ads WHERE id = ?');
    $st->execute([$seg[1]]);
    $ad = $st->fetch();
    if (!$ad) jerr('Publicité introuvable.', 404);
    $u = current_user($pdo, $secret);
    $sien = $u && (
      ((string) ($ad['user_id'] ?? '') !== '' && (string) $ad['user_id'] === (string) $u['id'])
      || strtolower((string) ($ad['email'] ?? '')) === strtolower((string) ($u['email'] ?? ''))
      || is_admin($config, $pdo, $u)
    );
    if (!$sien) jerr('Ces statistiques ne sont visibles que par l’annonceur.', 403);
    $a = ad_audience($pdo, (string) $ad['id']);
    // Courbe des 14 derniers jours, pour que l'annonceur voie l'évolution.
    $par = $pdo->prepare('SELECT day, views, clicks FROM ad_stats WHERE ad_id = ? ORDER BY day DESC LIMIT 14');
    $par->execute([$seg[1]]);
    jout([
      'id'        => $ad['id'],
      'title'     => $ad['title'],
      'status'    => $ad['status'],
      'startsAt'  => iso_to_ms($ad['starts_at'] ?? null),
      'expiresAt' => iso_to_ms($ad['expires_at'] ?? null),
      'views'     => $a['views'],
      'clicks'    => $a['clicks'],
      'ctr'       => $a['ctr'],
      'parJour'   => array_reverse($par->fetchAll(PDO::FETCH_ASSOC)),
    ]);
  }

  // Pubs actives (écran publicitaire de l'accueil). Le mélange se fait côté client.
  if ($path === 'ads/active' && $method === 'GET') {
    $st = $pdo->prepare("SELECT id,title,description,link,images,kind,style,anim,anim_loop,anims,anim_gap,text_color FROM ads
      WHERE status = 'active' AND expires_at > ? ORDER BY created_at DESC LIMIT 50");
    $st->execute([now_iso()]);
    jout(array_map(fn($r) => [
      'id' => $r['id'], 'title' => $r['title'], 'description' => (string) $r['description'],
      'link' => $r['link'] ?: null, 'images' => json_decode((string) $r['images'], true) ?: [],
      'kind' => $r['kind'] ?: 'paid', 'style' => $r['style'] ?: null, 'anim' => $r['anim'] ?: null,
      'animLoop' => (($r['anim_loop'] ?? '') === '0') ? false : true,
      'anims' => (($a = json_decode((string) ($r['anims'] ?? ''), true)) && is_array($a) && $a) ? $a : ($r['anim'] ? [$r['anim']] : []),
      'animGap' => ((int) ($r['anim_gap'] ?? 0)) ?: 8,
      'textColor' => ($r['text_color'] ?? '') !== '' ? $r['text_color'] : null,
    ], $st->fetchAll()));
  }

  // Page de détail d'une pub (clic sans lien externe) : uniquement les actives.
  if (count($seg) === 2 && $seg[0] === 'ads' && $method === 'GET' && !in_array($seg[1], ['tarif', 'active'], true)) {
    $st = $pdo->prepare("SELECT * FROM ads WHERE id = ? AND status = 'active' AND expires_at > ?");
    $st->execute([$seg[1], now_iso()]);
    $r = $st->fetch();
    if (!$r) jerr('Publicité introuvable ou expirée.', 404);
    // Les réglages du texte (style, animations, couleur) sont renvoyés ici comme
    // ils le sont déjà sur /ads/active : ils servent à la PROLONGATION, qui
    // repart de la bannière existante au lieu de la faire refaire.
    jout([
      'id' => $r['id'], 'title' => $r['title'], 'description' => (string) $r['description'],
      'link' => $r['link'] ?: null, 'images' => json_decode((string) $r['images'], true) ?: [],
      'style' => $r['style'] ?: null, 'anim' => $r['anim'] ?: null,
      'animLoop' => (($r['anim_loop'] ?? '') === '0') ? false : true,
      'anims' => (($a = json_decode((string) ($r['anims'] ?? ''), true)) && is_array($a) && $a) ? $a : ($r['anim'] ? [$r['anim']] : []),
      'animGap' => ((int) ($r['anim_gap'] ?? 0)) ?: 8,
      'textColor' => ($r['text_color'] ?? '') !== '' ? $r['text_color'] : null,
      'expiresAt' => iso_to_ms($r['expires_at']),
    ]);
  }

  if ($path === 'contact' && $method === 'POST') {
    $b = body();
    $name    = trim((string) ($b['name'] ?? ''));
    $email   = strtolower(trim((string) ($b['email'] ?? '')));
    $subject = trim((string) ($b['subject'] ?? '')) ?: 'Message';
    $message = trim((string) ($b['message'] ?? ''));
    // Pot de miel anti-robot : ce champ caché doit rester vide. Rempli = bot :
    // on répond « ok » sans rien faire (ni stockage, ni email).
    if (trim((string) ($b['company'] ?? '')) !== '') jout(['ok' => true]);
    if ($message === '') jerr('Votre message est vide.');
    // Validation stricte : FILTER_VALIDATE_EMAIL accepte '?', '&', '=' et '%' dans
    // la partie locale — on les refuse pour bloquer l'injection de paramètres
    // mailto (cc/bcc/body) dans le bouton « Répondre » de l'admin (CWE-88).
    if ($email !== '' && (!filter_var($email, FILTER_VALIDATE_EMAIL) || preg_match('/[?&=%\s"()<>,;:\\\\]/', $email))) jerr('Adresse email invalide.');
    // Anti-spam : max 5 messages par IP/email et par heure (empêche l'abus du
    // formulaire pour envoyer des emails en masse).
    rate_limit($pdo, 'contact', $email ?: null, 5, 3600);
    // Bornage des longueurs.
    $name = mb_substr($name, 0, 120);
    $subject = mb_substr($subject, 0, 160);
    $message = mb_substr($message, 0, 5000);
    // 1) Copie en base : rien n'est perdu, même si l'email échoue.
    try {
      $pdo->prepare('INSERT INTO contact_messages (id,name,email,subject,message,ip,handled,created_at) VALUES (?,?,?,?,?,?,?,?)')
          ->execute([uuid(), $name, $email, $subject, $message, client_ip(), 0, now_iso()]);
    } catch (Throwable $e) { /* ne bloque pas l'envoi email */ }
    log_security_event($pdo, 'contact', $email ?: null); // compteur anti-spam
    // 2) Notification email vers contact@chap.ci (+ admins), réponse dirigée vers
    //    l'expéditeur. Best-effort : l'échec d'envoi ne perd pas le message (stocké).
    $to = array_values(array_unique(array_filter(array_merge(
      report_recipients($config),
      [$config['mail_reply_to'] ?? 'contact@chap.ci'],
    ))));
    $safe = fn(string $s) => htmlspecialchars($s, ENT_QUOTES, 'UTF-8');
    $html = '<p><b>Nouveau message de contact — Chap.ci</b></p>'
          . '<p><b>Nom :</b> ' . $safe($name ?: '—') . '<br>'
          . '<b>Email :</b> ' . $safe($email ?: '—') . '<br>'
          . '<b>Sujet :</b> ' . $safe($subject) . '</p>'
          . '<hr><p style="white-space:pre-wrap">' . nl2br($safe($message)) . '</p>';
    $delivered = false;
    foreach ($to as $addr) {
      if (send_mail($config, $addr, '[Contact] ' . $subject, $html, null, $email ?: null)) $delivered = true;
    }
    jout(['ok' => true, 'delivered' => $delivered]);
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
    if (!admin_can($config, $pdo, $u, 'newsletter')) jerr('Accès réservé à l’administrateur.', 403);
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
    if ($path === 'admin/check') {
      $email = strtolower((string) ($u['email'] ?? ''));
      $owner = in_array($email, owner_emails($config), true);
      jout([
        'admin'       => $userIsAdmin,
        'owner'       => $owner,
        // Propriétaire = tout ('*'). Modérateur = ses fonctionnalités cochées.
        'permissions' => $owner ? ['*'] : ($userIsAdmin ? admin_permissions_for($pdo, $email) : []),
      ]);
    }
    if (!$userIsAdmin) jerr('Accès réservé à l’administrateur.', 403);

    // ---- 2ᵉ serrure : code d'accès du tableau de bord ----------------------
    // Être admin ne suffit pas : il faut aussi DÉVERROUILLER avec le code d'accès
    // (stocké côté serveur, remis par l'admin principal). Les routes ci-dessous
    // sont exemptées (sinon on ne pourrait jamais déverrouiller).
    if ($path === 'admin/unlock/status' && $method === 'GET') {
      jout(['unlocked' => admin_unlocked($config, $pdo, $secret, $u)]);
    }
    if ($path === 'admin/unlock' && $method === 'POST') {
      $b = body();
      // Anti-force brute sur le code : 8 essais / 15 min par IP+email.
      rate_limit($pdo, 'admin_unlock_fail', (string) ($u['email'] ?? ''), 8, 900);
      $code  = strtoupper(trim((string) ($b['code'] ?? '')));
      $email = strtolower((string) ($u['email'] ?? ''));
      $ok = false; $persistent = false; $maxAge = 60 * 60 * 12; // propriétaire : 12 h
      if (in_array($email, owner_emails($config), true)) {
        // PROPRIÉTAIRE : code à usage unique expirant (reçu par email). Fini le code fixe.
        $ok = admin_otp_valid($config, $code);
      } else {
        // MODÉRATEUR : son code personnel + doit ne pas être bloqué. Accès PERMANENT
        // (jeton long, 30 j) jusqu'à ce que l'admin le bloque.
        $st = $pdo->prepare('SELECT access_code_hash, blocked FROM admins WHERE email = ?'); $st->execute([$email]);
        $row = $st->fetch();
        if ($row && (int) ($row['blocked'] ?? 0) === 1) {
          log_security_event($pdo, 'admin_unlock_blocked', $u['email'] ?? null);
          jerr('Votre accès a été bloqué par l’administrateur.', 403);
        }
        $h = (string) ($row['access_code_hash'] ?? '');
        $ok = $code !== '' && $h !== '' && password_verify($code, $h);
        $persistent = true; $maxAge = 60 * 60 * 24 * 30; // 30 jours
      }
      if (!$ok) {
        log_security_event($pdo, 'admin_unlock_fail', $u['email'] ?? null);
        jerr('Code d’accès incorrect ou expiré.', 401);
      }
      log_security_event($pdo, 'admin_unlock_ok', $u['email'] ?? null);
      $tok = jwt_sign(['sub' => $u['id'], 'au' => 1, 'exp' => time() + $maxAge], $secret);
      set_admin_unlock_cookie($config, $tok, $maxAge);
      jout(['ok' => true, 'token' => $tok, 'persistent' => $persistent]);
    }
    if ($path === 'admin/unlock/email' && $method === 'POST') {
      // Réservé au PROPRIÉTAIRE (un modérateur reçoit son code de l'admin principal).
      if (!in_array(strtolower((string) ($u['email'] ?? '')), owner_emails($config), true)) {
        jout(['ok' => false, 'message' => 'Votre code d’accès vous est remis par l’administrateur principal.']);
      }
      rate_limit($pdo, 'admin_code_email', (string) ($u['email'] ?? ''), 6, 3600);
      // Génère un code À USAGE UNIQUE qui EXPIRE (60 s) et l'envoie par email.
      $code = admin_otp_generate($config);
      $ttl  = admin_otp_ttl($config);
      $html = '<p>Bonjour,</p><p>Votre <b>code d’accès au tableau de bord</b> Chap.ci :</p>'
            . '<p style="font-size:28px;font-weight:bold;letter-spacing:8px;font-family:monospace">' . htmlspecialchars($code) . '</p>'
            . '<p>⏱️ Ce code <b>expire dans ' . $ttl . ' secondes</b> et ne sert <b>qu’une seule fois</b>. '
            . 'Saisissez-le tout de suite. S’il a expiré, cliquez à nouveau sur « Recevoir le code ». '
            . 'Si vous n’êtes pas à l’origine de cette demande, ignorez cet email.</p>';
      $sent = 0;
      // Envoi au propriétaire ET à l'adresse de rapport (contact@chap.ci).
      foreach (security_notify_recipients($config) as $to) { if (send_mail($config, $to, 'Chap.ci — code d’accès (expire dans 1 min)', $html)) $sent++; }
      log_security_event($pdo, 'admin_code_emailed', $u['email'] ?? null);
      jout(['ok' => true, 'sent' => $sent]);
    }
    // Toute autre route admin exige une session DÉVERROUILLÉE.
    if (!admin_unlocked($config, $pdo, $secret, $u)) {
      jout(['error' => 'Tableau de bord verrouillé. Entrez le code d’accès administrateur.', 'locked' => true], 423);
    }

    // 3ᵉ contrôle : permissions fines. Le propriétaire a tout ; un modérateur n'a
    // accès qu'aux fonctionnalités que l'admin lui a cochées (le reste = 403).
    if (!admin_can($config, $pdo, $u, admin_feature_for_path($path))) {
      jerr('Cette section n’est pas autorisée pour votre compte.', 403);
    }

    // Sauvegarde immédiate : télécharge un export JSON complet de la base.
    if ($path === 'admin/backup' && $method === 'GET') {
      $dump = export_all($pdo);
      $json = json_encode($dump, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
      $file = 'chapci-' . gmdate('Y-m-d-His') . '.json';
      header('Content-Type: application/json; charset=utf-8');
      header('Content-Disposition: attachment; filename="' . $file . '"');
      header('Content-Length: ' . strlen($json));
      echo $json; exit;
    }
    // Liste des sauvegardes automatiques présentes sur le serveur.
    if ($path === 'admin/backups' && $method === 'GET') {
      $dir = __DIR__ . '/backups';
      $files = is_dir($dir) ? (glob($dir . '/chapci-*.json') ?: []) : [];
      rsort($files);
      $out = array_map(fn($f) => [
        'file' => basename($f), 'bytes' => (int) @filesize($f), 'at' => iso_to_ms(gmdate('Y-m-d\TH:i:s\Z', (int) @filemtime($f))),
      ], $files);
      jout(['cronKey' => $config['cron_key'] ?? '', 'site' => rtrim($config['site_url'] ?? 'https://chap.ci', '/'), 'backups' => $out]);
    }

    // ----- Jetons de service « modération auto » (propriétaire uniquement) -----
    // Liste des jetons (métadonnées seulement — jamais le secret, qui n'est
    // montré qu'une fois à la création).
    if ($path === 'admin/service-tokens' && $method === 'GET') {
      $rows = $pdo->query('SELECT id,label,scope,prefix,created_at,last_used_at,uses,revoked_at FROM service_tokens ORDER BY created_at DESC')->fetchAll();
      jout([
        'site' => rtrim($config['site_url'] ?? 'https://chap.ci', '/'),
        'tokens' => array_map(fn($t) => [
          'id' => $t['id'], 'label' => $t['label'] ?: 'Modération', 'scope' => $t['scope'],
          'prefix' => $t['prefix'], 'createdAt' => iso_to_ms($t['created_at']),
          'lastUsedAt' => $t['last_used_at'] ? iso_to_ms($t['last_used_at']) : null,
          'uses' => (int) ($t['uses'] ?? 0), 'revoked' => !empty($t['revoked_at']),
        ], $rows),
      ]);
    }
    // Émettre un NOUVEAU jeton (scope 'moderation'). Le secret n'est renvoyé
    // qu'ICI, une seule fois. Option {rotate:true} → révoque d'abord les jetons
    // 'moderation' encore actifs (rotation propre).
    if ($path === 'admin/service-tokens' && $method === 'POST') {
      $b = body();
      $label = mb_substr(trim((string) ($b['label'] ?? 'Le Gardien — modération')), 0, 60) ?: 'Le Gardien — modération';
      $scope = 'moderation'; // seul périmètre exposé pour l'instant
      if (!empty($b['rotate'])) {
        $pdo->prepare('UPDATE service_tokens SET revoked_at = ? WHERE scope = ? AND revoked_at IS NULL')->execute([now_iso(), $scope]);
      }
      $raw  = 'cmst_' . bin2hex(random_bytes(30)); // 65 caractères, imprédictible
      $pdo->prepare('INSERT INTO service_tokens (id,label,scope,token_hash,prefix,created_at,last_used_at,uses,revoked_at) VALUES (?,?,?,?,?,?,?,?,?)')
          ->execute([uuid(), $label, $scope, service_token_hash($raw), mb_substr($raw, 0, 12), now_iso(), null, 0, null]);
      log_security_event($pdo, 'service_token_created', $u['email'] ?? null, $scope);
      jout(['token' => $raw, 'scope' => $scope, 'label' => $label]); // secret montré une seule fois
    }
    // Révoquer un jeton (irréversible : il faut en émettre un nouveau ensuite).
    if (count($seg) === 4 && $seg[1] === 'service-tokens' && $seg[3] === 'revoke' && $method === 'POST') {
      $pdo->prepare('UPDATE service_tokens SET revoked_at = ? WHERE id = ? AND revoked_at IS NULL')->execute([now_iso(), $seg[2]]);
      log_security_event($pdo, 'service_token_revoked', $u['email'] ?? null, $seg[2]);
      jout(['ok' => true]);
    }
    // Journal d'audit des actions de modération automatique (100 dernières).
    if ($path === 'admin/mod-audit' && $method === 'GET') {
      $rows = $pdo->query("SELECT m.id, m.action, m.listing_id, m.reason, m.confidence, m.created_at, l.title AS listing_title
        FROM mod_actions m LEFT JOIN listings l ON l.id = m.listing_id
        ORDER BY m.created_at DESC LIMIT 100")->fetchAll();
      jout(['entries' => array_map(fn($r) => [
        'id' => $r['id'], 'action' => $r['action'], 'listingId' => $r['listing_id'],
        'listingTitle' => $r['listing_title'] ?? null, 'reason' => $r['reason'],
        'confidence' => $r['confidence'], 'at' => iso_to_ms($r['created_at']),
      ], $rows)]);
    }

    // Télécharge une sauvegarde automatique précise (nom de fichier sécurisé).
    if ($path === 'admin/backup/download' && $method === 'GET') {
      $file = basename((string) ($_GET['file'] ?? ''));
      if (!preg_match('/^chapci-[0-9\-]+\.json$/', $file)) jerr('Nom de fichier invalide.', 400);
      $full = __DIR__ . '/backups/' . $file;
      if (!is_file($full)) jerr('Sauvegarde introuvable.', 404);
      header('Content-Type: application/json; charset=utf-8');
      header('Content-Disposition: attachment; filename="' . $file . '"');
      header('Content-Length: ' . (string) filesize($full));
      readfile($full); exit;
    }

    // Réinitialisation : efface les données de test pour repartir à zéro.
    // Une SAUVEGARDE automatique est créée avant toute suppression (filet de
    // sécurité). Exige une confirmation explicite (« EFFACER »).
    if ($path === 'admin/reset' && $method === 'POST') {
      $b = body();
      if (trim((string) ($b['confirm'] ?? '')) !== 'EFFACER') jerr('Confirmation requise (tapez EFFACER).', 400);
      $withAccounts = !empty($b['accounts']);
      // 1) Sauvegarde de sécurité avant purge.
      $dir = __DIR__ . '/backups';
      if (!is_dir($dir)) @mkdir($dir, 0700, true);
      $backupFile = null;
      if (is_dir($dir) && is_writable($dir)) {
        if (!is_file($dir . '/.htaccess')) @file_put_contents($dir . '/.htaccess', "Require all denied\nDeny from all\n");
        $dump = export_all($pdo);
        $backupFile = 'chapci-avant-reset-' . gmdate('Y-m-d-His') . '.json';
        @file_put_contents($dir . '/' . $backupFile, json_encode($dump, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
      }
      // 2) Purge du catalogue + transactions + analytics (toujours).
      $wipe = ['order_items', 'orders', 'messages', 'conversations', 'reviews', 'reports',
               'user_interests', 'saved_searches', 'visits', 'listings'];
      $deleted = [];
      foreach ($wipe as $t) {
        try { $before = (int) $pdo->query("SELECT COUNT(*) AS c FROM $t")->fetch()['c']; $pdo->exec("DELETE FROM $t"); $deleted[$t] = $before; }
        catch (Throwable $e) { $deleted[$t] = 0; }
      }
      // 3) Comptes de test : on garde les administrateurs (config + table admins)
      //    et l'administrateur connecté. Le reste (comptes + profils + newsletter) est effacé.
      if ($withAccounts) {
        $keep = owner_emails($config);
        foreach ($pdo->query('SELECT email FROM admins')->fetchAll() as $a) $keep[] = strtolower($a['email']);
        $keep[] = strtolower($u['email'] ?? '');
        $keep = array_values(array_unique(array_filter($keep)));
        $ph = $keep ? implode(',', array_fill(0, count($keep), '?')) : "''";
        try {
          // Profils des comptes supprimés.
          $ids = $pdo->prepare("SELECT id FROM users WHERE LOWER(email) NOT IN ($ph)");
          $ids->execute($keep); $delIds = array_column($ids->fetchAll(), 'id');
          $cntU = 0;
          foreach ($delIds as $did) {
            $pdo->prepare('DELETE FROM profiles WHERE id = ?')->execute([$did]);
            $pdo->prepare('DELETE FROM users WHERE id = ?')->execute([$did]); $cntU++;
          }
          $deleted['users'] = $cntU;
          $before = (int) $pdo->query('SELECT COUNT(*) AS c FROM newsletter')->fetch()['c'];
          $pdo->exec('DELETE FROM newsletter'); $deleted['newsletter'] = $before;
        } catch (Throwable $e) { /* ignore */ }
      }
      jout(['ok' => true, 'deleted' => $deleted, 'backup' => $backupFile, 'accounts' => $withAccounts]);
    }

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
        fn($r) => ['id' => $r['id'], 'email' => $r['email'], 'fullName' => $r['full_name'] ?: '—',
                   'status' => $r['status'] ?: 'active', 'createdAt' => iso_to_ms($r['created_at'])],
        $pdo->query('SELECT u.id, u.email, u.created_at, u.status, p.full_name FROM users u LEFT JOIN profiles p ON p.id = u.id ORDER BY u.created_at DESC LIMIT 5')->fetchAll());
      // Statistiques temporelles : nouveaux inscrits / annonces par période
      // (fenêtres glissantes). created_at est en ISO UTC, donc comparable en texte.
      $cut = fn(int $days) => gmdate('Y-m-d\TH:i:s\Z', time() - $days * 86400);
      $since = function (string $table, string $iso) use ($pdo): int {
        $s = $pdo->prepare("SELECT COUNT(*) AS c FROM $table WHERE created_at >= ?");
        $s->execute([$iso]);
        return (int) $s->fetch()['c'];
      };
      $periodStats = function (string $table) use ($since, $cut) {
        return [
          'day' => $since($table, $cut(1)), 'week' => $since($table, $cut(7)),
          'month' => $since($table, $cut(30)), 'year' => $since($table, $cut(365)),
        ];
      };
      // Série journalière (14 derniers jours) pour les graphiques évolutifs.
      $dailyMap = function (string $table) use ($pdo): array {
        $m = [];
        foreach ($pdo->query("SELECT substr(created_at,1,10) AS d, COUNT(*) AS c FROM $table GROUP BY substr(created_at,1,10)")->fetchAll() as $r) {
          $m[$r['d']] = (int) $r['c'];
        }
        return $m;
      };
      $uMap = $dailyMap('users'); $lMap = $dailyMap('listings');
      $series = [];
      for ($i = 13; $i >= 0; $i--) {
        $d = gmdate('Y-m-d', time() - $i * 86400);
        $series[] = ['date' => $d, 'users' => $uMap[$d] ?? 0, 'listings' => $lMap[$d] ?? 0];
      }
      jout([
        'users' => $count('users'), 'listings' => $count('listings'),
        'conversations' => $count('conversations'), 'messages' => $count('messages'),
        'orders' => $count('orders'), 'reviews' => $count('reviews'),
        'newsletter' => $count('newsletter'),
        'reportsOpen' => (int) ($pdo->query("SELECT COUNT(*) AS c FROM reports WHERE status = 'open'")->fetch()['c']),
        // Compteur réservé aux comptes ayant la permission 'contact' (pas de fuite
        // du volume de messages vers un modérateur non habilité).
        'contactOpen' => admin_can($config, $pdo, $u, 'contact')
          ? (int) ($pdo->query('SELECT COUNT(*) AS c FROM contact_messages WHERE handled = 0 OR handled IS NULL')->fetch()['c'])
          : null,
        'adsPending' => admin_can($config, $pdo, $u, 'ads')
          ? (int) ($pdo->query("SELECT COUNT(*) AS c FROM ads WHERE status = 'pending'")->fetch()['c'])
          : null,
        'ordersByStatus' => $ordersByStatus, 'ordersValue' => $ordersValue,
        'periods' => ['users' => $periodStats('users'), 'listings' => $periodStats('listings')],
        'series' => $series,
        'recentListings' => $recentListings,
        // Liste nominative (emails) : réservée aux comptes ayant la permission
        // « Utilisateurs » — pas de fuite vers un modérateur non habilité.
        'recentUsers' => admin_can($config, $pdo, $u, 'users') ? $recentUsers : [],
        // Carte « Sécurité » de l'aperçu : réservée au PROPRIÉTAIRE (un modérateur
        // n'a pas à voir l'état 2FA du compte principal ni le journal global).
        'security' => in_array(strtolower((string) ($u['email'] ?? '')), owner_emails($config), true)
          ? (function () use ($pdo, $config, $u, $cut) {
              try {
                $q = function (string $kinds) use ($pdo, $cut): int {
                  $st = $pdo->prepare("SELECT COUNT(*) AS c FROM security_events WHERE kind IN ($kinds) AND created_at >= ?");
                  $st->execute([$cut(7)]);
                  return (int) $st->fetchColumn();
                };
                // Intégrité de la table admins : empreinte actuelle vs référence.
                $ref = @file_get_contents(admins_fp_file($config));
                $integrity = $ref === false ? null : (trim((string) $ref) === admins_fingerprint($pdo));
                // 2FA du propriétaire actuellement connecté.
                $tf = $pdo->prepare('SELECT totp_enabled FROM users WHERE id = ?');
                $tf->execute([$u['id']]);
                $twofa = (int) ($tf->fetchColumn() ?: 0) === 1;
                return [
                  'failedLogins'    => $q("'login_fail','admin_unlock_fail','mfa_fail'"),
                  'adminsIntegrity' => $integrity,
                  'owner2fa'        => $twofa,
                  'alerts'          => $q("'admins_tampered','cron_fail'"),
                ];
              } catch (Throwable $e) { return null; /* la carte s'efface, stats OK */ }
            })()
          : null,
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
      $pdo->prepare('DELETE FROM reviews WHERE reviewer_id = ? OR seller_id = ? OR target_id = ?')->execute([$id, $id, $id]);
      // Nettoyage RGPD complet (idem suppression par l'utilisateur).
      foreach (['favorites' => 'user_id', 'notifications' => 'user_id',
                'saved_searches' => 'user_id', 'user_interests' => 'user_id'] as $tbl => $col) {
        try { $pdo->prepare("DELETE FROM $tbl WHERE $col = ?")->execute([$id]); } catch (Throwable $e) {}
      }
      $pdo->prepare('DELETE FROM listings WHERE user_id = ?')->execute([$id]);
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

    // ------------------------------------------------------------------------
    //  RECETTES DU SITE — ce que Chap.ci a réellement encaissé
    //
    //  Deux natures de recette, et elles ne se connaissent pas de la même façon.
    //
    //  Les PUBLICITÉS, le site les connaît : chaque bannière porte son prix, son
    //  moyen de paiement et le numéro qui a payé. Rien à saisir.
    //
    //  Les DONS, le site ne les connaît PAS — et ce n'est pas un oubli. La page
    //  /don affiche un numéro Mobile Money ; le donateur envoie l'argent depuis
    //  son téléphone, directement à l'opérateur. Chap.ci n'est à aucun moment
    //  dans la transaction : aucun serveur ne peut deviner qu'elle a eu lieu.
    //  On les inscrit donc à la main, d'après le relevé Mobile Money.
    //
    //  D'où la colonne « confirmé » : elle ne dit pas « payé », elle dit
    //  « retrouvé sur le relevé de l'opérateur ». C'est la seule preuve qui
    //  vaille, et elle vient du téléphone du propriétaire, pas d'ici.
    // ------------------------------------------------------------------------
    //  Réservé au PROPRIÉTAIRE. Un modérateur modère ; il n'a pas à connaître
    //  le chiffre d'affaires, ni les numéros de téléphone des payeurs.
    if (str_starts_with($path, 'admin/revenues')) {
      if (!in_array(strtolower((string) ($u['email'] ?? '')), owner_emails($config), true)) {
        jerr('Les recettes sont réservées au propriétaire du site.', 403);
      }
    }

    // ------------------------------------------------------------------------
    //  Campagne de mise en conformité des ventes immobilières.
    //
    //  Masque les annonces publiées avant la nouvelle règle, inscrit le motif
    //  et prévient chaque vendeur — notification dans l'application ET e-mail
    //  avec le lien qui ouvre le formulaire sur la bonne annonce.
    //
    //  Elle s'exécute une fois toute seule au déploiement ; cette route existe
    //  pour la relancer si de vieilles annonces réapparaissent, et pour voir le
    //  compte rendu. Idempotente : personne n'est prévenu deux fois.
    //
    //  Réservée au PROPRIÉTAIRE : elle masque des annonces et envoie des
    //  e-mails en série. Un modérateur modère au cas par cas.
    // ------------------------------------------------------------------------
    if (str_starts_with($path, 'admin/foncier/')) {
      if (!in_array(strtolower((string) ($u['email'] ?? '')), owner_emails($config), true)) {
        jerr('Cette campagne est réservée au propriétaire du site.', 403);
      }
    }
    // État des lieux — ne masque rien, n'envoie rien. C'est la réponse à
    // « qu'est-ce que la campagne a fait, au juste ? », consultable à tout moment.
    if ($path === 'admin/foncier/campagne' && $method === 'GET') {
      $etat = foncier_campagne($config, $pdo, 200, true);
      $st = $pdo->query("SELECT id, title, hidden, hidden_reason, attributes FROM listings
                         WHERE category_id = 'immobilier' ORDER BY created_at DESC LIMIT 100");
      $etat['annonces'] = array_map(function (array $l) {
        $a = !empty($l['attributes']) ? (json_decode((string) $l['attributes'], true) ?: []) : [];
        return [
          'id' => $l['id'], 'titre' => $l['title'],
          'masquee' => !empty($l['hidden']),
          'parLaCampagne' => (string) ($l['hidden_reason'] ?? '') === FONCIER_MOTIF,
          'vente' => foncier_concerne('immobilier', null, $a),
          'manques' => foncier_manques($a),
        ];
      }, $st->fetchAll());
      jout($etat);
    }
    if ($path === 'admin/foncier/campagne' && $method === 'POST') {
      jout(foncier_campagne($config, $pdo, 200));
    }
    // Renvoi du message aux vendeurs déjà prévenus. À déclencher seulement si
    // l'on soupçonne que le premier e-mail n'est pas parti : il peut arriver
    // deux fois, ce qui est moins grave qu'une annonce masquée sans explication.
    if ($path === 'admin/foncier/relance' && $method === 'POST') {
      jout(foncier_relance($config, $pdo));
    }

    // ========================================================================
    //  COMPTABILITÉ — réservée au propriétaire, comme les recettes.
    //
    //  Un modérateur modère ; il n'a rien à faire dans les comptes. La garde
    //  est posée ici et non dans chaque route : une route ajoutée demain sous
    //  `admin/comptabilite/` est protégée sans que personne n'y pense.
    // ========================================================================
    if (str_starts_with($path, 'admin/comptabilite')) {
      if (!in_array(strtolower((string) ($u['email'] ?? '')), owner_emails($config), true)) {
        jerr('La comptabilité est réservée au propriétaire du site.', 403);
      }
    }

    // Le tableau complet d'un exercice : les deux registres, les totaux, le
    // résultat, le régime fiscal applicable. La reprise tourne à chaque
    // ouverture — elle est idempotente, et un rapprochement qu'il faut penser
    // à lancer finit par ne plus être lancé.
    if ($path === 'admin/comptabilite' && $method === 'GET') {
      $exercice = (int) ($_GET['exercice'] ?? gmdate('Y'));
      if ($exercice < 2020 || $exercice > 2100) $exercice = (int) gmdate('Y');
      $reprises = compta_reprise($pdo, (string) ($u['email'] ?? ''));

      $lire = function (string $sens) use ($pdo, $exercice): array {
        $st = $pdo->prepare('SELECT * FROM compta WHERE exercice = ? AND sens = ? ORDER BY numero ASC');
        $st->execute([$exercice, $sens]);
        return array_map(fn($r) => [
          'id' => $r['id'], 'numero' => (int) $r['numero'],
          'date' => (string) $r['date_op'], 'libelle' => (string) $r['libelle'],
          'montant' => (int) $r['montant'], 'categorie' => (string) $r['categorie'],
          'mode' => (string) $r['mode'], 'reference' => (string) ($r['reference'] ?? ''),
          'tiers' => (string) ($r['tiers'] ?? ''), 'piece' => (string) ($r['piece'] ?? ''),
          'note' => (string) ($r['note'] ?? ''), 'source' => (string) ($r['source'] ?? 'manuel'),
          'pointe' => (int) ($r['pointe'] ?? 0) === 1,
        ], $st->fetchAll());
      };
      $recettes = $lire('recette');
      $depenses = $lire('depense');
      $somme = fn(array $l) => array_sum(array_map(fn($x) => (int) $x['montant'], $l));
      $totalR = $somme($recettes); $totalD = $somme($depenses);

      // Ventilation par mois — c'est ce qu'on regarde pour voir venir un seuil.
      $mois = [];
      for ($m = 1; $m <= 12; $m++) $mois[sprintf('%04d-%02d', $exercice, $m)] = ['recettes' => 0, 'depenses' => 0];
      foreach ([['recette', $recettes], ['depense', $depenses]] as [$sens, $lignes]) {
        foreach ($lignes as $l) {
          $k = substr((string) $l['date'], 0, 7);
          if (isset($mois[$k])) $mois[$k][$sens === 'recette' ? 'recettes' : 'depenses'] += (int) $l['montant'];
        }
      }
      $parMois = [];
      foreach ($mois as $k => $v) $parMois[] = ['mois' => $k, 'recettes' => $v['recettes'], 'depenses' => $v['depenses'], 'resultat' => $v['recettes'] - $v['depenses']];

      $ventil = function (array $lignes, array $ref): array {
        $t = [];
        foreach ($lignes as $l) {
          $c = (string) $l['categorie'];
          $t[$c] = ($t[$c] ?? 0) + (int) $l['montant'];
        }
        arsort($t);
        $out = [];
        foreach ($t as $c => $v) $out[] = ['code' => $c, 'nom' => $ref[$c][0] ?? $c, 'compte' => $ref[$c][1] ?? '', 'total' => $v];
        return $out;
      };

      // Les exercices qui ont une écriture — c'est ce qui peuple le sélecteur.
      $annees = [];
      try {
        foreach ($pdo->query('SELECT DISTINCT exercice FROM compta ORDER BY exercice DESC')->fetchAll() as $r) $annees[] = (int) $r['exercice'];
      } catch (Throwable $e) {}
      if (!in_array((int) gmdate('Y'), $annees, true)) array_unshift($annees, (int) gmdate('Y'));

      jout([
        'exercice' => $exercice,
        'exercices' => $annees,
        'clos' => compta_clos($pdo, $exercice),
        'reprises' => $reprises,
        'recettes' => $recettes,
        'depenses' => $depenses,
        'totaux' => [
          'recettes' => $totalR,
          'depenses' => $totalD,
          'resultat' => $totalR - $totalD,
          'nbRecettes' => count($recettes),
          'nbDepenses' => count($depenses),
          // Le rapprochement : ce qui a été retrouvé sur le relevé de
          // l'opérateur. Une recette non pointée n'est pas une recette
          // douteuse — c'est une recette qu'on n'a pas encore vérifiée.
          'aPointer' => count(array_filter(array_merge($recettes, $depenses), fn($x) => !$x['pointe'])),
        ],
        'parMois' => $parMois,
        'parCategorie' => [
          'recettes' => $ventil($recettes, COMPTA_RECETTES),
          'depenses' => $ventil($depenses, COMPTA_DEPENSES),
        ],
        'regime' => compta_regime($totalR),
        // L'identité qui figure en tête des registres exportés.
        //
        // Le zip de déploiement n'écrase JAMAIS `api/config.php` — c'est la
        // règle qui protège les mots de passe du Patron. Le bloc `entite` livré
        // dans `server/config.php` n'arrive donc pas tout seul sur le serveur,
        // et sans RCCM ni NCC un registre remis aux Impôts est incomplet. On
        // renvoie ce qui manque pour que l'écran le dise, au lieu de laisser
        // découvrir le trou au guichet.
        'entite' => [
          'nom' => trim((string) (($config['entite']['nom'] ?? '') ?: 'Chap.ci')),
          'rccm' => trim((string) ($config['entite']['rccm'] ?? '')),
          'ncc' => trim((string) ($config['entite']['ncc'] ?? '')),
        ],
        'categories' => [
          'recettes' => array_map(fn($k) => ['code' => $k, 'nom' => COMPTA_RECETTES[$k][0], 'compte' => COMPTA_RECETTES[$k][1]], array_keys(COMPTA_RECETTES)),
          'depenses' => array_map(fn($k) => ['code' => $k, 'nom' => COMPTA_DEPENSES[$k][0], 'compte' => COMPTA_DEPENSES[$k][1]], array_keys(COMPTA_DEPENSES)),
        ],
        'modes' => COMPTA_MODES,
      ]);
    }

    // Inscrire une opération — une dépense le plus souvent, une recette au
    // besoin (un virement reçu hors publicité).
    if ($path === 'admin/comptabilite' && $method === 'POST') {
      $b = body();
      $montant = (int) ($b['montant'] ?? 0);
      if ($montant <= 0) jerr('Indiquez le montant, en francs CFA.');
      $libelle = trim((string) ($b['libelle'] ?? ''));
      if ($libelle === '') jerr('Décrivez l’opération : c’est ce que lira le contrôleur.');
      $sens = ($b['sens'] ?? 'depense') === 'recette' ? 'recette' : 'depense';
      $ref = $sens === 'recette' ? COMPTA_RECETTES : COMPTA_DEPENSES;
      $cat = (string) ($b['categorie'] ?? '');
      if (!isset($ref[$cat])) $cat = 'autre';
      $d = trim((string) ($b['date'] ?? ''));
      $date = preg_match('/^\d{4}-\d{2}-\d{2}$/', $d) ? $d . 'T12:00:00Z' : now_iso();
      $exercice = compta_exercice($date);
      if (compta_clos($pdo, $exercice)) jerr("L’exercice $exercice est clos : plus aucune écriture ne peut y être ajoutée.", 409);

      $id = compta_ecrire($pdo, [
        'sens' => $sens, 'date_op' => $date, 'libelle' => $libelle, 'montant' => $montant,
        'categorie' => $cat, 'mode' => (string) ($b['mode'] ?? 'autre'),
        'reference' => (string) ($b['reference'] ?? ''), 'tiers' => (string) ($b['tiers'] ?? ''),
        'piece' => (string) ($b['piece'] ?? ''), 'note' => (string) ($b['note'] ?? ''),
        'source' => 'manuel', 'cree_par' => (string) ($u['email'] ?? ''),
      ]);
      if (!$id) jerr('L’écriture n’a pas pu être inscrite.', 500);
      jout(['ok' => true, 'id' => $id]);
    }

    // Supprimer une écriture SAISIE À LA MAIN, et seulement elle.
    //
    // Une ligne venue d'une publicité encaissée ne se supprime pas : elle
    // correspond à de l'argent réellement reçu, et l'effacer ferait mentir le
    // registre. Une saisie manuelle, en revanche, peut être une faute de
    // frappe qu'il faut pouvoir retirer le jour même.
    if (count($seg) === 3 && $seg[1] === 'comptabilite' && $method === 'DELETE') {
      $st = $pdo->prepare('SELECT exercice, sens, source FROM compta WHERE id = ?');
      $st->execute([$seg[2]]);
      $row = $st->fetch();
      if (!$row) jerr('Écriture introuvable.', 404);
      if ((string) $row['source'] !== 'manuel') {
        jerr('Cette ligne vient d’une opération réelle du site : elle ne peut pas être supprimée. Ajoutez une écriture de correction si le montant est faux.', 409);
      }
      if (compta_clos($pdo, (int) $row['exercice'])) jerr('Exercice clos : plus aucune modification.', 409);
      $pdo->prepare('DELETE FROM compta WHERE id = ?')->execute([$seg[2]]);
      // Sans cela le registre garderait un trou — n° 1, n° 3 — qui se lit comme
      // une pièce retirée après coup.
      compta_renumeroter($pdo, (int) $row['exercice'], (string) $row['sens']);
      jout(['ok' => true]);
    }

    // Pointer une écriture : « je l'ai retrouvée sur le relevé Mobile Money ».
    //
    // C'est le rapprochement, et c'est ce qui distingue une liste d'une
    // comptabilité. Il reste possible sur un exercice clos : pointer ne change
    // aucun montant, cela note seulement qu'on a vérifié.
    if (count($seg) === 4 && $seg[1] === 'comptabilite' && $seg[3] === 'pointer' && $method === 'POST') {
      $b = body();
      $v = array_key_exists('pointe', $b) ? (!empty($b['pointe']) ? 1 : 0) : 1;
      $st = $pdo->prepare('SELECT id FROM compta WHERE id = ?');
      $st->execute([$seg[2]]);
      if (!$st->fetchColumn()) jerr('Écriture introuvable.', 404);
      $pdo->prepare('UPDATE compta SET pointe = ?, pointe_le = ? WHERE id = ?')
          ->execute([$v, $v ? now_iso() : null, $seg[2]]);
      jout(['ok' => true, 'pointe' => $v === 1]);
    }

    // Clore un exercice. Geste volontaire, irréversible depuis l'écran : à
    // partir de là, le registre imprimé et le registre en ligne diront
    // toujours la même chose.
    if ($path === 'admin/comptabilite/cloturer' && $method === 'POST') {
      $b = body();
      $annee = (int) ($b['exercice'] ?? 0);
      if ($annee < 2020 || $annee > 2100) jerr('Exercice invalide.');
      if ($annee >= (int) gmdate('Y')) jerr('On ne clôt pas un exercice en cours. Attendez le 1ᵉʳ janvier.', 409);
      if (compta_clos($pdo, $annee)) jerr("L’exercice $annee est déjà clos.", 409);
      $st = $pdo->prepare("SELECT sens, SUM(montant) t FROM compta WHERE exercice = ? GROUP BY sens");
      $st->execute([$annee]);
      $tot = ['recette' => 0, 'depense' => 0];
      foreach ($st->fetchAll() as $r) $tot[(string) $r['sens']] = (int) $r['t'];
      $pdo->prepare('INSERT INTO exercices (annee,cloture_le,cloture_par,total_recettes,total_depenses) VALUES (?,?,?,?,?)')
          ->execute([$annee, now_iso(), (string) ($u['email'] ?? ''), $tot['recette'], $tot['depense']]);
      $pdo->prepare('UPDATE compta SET verrouille = 1 WHERE exercice = ?')->execute([$annee]);
      jout(['ok' => true, 'exercice' => $annee, 'totaux' => $tot]);
    }

    // ------------------------------------------------------------------------
    //  LES EXPORTS — ce qui sort de l'écran et part chez le comptable.
    //
    //  Trois formats, trois usages :
    //   · `recettes` / `depenses` en CSV — les deux registres chronologiques
    //     exigés par le Code général des impôts, chacun dans son fichier,
    //     ouvrables dans n'importe quel tableur.
    //   · `smt` — le résultat de fin d'exercice présenté selon le Système
    //     Minimal de Trésorerie du SYSCOHADA révisé, en HTML fait pour être
    //     imprimé ou enregistré en PDF depuis le navigateur.
    //
    //  Le CSV porte un BOM UTF-8 : sans lui, Excel affiche « Coté d'Ivoire »
    //  et « Hébergement » en charabia, et le document devient impossible à
    //  présenter. Le séparateur est le point-virgule, celui qu'attend un
    //  tableur configuré en français.
    // ------------------------------------------------------------------------
    if ($path === 'admin/comptabilite/export' && $method === 'GET') {
      $exercice = (int) ($_GET['exercice'] ?? gmdate('Y'));
      if ($exercice < 2020 || $exercice > 2100) $exercice = (int) gmdate('Y');
      $quoi = (string) ($_GET['quoi'] ?? 'recettes');
      compta_reprise($pdo, (string) ($u['email'] ?? ''));

      $lignes = function (string $sens) use ($pdo, $exercice): array {
        $st = $pdo->prepare('SELECT * FROM compta WHERE exercice = ? AND sens = ? ORDER BY numero ASC');
        $st->execute([$exercice, $sens]);
        return $st->fetchAll();
      };
      $ident = $config['entite'] ?? [];
      $nomEntite = trim((string) ($ident['nom'] ?? '')) ?: 'Chap.ci';

      if ($quoi === 'recettes' || $quoi === 'depenses') {
        $sens = $quoi === 'recettes' ? 'recette' : 'depense';
        $ref = $sens === 'recette' ? COMPTA_RECETTES : COMPTA_DEPENSES;
        $rows = $lignes($sens);
        $csv = "\xEF\xBB\xBF"; // BOM : Excel lit alors correctement les accents
        $sep = ';';
        $esc = function ($v) { return '"' . str_replace('"', '""', (string) $v) . '"'; };
        // Un en-tête qui dit de quoi il s'agit : le fichier voyage seul.
        $csv .= $esc($nomEntite) . $sep . $esc(($sens === 'recette' ? 'REGISTRE DES RECETTES' : 'REGISTRE DES ACHATS ET DÉPENSES') . " — exercice $exercice") . "\n";
        if (!empty($ident['rccm'])) $csv .= $esc('RCCM') . $sep . $esc($ident['rccm']) . "\n";
        if (!empty($ident['ncc'])) $csv .= $esc('Compte contribuable (NCC)') . $sep . $esc($ident['ncc']) . "\n";
        $csv .= $esc('Édité le') . $sep . $esc(gmdate('d/m/Y H:i') . ' UTC') . "\n\n";
        $csv .= implode($sep, array_map($esc, ['N°', 'Date', 'Libellé', 'Tiers', 'Catégorie', 'Compte SYSCOHADA', 'Mode de règlement', 'Référence', 'Pièce justificative', 'Pointé sur relevé', 'Montant (FCFA)'])) . "\n";
        $total = 0;
        foreach ($rows as $r) {
          $c = (string) $r['categorie'];
          $total += (int) $r['montant'];
          $csv .= implode($sep, array_map($esc, [
            (int) $r['numero'],
            gmdate('d/m/Y', strtotime((string) $r['date_op']) ?: time()),
            (string) $r['libelle'],
            (string) ($r['tiers'] ?? ''),
            $ref[$c][0] ?? $c,
            $ref[$c][1] ?? '',
            (string) $r['mode'],
            (string) ($r['reference'] ?? ''),
            (string) ($r['piece'] ?? ''),
            ((int) ($r['pointe'] ?? 0) === 1) ? 'oui' : 'non',
            (int) $r['montant'],
          ])) . "\n";
        }
        $csv .= "\n" . implode($sep, array_map($esc, ['', '', 'TOTAL', '', '', '', '', '', '', '', $total])) . "\n";
        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename="chapci-' . $quoi . '-' . $exercice . '.csv"');
        header('X-Content-Type-Options: nosniff');
        echo $csv;
        exit;
      }

      if ($quoi === 'smt') {
        $rec = $lignes('recette'); $dep = $lignes('depense');
        $sum = fn(array $l) => array_sum(array_map(fn($x) => (int) $x['montant'], $l));
        $tr = $sum($rec); $td = $sum($dep);
        $regime = compta_regime($tr);
        $grp = function (array $l, array $ref): array {
          $t = [];
          foreach ($l as $x) { $c = (string) $x['categorie']; $t[$c] = ($t[$c] ?? 0) + (int) $x['montant']; }
          arsort($t); return $t;
        };
        $gr = $grp($rec, COMPTA_RECETTES); $gd = $grp($dep, COMPTA_DEPENSES);
        $f = fn(int $n) => number_format($n, 0, ',', ' ');
        $h = fn($s) => htmlspecialchars((string) $s, ENT_QUOTES, 'UTF-8');
        $clos = compta_clos($pdo, $exercice);

        $ligneCat = function (array $t, array $ref) use ($f, $h): string {
          $out = '';
          foreach ($t as $c => $v) {
            $out .= '<tr><td>' . $h($ref[$c][0] ?? $c) . '</td><td class="c">' . $h($ref[$c][1] ?? '—')
                 . '</td><td class="n">' . $f($v) . '</td></tr>';
          }
          return $out ?: '<tr><td colspan="3" class="vide">Aucune écriture</td></tr>';
        };

        header('Content-Type: text/html; charset=utf-8');
        header('Content-Disposition: inline; filename="chapci-etat-financier-' . $exercice . '.html"');
        header('X-Content-Type-Options: nosniff');
        echo '<!doctype html><html lang="fr"><head><meta charset="utf-8">'
          . '<title>' . $h($nomEntite) . ' — état financier ' . $exercice . '</title>'
          . '<style>'
          . '@page{size:A4;margin:18mm}'
          . 'body{font-family:Georgia,"Times New Roman",serif;color:#111;max-width:800px;margin:0 auto;padding:28px;line-height:1.5}'
          . 'h1{font-size:20px;margin:0 0 2px;letter-spacing:-.3px}'
          . 'h2{font-size:14px;margin:26px 0 8px;padding-bottom:5px;border-bottom:1.5px solid #111;text-transform:uppercase;letter-spacing:.6px}'
          . '.ent{font-size:12.5px;color:#444;margin-bottom:22px}'
          . 'table{width:100%;border-collapse:collapse;font-size:12.5px;margin-bottom:6px}'
          . 'th,td{padding:5px 8px;border-bottom:1px solid #ddd;text-align:left;vertical-align:top}'
          . 'th{font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:#555;border-bottom:1px solid #111}'
          . '.n{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}'
          . '.c{color:#666;font-size:11.5px;white-space:nowrap}'
          . '.tot td{border-top:1.5px solid #111;border-bottom:none;font-weight:bold;padding-top:8px}'
          . '.res{margin:22px 0;padding:14px 16px;border:2px solid #111}'
          . '.res .l{font-size:11px;text-transform:uppercase;letter-spacing:.8px;color:#555}'
          . '.res .v{font-size:26px;font-weight:bold;font-variant-numeric:tabular-nums}'
          . '.neg{color:#A81E1E}'
          . '.vide{color:#888;font-style:italic}'
          . '.pied{margin-top:30px;padding-top:12px;border-top:1px solid #ccc;font-size:11px;color:#555;line-height:1.7}'
          . '.att{background:#FFF8E1;border-left:3px solid #E8A100;padding:10px 12px;margin:16px 0;font-size:11.5px}'
          . '@media print{.noprint{display:none}}'
          . '</style></head><body>'
          . '<button class="noprint" onclick="window.print()" style="float:right;font:inherit;padding:7px 14px;cursor:pointer">Imprimer / PDF</button>'
          . '<h1>' . $h($nomEntite) . '</h1>'
          . '<div class="ent">'
          . ($ident['activite'] ?? 'Plateforme de petites annonces en ligne') . '<br>'
          . ($ident['adresse'] ?? 'Abidjan, Côte d’Ivoire')
          . (!empty($ident['rccm']) ? '<br>RCCM : ' . $h($ident['rccm']) : '')
          . (!empty($ident['ncc']) ? ' &nbsp;·&nbsp; Compte contribuable : ' . $h($ident['ncc']) : '')
          . '</div>'
          . '<h2>État financier — exercice ' . $exercice . '</h2>'
          . '<p style="font-size:12.5px;margin:0 0 4px">Système Minimal de Trésorerie — référentiel SYSCOHADA révisé.<br>'
          . 'Période du 1<sup>er</sup> janvier au 31 décembre ' . $exercice . '. Montants en francs CFA (XOF).</p>'
          . ($clos ? '' : '<div class="att"><b>Exercice non clos.</b> Ce document reflète les écritures enregistrées au '
              . gmdate('d/m/Y') . '. Il n’est définitif qu’une fois l’exercice clôturé.</div>')
          . '<h2>Recettes encaissées</h2>'
          . '<table><tr><th>Nature</th><th>Compte</th><th class="n">Montant</th></tr>'
          . $ligneCat($gr, COMPTA_RECETTES)
          . '<tr class="tot"><td>Total des recettes</td><td></td><td class="n">' . $f($tr) . '</td></tr></table>'
          . '<p style="font-size:11.5px;color:#555;margin-top:2px">' . count($rec) . ' écriture(s), numérotées de 1 à ' . count($rec) . ' au registre des recettes.</p>'
          . '<h2>Dépenses décaissées</h2>'
          . '<table><tr><th>Nature</th><th>Compte</th><th class="n">Montant</th></tr>'
          . $ligneCat($gd, COMPTA_DEPENSES)
          . '<tr class="tot"><td>Total des dépenses</td><td></td><td class="n">' . $f($td) . '</td></tr></table>'
          . '<p style="font-size:11.5px;color:#555;margin-top:2px">' . count($dep) . ' écriture(s), numérotées de 1 à ' . count($dep) . ' au registre des dépenses.</p>'
          . '<div class="res"><div class="l">Résultat de l’exercice ' . $exercice . '</div>'
          . '<div class="v' . ($tr - $td < 0 ? ' neg' : '') . '">' . $f($tr - $td) . ' FCFA</div></div>'
          . '<h2>Régime fiscal applicable</h2>'
          . '<p style="font-size:12.5px;margin:0"><b>' . $h($regime['nom']) . '</b><br>'
          . 'Déterminé par le chiffre d’affaires de l’exercice : ' . $f($tr) . ' FCFA TTC.<br>'
          . $h($regime['obligation']) . '</p>'
          . '<div class="pied">'
          . 'Document établi le ' . gmdate('d/m/Y à H:i') . ' UTC à partir du grand livre tenu par le site Chap.ci.<br>'
          . 'Les registres détaillés — recettes et dépenses, chronologiques et numérotés — sont exportables séparément au format CSV.<br>'
          . 'Conformément au Code général des impôts, ces documents sont conservés <b>trois ans</b> et présentés à toute réquisition du service des Impôts.<br>'
          . '<i>Ce document est produit automatiquement. Il ne remplace pas l’avis d’un expert-comptable, et n’a pas valeur de déclaration fiscale.</i>'
          . '</div></body></html>';
        exit;
      }
      jerr('Export inconnu.', 400);
    }

    if ($path === 'admin/revenues' && $method === 'GET') {
      $depuis = trim((string) ($_GET['from'] ?? ''));   // AAAA-MM-JJ (facultatif)
      $jusqua = trim((string) ($_GET['to'] ?? ''));
      $borne = function (string $col) use ($depuis, $jusqua): array {
        $w = []; $p = [];
        if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $depuis)) { $w[] = "$col >= ?"; $p[] = $depuis . 'T00:00:00Z'; }
        if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $jusqua)) { $w[] = "$col <= ?"; $p[] = $jusqua . 'T23:59:59Z'; }
        return [$w ? ' AND ' . implode(' AND ', $w) : '', $p];
      };

      // Publicités encaissées : payantes uniquement. Une diffusion maison
      // (kind admin/seo) ou une demande refusée n'a jamais rapporté un franc.
      [$wAds, $pAds] = $borne('created_at');
      $st = $pdo->prepare("SELECT id,title,price,pay_method,pay_number,email,status,created_at,starts_at,pay_confirmed,pay_confirmed_at
        FROM ads
        WHERE price > 0 AND (kind IS NULL OR kind NOT IN ('admin','seo'))
          AND status IN ('active','expired','merged')$wAds
        ORDER BY created_at DESC LIMIT 500");
      $st->execute($pAds);
      $pubs = array_map(fn($r) => [
        'id' => $r['id'], 'label' => ($r['title'] ?: '(bannière image seule)'),
        'amount' => (int) $r['price'],
        'method' => $r['pay_method'] ?: '', 'number' => $r['pay_number'] ?: '',
        'email' => $r['email'] ?: null,
        'status' => $r['status'],
        'at' => iso_to_ms($r['starts_at'] ?: $r['created_at']),
        'confirmed' => (int) ($r['pay_confirmed'] ?? 0) === 1,
        'confirmedAt' => !empty($r['pay_confirmed_at']) ? iso_to_ms($r['pay_confirmed_at']) : null,
      ], $st->fetchAll());

      // Recettes saisies à la main (dons et autres).
      [$wRev, $pRev] = $borne('occurred_at');
      $st2 = $pdo->prepare("SELECT * FROM revenues WHERE 1 = 1$wRev ORDER BY occurred_at DESC LIMIT 500");
      $st2->execute($pRev);
      $manuelles = array_map(fn($r) => [
        'id' => $r['id'], 'kind' => $r['kind'] ?: 'don', 'label' => (string) $r['label'],
        'amount' => (int) $r['amount'], 'method' => $r['method'] ?: '', 'number' => $r['number'] ?: '',
        'note' => (string) ($r['note'] ?? ''),
        'at' => iso_to_ms($r['occurred_at'] ?: $r['created_at']),
        'confirmed' => (int) ($r['confirmed'] ?? 0) === 1,
        'confirmedAt' => !empty($r['confirmed_at']) ? iso_to_ms($r['confirmed_at']) : null,
      ], $st2->fetchAll());

      $somme = fn(array $l) => array_sum(array_map(fn($x) => (int) $x['amount'], $l));
      $dons  = array_values(array_filter($manuelles, fn($x) => $x['kind'] === 'don'));
      $autres = array_values(array_filter($manuelles, fn($x) => $x['kind'] !== 'don'));
      $toutes = array_merge($pubs, $manuelles);
      $confirmees = array_values(array_filter($toutes, fn($x) => $x['confirmed']));

      // Recettes par mois : de quoi voir une tendance sans exporter quoi que ce soit.
      $mois = [];
      foreach ($toutes as $x) {
        if (!$x['at']) continue;
        $m = gmdate('Y-m', (int) ($x['at'] / 1000));
        $mois[$m] = ($mois[$m] ?? 0) + (int) $x['amount'];
      }
      krsort($mois);
      $parMois = [];
      foreach (array_slice($mois, 0, 12, true) as $m => $v) $parMois[] = ['mois' => $m, 'total' => $v];

      jout([
        'pubs' => $pubs,
        'dons' => $dons,
        'autres' => $autres,
        'totaux' => [
          'pub' => $somme($pubs),
          'don' => $somme($dons),
          'autre' => $somme($autres),
          'total' => $somme($toutes),
          'confirme' => $somme($confirmees),
          'aVerifier' => $somme($toutes) - $somme($confirmees),
          'nbAVerifier' => count($toutes) - count($confirmees),
        ],
        'parMois' => array_reverse($parMois),
      ]);
    }

    // Inscrire une recette relevée sur le compte Mobile Money (don, virement…).
    if ($path === 'admin/revenues' && $method === 'POST') {
      $b = body();
      $montant = (int) ($b['amount'] ?? 0);
      if ($montant <= 0) jerr('Indiquez le montant reçu.');
      $kind = in_array($b['kind'] ?? '', ['don', 'pub', 'autre'], true) ? $b['kind'] : 'don';
      $quand = trim((string) ($b['occurredAt'] ?? ''));
      $quand = preg_match('/^\d{4}-\d{2}-\d{2}$/', $quand) ? $quand . 'T12:00:00Z' : now_iso();
      $id = uuid();
      $pdo->prepare('INSERT INTO revenues (id,kind,label,amount,method,number,occurred_at,note,confirmed,confirmed_at,created_at,created_by)
                     VALUES (?,?,?,?,?,?,?,?,?,?,?,?)')
          ->execute([$id, $kind,
            mb_substr(trim((string) ($b['label'] ?? '')), 0, 120) ?: 'Don',
            $montant,
            in_array($b['method'] ?? '', ['orange', 'wave', 'mtn', 'moov', 'especes', 'autre'], true) ? $b['method'] : 'orange',
            mb_substr(preg_replace('/[^0-9+ ]/', '', (string) ($b['number'] ?? '')), 0, 20),
            $quand,
            mb_substr(trim((string) ($b['note'] ?? '')), 0, 300),
            // Saisi d'après le relevé : la ligne naît donc confirmée, sauf mention contraire.
            array_key_exists('confirmed', $b) && empty($b['confirmed']) ? 0 : 1,
            array_key_exists('confirmed', $b) && empty($b['confirmed']) ? null : now_iso(),
            now_iso(), (string) ($u['email'] ?? '')]);
      jout(['ok' => true, 'id' => $id]);
    }

    // Pointer / dépointer une recette (« retrouvée sur le relevé Mobile Money »).
    if (count($seg) === 4 && $seg[1] === 'revenues' && $seg[3] === 'confirm' && $method === 'POST') {
      $on = !empty(body()['confirmed']);
      $pdo->prepare('UPDATE revenues SET confirmed = ?, confirmed_at = ? WHERE id = ?')
          ->execute([$on ? 1 : 0, $on ? now_iso() : null, $seg[2]]);
      // La même bascule vaut pour un paiement de publicité.
      $pdo->prepare('UPDATE ads SET pay_confirmed = ?, pay_confirmed_at = ? WHERE id = ?')
          ->execute([$on ? 1 : 0, $on ? now_iso() : null, $seg[2]]);
      jout(['ok' => true]);
    }

    if (count($seg) === 3 && $seg[1] === 'revenues' && $method === 'DELETE') {
      $pdo->prepare('DELETE FROM revenues WHERE id = ?')->execute([$seg[2]]);
      jout(['ok' => true]);
    }

    // Publicités : demandes en attente d'abord, puis récentes.
    if ($path === 'admin/ads' && $method === 'GET') {
      $rows = $pdo->query("SELECT * FROM ads
        ORDER BY (CASE WHEN status = 'pending' THEN 0 ELSE 1 END), created_at DESC LIMIT 200")->fetchAll();
      $now = now_iso();
      jout(array_map(fn($r) => [
        'id' => $r['id'], 'title' => $r['title'], 'description' => (string) $r['description'],
        'link' => $r['link'] ?: null, 'images' => json_decode((string) $r['images'], true) ?: [],
        'formule' => $r['formule'], 'qty' => (int) $r['qty'], 'price' => (int) $r['price'],
        'payMethod' => $r['pay_method'], 'payNumber' => $r['pay_number'],
        'email' => ($r['email'] ?? '') !== '' ? $r['email'] : null,
        'phone' => ($r['phone'] ?? '') !== '' ? $r['phone'] : null,
        'kind' => $r['kind'] ?: 'paid', 'style' => $r['style'] ?: null, 'anim' => $r['anim'] ?: null,
        'animLoop' => (($r['anim_loop'] ?? '') === '0') ? false : true,
        'anims' => (($a = json_decode((string) ($r['anims'] ?? ''), true)) && is_array($a) && $a) ? $a : ($r['anim'] ? [$r['anim']] : []),
        'animGap' => ((int) ($r['anim_gap'] ?? 0)) ?: 8,
        'textColor' => ($r['text_color'] ?? '') !== '' ? $r['text_color'] : null,
        // Une pub « active » dont la date est passée est présentée comme expirée.
        'status' => ($r['status'] === 'active' && ($r['expires_at'] ?? '') !== '' && $r['expires_at'] <= $now) ? 'expired' : $r['status'],
        'expiresAt' => !empty($r['expires_at']) ? iso_to_ms($r['expires_at']) : null,
        'createdAt' => iso_to_ms($r['created_at']),
      ], $rows));
    }

    // Bureau de Croissance SEO : état (activé, diffusion du jour) + bascule +
    // déclenchement manuel immédiat (pour tester sans attendre le cron).
    if ($path === 'admin/seo' && $method === 'GET') {
      $today = gmdate('Y-m-d');
      $st = $pdo->prepare("SELECT title, created_at FROM ads WHERE kind = 'seo' AND status = 'active' ORDER BY created_at DESC LIMIT 1");
      $st->execute();
      $cur = $st->fetch();
      jout([
        'enabled'   => seo_auto_enabled($config),
        'todayDone' => (int) (function () use ($pdo, $today) { $s = $pdo->prepare("SELECT COUNT(*) FROM ads WHERE kind='seo' AND substr(created_at,1,10)=?"); $s->execute([$today]); return $s->fetchColumn(); })() > 0,
        'current'   => $cur ? ['title' => $cur['title'], 'createdAt' => iso_to_ms($cur['created_at'])] : null,
        'cronKey'   => $config['cron_key'] ?? '',
        'site'      => rtrim($config['site_url'] ?? 'https://chap.ci', '/'),
      ]);
    }
    if ($path === 'admin/seo' && $method === 'POST') {
      $b = body();
      seo_auto_set($config, !empty($b['enabled']));
      jout(['ok' => true, 'enabled' => seo_auto_enabled($config)]);
    }
    // Générer MAINTENANT la diffusion du jour (remplace celle du jour si besoin).
    if ($path === 'admin/seo/run' && $method === 'POST') {
      $pdo->prepare("UPDATE ads SET status = 'expired' WHERE kind = 'seo' AND status = 'active'")->execute([]);
      $bc = seo_daily_broadcast($config, $pdo);
      $id = uuid(); $now = now_iso();
      $expires = gmdate('Y-m-d\TH:i:s\Z', time() + 26 * 3600);
      $pdo->prepare('INSERT INTO ads (id,user_id,title,description,link,images,formule,qty,price,pay_method,pay_number,status,starts_at,expires_at,ip,created_at,kind,style,anim,anim_loop)
                     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)')
          ->execute([$id, $u['id'] ?? null, $bc['title'], $bc['description'], $bc['link'] ?? '', json_encode([]), 'day', 1,
                     0, '', '', 'active', $now, $expires, 'admin', $now, 'seo', $bc['style'], $bc['anim'], '1']);
      jout(['ok' => true, 'goal' => $bc['goal'], 'title' => $bc['title']]);
    }

    // Diffusion ADMIN sur l'écran : message/annonce avec animation et style
    // d'écriture, actif immédiatement (pas de paiement — c'est la maison).
    if ($path === 'admin/ads/broadcast' && $method === 'POST') {
      $b = body();
      $title = mb_substr(trim((string) ($b['title'] ?? '')), 0, 90);
      $desc  = mb_substr(trim((string) ($b['description'] ?? '')), 0, 600);
      $link  = trim((string) ($b['link'] ?? ''));
      if ($link !== '' && (!preg_match('#^https?://#i', $link) || strlen($link) > 300)) {
        jerr('Le lien doit commencer par https://.');
      }
      $style = in_array($b['style'] ?? '', ['classique', 'neon', 'script', 'impact', 'ivoire'], true) ? $b['style'] : 'classique';
      // Animations enchaînées du texte : liste de clés (une ou plusieurs).
      $anims = [];
      foreach ((array) ($b['anims'] ?? []) as $a) {
        $a = (string) $a;
        if (preg_match('/^[a-z0-9-]{2,24}$/', $a)) $anims[] = $a;
      }
      $anims = array_slice(array_values(array_unique($anims)), 0, 20);
      // Repli sur l'ancien champ unique, sinon « fondu ».
      if (!$anims) {
        $single = is_string($b['anim'] ?? null) && preg_match('/^[a-z0-9-]{2,24}$/', $b['anim']) ? $b['anim'] : 'fondu';
        $anims = [$single];
      }
      $anim  = $anims[0]; // colonne « anim » (compatibilité)
      // Pause entre deux animations : de 5 s à 60 s.
      $gap   = (string) max(5, min(60, (int) ($b['gap'] ?? 8)));
      // Couleur du texte : #RGB ou #RRGGBB (sinon vide = couleur par défaut).
      $tcol  = is_string($b['textColor'] ?? null) && preg_match('/^#[0-9a-fA-F]{3,8}$/', $b['textColor']) ? strtoupper($b['textColor']) : '';
      // Boucle continue pendant toute la durée ('1') ou une seule fois ('0').
      $loop  = array_key_exists('loop', $b) ? (!empty($b['loop']) ? '1' : '0') : '1';
      $days  = max(1, min(90, (int) ($b['days'] ?? 7)));
      $images = [];
      foreach (array_slice((array) ($b['images'] ?? []), 0, 3) as $img) {
        $url = save_data_uri($config, (string) $img, false);
        if ($url) $images[] = $url;
      }
      // Il faut au moins un message OU une image (diffusion « image seule » permise).
      if (mb_strlen($title) < 2 && !$images) jerr('Écrivez un message ou ajoutez une image à diffuser.');
      $id = uuid();
      $now = now_iso();
      $expires = gmdate('Y-m-d\TH:i:s\Z', time() + $days * 86400);
      $pdo->prepare('INSERT INTO ads (id,user_id,title,description,link,images,formule,qty,price,pay_method,pay_number,status,starts_at,expires_at,ip,created_at,kind,style,anim,anim_loop,anims,anim_gap,text_color)
                     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)')
          ->execute([$id, $u['id'] ?? null, $title, $desc, $link, json_encode($images), 'day', $days,
                     0, '', '', 'active', $now, $expires, client_ip(), $now, 'admin', $style, $anim, $loop, json_encode($anims), $gap, $tcol]);
      jout(['ok' => true, 'id' => $id, 'expiresAt' => iso_to_ms($expires)]);
    }

    // Approuver une pub (paiement reçu) : activation + calcul de l'expiration.
    if (count($seg) === 4 && $seg[1] === 'ads' && $seg[3] === 'approve' && $method === 'POST') {
      $st = $pdo->prepare('SELECT * FROM ads WHERE id = ?');
      $st->execute([$seg[2]]);
      $ad = $st->fetch();
      if (!$ad) jerr('Publicité introuvable.', 404);
      $unit = ['day' => 86400, 'week' => 7 * 86400, 'month' => 30 * 86400][$ad['formule']] ?? 7 * 86400;
      $duree = $unit * max(1, (int) $ad['qty']);
      $cible = trim((string) ($ad['extends_ad_id'] ?? ''));
      if ($cible !== '') {
        // PROLONGATION : on repousse la fin de la bannière d'origine à partir
        // de SA date de fin, pas de maintenant — l'annonceur ne perd aucun jour
        // de ce qu'il a déjà payé, et l'affichage ne s'interrompt jamais.
        $q = $pdo->prepare('SELECT expires_at FROM ads WHERE id = ?'); $q->execute([$cible]);
        $base = (int) strtotime((string) ($q->fetchColumn() ?: now_iso()));
        if ($base < time()) $base = time();
        $expires = gmdate('Y-m-d\TH:i:s\Z', $base + $duree);
        $pdo->prepare("UPDATE ads SET expires_at = ?, expiry_notified = '', expired_notified = '' WHERE id = ?")
            ->execute([$expires, $cible]);
        // La demande de prolongation, elle, est classée : elle ne doit pas
        // apparaître comme une seconde bannière à l'écran.
        $pdo->prepare("UPDATE ads SET status = 'merged', starts_at = ?, expires_at = ?, pay_confirmed = 1, pay_confirmed_at = ? WHERE id = ?")
            ->execute([now_iso(), $expires, now_iso(), $seg[2]]);
        $src = $pdo->prepare('SELECT * FROM ads WHERE id = ?'); $src->execute([$cible]);
        $orig = $src->fetch() ?: $ad;
        send_ad_status_email($config, array_merge($orig, ['expires_at' => $expires]), 'active', $pdo);
        jout(['ok' => true, 'prolonge' => $cible, 'expiresAt' => iso_to_ms($expires)]);
      }
      $expires = gmdate('Y-m-d\TH:i:s\Z', time() + $duree);
      // last_report_at est daté de la MISE EN LIGNE, pas laissé vide : sinon le
      // premier rapport d'audience part au prochain passage du cron — quelques
      // heures après le « c'est en ligne », avec des chiffres à zéro. On veut
      // le premier bilan à J+3, comme annoncé à l'annonceur.
      // pay_confirmed_at : approuver, c'est avoir verifie le versement sur le
      // compte Mobile Money. La recette est donc pointee dans le meme geste,
      // sans un second clic ailleurs — et reste depointable si l'on s'est
      // trompe (voir l'onglet Recettes).
      $pdo->prepare("UPDATE ads SET status = 'active', starts_at = ?, expires_at = ?, expiry_notified = '', last_report_at = ?, pay_confirmed = 1, pay_confirmed_at = ? WHERE id = ?")
          ->execute([now_iso(), $expires, now_iso(), now_iso(), $seg[2]]);
      // Notification « en ligne » à l'annonceur (avec la date de fin).
      send_ad_status_email($config, array_merge($ad, ['expires_at' => $expires]), 'active', $pdo);
      jout(['ok' => true, 'expiresAt' => iso_to_ms($expires)]);
    }

    // Rejeter une pub (visuel non conforme, paiement absent…).
    if (count($seg) === 4 && $seg[1] === 'ads' && $seg[3] === 'reject' && $method === 'POST') {
      $st = $pdo->prepare('SELECT * FROM ads WHERE id = ?'); $st->execute([$seg[2]]); $ad = $st->fetch();
      // Motif OBLIGATOIRE dans l'e-mail : « non conforme » sans explication
      // fait recommencer la même erreur, et revenir se plaindre.
      //
      // Le commentaire disait « obligatoire » et le serveur acceptait le vide —
      // relevé par le Gardien le 29/07. Un commentaire qui ment est pire que
      // pas de commentaire : le prochain lecteur s'y fie. Le front impose déjà
      // cinq caractères ; le serveur ne s'en remet plus à lui.
      $motif = mb_substr(trim((string) (body()['reason'] ?? '')), 0, 400);
      if (mb_strlen($motif) < 5) {
        jerr('Indiquez le motif du refus : il part tel quel dans l’e-mail à l’annonceur.');
      }
      $pdo->prepare("UPDATE ads SET status = 'rejected', reject_reason = ? WHERE id = ?")
          ->execute([$motif, $seg[2]]);
      if ($ad) send_ad_status_email($config, $ad, 'rejected', $pdo, ['reason' => $motif]);
      jout(['ok' => true]);
    }

    // Supprimer une pub.
    if (count($seg) === 3 && $seg[1] === 'ads' && $method === 'DELETE') {
      $pdo->prepare('DELETE FROM ads WHERE id = ?')->execute([$seg[2]]);
      jout(['ok' => true]);
    }

    // Messages du formulaire de contact : non traités d'abord, puis récents.
    if ($path === 'admin/contact-messages' && $method === 'GET') {
      $rows = $pdo->query('SELECT * FROM contact_messages
        ORDER BY (CASE WHEN handled = 1 THEN 1 ELSE 0 END), created_at DESC LIMIT 200')->fetchAll();
      jout(array_map(fn($r) => [
        'id' => $r['id'], 'name' => $r['name'] ?: null, 'email' => $r['email'] ?: null,
        'subject' => $r['subject'] ?: 'Message', 'message' => (string) $r['message'],
        'handled' => !empty($r['handled']), 'createdAt' => iso_to_ms($r['created_at']),
        'replyBody' => ($r['reply_body'] ?? '') !== '' ? $r['reply_body'] : null,
        'repliedAt' => !empty($r['replied_at']) ? iso_to_ms($r['replied_at']) : null,
        'repliedBy' => ($r['replied_by'] ?? '') !== '' ? $r['replied_by'] : null,
      ], $rows));
    }

    // Brouillon de réponse proposé (IA si clé configurée, sinon gabarit local).
    if (count($seg) === 4 && $seg[1] === 'contact-messages' && $seg[3] === 'suggest' && $method === 'POST') {
      $st = $pdo->prepare('SELECT * FROM contact_messages WHERE id = ?');
      $st->execute([$seg[2]]);
      $msg = $st->fetch();
      if (!$msg) jerr('Message introuvable.', 404);
      jout(contact_ai_draft($config, (string) ($msg['name'] ?? ''), (string) ($msg['subject'] ?? 'Message'), (string) ($msg['message'] ?? '')));
    }

    // Répondre DEPUIS le tableau de bord : l'email part de contact@chap.ci
    // (signature ajoutée), la personne le reçoit dans sa boîte et peut répondre
    // directement à contact@chap.ci — la suite se passe par email.
    if (count($seg) === 4 && $seg[1] === 'contact-messages' && $seg[3] === 'reply' && $method === 'POST') {
      $b = body();
      $reply = trim((string) ($b['body'] ?? ''));
      if ($reply === '') jerr('Écrivez votre réponse avant d’envoyer.');
      $reply = mb_substr($reply, 0, 8000);
      $st = $pdo->prepare('SELECT * FROM contact_messages WHERE id = ?');
      $st->execute([$seg[2]]);
      $msg = $st->fetch();
      if (!$msg) jerr('Message introuvable.', 404);
      $toAddr = strtolower(trim((string) ($msg['email'] ?? '')));
      // Même validation stricte qu'à la réception (défense en profondeur).
      if ($toAddr === '' || !filter_var($toAddr, FILTER_VALIDATE_EMAIL) || preg_match('/[?&=%\s"()<>,;:\\\\]/', $toAddr)) {
        jerr('Ce message n’a pas d’adresse email valide : réponse impossible.', 400);
      }
      $contactAddr = $config['mail_reply_to'] ?? 'contact@chap.ci';
      $safe = fn(string $s) => htmlspecialchars($s, ENT_QUOTES, 'UTF-8');
      // Corps : texte de l'admin tel quel + signature + message d'origine cité.
      $inner = '<p style="white-space:pre-wrap;line-height:1.65">' . nl2br($safe($reply)) . '</p>'
             . '<p style="margin-top:22px;line-height:1.5">— L’équipe Chap.ci 🇨🇮<br>'
             . '<a href="mailto:' . $safe($contactAddr) . '" style="color:#F77F00;text-decoration:none">' . $safe($contactAddr) . '</a>'
             . ' · <a href="' . $safe(rtrim($config['site_url'] ?? 'https://chap.ci', '/')) . '" style="color:#F77F00;text-decoration:none">chap.ci</a></p>'
             . '<hr style="border:none;border-top:1px solid #EFE6D7;margin:22px 0 12px">'
             . '<p style="color:#8B857C;font-size:12px;margin:0 0 6px">Votre message :</p>'
             . '<blockquote style="margin:0;padding:10px 14px;border-left:3px solid #EFE6D7;color:#57534E;font-size:13px;white-space:pre-wrap">'
             . nl2br($safe((string) $msg['message'])) . '</blockquote>';
      $subject = 'Re: ' . ((string) ($msg['subject'] ?? '') ?: 'Votre message à Chap.ci');
      $html = email_layout($config, $inner, 'Réponse de l’équipe Chap.ci à votre message');
      // Expéditeur ET adresse de réponse = contact@chap.ci.
      if (!send_mail($config, $toAddr, $subject, $html, $contactAddr, $contactAddr)) {
        jerr('Envoi impossible pour le moment (email). Réessayez dans un instant.', 502);
      }
      // Envoi réussi → on archive la réponse et on marque le message traité.
      $pdo->prepare('UPDATE contact_messages SET reply_body = ?, replied_at = ?, replied_by = ?, handled = 1 WHERE id = ?')
          ->execute([$reply, now_iso(), strtolower((string) ($u['email'] ?? '')), $seg[2]]);
      jout(['ok' => true]);
    }

    // Marquer un message de contact traité (ou le rouvrir avec {handled:false}).
    if (count($seg) === 3 && $seg[1] === 'contact-messages' && $method === 'POST') {
      $b = body();
      $handled = array_key_exists('handled', $b) ? (int) !empty($b['handled']) : 1;
      $pdo->prepare('UPDATE contact_messages SET handled = ? WHERE id = ?')->execute([$handled, $seg[2]]);
      jout(['ok' => true]);
    }

    // Supprimer un message de contact.
    if (count($seg) === 3 && $seg[1] === 'contact-messages' && $method === 'DELETE') {
      $pdo->prepare('DELETE FROM contact_messages WHERE id = ?')->execute([$seg[2]]);
      jout(['ok' => true]);
    }

    // Conversations (supervision) : parties, annonce, nb de messages, dernier message.
    if ($path === 'admin/conversations' && $method === 'GET') {
      $rows = $pdo->query('SELECT c.*, b.email AS buyer_email, s.email AS seller_email,
          l.title AS listing_title,
          (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id) AS msg_count,
          (SELECT m2.body FROM messages m2 WHERE m2.conversation_id = c.id ORDER BY m2.created_at DESC LIMIT 1) AS last_body
        FROM conversations c
        LEFT JOIN users b ON b.id = c.buyer_id
        LEFT JOIN users s ON s.id = c.seller_id
        LEFT JOIN listings l ON l.id = c.listing_id
        ORDER BY c.created_at DESC LIMIT 200')->fetchAll();
      jout(array_map(fn($r) => [
        'id' => $r['id'], 'buyerEmail' => $r['buyer_email'] ?: null, 'sellerEmail' => $r['seller_email'] ?: null,
        'listingTitle' => $r['listing_title'] ?: null, 'messages' => (int) $r['msg_count'],
        'lastMessage' => $r['last_body'] ?: null, 'createdAt' => iso_to_ms($r['created_at']),
      ], $rows));
    }

    // Avis (modération) : note, commentaire, auteur, vendeur, annonce.
    if ($path === 'admin/reviews' && $method === 'GET') {
      $rows = $pdo->query('SELECT r.*, ru.email AS reviewer_email, su.email AS seller_email,
          p.full_name AS reviewer_name, l.title AS listing_title
        FROM reviews r
        LEFT JOIN users ru ON ru.id = r.reviewer_id
        LEFT JOIN users su ON su.id = r.seller_id
        LEFT JOIN profiles p ON p.id = r.reviewer_id
        LEFT JOIN listings l ON l.id = r.listing_id
        ORDER BY r.created_at DESC LIMIT 200')->fetchAll();
      jout(array_map(fn($r) => [
        'id' => $r['id'], 'rating' => (int) $r['rating'], 'comment' => $r['comment'] ?: null,
        'reviewerName' => $r['reviewer_name'] ?: null, 'reviewerEmail' => $r['reviewer_email'] ?: null,
        'sellerEmail' => $r['seller_email'] ?: null, 'listingId' => $r['listing_id'],
        'listingTitle' => $r['listing_title'] ?: null, 'createdAt' => iso_to_ms($r['created_at']),
      ], $rows));
    }

    // Supprimer un avis abusif.
    if (count($seg) === 3 && $seg[1] === 'reviews' && $method === 'DELETE') {
      $pdo->prepare('DELETE FROM reviews WHERE id = ?')->execute([$seg[2]]);
      jout(['ok' => true]);
    }

    // Suivi des visiteurs (courbe par jour/semaine/mois/année).
    if ($path === 'admin/visits' && $method === 'GET') {
      $range = in_array($_GET['range'] ?? '', ['day', 'week', 'month', 'year'], true) ? $_GET['range'] : 'day';
      jout(visit_series($pdo, $range));
    }

    // Temps de réponse moyen aux messages.
    if ($path === 'admin/response-time' && $method === 'GET') {
      jout(avg_response_time($pdo));
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

    // Modérateurs : créés PAR l'admin avec un email, des fonctionnalités cochées
    // et un code d'accès personnel. (Section réservée au propriétaire via le gate.)
    if ($path === 'admin/moderators' && $method === 'GET') {
      $mods = array_map(fn($r) => [
        'email'       => $r['email'],
        'createdAt'   => iso_to_ms($r['created_at']),
        'permissions' => json_decode((string) ($r['permissions'] ?? '[]'), true) ?: [],
        'hasCode'     => !empty($r['access_code_hash']),
        'blocked'     => (int) ($r['blocked'] ?? 0) === 1,
      ], $pdo->query('SELECT email, created_at, permissions, access_code_hash, blocked FROM admins ORDER BY created_at DESC')->fetchAll());
      $feats = array_map(fn($k) => ['key' => $k, 'label' => admin_feature_labels()[$k] ?? $k], admin_grantable_features());
      jout(['owners' => owner_emails($config), 'moderators' => $mods, 'features' => $feats]);
    }
    if ($path === 'admin/moderators' && $method === 'POST') {
      $b = body();
      $email = strtolower(trim($b['email'] ?? ''));
      if (!filter_var($email, FILTER_VALIDATE_EMAIL)) jerr('Adresse email invalide.');
      if (in_array($email, owner_emails($config), true)) jerr('Cet email est déjà propriétaire du site.');
      // Permissions : on ne retient que les fonctionnalités réellement délégables.
      $grant = admin_grantable_features();
      $perms = array_values(array_intersect($grant, array_map('strval', (array) ($b['permissions'] ?? []))));
      $ex = $pdo->prepare('SELECT access_code_hash FROM admins WHERE email = ?'); $ex->execute([$email]);
      $exRow = $ex->fetch(); $already = (bool) $exRow;
      $codeHash = $already ? (string) ($exRow['access_code_hash'] ?? '') : '';
      // Code d'accès : fourni par l'admin, ou généré (à la création / si absent).
      $rawCode = strtoupper(trim((string) ($b['code'] ?? ''))); $shownCode = null;
      if ($rawCode !== '') {
        if (strlen($rawCode) < 6) jerr('Le code d’accès doit faire au moins 6 caractères.');
        $shownCode = $rawCode;
      } elseif (!$already || $codeHash === '') {
        $A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; $shownCode = '';
        for ($i = 0; $i < 8; $i++) { try { $r = random_int(0, 31); } catch (Throwable $e) { $r = mt_rand(0, 31); } $shownCode .= $A[$r]; }
      }
      if ($shownCode !== null) $codeHash = password_hash($shownCode, PASSWORD_BCRYPT);
      if ($already) {
        $pdo->prepare('UPDATE admins SET permissions = ?, access_code_hash = ? WHERE email = ?')
            ->execute([json_encode($perms), $codeHash, $email]);
      } else {
        $pdo->prepare('INSERT INTO admins (email, created_at, permissions, access_code_hash) VALUES (?,?,?,?)')
            ->execute([$email, now_iso(), json_encode($perms), $codeHash]);
      }
      admins_fp_save($config, $pdo); // changement légitime : met à jour la référence d'intégrité
      $emailed = send_moderator_email($config, $email); // notification (sans le code)
      log_security_event($pdo, $already ? 'moderator_updated' : 'moderator_added', $email);
      // Le code EN CLAIR n'est renvoyé qu'une fois (si (re)défini) pour que l'admin
      // le transmette au modérateur. Sinon `code` = null (permissions mises à jour).
      jout(['ok' => true, 'already' => $already, 'emailed' => $emailed, 'permissions' => $perms, 'code' => $shownCode]);
    }
    if ($path === 'admin/moderators' && $method === 'DELETE') {
      $b = body();
      $email = strtolower(trim($b['email'] ?? ''));
      if (in_array($email, owner_emails($config), true)) jerr('Le propriétaire ne peut pas être retiré.', 403);
      $pdo->prepare('DELETE FROM admins WHERE email = ?')->execute([$email]);
      admins_fp_save($config, $pdo); // changement légitime : met à jour la référence d'intégrité
      log_security_event($pdo, 'moderator_removed', $email);
      jout(['ok' => true]);
    }
    // Bloquer / débloquer un modérateur : coupe (ou rétablit) son accès au tableau
    // de bord. Bloqué = son jeton de déverrouillage ne vaut plus rien (accès révoqué
    // immédiatement) et il ne peut plus déverrouiller tant qu'il n'est pas débloqué.
    if ($path === 'admin/moderators/block' && $method === 'POST') {
      $b = body();
      $email = strtolower(trim($b['email'] ?? ''));
      if (in_array($email, owner_emails($config), true)) jerr('Le propriétaire ne peut pas être bloqué.', 403);
      $blocked = !empty($b['blocked']) ? 1 : 0;
      $pdo->prepare('UPDATE admins SET blocked = ? WHERE email = ?')->execute([$blocked, $email]);
      log_security_event($pdo, $blocked ? 'moderator_blocked' : 'moderator_unblocked', $email);
      jout(['ok' => true, 'blocked' => (bool) $blocked]);
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
      // Dernier passage réussi de chaque tâche, pour que le panneau puisse
      // afficher « il y a 2 h » ou « jamais » au lieu de laisser croire que tout
      // tourne. Clé = suffixe de la route (backup, cleanup…), comme le registre
      // CRON_JOBS côté interface.
      $runs = [];
      try {
        foreach ($pdo->query('SELECT path, last_ok_at, runs FROM cron_runs')->fetchAll() as $r) {
          $runs[substr((string) $r['path'], 5)] = [
            'lastOkAt' => $r['last_ok_at'],
            'runs'     => (int) $r['runs'],
          ];
        }
      } catch (Throwable $e) { /* table absente : on renvoie une liste vide */ }
      // Depuis quand cette trace existe-t-elle ? Sans cette date, une tâche dont
      // l'heure n'est pas encore venue paraît « en panne » alors qu'elle attend
      // simplement son tour — et le panneau crie au loup dès le déploiement.
      $since = null;
      try { $since = $pdo->query('SELECT MIN(last_ok_at) FROM cron_runs')->fetchColumn() ?: null; }
      catch (Throwable $e) { /* table absente */ }
      jout([
        'cronKey'      => $config['cron_key'] ?? '',
        'site'         => rtrim($config['site_url'] ?? 'https://chap.ci', '/'),
        'runs'         => $runs,
        'trackedSince' => $since,
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

  // ---- Défense en profondeur commune aux endpoints cron/* -------------------
  // Avant tout traitement : on ralentit un balayage de clé. La clé reste forte
  // (32 octets, non devinable) ; ceci limite juste les ESSAIS ratés par IP. Un
  // cron légitime (bonne clé) n'est jamais compté ni pénalisé.
  if (str_starts_with($path, 'cron/')) {
    rate_limit($pdo, 'cron_fail', null, 20, 600); // max 20 échecs / 10 min / IP
    // Clé cron : DE PRÉFÉRENCE dans l'en-tête X-Cron-Key (n'apparaît pas dans
    // les journaux d'accès serveur/CDN), sinon en repli ?key= (tâches cPanel
    // qui ne peuvent pas poser d'en-tête), sinon corps JSON (POST report-email).
    $cronKey = (string) ($_SERVER['HTTP_X_CRON_KEY'] ?? '');
    if ($cronKey === '' && function_exists('apache_request_headers')) {
      foreach (apache_request_headers() as $hk => $hv) {
        if (strcasecmp($hk, 'X-Cron-Key') === 0) { $cronKey = (string) $hv; break; }
      }
    }
    if ($cronKey === '') $cronKey = (string) ($_GET['key'] ?? '');
    if ($cronKey === '' && $method === 'POST') $cronKey = (string) (body()['key'] ?? '');
    if (!hash_equals((string) ($config['cron_key'] ?? '__none__'), $cronKey)) {
      log_security_event($pdo, 'cron_fail', null, $path);
      jerr('Clé invalide.', 403);
    }
    // Trace du passage. On l'écrit ICI, à l'authentification réussie, et non à la
    // fin du traitement : ce qu'il s'agit de détecter, c'est une tâche qui ne
    // s'exécute plus DU TOUT — cron absent, clé périmée, commande mal écrite.
    // C'est exactement ce qui est arrivé à la sauvegarde quotidienne, muette
    // pendant douze jours. Une tâche qui passe ici mais échoue ensuite se
    // signalerait autrement (erreur 500, e-mail manquant).
    try {
      $st = $pdo->prepare('UPDATE cron_runs SET last_ok_at = ?, runs = COALESCE(runs,0) + 1 WHERE path = ?');
      $st->execute([now_iso(), $path]);
      if ($st->rowCount() === 0) {
        $pdo->prepare('INSERT INTO cron_runs (path,last_ok_at,runs) VALUES (?,?,1)')
            ->execute([$path, now_iso()]);
      }
    } catch (Throwable $e) { /* la trace ne doit jamais empêcher la tâche de tourner */ }
  }

  // ---------- TÂCHE PLANIFIÉE : offres du jour / de la semaine ----------
  // Appelée par une tâche cron cPanel. Authentifiée par clé (pas de JWT).
  if ($path === 'cron/digest' && $method === 'GET') {
    // Redondance défensive : réutilise la clé résolue par le portail cron/*
    // ci-dessus (en-tête X-Cron-Key ou ?key=).
    if (!hash_equals((string) ($config['cron_key'] ?? '__none__'), $cronKey ?? '')) {
      jerr('Clé invalide.', 403);
    }
    $type = (($_GET['type'] ?? 'daily') === 'weekly') ? 'weekly' : 'daily';
    jout(send_digest($config, $pdo, $type));
  }

  // ---------- TÂCHE PLANIFIÉE : Bureau de Croissance SEO (1 diffusion / jour) ----------
  // Publie automatiquement UNE diffusion animée par jour sur l'écran publicitaire,
  // selon les objectifs du site. Idempotent : une seule création par jour civil.
  if ($path === 'cron/seo' && $method === 'GET') {
    // Redondance défensive : réutilise la clé résolue par le portail cron/*.
    if (!hash_equals((string) ($config['cron_key'] ?? '__none__'), $cronKey ?? '')) {
      jerr('Clé invalide.', 403);
    }
    if (!seo_auto_enabled($config)) jout(['skipped' => 'disabled']);
    $today = gmdate('Y-m-d');
    // Déjà une diffusion SEO aujourd'hui ? On ne double pas.
    $ex = $pdo->prepare("SELECT COUNT(*) FROM ads WHERE kind = 'seo' AND substr(created_at,1,10) = ?");
    $ex->execute([$today]);
    if ((int) $ex->fetchColumn() > 0) jout(['skipped' => 'already_today']);
    // Expire les diffusions SEO de la veille (une seule à l'écran à la fois).
    $pdo->prepare("UPDATE ads SET status = 'expired' WHERE kind = 'seo' AND status = 'active'")->execute([]);
    $b = seo_daily_broadcast($config, $pdo);
    $id = uuid(); $now = now_iso();
    // Active ~26 h : léger chevauchement pour qu'il y ait toujours une diffusion.
    $expires = gmdate('Y-m-d\TH:i:s\Z', time() + 26 * 3600);
    $pdo->prepare('INSERT INTO ads (id,user_id,title,description,link,images,formule,qty,price,pay_method,pay_number,status,starts_at,expires_at,ip,created_at,kind,style,anim,anim_loop)
                   VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)')
        ->execute([$id, null, $b['title'], $b['description'], $b['link'] ?? '', json_encode([]), 'day', 1,
                   0, '', '', 'active', $now, $expires, 'cron', $now, 'seo', $b['style'], $b['anim'], '1']);
    jout(['ok' => true, 'id' => $id, 'goal' => $b['goal'], 'title' => $b['title'], 'style' => $b['style'], 'anim' => $b['anim']]);
  }

  // ---------- TÂCHE PLANIFIÉE : rappel d'expiration des publicités ----------
  // Prévient l'annonceur ~3 jours avant la fin pour qu'il renouvelle (1 seul rappel).
  if ($path === 'cron/ads-expiring' && $method === 'GET') {
    if (!hash_equals((string) ($config['cron_key'] ?? '__none__'), $cronKey ?? '')) {
      jerr('Clé invalide.', 403);
    }
    @set_time_limit(0);
    $now = now_iso();
    // « echecs » compte les envois DUS qui n'ont pas pu partir. Sans lui, un
    // relevé à 0/0/0 se lit « rien à envoyer » aussi bien que « la messagerie
    // est tombée » — deux situations opposées, et seule la seconde est grave.
    $res = ['rapports' => 0, 'veille' => 0, 'terminees' => 0, 'echecs' => 0];

    // ── 1. RAPPORT D'AUDIENCE tous les 3 jours ─────────────────────────────
    // On vend de la visibilité : un annonceur doit voir ce qu'il achète, sans
    // avoir à le demander. C'est aussi le meilleur moment pour proposer une
    // prolongation — quand les chiffres sont sous ses yeux.
    $il3j = gmdate('Y-m-d\TH:i:s\Z', time() - 3 * 86400);
    $st = $pdo->prepare("SELECT * FROM ads
      WHERE status = 'active' AND email IS NOT NULL AND email <> '' AND expires_at > ?
        AND (last_report_at IS NULL OR last_report_at = '' OR last_report_at <= ?)");
    $st->execute([$now, $il3j]);
    foreach ($st->fetchAll() as $ad) {
      @set_time_limit(30);
      if (send_ad_status_email($config, $ad, 'report', $pdo)) $res['rapports']++; else $res['echecs']++;
      $pdo->prepare('UPDATE ads SET last_report_at = ? WHERE id = ?')->execute([now_iso(), $ad['id']]);
    }

    // ── 2. LA VEILLE de la fin ─────────────────────────────────────────────
    // Avant : 3 jours avant, sans heure. Un annonceur qui veut prolonger a
    // besoin de savoir à quelle HEURE sa bannière tombe, et d'être prévenu
    // assez tard pour que l'information soit encore d'actualité.
    $demain = gmdate('Y-m-d\TH:i:s\Z', time() + 86400);
    $st = $pdo->prepare("SELECT * FROM ads
      WHERE status = 'active' AND email IS NOT NULL AND email <> ''
        AND (expiry_notified IS NULL OR expiry_notified <> '1')
        AND expires_at > ? AND expires_at <= ?");
    $st->execute([$now, $demain]);
    foreach ($st->fetchAll() as $ad) {
      @set_time_limit(30);
      if (send_ad_status_email($config, $ad, 'expiring', $pdo)) $res['veille']++; else $res['echecs']++;
      $pdo->prepare("UPDATE ads SET expiry_notified = '1' WHERE id = ?")->execute([$ad['id']]);
    }

    // ── 3. TERMINÉES : bilan complet, une seule fois ───────────────────────
    $st = $pdo->prepare("SELECT * FROM ads
      WHERE status = 'active' AND expires_at IS NOT NULL AND expires_at <= ?
        AND (expired_notified IS NULL OR expired_notified <> '1')");
    $st->execute([$now]);
    foreach ($st->fetchAll() as $ad) {
      @set_time_limit(30);
      if (send_ad_status_email($config, $ad, 'expired', $pdo)) $res['terminees']++; else $res['echecs']++;
      // Le statut passe à « expired » ici : la bannière quitte l'écran et
      // l'annonceur reçoit son bilan dans le même mouvement.
      $pdo->prepare("UPDATE ads SET status = 'expired', expired_notified = '1' WHERE id = ?")
          ->execute([$ad['id']]);
    }

    jout($res);
  }



  // ---------- RELANCE D'ACTIVATION : inscrits sans annonce ----------
  // Invite (UNE seule fois) les comptes créés depuis ≥ 3 jours, sans aucune
  // annonce, à publier leur première. Authentifié par la clé cron. Chaque envoi
  // est marqué (activation_emailed) → jamais deux fois, jamais de spam.
  if ($path === 'cron/activation-relance' && $method === 'GET') {
    if (!hash_equals((string) ($config['cron_key'] ?? '__none__'), $cronKey ?? '')) {
      jerr('Clé invalide.', 403);
    }
    $before = gmdate('Y-m-d\TH:i:s\Z', time() - 3 * 86400); // inscrit il y a ≥ 3 jours
    $st = $pdo->prepare("SELECT u.id, u.email FROM users u
      WHERE u.email IS NOT NULL AND u.email <> ''
        AND (u.status IS NULL OR u.status NOT IN ('blocked','restricted'))
        AND u.activation_emailed IS NULL
        AND u.created_at <= ?
        AND NOT EXISTS (SELECT 1 FROM listings l WHERE l.user_id = u.id)
      ORDER BY u.created_at ASC LIMIT 200");
    $st->execute([$before]);
    $rows = $st->fetchAll();
    $site = rtrim($config['site_url'] ?? 'https://chap.ci', '/');
    @set_time_limit(0);
    $sent = 0;
    foreach ($rows as $u) {
      @set_time_limit(30);
      $inner = '<h2 style="margin:0 0 6px">Vendez votre premier article sur Chap.ci 🇨🇮</h2>'
        . '<p style="color:#374151;margin:0 0 14px">Bonjour,<br>Vous avez un téléphone, un vêtement, un meuble ou un service à proposer ? '
        . 'Sur Chap.ci, publier une annonce est <b>100&nbsp;% gratuit</b> et prend <b>moins de 2&nbsp;minutes</b> — '
        . 'des milliers d\'Ivoiriens cherchent des bonnes affaires près de chez eux.</p>'
        . '<p style="margin:0 0 16px">' . email_button($site . '/#/publier', 'Publier une annonce gratuitement') . '</p>'
        . '<p style="color:#6b7280;font-size:13px;margin:0">C\'est rapide, sûr, et vous gérez tout depuis votre compte. À très vite sur Chap.ci&nbsp;! 🧡💚</p>';
      $html = email_layout($config, $inner, 'Publiez votre première annonce, c\'est gratuit');
      if (send_mail($config, (string) $u['email'], 'Vendez votre premier article sur Chap.ci 🇨🇮', $html)) $sent++;
      // Marqué dans tous les cas → une seule tentative par compte (comme les autres relances).
      $pdo->prepare('UPDATE users SET activation_emailed = ? WHERE id = ?')->execute([now_iso(), $u['id']]);
    }
    jout(['checked' => count($rows), 'emailed' => $sent]);
  }

  // ---------- MODÉRATION AUTOMATIQUE — jeton de service cloisonné ----------
  // « Le Gardien » (routine) s'authentifie avec un JETON DE SERVICE de périmètre
  // 'moderation' (en-tête X-Service-Token UNIQUEMENT — jamais en query-string,
  // pour éviter toute fuite du jeton dans les journaux/URL). Ce jeton n'ouvre QUE ces
  // routes : lire la file, masquer, signaler. JAMAIS de compte, réglage ni sauvegarde.
  if ($path === 'mod/queue' && $method === 'GET') {
    $tok = require_service_token($pdo, 'moderation');
    $limit = min(200, max(1, (int) ($_GET['limit'] ?? 80)));
    $shape = function (array $l): array {
      $imgs = json_decode((string) ($l['images'] ?? '[]'), true); if (!is_array($imgs)) $imgs = [];
      return [
        'id'          => $l['id'],
        'title'       => (string) ($l['title'] ?? ''),
        'description' => mb_substr((string) ($l['description'] ?? ''), 0, 1200),
        'price'       => (int) ($l['price'] ?? 0),
        'category'    => (string) ($l['category_id'] ?? ''),
        'images'      => array_slice(array_values(array_filter($imgs, 'is_string')), 0, 4),
        'imageCount'  => count($imgs),
        'sellerId'    => $l['user_id'] ?? null,
        'hidden'      => !empty($l['hidden']),
        'createdAt'   => iso_to_ms($l['created_at'] ?? null),
        'risk'        => moderation_risk($l),
      ];
    };
    // 1) Signalements ouverts (priorité) + l'annonce liée.
    $rp = $pdo->query("SELECT r.id AS report_id, r.listing_id, r.reason, r.details, r.created_at AS reported_at,
        l.id, l.title, l.description, l.price, l.category_id, l.images, l.hidden, l.user_id, l.created_at
      FROM reports r LEFT JOIN listings l ON l.id = r.listing_id
      WHERE r.status = 'open' ORDER BY r.created_at DESC LIMIT 200")->fetchAll();
    $reports = array_map(function ($r) use ($shape) {
      return [
        'reportId'   => $r['report_id'],
        'listingId'  => $r['listing_id'],
        'reason'     => $r['reason'],
        'details'    => $r['details'],
        'reportedAt' => iso_to_ms($r['reported_at']),
        'listing'    => $r['id'] ? $shape($r) : null,
      ];
    }, $rp);
    // 2) Annonces récentes visibles jamais encore examinées par la modération auto
    //    (ni action dans mod_actions, ni marquage « vue/RAS » dans mod_seen).
    $st = $pdo->prepare("SELECT l.id, l.title, l.description, l.price, l.category_id, l.images, l.hidden, l.user_id, l.created_at
      FROM listings l
      WHERE (l.hidden IS NULL OR l.hidden = 0)
        AND l.id NOT IN (SELECT listing_id FROM mod_actions WHERE listing_id IS NOT NULL)
        AND l.id NOT IN (SELECT listing_id FROM mod_seen)
      ORDER BY l.created_at DESC LIMIT " . (int) $limit);
    $st->execute();
    $recent = array_map($shape, $st->fetchAll());
    jout([
      'reports' => $reports,
      'recent'  => $recent,
      'counts'  => ['reports' => count($reports), 'recent' => count($recent)],
      'guide'   => 'Authentification: en-tête HTTP X-Service-Token. Masquer: POST /api/mod/hide {listingId,reason,confidence}. Signaler: POST /api/mod/flag {listingId,reason,details}. Marquer examinées-OK (pour ne plus les revoir): POST /api/mod/seen {listingIds:[]}. Digest: POST /api/mod/digest {examined,hidden:[],flagged:[],notes}.',
    ]);
  }
  // Masquer une annonce (cas à haute confiance : illégal / NSFW). Idempotent + audité.
  if ($path === 'mod/hide' && $method === 'POST') {
    $tok = require_service_token($pdo, 'moderation');
    $b = body();
    $lid = trim((string) ($b['listingId'] ?? ''));
    if ($lid === '') jerr('listingId requis.');
    $reason = mb_substr(trim((string) ($b['reason'] ?? '')), 0, 300) ?: 'Modération automatique';
    $conf   = mb_substr(trim((string) ($b['confidence'] ?? 'high')), 0, 20);
    $st = $pdo->prepare('SELECT id, hidden FROM listings WHERE id = ?'); $st->execute([$lid]);
    $row = $st->fetch();
    if (!$row) jerr('Annonce introuvable.', 404);
    $already = !empty($row['hidden']);
    if (!$already) $pdo->prepare('UPDATE listings SET hidden = 1 WHERE id = ?')->execute([$lid]);
    mod_audit($pdo, $tok['id'], 'hide', $lid, $reason, $conf, ['already' => $already]);
    jout(['ok' => true, 'listingId' => $lid, 'alreadyHidden' => $already]);
  }
  // Signaler une annonce (cas douteux) → signalement ouvert pour revue humaine. Anti-doublon.
  if ($path === 'mod/flag' && $method === 'POST') {
    $tok = require_service_token($pdo, 'moderation');
    $b = body();
    $lid = trim((string) ($b['listingId'] ?? ''));
    $reason = mb_substr(trim((string) ($b['reason'] ?? '')), 0, 80);
    $details = mb_substr(trim((string) ($b['details'] ?? '')), 0, 500);
    if ($lid === '' || $reason === '') jerr('listingId et reason requis.');
    $st = $pdo->prepare('SELECT id FROM listings WHERE id = ?'); $st->execute([$lid]);
    if (!$st->fetch()) jerr('Annonce introuvable.', 404);
    $ex = $pdo->prepare("SELECT COUNT(*) FROM reports WHERE listing_id = ? AND status = 'open' AND reporter_id = 'moderation-bot'");
    $ex->execute([$lid]);
    $created = false;
    if ((int) $ex->fetchColumn() === 0) {
      $pdo->prepare('INSERT INTO reports (id,listing_id,reporter_id,reason,details,status,created_at) VALUES (?,?,?,?,?,?,?)')
          ->execute([uuid(), $lid, 'moderation-bot', $reason, $details ?: null, 'open', now_iso()]);
      $created = true;
    }
    mod_audit($pdo, $tok['id'], 'flag', $lid, $reason . ($details ? ' — ' . $details : ''), 'medium', ['created' => $created]);
    jout(['ok' => true, 'listingId' => $lid, 'created' => $created]);
  }
  // Marquer des annonces « examinées et OK » → elles ne reviennent plus dans la file.
  // (N'entre PAS dans le journal d'audit : réservé aux vraies actions hide/flag.)
  if ($path === 'mod/seen' && $method === 'POST') {
    $tok = require_service_token($pdo, 'moderation');
    $b = body();
    $ids = array_values(array_unique(array_filter(array_map(fn($x) => trim((string) $x), (array) ($b['listingIds'] ?? [])))));
    $ids = array_slice($ids, 0, 500);
    $ins = $pdo->prepare('INSERT INTO mod_seen (listing_id, created_at) VALUES (?, ?)');
    $marked = 0;
    foreach ($ids as $lid) {
      try { $ins->execute([$lid, now_iso()]); $marked++; }
      catch (Throwable $e) { /* déjà marquée (clé primaire) : on ignore */ }
    }
    jout(['ok' => true, 'marked' => $marked]);
  }
  // Envoyer le digest de modération aux propriétaires + modérateurs.
  if ($path === 'mod/digest' && $method === 'POST') {
    $tok = require_service_token($pdo, 'moderation');
    $b = body();
    $examined = max(0, (int) ($b['examined'] ?? 0));
    $hidden  = array_values(array_filter((array) ($b['hidden'] ?? []), 'is_array'));
    $flagged = array_values(array_filter((array) ($b['flagged'] ?? []), 'is_array'));
    $notes   = mb_substr(trim((string) ($b['notes'] ?? '')), 0, 2000);
    if (!$hidden && !$flagged && $notes === '') {
      mod_audit($pdo, $tok['id'], 'digest', null, 'RAS', '', ['examined' => $examined]);
      jout(['ok' => true, 'emailed' => 0, 'skipped' => true]);
    }
    $esc  = fn($s) => htmlspecialchars((string) $s, ENT_QUOTES, 'UTF-8');
    $site = rtrim($config['site_url'] ?? 'https://chap.ci', '/');
    $listHtml = function (array $items, string $emptyMsg) use ($esc, $site): string {
      if (!$items) return '<p style="color:#8a94a6;margin:4px 0 0">' . $esc($emptyMsg) . '</p>';
      $out = '';
      foreach (array_slice($items, 0, 50) as $it) {
        $id = (string) ($it['listingId'] ?? ($it['id'] ?? ''));
        $link = $id ? $site . '/#/annonce/' . rawurlencode($id) : '';
        $out .= '<div style="border:1px solid #eef0f2;border-radius:10px;padding:10px 12px;margin:6px 0">'
              . '<div style="font-weight:600;color:#1a1f2b">' . $esc($it['title'] ?? '(sans titre)') . '</div>'
              . (isset($it['reason']) && $it['reason'] !== '' ? '<div style="font-size:13px;color:#6b7280;margin-top:2px">' . $esc($it['reason']) . '</div>' : '')
              . ($link ? '<a href="' . $esc($link) . '" style="font-size:12px;color:#e8590c">Voir l’annonce →</a>' : '')
              . '</div>';
      }
      return $out;
    };
    $inner = '<h2 style="margin:0 0 4px">🛡️ Modération automatique — récapitulatif</h2>'
      . '<p style="color:#6b7280;margin:0 0 14px">' . (int) $examined . ' annonce(s) examinée(s) · '
      . count($hidden) . ' masquée(s) · ' . count($flagged) . ' signalée(s) pour revue humaine.</p>'
      . '<h3 style="margin:14px 0 2px;color:#b42318">Masquées automatiquement (haute confiance)</h3>'
      . $listHtml($hidden, 'Aucune annonce masquée automatiquement.')
      . '<h3 style="margin:16px 0 2px;color:#b54708">À vérifier (signalées)</h3>'
      . $listHtml($flagged, 'Rien à vérifier manuellement.')
      . ($notes !== '' ? '<h3 style="margin:16px 0 2px">Notes du Gardien</h3><p style="color:#374151;white-space:pre-wrap">' . $esc($notes) . '</p>' : '')
      . '<p style="margin-top:16px">' . email_button($site . '/#/admin', 'Ouvrir le tableau de bord') . '</p>';
    $html = email_layout($config, $inner, 'Récapitulatif de modération Chap.ci');
    $recips = moderation_notify_recipients($config, $pdo);
    $sent = 0;
    foreach ($recips as $to) { if (send_mail($config, $to, 'Chap.ci — modération auto (' . count($hidden) . ' masquée(s), ' . count($flagged) . ' à vérifier)', $html)) $sent++; }
    mod_audit($pdo, $tok['id'], 'digest', null, 'Digest envoyé', '', ['examined' => $examined, 'hidden' => count($hidden), 'flagged' => count($flagged), 'emailed' => $sent]);
    jout(['ok' => true, 'emailed' => $sent, 'recipients' => count($recips)]);
  }

  // ---------- TÂCHE PLANIFIÉE : suggestions personnalisées (2×/semaine) ----------
  if ($path === 'cron/suggestions' && $method === 'GET') {
    if (!hash_equals((string) ($config['cron_key'] ?? '__none__'), $cronKey ?? '')) {
      jerr('Clé invalide.', 403);
    }
    $users = $pdo->query('SELECT DISTINCT ui.user_id AS id, u.email
      FROM user_interests ui JOIN users u ON u.id = ui.user_id')->fetchAll();
    @set_time_limit(0); // envois potentiellement longs : pas de timeout à l'échelle
    $reached = 0; $emailed = 0;
    foreach ($users as $usr) {
      @set_time_limit(30); // réarme le budget à chaque utilisateur
      $r = send_suggestions($config, $pdo, $usr);
      $reached++;
      if ($r['sent']) $emailed++;
    }
    jout(['users' => $reached, 'emailed' => $emailed]);
  }

  // ---------- TÂCHE PLANIFIÉE : alertes « recherches sauvegardées » ----------
  // Pour chaque alerte, on cherche les annonces publiées depuis la dernière
  // notification. S'il y en a, on prévient par email et on avance le curseur.
  if ($path === 'cron/alerts' && $method === 'GET') {
    if (!hash_equals((string) ($config['cron_key'] ?? '__none__'), $cronKey ?? '')) {
      jerr('Clé invalide.', 403);
    }
    $searches = $pdo->query('SELECT s.*, u.email FROM saved_searches s JOIN users u ON u.id = s.user_id')->fetchAll();
    @set_time_limit(0); // envois potentiellement longs : pas de timeout à l'échelle
    $checked = 0; $emailed = 0; $matched = 0;
    foreach ($searches as $s) {
      @set_time_limit(30); // réarme le budget à chaque alerte
      $checked++;
      $rows = search_matching_listings($pdo, (string) $s['params'], (string) ($s['last_notified_at'] ?? ''));
      if ($rows) {
        $rows = array_slice($rows, 0, 8);
        $matched += count($rows);
        if (send_search_alert($config, ['email' => $s['email']], (string) $s['label'], $rows, (string) $s['params'])) $emailed++;
      }
      // On avance toujours le curseur (évite de renvoyer les mêmes annonces).
      $pdo->prepare('UPDATE saved_searches SET last_notified_at = ? WHERE id = ?')->execute([now_iso(), $s['id']]);
    }
    jout(['searches' => $checked, 'matched' => $matched, 'emailed' => $emailed]);
  }

  // ---------- STATISTIQUES POUR LE RAPPORT D'ACTIVITÉ (routine hebdo) ----------
  // Agrégats anonymes (aucune donnée personnelle). Authentifié par la clé cron.
  if ($path === 'cron/stats' && $method === 'GET') {
    if (!hash_equals((string) ($config['cron_key'] ?? '__none__'), $cronKey ?? '')) {
      jerr('Clé invalide.', 403);
    }
    $days = max(1, min(90, (int) ($_GET['days'] ?? 7)));
    $since = gmdate('Y-m-d\TH:i:s\Z', time() - $days * 86400);
    $one = function (string $sql, array $p = []) use ($pdo) {
      $st = $pdo->prepare($sql); $st->execute($p); return (int) $st->fetchColumn();
    };
    $topCats = $pdo->prepare('SELECT category_id, COUNT(*) AS n FROM listings WHERE created_at >= ? GROUP BY category_id ORDER BY n DESC LIMIT 5');
    $topCats->execute([$since]);
    // Chaque page est scindée en « vues connectées » / « vues visiteur ». C'est ce
    // qui rend /publier interprétable : beaucoup de visiteurs = le mur est la
    // création de compte ; beaucoup de connectés = le mur est le formulaire.
    // (`n` reste en tête pour ne rien casser chez les consommateurs existants.)
    $topPaths = $pdo->prepare(
      'SELECT path, COUNT(*) AS n,
              SUM(CASE WHEN authed = 1 THEN 1 ELSE 0 END) AS connectes,
              SUM(CASE WHEN authed = 0 THEN 1 ELSE 0 END) AS visiteurs,
              SUM(CASE WHEN authed IS NULL THEN 1 ELSE 0 END) AS inconnu
       FROM visits WHERE created_at >= ? GROUP BY path ORDER BY n DESC LIMIT 8');
    $topPaths->execute([$since]);
    jout([
      'periodDays' => $days,
      'since'      => $since,
      'users'      => [
        'total' => $one('SELECT COUNT(*) FROM users'),
        'new'   => $one('SELECT COUNT(*) FROM users WHERE created_at >= ?', [$since]),
      ],
      'listings'   => [
        'active' => $one('SELECT COUNT(*) FROM listings WHERE (hidden IS NULL OR hidden = 0) AND (sold IS NULL OR sold = 0)'),
        'new'    => $one('SELECT COUNT(*) FROM listings WHERE created_at >= ?', [$since]),
        'sold'   => $one('SELECT COUNT(*) FROM listings WHERE sold = 1'),
        'hidden' => $one('SELECT COUNT(*) FROM listings WHERE hidden = 1'),
      ],
      'messages'   => [
        'new'              => $one('SELECT COUNT(*) FROM messages WHERE created_at >= ?', [$since]),
        'newConversations' => $one('SELECT COUNT(*) FROM conversations WHERE created_at >= ?', [$since]),
      ],
      'orders'     => ['new' => $one('SELECT COUNT(*) FROM orders WHERE created_at >= ?', [$since])],
      'reviews'    => ['new' => $one('SELECT COUNT(*) FROM reviews WHERE created_at >= ?', [$since])],
      'reports'    => ['new' => $one('SELECT COUNT(*) FROM reports WHERE created_at >= ?', [$since])],
      'newsletter' => ['total' => $one('SELECT COUNT(*) FROM newsletter')],
      'visits'     => [
        'total'    => $one('SELECT COUNT(*) FROM visits WHERE created_at >= ?', [$since]),
        'visitors' => $one('SELECT COUNT(DISTINCT visitor_id) FROM visits WHERE created_at >= ?', [$since]),
        'topPages' => $topPaths->fetchAll(),
      ],
      'topCategories' => $topCats->fetchAll(),
    ]);
  }

  // ---------- SYNTHÈSE SÉCURITÉ (Le Greffier — journal d'audit) ----------
  // Compteurs d'événements + IP les plus actives sur les échecs. Clé cron.
  if ($path === 'cron/security' && $method === 'GET') {
    if (!hash_equals((string) ($config['cron_key'] ?? '__none__'), $cronKey ?? '')) {
      jerr('Clé invalide.', 403);
    }
    $days = max(1, min(90, (int) ($_GET['days'] ?? 1)));
    $since = gmdate('Y-m-d\TH:i:s\Z', time() - $days * 86400);
    $sec = security_stats($pdo, $config, $since);

    // On rassemble tous les motifs d'alerte dans une seule liste → un seul email.
    $alerts = [];

    // (a) Intégrité de la table admins : une ligne « admin » ajoutée AUTREMENT que
    // par le tableau de bord (injection, accès direct à la base) casse l'empreinte.
    $fp = admins_fp_file($config);
    $expected = @is_readable($fp) ? trim((string) @file_get_contents($fp)) : '';
    $adminsTampered = false; $currentAdmins = [];
    if ($expected === '') {
      admins_fp_save($config, $pdo); // 1re exécution : on établit la référence
    } elseif (!hash_equals($expected, admins_fingerprint($pdo))) {
      $adminsTampered = true;
      $currentAdmins = $pdo->query('SELECT email FROM admins ORDER BY email')->fetchAll(PDO::FETCH_COLUMN);
      $alerts[] = 'Liste des administrateurs modifiée HORS du tableau de bord (injection / accès direct '
                . 'à la base). Comptes actuels : ' . (implode(', ', $currentAdmins) ?: '(aucun)') . '.';
      log_security_event($pdo, 'admins_tampered', null, implode(',', $currentAdmins));
    }

    // (b) Seuils d'activité suspecte (surchargeable via config['security_alerts']).
    $thr       = $config['security_alerts'] ?? [];
    $loginFail  = (int) $sec['loginFail'];
    $unlockFail = (int) ($sec['counts']['admin_unlock_fail'] ?? 0);
    $mfaFail    = (int) ($sec['counts']['mfa_fail'] ?? 0);
    $nSusp      = count($sec['suspicious']);
    if ($loginFail  >= (int) ($thr['login_fail']        ?? 30)) $alerts[] = "Pic de connexions échouées : $loginFail sur $days j.";
    if ($unlockFail >= (int) ($thr['admin_unlock_fail'] ?? 3))  $alerts[] = "Tentatives de déverrouillage admin ratées : $unlockFail (compte admin peut-être compromis).";
    if ($mfaFail    >= (int) ($thr['mfa_fail']          ?? 5))  $alerts[] = "Échecs de code 2FA répétés : $mfaFail.";
    if ($nSusp      >= (int) ($thr['suspicious_ips']    ?? 3)) {
      $top = array_slice(array_map(fn($x) => $x['ip'] . ' (' . $x['n'] . ')', $sec['suspicious']), 0, 5);
      $alerts[] = "$nSusp IP suspectes (≥ 5 échecs) : " . implode(', ', $top) . '.';
    }

    // Un SEUL email récapitulatif, throttlé à 1×/24 h (anti-spam) via le journal d'audit.
    if ($alerts) {
      $recent = $pdo->prepare("SELECT COUNT(*) FROM security_events WHERE kind = 'security_alert' AND created_at >= ?");
      $recent->execute([gmdate('Y-m-d\TH:i:s\Z', time() - 86400)]);
      if ((int) $recent->fetchColumn() === 0) {
        $items = '<ul><li>' . implode('</li><li>', array_map('htmlspecialchars', $alerts)) . '</li></ul>';
        $html = '<p><b>⚠️ Alerte sécurité Chap.ci</b></p>'
              . '<p>Le scan de sécurité a détecté <b>' . count($alerts) . ' point(s)</b> à vérifier :</p>' . $items
              . '<p>Connectez-vous au tableau de bord pour investiguer (onglet Aperçu / Visiteurs). En cas de '
              . 'doute sur un compte admin, ouvrez <b>Modérateurs</b>. Si un intrus y figure, supprimez-le ; '
              . 'en cas de doute sérieux, changez le mot de passe de la base.</p>';
        foreach (security_notify_recipients($config) as $to) { send_mail($config, $to, 'Chap.ci — ⚠️ alerte sécurité', $html); }
        log_security_event($pdo, 'security_alert', null, implode(' | ', $alerts));
      }
    }

    jout([
      'periodDays'      => $days,
      'since'           => $since,
      'counts'          => $sec['counts'],
      'suspiciousIps'   => $sec['suspicious'],
      'failRatio'       => $sec['ratio'],
      'loginFail'       => $loginFail,
      'adminUnlockFail' => $unlockFail,
      'mfaFail'         => $mfaFail,
      'rateLimited'     => $sec['counts']['rate_limited'] ?? 0,
      'newSignups'      => $sec['counts']['signup'] ?? 0,
      // Quelle route échoue, et combien de fois. Sans ce détail, un compteur
      // cron_fail qui monte ne dit pas s'il s'agit d'une tâche cassée ou d'un
      // balayage extérieur — les deux se corrigent très différemment.
      'byDetail'        => $sec['byDetail'],
      // Ce que la CSP aurait bloqué si elle n'était pas en mode rapport.
      // Tant que cette liste contient des origines légitimes, la durcir
      // casserait le site : c'est le relevé qui dit quand on peut le faire.
      //
      // ⚠️ LA FENÊTRE EST INDISPENSABLE, et son absence a déjà trompé un bureau.
      // La table csp_reports est un COMPTEUR CUMULÉ (une ligne par origine, un
      // « n » qui monte depuis le 27/07). Servie sans borne de temps, elle se
      // lisait comme l'activité du jour : le 29/07, le Gardien a proposé
      // d'autoriser quatre origines dont TROIS l'étaient déjà depuis deux jours.
      // Leurs lignes ne bougeaient plus — il regardait un vestige.
      //
      // On ne renvoie donc que ce qui a été revu RÉCEMMENT, et l'on annonce la
      // fenêtre dans la réponse. Une origine corrigée disparaît d'elle-même du
      // relevé au bout de sept jours : c'est ainsi que le relevé dit la vérité
      // sans qu'on ait à purger la table ni à se souvenir de rien.
      'cspFenetreJours' => 7,
      'cspViolations'   => (function () use ($pdo) {
        try {
          $st = $pdo->prepare('SELECT directive, blocked, n, first_at, last_at FROM csp_reports
                               WHERE last_at >= ? ORDER BY last_at DESC, n DESC LIMIT 20');
          $st->execute([gmdate('Y-m-d\TH:i:s\Z', time() - 7 * 86400)]);
          return $st->fetchAll(PDO::FETCH_ASSOC);
        } catch (Throwable $e) { return []; }
      })(),
      // Le cumul reste disponible, mais NOMMÉ pour ce qu'il est : un historique.
      'cspViolationsHistorique' => (function () use ($pdo) {
        try {
          return $pdo->query('SELECT directive, blocked, n, last_at FROM csp_reports ORDER BY n DESC LIMIT 20')
                     ->fetchAll(PDO::FETCH_ASSOC);
        } catch (Throwable $e) { return []; }
      })(),
      'ignoredIps'      => $config['security_ignore_ips'] ?? [],
      // Intégrité des rôles admin : « ok » ou « ALTÉRÉE » (+ liste si altérée).
      'adminsIntegrity' => $adminsTampered ? 'ALTÉRÉE' : 'ok',
      'adminsTampered'  => $adminsTampered,
      'currentAdmins'   => $currentAdmins,
      // Motifs d'alerte de ce scan (vide = rien à signaler).
      'alerts'          => $alerts,
    ]);
  }

  // ---------- MÉNAGE / MAINTENANCE (L'Intendant) ----------
  // Purge les données temporaires anciennes + expire les vieilles annonces. Clé cron.
  if ($path === 'cron/cleanup' && $method === 'GET') {
    if (!hash_equals((string) ($config['cron_key'] ?? '__none__'), $cronKey ?? '')) {
      jerr('Clé invalide.', 403);
    }
    $done = [];
    // Visites de plus de 120 jours (analytics anonymes, inutiles au-delà).
    $d = gmdate('Y-m-d\TH:i:s\Z', time() - 120 * 86400);
    $st = $pdo->prepare('DELETE FROM visits WHERE created_at < ?'); $st->execute([$d]); $done['visits_purgees'] = $st->rowCount();
    // Journal de sécurité de plus de 180 jours.
    $d2 = gmdate('Y-m-d\TH:i:s\Z', time() - 180 * 86400);
    $st = $pdo->prepare('DELETE FROM security_events WHERE created_at < ?'); $st->execute([$d2]); $done['evenements_securite_purges'] = $st->rowCount();
    // Annonces actives non vendues de plus de 90 jours → masquées (expirées), pas supprimées.
    $d3 = gmdate('Y-m-d\TH:i:s\Z', time() - 90 * 86400);
    $st = $pdo->prepare('UPDATE listings SET hidden = 1 WHERE (hidden IS NULL OR hidden = 0) AND (sold IS NULL OR sold = 0) AND created_at < ?');
    $st->execute([$d3]); $done['annonces_expirees'] = $st->rowCount();
    // Annonces sans aucune photo → effacées (le vendeur est prévenu).
    // Contrairement à l'expiration ci-dessus, celle-ci supprime : une annonce
    // sans photo n'a rien à montrer, la masquer reviendrait à la garder en base
    // pour rien. Voir listings_purge_sans_photo() pour les précautions.
    $done['annonces_sans_photo_effacees'] = listings_purge_sans_photo($pdo);
    jout(['ok' => true, 'nettoyage' => $done]);
  }

  // ---------- RAPPORT PÉRIODIQUE PAR EMAIL (serveur, sans Claude) ----------
  // Envoie à report_email (contact@chap.ci) un récap : activité + sécurité +
  // santé de la base. Appelé par une tâche cron cPanel (ex. mensuel : ?days=30).
  // Lecture seule (aucune modification de données) hormis l'envoi de l'email.
  if ($path === 'cron/report' && $method === 'GET') {
    if (!hash_equals((string) ($config['cron_key'] ?? '__none__'), $cronKey ?? '')) {
      jerr('Clé invalide.', 403);
    }
    $days  = max(1, min(365, (int) ($_GET['days'] ?? 30)));
    $since = gmdate('Y-m-d\TH:i:s\Z', time() - $days * 86400);
    $one = function (string $sql, array $p = []) use ($pdo) {
      $st = $pdo->prepare($sql); $st->execute($p); return (int) $st->fetchColumn();
    };
    $fr = function ($n): string { return number_format((int) $n, 0, ',', ' '); };

    // Activité sur la période
    $act = [
      'Nouveaux inscrits'       => $one('SELECT COUNT(*) FROM users WHERE created_at >= ?', [$since]),
      'Annonces publiées'       => $one('SELECT COUNT(*) FROM listings WHERE created_at >= ?', [$since]),
      'Annonces vendues'        => $one('SELECT COUNT(*) FROM listings WHERE sold = 1 AND created_at >= ?', [$since]),
      'Nouvelles conversations' => $one('SELECT COUNT(*) FROM conversations WHERE created_at >= ?', [$since]),
      'Messages échangés'       => $one('SELECT COUNT(*) FROM messages WHERE created_at >= ?', [$since]),
      'Commandes'               => $one('SELECT COUNT(*) FROM orders WHERE created_at >= ?', [$since]),
      'Avis laissés'            => $one('SELECT COUNT(*) FROM reviews WHERE created_at >= ?', [$since]),
      'Signalements'            => $one('SELECT COUNT(*) FROM reports WHERE created_at >= ?', [$since]),
      'Visites'                 => $one('SELECT COUNT(*) FROM visits WHERE created_at >= ?', [$since]),
      'Visiteurs uniques'       => $one('SELECT COUNT(DISTINCT visitor_id) FROM visits WHERE created_at >= ?', [$since]),
    ];
    // Santé de la base (instantané)
    $health = [
      'Comptes au total'           => $one('SELECT COUNT(*) FROM users'),
      'Annonces actives'           => $one('SELECT COUNT(*) FROM listings WHERE (hidden IS NULL OR hidden = 0) AND (sold IS NULL OR sold = 0)'),
      'Annonces masquées/expirées' => $one('SELECT COUNT(*) FROM listings WHERE hidden = 1'),
      'Abonnés newsletter'         => $one('SELECT COUNT(*) FROM newsletter'),
    ];
    // Sécurité sur la période (IP de monitoring exclues → pas de fausse alerte)
    $sec = security_stats($pdo, $config, $since);
    $loginOk = $sec['loginOk']; $loginFail = $sec['loginFail'];
    $ratio = (int) round($sec['ratio'] * 100);
    $suspicious = array_slice($sec['suspicious'], 0, 5);

    // Construction de l'email (charte via email_layout)
    $tbl = function (array $data) use ($fr): string {
      $rows = '';
      foreach ($data as $label => $val) {
        $rows .= '<tr><td style="padding:7px 0;border-bottom:1px solid #f0f0f0;color:#555">' . htmlspecialchars($label)
               . '</td><td style="padding:7px 0;border-bottom:1px solid #f0f0f0;text-align:right;font-weight:700;color:#111">' . $fr($val) . '</td></tr>';
      }
      return '<table style="width:100%;border-collapse:collapse;font-size:14px;margin:6px 0 18px">' . $rows . '</table>';
    };
    $secLine = '<p style="font-size:14px;margin:6px 0 4px"><b>Connexions :</b> ' . $fr($loginOk) . ' réussies · ' . $fr($loginFail) . ' échouées (' . $ratio . '% d\'échec)</p>';
    if ($suspicious) {
      $parts = [];
      foreach ($suspicious as $s) $parts[] = htmlspecialchars((string) $s['ip']) . ' (' . (int) $s['n'] . ')';
      $secLine .= '<p style="font-size:14px;margin:6px 0;color:#b91c1c"><b>⚠️ IP à surveiller :</b> ' . implode(', ', $parts) . '</p>';
    } else {
      $secLine .= '<p style="font-size:14px;margin:6px 0;color:#059669">✅ Aucune IP suspecte sur la période.</p>';
    }
    $inner =
      '<h2 style="margin-top:0;color:#111827">Rapport Chap.ci 📊</h2>'
      . '<p style="color:#555;font-size:14px;margin:0 0 18px">Récapitulatif automatique — période : ' . $days . ' jours.</p>'
      . '<h3 style="color:#F77F00;font-size:15px;margin:16px 0 4px">Activité</h3>' . $tbl($act)
      . '<h3 style="color:#F77F00;font-size:15px;margin:16px 0 4px">Sécurité</h3>' . $secLine
      . '<h3 style="color:#F77F00;font-size:15px;margin:22px 0 4px">Santé de la base</h3>' . $tbl($health)
      . '<p style="color:#9ca3af;font-size:12px;margin-top:22px">Généré automatiquement par le serveur Chap.ci — aucune action requise, sauf en cas d\'alerte sécurité.</p>';
    $html = email_layout($config, $inner, 'Rapport Chap.ci');
    $subject = 'Rapport Chap.ci — ' . gmdate('d/m/Y');

    // Destinataires : le PROPRIÉTAIRE (bracknetswilliam@…) ET contact@chap.ci.
    $to = security_notify_recipients($config); $sent = 0;
    foreach ($to as $addr) { if (send_mail($config, $addr, $subject, $html)) $sent++; }
    jout(['ok' => true, 'destinataires' => count($to), 'envoyes' => $sent, 'periodeJours' => $days]);
  }

  // ---------- ENVOI D'UN RAPPORT PAR EMAIL (avec PDF joint) ----------
  // Appelé par la routine de sourcing (agents). Authentifié par la clé cron.
  // Corps JSON : { key, subject, html, pdf_base64, filename, to? }
  if ($path === 'cron/report-email' && $method === 'POST') {
    $b = body();
    $key = ($cronKey ?? '') !== '' ? $cronKey : (string) ($b['key'] ?? ($_GET['key'] ?? ''));
    if (!hash_equals((string) ($config['cron_key'] ?? '__none__'), $key)) jerr('Clé invalide.', 403);
    // Destinataires par défaut = le PROPRIÉTAIRE ET contact@chap.ci (les deux).
    $admins = security_notify_recipients($config);
    // Destinataires AUTORISÉS = admins + destinataires de rapport configurés.
    $allowed = array_values(array_unique(array_merge(
      array_values($config['admin_emails'] ?? []), report_recipients($config), $admins)));
    // Sécurité : un `to` explicite doit faire partie des destinataires autorisés.
    // On n'envoie JAMAIS vers une adresse arbitraire — sinon la clé cron (connue
    // des admins/modérateurs) permettrait d'expédier du HTML « from chap.ci » à
    // n'importe quelle adresse (phishing crédible).
    if (!empty($b['to']) && filter_var($b['to'], FILTER_VALIDATE_EMAIL)
        && in_array(strtolower((string) $b['to']), array_map('strtolower', $allowed), true)) {
      $admins = [(string) $b['to']];
    } elseif (!$admins) {
      $admins = $allowed; // repli ultime
    }
    if (!$admins) jerr('Aucun destinataire administrateur configuré.', 400);
    $subject  = trim((string) ($b['subject'] ?? '')) ?: 'Rapport de sourcing — Chap.ci';
    $html     = (string) ($b['html'] ?? '<p>Rapport de sourcing Chap.ci.</p>');
    $pdf      = (string) ($b['pdf_base64'] ?? '');
    $filename = preg_replace('/[^A-Za-z0-9._-]/', '_', (string) ($b['filename'] ?? 'rapport-sourcing.pdf'));
    if ($filename === '') $filename = 'rapport-sourcing.pdf';
    $sent = [];
    foreach ($admins as $adm) {
      $sent[$adm] = ($pdf !== '')
        ? send_report_mail($config, $adm, $subject, $html, $pdf, $filename)
        : send_mail($config, $adm, $subject, $html);
    }
    jout(['sent' => $sent, 'withPdf' => $pdf !== '']);
  }

  // ---------- TÂCHE PLANIFIÉE : sauvegarde automatique de la base ----------
  // Écrit un export JSON dans api/backups/ (dossier protégé), garde les 7 plus
  // récents et prévient l'administrateur par email.
  if ($path === 'cron/backup' && $method === 'GET') {
    if (!hash_equals((string) ($config['cron_key'] ?? '__none__'), $cronKey ?? '')) {
      jerr('Clé invalide.', 403);
    }
    $dir = __DIR__ . '/backups';
    if (!is_dir($dir)) @mkdir($dir, 0700, true);
    if (!is_dir($dir) || !is_writable($dir)) {
      jerr('Dossier api/backups/ non inscriptible (droits).', 500);
    }
    // Protège le dossier des accès web directs.
    if (!is_file($dir . '/.htaccess')) @file_put_contents($dir . '/.htaccess', "Require all denied\nDeny from all\n");
    $dump = export_all($pdo);
    $json = json_encode($dump, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    $file = 'chapci-' . gmdate('Y-m-d-His') . '.json';
    $bytes = @file_put_contents($dir . '/' . $file, $json);
    if ($bytes === false) jerr('Écriture de la sauvegarde impossible.', 500);
    // Rotation : ne conserver que les 7 sauvegardes les plus récentes.
    $files = glob($dir . '/chapci-*.json') ?: [];
    rsort($files);
    foreach (array_slice($files, 7) as $old) @unlink($old);
    send_backup_email($config, $dump, $file, (int) $bytes);
    jout(['ok' => true, 'file' => $file, 'bytes' => (int) $bytes, 'counts' => $dump['counts']]);
  }

  // ---------- TÂCHE PLANIFIÉE : invitations / relances d'avis ----------
  // Pour chaque transaction conclue (réception confirmée OU vente confirmée),
  // on invite par email la partie qui n'a pas encore laissé d'avis. Relance
  // espacée de 3 jours, 2 fois maximum.
  if ($path === 'cron/review-invites' && $method === 'GET') {
    if (!hash_equals((string) ($config['cron_key'] ?? '__none__'), $cronKey ?? '')) {
      jerr('Clé invalide.', 403);
    }
    $minAge  = gmdate('Y-m-d\TH:i:s\Z', time() - 86400);      // conclu il y a ≥ 1 jour
    $reDelay = gmdate('Y-m-d\TH:i:s\Z', time() - 3 * 86400);  // relance ≥ 3 jours après la dernière
    $orders = $pdo->query("SELECT * FROM orders WHERE status = 'finalise' OR seller_confirmed = 1")->fetchAll();
    $checked = 0; $emailed = 0;
    foreach ($orders as $o) {
      if ((string) ($o['created_at'] ?? '') > $minAge) continue;               // trop récent
      if ((int) ($o['reminder_count'] ?? 0) >= 2) continue;                    // déjà relancé 2×
      if (!empty($o['review_reminded_at']) && (string) $o['review_reminded_at'] > $reDelay) continue; // pas encore l'heure
      $checked++;
      $buyerId = $o['buyer_id']; $sellerId = $o['seller_id'];
      $em = function (string $id) use ($pdo): string {
        $s = $pdo->prepare('SELECT email FROM users WHERE id = ?'); $s->execute([$id]);
        return (string) ($s->fetch()['email'] ?? '');
      };
      $nm = function (string $id) use ($pdo): string {
        $s = $pdo->prepare('SELECT full_name FROM profiles WHERE id = ?'); $s->execute([$id]);
        return (string) ($s->fetch()['full_name'] ?? '');
      };
      $reviewed = function (string $reviewer, string $target) use ($pdo): bool {
        $s = $pdo->prepare('SELECT 1 FROM reviews WHERE reviewer_id = ? AND target_id = ? LIMIT 1');
        $s->execute([$reviewer, $target]); return (bool) $s->fetch();
      };
      // Titre de l'annonce (via order_items ou listing_id).
      $title = '';
      $ti = $pdo->prepare('SELECT title FROM order_items WHERE order_id = ? LIMIT 1'); $ti->execute([$o['id']]);
      $title = (string) ($ti->fetch()['title'] ?? '');
      $convId = (string) ($o['conversation_id'] ?? '');
      $sent = false;
      // Acheteur → vendeur (priorité : « laissez un avis ») — uniquement si le
      // vendeur a confirmé la vente (cohérent avec la règle des avis : pas d'avis
      // sur une transaction non confirmée par le vendeur).
      if ($convId && !empty($o['seller_confirmed']) && !$reviewed($buyerId, $sellerId)) {
        if (send_review_invite_email($config, $em($buyerId), $nm($sellerId), $title, $convId, 'buyer')) { $emailed++; $sent = true; }
      }
      // Vendeur → acheteur (uniquement s'il a confirmé la vente).
      if ($convId && !empty($o['seller_confirmed']) && !$reviewed($sellerId, $buyerId)) {
        if (send_review_invite_email($config, $em($sellerId), $nm($buyerId), $title, $convId, 'seller')) { $emailed++; $sent = true; }
      }
      if ($sent) {
        $pdo->prepare('UPDATE orders SET review_reminded_at = ?, reminder_count = ? WHERE id = ?')
            ->execute([now_iso(), (int) ($o['reminder_count'] ?? 0) + 1, $o['id']]);
      }
    }
    jout(['orders' => $checked, 'emailed' => $emailed]);
  }

  // ---- Rapports de violation de la CSP ---------------------------------------
  // Le navigateur poste ici, tout seul, ce que la politique AURAIT bloqué. Route
  // publique par nécessité : aucun navigateur n'y joindra de jeton.
  //
  // Trois garde-fous, parce qu'une route publique qui écrit en base est une
  // invitation :
  //  1. la charge utile est plafonnée (un rapport CSP tient en quelques lignes) ;
  //  2. l'origine bloquée est réduite à « schéma://hôte » — sans le chemin, qui
  //     serait de cardinalité infinie et remplirait la table à lui seul ;
  //  3. le nombre de lignes distinctes est plafonné : au-delà, on compte sans
  //     créer de nouvelle ligne. Personne ne peut faire gonfler la base en
  //     postant mille URL différentes.
  // On agrège au lieu de tout garder : ce qui compte, c'est QUELLES origines
  // reviennent, pas combien de fois exactement.
  if ($path === 'csp-report' && $method === 'POST') {
    $raw = file_get_contents('php://input') ?: '';
    if (strlen($raw) > 8192) jout(['ok' => true]);          // trop gros : on ignore en silence
    $b = json_decode($raw, true);
    $r = is_array($b) ? ($b['csp-report'] ?? $b) : null;
    if (!is_array($r)) jout(['ok' => true]);
    $dir = substr((string) ($r['effective-directive'] ?? $r['violated-directive'] ?? '?'), 0, 64);
    $blk = (string) ($r['blocked-uri'] ?? '?');
    // « inline », « eval », « data » n'ont pas d'hôte : on les garde tels quels.
    if (preg_match('~^https?://~i', $blk)) {
      $u = parse_url($blk);
      $blk = ($u['scheme'] ?? 'https') . '://' . ($u['host'] ?? '?');
    }
    $blk = substr($blk, 0, 190);
    $k = substr(sha1($dir . '|' . $blk), 0, 40);
    try {
      $up = $pdo->prepare('UPDATE csp_reports SET n = n + 1, last_at = ? WHERE k = ?');
      $up->execute([now_iso(), $k]);
      if ($up->rowCount() === 0) {
        $cnt = (int) $pdo->query('SELECT COUNT(*) FROM csp_reports')->fetchColumn();
        if ($cnt < 300) {
          $pdo->prepare('INSERT INTO csp_reports (k,directive,blocked,n,first_at,last_at) VALUES (?,?,?,1,?,?)')
              ->execute([$k, $dir, $blk, now_iso(), now_iso()]);
        }
      }
    } catch (Throwable $e) { /* un rapport perdu ne doit jamais casser une page */ }
    jout(['ok' => true]);
  }

  // Santé — et EMPREINTE du fichier réellement servi.
  //
  // Deux fois aujourd'hui il a fallu deviner si un correctif était vraiment en
  // production : le zip est extrait à la main, et rien côté serveur ne disait
  // quelle version tournait. L'empreinte est le md5 de ce fichier-ci ; elle se
  // compare en une commande à celle du dépôt :
  //
  //     md5sum server/index.php    (les 12 premiers caractères)
  //
  // Elle n'expose rien : c'est une somme de contrôle d'un fichier que le
  // serveur exécute déjà, pas un secret. `depose` est sa date d'écriture sur
  // le disque — donc l'heure réelle de l'extraction du zip.
  if ($path === '' || $path === 'health') {
    $empreinte = ''; $depose = null;
    $moi = @file_get_contents(__FILE__);
    if ($moi !== false) $empreinte = substr(md5($moi), 0, 12);
    $t = @filemtime(__FILE__);
    if ($t) $depose = gmdate('Y-m-d\TH:i:s\Z', $t);
    jout(['ok' => true, 'name' => 'Chap.ci API', 'time' => now_iso(), 'php' => PHP_VERSION,
          'empreinte' => $empreinte, 'depose' => $depose]);
  }

  jerr('Route inconnue: ' . $path, 404);
} catch (Throwable $e) {
  error_log('[chapci] ' . $e->getMessage());
  // P13 : pas de détail technique côté client hors mode debug.
  jerr(!empty($config['debug']) ? ('Erreur serveur : ' . $e->getMessage()) : 'Erreur serveur. Réessayez plus tard.', 500);
}
