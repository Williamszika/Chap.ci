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
function chapci_hardened_secret(array $config, string $label, string $configured): string {
  // Valeurs faibles/connues à ne jamais accepter en production.
  $weak = ['', 'CHANGEZ-MOI-mettez-un-secret-long-et-aleatoire', 'chapci-cron-2026-a7f3e9',
           'changeme', 'secret', 'chapci', 'password', 'test'];
  $configured = trim($configured);
  if ($configured !== '' && strlen($configured) >= 24 && !in_array($configured, $weak, true)) {
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
$config['jwt_secret'] = chapci_hardened_secret($config, 'jwt',
  (string) (getenv('CHAPCI_JWT_SECRET') ?: ($config['jwt_secret'] ?? '')));
$config['cron_key'] = chapci_hardened_secret($config, 'cron',
  (string) (getenv('CHAPCI_CRON_KEY') ?: ($config['cron_key'] ?? '')));

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
header('Access-Control-Allow-Headers: Content-Type, Authorization');
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
  return ['counts' => $counts, 'loginOk' => $loginOk, 'loginFail' => $loginFail,
          'ratio' => ($loginOk + $loginFail) ? round($loginFail / ($loginOk + $loginFail), 2) : 0,
          'suspicious' => $suspicious];
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
    "CREATE TABLE IF NOT EXISTS saved_searches (
      id $id PRIMARY KEY, user_id $id, label $txt, params $txt, last_notified_at $ts, created_at $ts
    )$eng",
    // Journal d'audit de sécurité : connexions, inscriptions, blocages… (Le Greffier).
    "CREATE TABLE IF NOT EXISTS security_events (
      id $id PRIMARY KEY, kind $txt, email $txt, ip $txt, ua $txt, detail $txt, created_at $ts
    )$eng",
    // Codes de vérification par SMS (connexion par téléphone). Usage unique, expirent.
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
  // Compteur de vues par annonce (statistiques vendeur).
  try { $pdo->exec("ALTER TABLE listings ADD COLUMN views $intT"); } catch (Throwable $e) {}
  // Préférences de notifications (JSON : {favorite:bool, message:bool, ...}).
  try { $pdo->exec("ALTER TABLE profiles ADD COLUMN notif_prefs $txt"); } catch (Throwable $e) {}
  try { $pdo->exec("CREATE INDEX idx_notif_user ON notifications (user_id, read_flag)"); } catch (Throwable $e) {}
  // Index léger sur le journal de sécurité (accélère rate-limit et rapports).
  try { $pdo->exec("CREATE INDEX idx_sec_events ON security_events (kind, created_at)"); } catch (Throwable $e) {}
  try { $pdo->exec("CREATE INDEX idx_users_phone ON users (phone)"); } catch (Throwable $e) {}
  try { $pdo->exec("CREATE INDEX idx_otp_phone ON otp_codes (phone)"); } catch (Throwable $e) {}
  // Anti-flood du suivi de visites : rend le plafond par visiteur/heure peu coûteux.
  try { $pdo->exec("CREATE INDEX idx_visits_visitor ON visits (visitor_id, created_at)"); } catch (Throwable $e) {}
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
  return ['id' => $u['id'], 'email' => $u['email'], 'status' => $status ?: 'active',
          'user_metadata' => ['full_name' => $name]];
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
             'reports', 'visits', 'saved_searches'];
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
    if (!$u || !password_verify((string) ($b['password'] ?? ''), $u['password_hash'])) {
      log_security_event($pdo, 'login_fail', $email);
      jerr('Email ou mot de passe incorrect.', 401);
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
    $st = $pdo->prepare('SELECT id,email,status,password_hash FROM users WHERE email = ?'); $st->execute([$email]); $u = $st->fetch();
    if (!$u) {
      $id = uuid();
      $pdo->prepare('INSERT INTO users (id,email,password_hash,created_at,consent_at,cgu_version,auth_provider) VALUES (?,?,?,?,?,?,?)')
          ->execute([$id, $email, null, now_iso(), now_iso(), '2026-07-14', 'google']);
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
      if (($u['password_hash'] ?? null) !== null && (string) $u['password_hash'] !== '') {
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
    $st = $pdo->prepare('SELECT id,email,status,password_hash FROM users WHERE email = ?'); $st->execute([$email]); $u = $st->fetch();
    if (!$u) {
      $id = uuid();
      $pdo->prepare('INSERT INTO users (id,email,password_hash,created_at,consent_at,cgu_version,auth_provider) VALUES (?,?,?,?,?,?,?)')
          ->execute([$id, $email, null, now_iso(), now_iso(), '2026-07-14', 'facebook']);
      $pdo->prepare('INSERT INTO profiles (id,full_name,created_at) VALUES (?,?,?)')
          ->execute([$id, $name, now_iso()]);
      log_security_event($pdo, 'signup', $email, 'facebook');
      if ($realEmail) send_welcome_email($config, $email, $name); // pas d'email vers une adresse fictive
      $u = ['id' => $id, 'email' => $email, 'status' => 'active'];
    } else {
      if (($u['status'] ?? 'active') === 'blocked') { log_security_event($pdo, 'login_blocked', $email, 'facebook'); jerr('Votre compte a été bloqué. Contactez le support à contact@chap.ci.', 403); }
      // Anti-pré-détournement (voir Google) : invalide un mot de passe local éventuel.
      if (($u['password_hash'] ?? null) !== null && (string) $u['password_hash'] !== '') {
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
    $rows = $pdo->query('SELECT * FROM listings WHERE (hidden IS NULL OR hidden = 0) AND (sold IS NULL OR sold = 0) ORDER BY created_at DESC LIMIT 500')->fetchAll();
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
    // Notification de statut : l'annonce a passé la modération et est en ligne.
    notify($pdo, $u['id'], 'listing', 'Annonce publiée ✅',
      'Votre annonce « ' . mb_substr(trim($b['title']), 0, 60) . ' » est maintenant en ligne.',
      '#/annonce/' . $id);
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

  // Comptabiliser une vue d'annonce (statistiques). On n'incrémente pas les
  // vues du propriétaire ; le frontend limite à une vue par visiteur/session.
  if (count($seg) === 3 && $seg[0] === 'listings' && $seg[2] === 'view' && $method === 'POST') {
    $st = $pdo->prepare('SELECT user_id FROM listings WHERE id = ?'); $st->execute([$seg[1]]);
    $row = $st->fetch();
    if ($row) {
      $viewer = current_user($pdo, $secret);
      if (!$viewer || $viewer['id'] !== $row['user_id']) {
        $pdo->prepare('UPDATE listings SET views = COALESCE(views, 0) + 1 WHERE id = ?')->execute([$seg[1]]);
      }
    }
    jout(['ok' => true]);
  }

  // Modifier son annonce.
  if (count($seg) === 2 && $seg[0] === 'listings' && $method === 'PUT') {
    $u = require_user($pdo, $secret); $b = body();
    $st = $pdo->prepare('SELECT user_id FROM listings WHERE id = ?'); $st->execute([$seg[1]]);
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
    foreach ($items as $it) {
      $lid = trim((string) ($it['listingId'] ?? ''));
      if ($lid === '') jerr('Article invalide (annonce manquante).', 400);
      $ls = $pdo->prepare('SELECT user_id FROM listings WHERE id = ?'); $ls->execute([$lid]);
      $lr = $ls->fetch();
      if (!$lr || (string) $lr['user_id'] !== $sellerId) jerr('Article invalide pour ce vendeur.', 400);
    }
    $oid = uuid();
    $pdo->prepare('INSERT INTO orders (id,buyer_id,seller_id,conversation_id,status,created_at) VALUES (?,?,?,?,?,?)')
        ->execute([$oid, $u['id'], $sellerId, $b['conversationId'] ?? null, 'en_cours', now_iso()]);
    foreach ($items as $it) {
      $pdo->prepare('INSERT INTO order_items (id,order_id,listing_id,title,price,image) VALUES (?,?,?,?,?,?)')
          ->execute([uuid(), $oid, $it['listingId'] ?? null, $it['title'] ?? '', (int) ($it['price'] ?? 0), $it['image'] ?? null]);
    }
    // Notifications email (best-effort) : vendeur + acheteur.
    $sellerEmail = $seller['email'] ?? null;
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
    $chk = $pdo->prepare('SELECT 1 FROM orders WHERE seller_confirmed = 1 AND
      ((buyer_id = ? AND seller_id = ?) OR (seller_id = ? AND buyer_id = ?)) LIMIT 1');
    $chk->execute([$u['id'], $targetId, $u['id'], $targetId]);
    if (!$chk->fetch()) {
      // Rétro-compat acheteur→vendeur par annonce — commande confirmée par le vendeur.
      $chk2 = $pdo->prepare('SELECT 1 FROM order_items oi JOIN orders o ON o.id = oi.order_id
        WHERE o.buyer_id = ? AND oi.listing_id = ? AND o.seller_id = ? AND o.seller_confirmed = 1 LIMIT 1');
      $chk2->execute([$u['id'], $listingId, $targetId]);
      if (!$chk2->fetch()) jerr('Vous ne pouvez noter qu’après une vente confirmée par le vendeur.', 403);
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
    $pdo->prepare('INSERT INTO visits (id,visitor_id,path,referrer,created_at) VALUES (?,?,?,?,?)')
        ->execute([uuid(), $vid, $p, $ref ?: null, now_iso()]);
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
        fn($r) => ['id' => $r['id'], 'email' => $r['email'], 'fullName' => $r['full_name'] ?: '—', 'createdAt' => iso_to_ms($r['created_at'])],
        $pdo->query('SELECT u.id, u.email, u.created_at, p.full_name FROM users u LEFT JOIN profiles p ON p.id = u.id ORDER BY u.created_at DESC LIMIT 5')->fetchAll());
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
        'ordersByStatus' => $ordersByStatus, 'ordersValue' => $ordersValue,
        'periods' => ['users' => $periodStats('users'), 'listings' => $periodStats('listings')],
        'series' => $series,
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
    if (!hash_equals((string) ($config['cron_key'] ?? '__none__'), (string) ($_GET['key'] ?? ''))) {
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
    if (!hash_equals((string) ($config['cron_key'] ?? '__none__'), (string) ($_GET['key'] ?? ''))) {
      jerr('Clé invalide.', 403);
    }
    $days = max(1, min(90, (int) ($_GET['days'] ?? 7)));
    $since = gmdate('Y-m-d\TH:i:s\Z', time() - $days * 86400);
    $one = function (string $sql, array $p = []) use ($pdo) {
      $st = $pdo->prepare($sql); $st->execute($p); return (int) $st->fetchColumn();
    };
    $topCats = $pdo->prepare('SELECT category_id, COUNT(*) AS n FROM listings WHERE created_at >= ? GROUP BY category_id ORDER BY n DESC LIMIT 5');
    $topCats->execute([$since]);
    $topPaths = $pdo->prepare('SELECT path, COUNT(*) AS n FROM visits WHERE created_at >= ? GROUP BY path ORDER BY n DESC LIMIT 8');
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
    if (!hash_equals((string) ($config['cron_key'] ?? '__none__'), (string) ($_GET['key'] ?? ''))) {
      jerr('Clé invalide.', 403);
    }
    $days = max(1, min(90, (int) ($_GET['days'] ?? 1)));
    $since = gmdate('Y-m-d\TH:i:s\Z', time() - $days * 86400);
    $sec = security_stats($pdo, $config, $since);
    jout([
      'periodDays'    => $days,
      'since'         => $since,
      'counts'        => $sec['counts'],
      'suspiciousIps' => $sec['suspicious'],
      'failRatio'     => $sec['ratio'],
      'rateLimited'   => $sec['counts']['rate_limited'] ?? 0,
      'newSignups'    => $sec['counts']['signup'] ?? 0,
      'ignoredIps'    => $config['security_ignore_ips'] ?? [],
    ]);
  }

  // ---------- MÉNAGE / MAINTENANCE (L'Intendant) ----------
  // Purge les données temporaires anciennes + expire les vieilles annonces. Clé cron.
  if ($path === 'cron/cleanup' && $method === 'GET') {
    if (!hash_equals((string) ($config['cron_key'] ?? '__none__'), (string) ($_GET['key'] ?? ''))) {
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
    jout(['ok' => true, 'nettoyage' => $done]);
  }

  // ---------- RAPPORT PÉRIODIQUE PAR EMAIL (serveur, sans Claude) ----------
  // Envoie à report_email (contact@chap.ci) un récap : activité + sécurité +
  // santé de la base. Appelé par une tâche cron cPanel (ex. mensuel : ?days=30).
  // Lecture seule (aucune modification de données) hormis l'envoi de l'email.
  if ($path === 'cron/report' && $method === 'GET') {
    if (!hash_equals((string) ($config['cron_key'] ?? '__none__'), (string) ($_GET['key'] ?? ''))) {
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

    $to = report_recipients($config); $sent = 0;
    foreach ($to as $addr) { if (send_mail($config, $addr, $subject, $html)) $sent++; }
    jout(['ok' => true, 'destinataires' => count($to), 'envoyes' => $sent, 'periodeJours' => $days]);
  }

  // ---------- ENVOI D'UN RAPPORT PAR EMAIL (avec PDF joint) ----------
  // Appelé par la routine de sourcing (agents). Authentifié par la clé cron.
  // Corps JSON : { key, subject, html, pdf_base64, filename, to? }
  if ($path === 'cron/report-email' && $method === 'POST') {
    $b = body();
    $key = (string) ($b['key'] ?? ($_GET['key'] ?? ''));
    if (!hash_equals((string) ($config['cron_key'] ?? '__none__'), $key)) jerr('Clé invalide.', 403);
    $admins = array_values($config['admin_emails'] ?? []);
    // Destinataires AUTORISÉS = admins + destinataires de rapport configurés.
    $allowed = array_values(array_unique(array_merge($admins, report_recipients($config))));
    // Sécurité : un `to` explicite doit faire partie des destinataires autorisés.
    // On n'envoie JAMAIS vers une adresse arbitraire — sinon la clé cron (connue
    // des admins/modérateurs) permettrait d'expédier du HTML « from chap.ci » à
    // n'importe quelle adresse (phishing crédible).
    if (!empty($b['to']) && filter_var($b['to'], FILTER_VALIDATE_EMAIL)
        && in_array(strtolower((string) $b['to']), array_map('strtolower', $allowed), true)) {
      $admins = [(string) $b['to']];
    } elseif (!$admins) {
      $admins = $allowed; // repli : les destinataires de rapport configurés
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
    if (!hash_equals((string) ($config['cron_key'] ?? '__none__'), (string) ($_GET['key'] ?? ''))) {
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
    if (!hash_equals((string) ($config['cron_key'] ?? '__none__'), (string) ($_GET['key'] ?? ''))) {
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

  if ($path === '' || $path === 'health') jout(['ok' => true, 'name' => 'Chap.ci API', 'time' => now_iso(), 'php' => PHP_VERSION]);

  jerr('Route inconnue: ' . $path, 404);
} catch (Throwable $e) {
  error_log('[chapci] ' . $e->getMessage());
  // P13 : pas de détail technique côté client hors mode debug.
  jerr(!empty($config['debug']) ? ('Erreur serveur : ' . $e->getMessage()) : 'Erreur serveur. Réessayez plus tard.', 500);
}
