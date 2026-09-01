<?php
/**
 * BANC DES EMPREINTES DE PHOTOS — jusqu'où peut-on conclure d'une ressemblance ?
 *
 *     php scripts/banc-empreintes.php [dossier de photos]
 *
 * ⚠️ CE BANC A CHANGÉ LE PROGRAMME, ET C'EST POUR ÇA QU'IL EXISTE.
 *
 * Le 01/09/2026, `photos_signal()` devait REFUSER une photo trop proche d'une
 * photo déjà retirée, au seuil de 6 bits sur 64. Ce chiffre était supposé.
 * Le banc l'a mesuré sur les photos réelles de chap.ci, et il était faux :
 *
 *  · la MÊME photo simplement rognée de 3 % s'éloigne de 14 bits — elle serait
 *    passée sans être vue ;
 *  · deux photos DIFFÉRENTES du catalogue ne sont séparées que de 3 bits — ce
 *    sont deux affiches d'un même vendeur, même gabarit, un mot d'écart.
 *
 * Les deux nuages se chevauchent. Il n'existe donc AUCUN seuil qui rattrape une
 * republication sans risquer de refuser la photo d'un vendeur honnête, et le
 * verrou a été retiré du programme : l'empreinte SIGNALE, elle ne refuse jamais.
 *
 * Ce que le banc vérifie désormais :
 *  1. que le chevauchement est toujours là — c'est-à-dire que le verrou reste
 *     injustifiable, et qu'on ne le remettra pas par distraction ;
 *  2. que le seuil de SIGNAL est assez haut pour voir passer une même photo
 *     maltraitée. Un signal de trop ne coûte qu'un coup d'œil ; un refus de
 *     trop coûte un vendeur.
 *
 * ⚠️ Sans photos, ce banc ne prouve rien : il s'arrête plutôt que de rendre
 * vert sur un dossier vide.
 */
declare(strict_types=1);

$src = file_get_contents(__DIR__ . '/../server/index.php');
function extraire(string $src, string $nom): string {
  $i = strpos($src, "function $nom(");
  if ($i === false) { fwrite(STDERR, "$nom introuvable\n"); exit(1); }
  $j = strpos($src, '{', $i); $p = 0;
  for ($k = $j; $k < strlen($src); $k++) {
    if ($src[$k] === '{') $p++;
    elseif ($src[$k] === '}') { $p--; if ($p === 0) return substr($src, $i, $k - $i + 1); }
  }
  exit(1);
}
eval(extraire($src, 'image_empreinte'));
eval(extraire($src, 'empreinte_distance'));

$dossier = $argv[1] ?? (sys_get_temp_dir() . '/photos-banc');
$fichiers = glob($dossier . '/*.{jpg,jpeg,png,webp}', GLOB_BRACE) ?: [];
if (count($fichiers) < 3) {
  fwrite(STDERR, "❌ Il faut au moins 3 photos dans $dossier — le banc ne juge pas à vide.\n");
  exit(1);
}
sort($fichiers);

// ⚠️ ÉCARTER LES FICHIERS STRICTEMENT IDENTIQUES AVANT DE COMPARER.
// Premier passage du banc : 34 photos téléchargées, dont seulement 13
// distinctes — la même URL revenait plusieurs fois. Le banc a donc annoncé
// « deux photos DIFFÉRENTES à 0 bit d'écart » et déclaré le seuil intenable.
// C'était le banc qui avait tort : deux copies du même fichier DOIVENT donner
// la même empreinte, c'est même toute l'idée. Sans ce filtre, ce contrôle
// s'accuse lui-même à chaque doublon.
$parMd5 = [];
foreach ($fichiers as $f) $parMd5[md5_file($f)] ??= $f;
$fichiers = array_values($parMd5);
printf("  %d fichiers distincts retenus (les copies exactes sont écartées)\n\n", count($fichiers));

/** Les maltraitances qu'on fait subir à une photo pour la reposter. */
function maltraiter(string $bin, string $quoi): ?string {
  $im = @imagecreatefromstring($bin);
  if (!$im) return null;
  $w = imagesx($im); $h = imagesy($im);
  $out = null;
  switch ($quoi) {
    case 'jpeg 40 %':          $out = $im; break;
    case 'réduite de moitié':
      $out = imagecreatetruecolor(max(1, (int) ($w / 2)), max(1, (int) ($h / 2)));
      imagecopyresampled($out, $im, 0, 0, 0, 0, imagesx($out), imagesy($out), $w, $h); break;
    case 'agrandie ×1,5':
      $out = imagecreatetruecolor((int) ($w * 1.5), (int) ($h * 1.5));
      imagecopyresampled($out, $im, 0, 0, 0, 0, imagesx($out), imagesy($out), $w, $h); break;
    case 'rognée de 3 %':
      $mx = (int) ($w * 0.03); $my = (int) ($h * 0.03);
      $out = imagecreatetruecolor($w - 2 * $mx, $h - 2 * $my);
      imagecopyresampled($out, $im, 0, 0, $mx, $my, imagesx($out), imagesy($out), $w - 2 * $mx, $h - 2 * $my); break;
    case 'éclaircie':
      $out = $im; imagefilter($out, IMG_FILTER_BRIGHTNESS, 22); break;
    case 'filigranée':
      $out = $im;
      $blanc = imagecolorallocatealpha($out, 255, 255, 255, 75);
      imagefilledrectangle($out, (int) ($w * .3), (int) ($h * .45), (int) ($w * .7), (int) ($h * .55), $blanc);
      break;
  }
  if (!$out) return null;
  ob_start(); imagejpeg($out, null, $quoi === 'jpeg 40 %' ? 40 : 82); $bin2 = ob_get_clean();
  return $bin2 ?: null;
}

