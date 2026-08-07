<?php
declare(strict_types=1);

// ============================================================================
//  Banc d'essai du chiffrement des notifications push.
//
//  Le chiffrement d'une notification push ne se vérifie pas « à l'œil » : il
//  produit des octets illisibles, et une erreur d'un seul bit donne un message
//  que le navigateur rejette en silence. On ne saurait jamais pourquoi.
//
//  La RFC 8291 §5 publie donc un vecteur d'essai complet — les deux paires de
//  clés, le secret d'authentification, le sel, le texte clair, et le résultat
//  attendu octet pour octet. Ce script le rejoue contre notre code.
//
//    php8.5 scripts/push-vecteur.php
//
//  Vert = le chiffrement est juste. Rouge = il ne l'est pas, et aucune
//  notification n'arrivera. Il n'y a pas d'entre-deux.
//
//  À relancer après toute retouche à push_chiffrer() ou aux fonctions de clés
//  dans server/index.php.
// ============================================================================

$src = file_get_contents(__DIR__ . '/../server/index.php');
if ($src === false) { fwrite(STDERR, "server/index.php introuvable.\n"); exit(1); }

// On extrait le bloc push de index.php plutôt que d'inclure le fichier entier :
// index.php ouvre une base, lit des en-têtes HTTP et sert une réponse. On veut
// éprouver les fonctions, pas démarrer le site.
$debut = strpos($src, '// ---- Notifications push');
$fin   = strpos($src, '// ---- FIN du chiffrement push');
if ($debut === false || $fin === false) {
  fwrite(STDERR, "Bloc push introuvable dans server/index.php (repères modifiés ?).\n");
  exit(1);
}
// Les deux seules dépendances du bloc, reprises à l'identique d'index.php.
function b64url(string $s): string { return rtrim(strtr(base64_encode($s), '+/', '-_'), '='); }
function b64url_dec(string $s): string { return base64_decode(strtr($s, '-_', '+/')); }
eval(substr($src, $debut, $fin - $debut));

$vert = "\033[32m"; $rouge = "\033[31m"; $gris = "\033[90m"; $zero = "\033[0m";
$echecs = 0;
function verifie(string $quoi, $obtenu, $attendu): void {
  global $vert, $rouge, $gris, $zero, $echecs;
  if ($obtenu === $attendu) { echo "  {$vert}✓{$zero} $quoi\n"; return; }
  $echecs++;
  echo "  {$rouge}✗{$zero} $quoi\n";
  echo "     {$gris}attendu :{$zero} $attendu\n";
  echo "     {$gris}obtenu  :{$zero} $obtenu\n";
}

echo "\nVecteur d'essai RFC 8291 §5 — chiffrement aes128gcm\n\n";

// ---- Les données de la RFC, telles qu'elles y sont écrites -----------------
$uaPublic  = 'BCVxsr7N_eNgVRqvHtD0zTZsEc6-VV-JvLexhqUzORcxaOzi6-AYWXvTBHm4bjyPjs7Vd8pZGH6SRpkNtoIAiw4';
$authSecret = 'BTBZMqHH6r4Tts7J_aSIgg';
$asPublic  = 'BP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A8';
$asPrivate = 'yfWPiYE-n46HLnH0KqZOF1fJJU3MYrct3AELtAQ-oRw';
$sel       = 'DGv6ra1nlYgDCS1FRnbzlw';
$clair     = 'When I grow up, I want to be a watermelon';
$attendu   = 'DGv6ra1nlYgDCS1FRnbzlwAAEABBBP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27ml'
           . 'mlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A_yl95bQpu6cVPT'
           . 'pK4Mqgkf1CXztLVBSt2Ks3oZwbuwXPXLWyouBWLVWGNWQexSgSxsj_Qulcy4a-fN';

