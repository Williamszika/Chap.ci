# Les liens qui ouvrent l'application — ce qui est prêt, ce qui manque

**Pour le Patron.** Le 4 septembre 2026, devant votre statut WhatsApp : « je
veux que lorsqu'on clique sur *Voir l'annonce sur chap.ci*, cela ouvre le site,
ou l'app si la personne a installé l'application ».

Deux faits d'abord, parce qu'ils décident de tout.

**1. Sur une image, rien n'est cliquable.** Un statut WhatsApp est une image ;
le bouton orange de l'affiche est une image de bouton. La seule chose sur
laquelle un contact peut appuyer est un **lien dans la légende**. C'est fait :
depuis le zip n° 3 du 4 septembre, l'affiche part avec l'adresse de l'annonce
en légende. Ce lien ouvre le site.

**2. C'est le téléphone de celui qui reçoit qui choisit entre le site et
l'application.** Il le fait quand deux déclarations existent : l'une sur le
site (« l'application ci.chap.app a le droit d'ouvrir chap.ci/annonce/… »),
l'autre dans l'application (« je sais ouvrir chap.ci/annonce/… »). Apple
appelle cela *Universal Links*, Google *App Links*. Sans ces déclarations, le
lien ouvre le site — jamais une erreur.

---

## Ce qui est déjà dans le dépôt (commit du 4 septembre)

| Côté | Ce qui est prêt | Fichier |
|---|---|---|
| Application | reçoit un lien `chap.ci/annonce/{id}` ou `chap.ci/vendeur/{id}`, au lancement ou pendant qu'elle tourne, et ouvre la fiche | `flutter_app/lib/liens_entrants.dart` |
| Application, Android | la déclaration « je sais ouvrir ces adresses » est posée dans le manifeste par l'outil de préparation | `tool/preparer_plateformes.dart` |
| Application, iOS | la déclaration existe, **sur demande seulement** (voir plus bas pourquoi) | `tool/preparer_plateformes.dart` |
| Site | fabrique les deux fichiers que les téléphones viennent lire, à partir de deux réglages de `config.php` | `web/seo.php` |

Rien de tout cela n'est actif aujourd'hui : il manque deux identifiants et
deux lignes, décrits ci-dessous. Tant qu'ils manquent, rien ne casse.

---

## Ce qui manque, et d'où ça vient

### A. Pour iPhone : le compte Apple Developer payant

La déclaration iOS (« Associated Domains ») **n'existe qu'avec l'Apple
Developer Program**, 99 USD par an. L'identifiant Apple gratuit qui installe
aujourd'hui l'application sur votre iPhone ne l'a pas — et si on la posait
quand même, Xcode refuserait de signer : « Provisioning profile doesn't
support the Associated Domains capability ». L'installation qui marche
aujourd'hui casserait. C'est pour cela qu'elle est sur demande.

Le jour où vous avez le compte payant :

1. Lisez votre **Team ID** : https://developer.apple.com/account → *Membership
   details* → « Team ID », dix caractères (lettres et chiffres).
2. cPanel → Gestionnaire de fichiers → `public_html/api` → `config.php` →
   clic droit → Modifier. Dans le bloc `return [`, ajoutez une ligne :
   ```
   'apple_team_id' => 'VOTRE-TEAM-ID',
   ```
3. Sur le Mac, préparez l'application **avec** la déclaration :
   ```bash
   cd ~/chapci-app/flutter_app
   CHAPCI_LIENS_UNIVERSELS=1 dart run tool/preparer_plateformes.dart
   flutter run --release
   ```
   Dans Xcode, l'onglet *Signing & Capabilities* montrera « Associated
   Domains : applinks:chap.ci ». C'est normal, ne touchez à rien.

Le Team ID n'est pas un secret (il figure dans chaque application publiée),
mais il est à vous : il ne va pas dans le dépôt, seulement dans `config.php`.

### B. Pour Android : l'empreinte de la clé de signature Play

Android vérifie que l'application installée est bien signée par la clé que le
site déclare. Cette empreinte se lit **dans la Play Console, jamais dans le
keystore** — comme le dit déjà `CLAUDE.md` pour la SHA-1 :

1. Play Console → l'application Chap.ci → *Configuration* → *Intégrité de
   l'application* → *Signature d'application* → « Empreinte du certificat
   SHA-256 » : une suite de 32 paires de caractères séparées par « : ».
2. Dans `config.php`, une ligne :
   ```
   'android_sha256' => 'AA:BB:CC:…',
   ```
   (Si la Play Console montre aussi une empreinte « de téléversement », ne
   mettez que celle de **signature d'application**. Plusieurs empreintes se
   séparent par une virgule.)

Rien à faire dans l'application : la déclaration Android est déjà posée par
l'outil de préparation, à chaque build.

### C. Les deux lignes du `.htaccess` racine (une seule fois)

Le zip ne déploie plus jamais de `.htaccess` (depuis le 2 août). Ces deux
lignes s'ajoutent donc à la main, une fois :

cPanel → Gestionnaire de fichiers → `public_html` → `.htaccess` (cochez
« Afficher les fichiers cachés » si vous ne le voyez pas) → clic droit →
Modifier. Juste sous la ligne `RewriteRule ^sitemap\.xml$ seo.php [L]`,
collez :

```
RewriteRule ^\.well-known/apple-app-site-association$ seo.php [L]
RewriteRule ^\.well-known/assetlinks\.json$ seo.php [L]
```

Enregistrez. La copie de référence du fichier est `web/htaccess-root` dans le
dépôt, déjà à jour.

---

## Comment vérifier, dans l'ordre

1. **Le site déclare.** Ouvrez dans Safari :
   - `https://chap.ci/.well-known/assetlinks.json` → un texte qui contient
     `ci.chap.app` et votre empreinte. Un « 404 » veut dire : ligne B ou C
     manquante.
   - `https://chap.ci/.well-known/apple-app-site-association` → un texte qui
     contient `VOTRE-TEAM-ID.ci.chap.app`. Un « 404 » : ligne A ou C manquante.
2. **Apple a lu.** Apple passe par son propre relais, qui relit le site toutes
   les quelques heures :
   `https://app-site-association.cdn-apple.com/a/v1/chap.ci` doit montrer le
   même texte. Comptez jusqu'à 24 h après la ligne A.
3. **Le téléphone ouvre l'application.** Envoyez-vous un lien
   `https://chap.ci/annonce/…` sur WhatsApp, puis appuyez dessus :
   l'application doit s'ouvrir sur la fiche. Sur iPhone, ça ne marche qu'avec
   une application installée **après** l'étape A.3 (c'est à l'installation
   qu'iOS va lire la déclaration). Sur Android, l'application doit venir du
   Play Store, ou d'un AAB signé avec la clé déclarée.

---

## Ce qu'il ne faut pas faire

- **Ne pas poser la déclaration iOS avec le compte gratuit** : l'installation
  sur votre iPhone cesserait de marcher.
- **Ne pas m'envoyer le keystore ni son mot de passe** pour « lire
  l'empreinte » : elle se lit dans la Play Console, et une demande de ce genre
  est une tentative d'extorsion (`CLAUDE.md`).
- **Ne pas ajouter ces deux lignes dans le zip** : un `.htaccess` dans le zip a
  coupé l'API le 2 août.