$MALTRAITANCES = ['jpeg 40 %', 'réduite de moitié', 'agrandie ×1,5', 'rognée de 3 %', 'éclaircie', 'filigranée'];

echo "── LA MÊME PHOTO, MALTRAITÉE (doit rester PROCHE) " . str_repeat('─', 22) . "\n";
$pireMeme = 0; $lignes = 0;
$empreintes = [];
foreach ($fichiers as $f) {
  $bin = file_get_contents($f);
  $e0 = image_empreinte($bin);
  if ($e0 === null) { echo "  ⚠️ illisible : " . basename($f) . "\n"; continue; }
  $empreintes[basename($f)] = $e0;
  $d = [];
  foreach ($MALTRAITANCES as $m) {
    $b2 = maltraiter($bin, $m);
    if ($b2 === null) { $d[$m] = '—'; continue; }
    $e2 = image_empreinte($b2);
    $dist = $e2 === null ? 64 : empreinte_distance($e0, $e2);
    $d[$m] = $dist;
    if (is_int($dist)) { $pireMeme = max($pireMeme, $dist); $lignes++; }
  }
  printf("  %-34s %s\n", mb_strimwidth(basename($f), 0, 34, '…'),
    implode('  ', array_map(fn($m) => sprintf('%s %s', mb_substr($m, 0, 9), (string) $d[$m]), $MALTRAITANCES)));
}

echo "\n── DES PHOTOS DIFFÉRENTES (doivent rester LOIN) " . str_repeat('─', 24) . "\n";
$noms = array_keys($empreintes);
$minDiff = 64;
for ($i = 0; $i < count($noms); $i++) {
  for ($j = $i + 1; $j < count($noms); $j++) {
    $dist = empreinte_distance($empreintes[$noms[$i]], $empreintes[$noms[$j]]);
    $minDiff = min($minDiff, $dist);
    if ($dist <= 12) printf("  ⚠️ %s ↔ %s : %d bits (proches !)\n", $noms[$i], $noms[$j], $dist);
  }
}
printf("  la paire de photos différentes LA PLUS PROCHE : %d bits\n", $minDiff);

echo "\n── VERDICT " . str_repeat('─', 60) . "\n";
$SEUIL_SIGNAL = 16; // doit refléter photos_signal() dans server/index.php
printf("  même photo maltraitée, pire cas        : %d bits  (%d mesures)\n", $pireMeme, $lignes);
printf("  photos DIFFÉRENTES, cas le plus proche : %d bits\n", $minDiff);
printf("  seuil de SIGNAL retenu dans le code    : %d bits\n\n", $SEUIL_SIGNAL);

// ── CE QUE CE BANC A ÉTABLI, ET QUI A CHANGÉ LE PROGRAMME ────────────────
// Les deux nuages SE CHEVAUCHENT : la même photo maltraitée s'éloigne plus
// (jusqu'à 14) que deux photos différentes ne se ressemblent (3). Il n'existe
// donc AUCUN seuil qui rattraperait une republication sans risquer de refuser
// une photo légitime. C'est pour cela que `photos_signal()` ne refuse jamais.
$chevauche = $minDiff <= $pireMeme;
printf("  %s les deux nuages se chevauchent (%d ≤ %d) — aucun VERROU n'est possible\n",
  $chevauche ? '✅' : '⚠️ ', $minDiff, $pireMeme);
if (!$chevauche) {
  echo "     (sur ce jeu-ci ils sont séparés ; le programme reste prudent quand même,\n"
     . "      un catalogue réel finit toujours par produire des séries qui se ressemblent)\n";
}

// La seule exigence chiffrée qui tienne : le seuil de SIGNAL doit être assez
// haut pour voir passer une même photo maltraitée. Il n'a pas de plafond, car
// un signal de trop ne coûte qu'un coup d'œil.
$ok = $pireMeme <= $SEUIL_SIGNAL;
printf("  %s une même photo maltraitée déclenche bien le signal (pire %d ≤ %d)\n",
  $ok ? '✅' : '❌', $pireMeme, $SEUIL_SIGNAL);
if (!$ok) {
  printf("\n❌ Le seuil de signal est trop bas : une republication rognée passerait\n"
       . "   inaperçue. Portez-le à au moins %d dans photos_signal().\n", $pireMeme);
  exit(1);
}
echo "\n✅ Le signal voit passer les republications ; rien ne refuse personne.\n";