// ---- 1. Reconstruire la clé privée de l'expéditeur imposée par la RFC ------
$pemPriv = push_pem_privee(b64url_dec($asPrivate), b64url_dec($asPublic));
$priv = openssl_pkey_get_private($pemPriv);
if (!$priv) { echo "  {$rouge}✗{$zero} clé privée de la RFC illisible : " . openssl_error_string() . "\n"; exit(1); }
verifie('la clé privée reconstruite redonne bien sa publique', b64url(push_details($priv)['pub']), $asPublic);

// ---- 2. Chiffrer avec la clé éphémère et le sel de la RFC ------------------
$corps = push_chiffrer($uaPublic, $authSecret, $clair, [
  'priv' => $priv, 'pub' => b64url_dec($asPublic), 'sel' => b64url_dec($sel),
]);
verifie('le corps chiffré est identique au résultat de la RFC', b64url($corps), $attendu);

// ---- 3. Déchiffrer avec la clé du destinataire : la boucle se ferme --------
// Le vecteur vérifie que nous produisons les bons octets ; ce tour-ci vérifie
// qu'un navigateur les rouvrira. Ce sont deux garanties différentes.
$uaPrivate = 'q1dXpw3UpT5VOmu_cf_v6ih07Aems3njxI-JWgLcM94';
$uaPem = push_pem_privee(b64url_dec($uaPrivate), b64url_dec($uaPublic));
$uaKey = openssl_pkey_get_private($uaPem);
$selLu   = substr($corps, 0, 16);
$idLen   = ord($corps[20]);
$asPubLu = substr($corps, 21, $idLen);
$chiffre = substr($corps, 21 + $idLen);
$partage = openssl_pkey_derive(push_pem_publique($asPubLu), $uaKey, 0);
$ikm  = hash_hkdf('sha256', $partage, 32, "WebPush: info\x00" . b64url_dec($uaPublic) . $asPubLu, b64url_dec($authSecret));
$cek  = hash_hkdf('sha256', $ikm, 16, "Content-Encoding: aes128gcm\x00", $selLu);
$non  = hash_hkdf('sha256', $ikm, 12, "Content-Encoding: nonce\x00", $selLu);
$tag  = substr($chiffre, -16);
$ouvert = openssl_decrypt(substr($chiffre, 0, -16), 'aes-128-gcm', $cek, OPENSSL_RAW_DATA, $non, $tag);
verifie('le destinataire retrouve le texte clair', $ouvert === false ? '(déchiffrement refusé)' : rtrim($ouvert, "\x02"), $clair);

// ---- 4. Un envoi réel tire des clés neuves : il doit s'ouvrir aussi -------
$corps2 = push_chiffrer($uaPublic, $authSecret, 'Chap.ci — essai à clé éphémère aléatoire');
$selLu   = substr($corps2, 0, 16);
$asPubLu = substr($corps2, 21, ord($corps2[20]));
$chiffre = substr($corps2, 21 + ord($corps2[20]));
$partage = openssl_pkey_derive(push_pem_publique($asPubLu), $uaKey, 0);
$ikm  = hash_hkdf('sha256', $partage, 32, "WebPush: info\x00" . b64url_dec($uaPublic) . $asPubLu, b64url_dec($authSecret));
$cek  = hash_hkdf('sha256', $ikm, 16, "Content-Encoding: aes128gcm\x00", $selLu);
$non  = hash_hkdf('sha256', $ikm, 12, "Content-Encoding: nonce\x00", $selLu);
$ouvert = openssl_decrypt(substr($chiffre, 0, -16), 'aes-128-gcm', $cek, OPENSSL_RAW_DATA, $non, substr($chiffre, -16));
verifie('une clé éphémère aléatoire s’ouvre aussi', $ouvert === false ? '(déchiffrement refusé)' : rtrim($ouvert, "\x02"), 'Chap.ci — essai à clé éphémère aléatoire');

// ---- 5. Un accent, une apostrophe typographique, un emoji ------------------
// Les notifications du site en sont pleines (« Annonce publiée ✅ »). L'UTF-8
// passe en octets bruts dans le chiffrement, mais autant que le banc le dise.
$accents = 'Annonce publiée ✅ — « Réfrigérateur », 150 000 FCFA';
$corps3 = push_chiffrer($uaPublic, $authSecret, $accents);
$selLu   = substr($corps3, 0, 16);
$asPubLu = substr($corps3, 21, ord($corps3[20]));
$chiffre = substr($corps3, 21 + ord($corps3[20]));
$partage = openssl_pkey_derive(push_pem_publique($asPubLu), $uaKey, 0);
$ikm  = hash_hkdf('sha256', $partage, 32, "WebPush: info\x00" . b64url_dec($uaPublic) . $asPubLu, b64url_dec($authSecret));
$cek  = hash_hkdf('sha256', $ikm, 16, "Content-Encoding: aes128gcm\x00", $selLu);
$non  = hash_hkdf('sha256', $ikm, 12, "Content-Encoding: nonce\x00", $selLu);
$ouvert = openssl_decrypt(substr($chiffre, 0, -16), 'aes-128-gcm', $cek, OPENSSL_RAW_DATA, $non, substr($chiffre, -16));
verifie('les accents et emojis traversent intacts', $ouvert === false ? '(déchiffrement refusé)' : rtrim($ouvert, "\x02"), $accents);

echo "\nSignature VAPID — RFC 8292\n\n";

// La signature ECDSA n'est pas déterministe (elle tire un aléa à chaque fois) :
// il n'y a pas de vecteur à comparer. On vérifie donc ce qui compte vraiment —
// que le relais, lui, la validera.
$paire = push_paire();
$entete = push_entete_vapid('https://fcm.googleapis.com/fcm/send/abc123', 'mailto:contact@chap.ci', $paire['cle'], $paire['pub']);
verifie('l’en-tête annonce bien le schéma vapid', substr($entete, 0, 8), 'vapid t=');
preg_match('/^vapid t=([^,]+), k=(.+)$/', $entete, $m);
verifie('la clé publique jointe est celle de la paire', $m[2] ?? '', b64url($paire['pub']));

[$h, $p, $s] = explode('.', $m[1]);
verifie('l’algorithme déclaré est ES256', json_decode(b64url_dec($h), true)['alg'] ?? '', 'ES256');
$charge = json_decode(b64url_dec($p), true);
verifie('l’auditoire est l’origine du relais, sans le chemin', $charge['aud'] ?? '', 'https://fcm.googleapis.com');
verifie('le sujet est repris tel quel', $charge['sub'] ?? '', 'mailto:contact@chap.ci');
verifie('la signature fait 64 octets (R‖S)', strlen(b64url_dec($s)), 64);

// Re-encoder R‖S en DER et demander à OpenSSL de vérifier : c'est exactement ce
// que fera le relais.
$brut = b64url_dec($s);
$ent = function (string $n): string {
  $n = ltrim($n, "\x00");
  if ($n === '' || ord($n[0]) > 0x7f) $n = "\x00" . $n;
  return "\x02" . chr(strlen($n)) . $n;
};
$seq = $ent(substr($brut, 0, 32)) . $ent(substr($brut, 32));
$der = "\x30" . chr(strlen($seq)) . $seq;
$pemPub = "-----BEGIN PUBLIC KEY-----\n"
  . chunk_split(base64_encode(hex2bin('3059301306072a8648ce3d020106082a8648ce3d030107034200') . $paire['pub']), 64, "\n")
  . "-----END PUBLIC KEY-----\n";
verifie('OpenSSL valide la signature comme le fera le relais',
  openssl_verify("$h.$p", $der, $pemPub, OPENSSL_ALGO_SHA256), 1);

echo "\n";
if ($echecs === 0) {
  echo "{$vert}Banc vert — le chiffrement et la signature sont conformes aux RFC.{$zero}\n\n";
  exit(0);
}
echo "{$rouge}$echecs vérification(s) en échec — aucune notification n’arrivera.{$zero}\n\n";
exit(1);
