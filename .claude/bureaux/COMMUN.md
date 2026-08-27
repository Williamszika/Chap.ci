# Le socle commun des bureaux

Ce que **tous** les bureaux doivent savoir. Chaque routine y renvoie au lieu de le
recopier : un chiffre recopié dans un prompt ne se met jamais à jour tout seul, il
vieillit en silence et fait conclure à côté.

Ce fichier est la **source unique**. Si un de ces points change, il change ici, une fois.

---

## 1. Aucun chiffre du catalogue ne se fige dans un prompt

**Mesure-le, à chaque ronde.** Le catalogue bouge.

```bash
curl -sS -H 'X-Cron-Key: CLE_CRON_ICI' 'https://chap.ci/api/cron/stats?days=30'
```

À défaut de clé : `https://chap.ci/api/listings?limit=100` donne le compte réel des
annonces actives, sans authentification.

**Ce que ça a déjà coûté.** Six routines ont porté « 3 annonces actives, 1 vendeur,
1 commune (Bingerville) » du 25 juillet au 4 août 2026. Le catalogue en comptait 7 pour
3 vendeurs — plus du double. Six bureaux ont donc raisonné pendant dix jours sur 40 % de
la réalité, en écrivant ce chiffre comme un constat.

Écris le chiffre **avec sa date de mesure**, dans le rapport, jamais dans le prompt.

---

## 2. L'état de l'application (Google Play ET App Store)

**Lis `store/APP-VERSIONS.md`** — seul endroit tenu à jour, la version la plus récente en
tête.

Ce qui reste vrai et ne bouge pas :

- appId `ci.chap.app` sur les DEUX plateformes ; compte développeur **personnel** ;
- depuis la **v1.20, l'application est en FLUTTER** — un code natif séparé, dans
  `flutter_app/`, et non plus le site enveloppé dans une WebView Capacitor. Un correctif du
  site (`src/`) ne rentre donc PLUS dans l'app ; seul `flutter_app/` la fait avancer. Le
  serveur, lui, reste commun au site et à l'app ;
- l'application vise les **deux boutiques** : **Google Play** (un AAB, ~50 Mo, que le Play
  Store découpe par appareil au téléchargement) et l'**App Store** (un IPA). Le volet **iOS**
  exige un Mac avec Xcode : tant qu'il manque, il est bloqué — `store/APP-VERSIONS.md` le dit,
  et aucun bureau ne produit alors d'instructions Apple ;
- avant la production sur **Google Play**, Google impose **12 testeurs inscrits en continu
  pendant 14 jours** sur un test **fermé** (l'App Store, lui, passe par TestFlight, sans ce
  seuil) ;
- le site propose aussi l'installation en **PWA** depuis le navigateur.

**Le champ « État » est écrit à l'avance par le Développement.** Aucun bureau n'a accès à la
Play Console ni à App Store Connect. Énonce-le comme une lecture de journal, jamais comme un
constat : « d'après le journal, non confirmé par le Patron », et demande la relecture de la
ligne de la release.

---

## 3. La clé cron

**Vérifie d'abord ton propre prompt.** Un exemple resté sur une ancienne clé est la panne
la plus fréquente, et la plus invisible.

Écris la clé **et** l'URL entre **apostrophes simples** — sans elles, le shell avale les
caractères spéciaux et rend un 403 incompréhensible :

```bash
curl -sS -H 'X-Cron-Key: CLE_CRON_ICI' 'https://chap.ci/api/cron/stats?days=30'
```

Un **403 « Clé invalide »** signifie que la clé a été régénérée : signale-le — elle se
récupère sur chap.ci → Admin → Tâches auto — et **poursuis ta ronde**. La plupart des
vérifications se font sans clé. Ne t'arrête jamais sur un 403.

La vraie clé reste chez le Patron : les prompts et le dépôt portent `CLE_CRON_ICI` et
`JETON_MODERATION_ICI`.

---

## 4. Les routes cron qu'un bureau n'appelle pas

Elles écrivent, envoient des e-mails ou déclenchent des sauvegardes. Les appeler depuis
une ronde produit des envois en double et fausse les journaux :

`backup` · `cleanup` · `digest` · `report` · `report-email` · `ads-expiring` ·
`seo` · `activation-relance` · `review-invites` · `rappels-pro` · `alerts` · `suggestions`

Deux exceptions écrites : **🛡️ Le Gardien** pour `cleanup` et la modération,
**🗂️ Le Secrétariat** pour `report-email`, une fois par semaine.

**Ajoutés le 15/08/2026** — ils manquaient, et la liste servait de permis implicite :

| route | ce qu'elle fait vraiment |
|---|---|
| `report` | envoie un récap (activité + sécurité + santé) au Patron **et** à contact@chap.ci. Aucun throttle. C'est le rapport **du serveur**, sans Claude — à ne pas confondre avec `report-email`, qui poste le HTML/PDF que le Secrétariat lui donne. |
| `ads-expiring` | envoie des e-mails **aux annonceurs eux-mêmes** : rapport, veille d'expiration, fin d'annonce. Le seul de la liste qui écrive à des utilisateurs. |
| `seo` | **écrit en base** : expire la diffusion SEO de la veille et en insère une nouvelle sur l'écran publicitaire (une par jour civil). |

**`security` reste autorisé** au Gardien : il envoie bien un e-mail d'alerte, mais
**throttlé à 1 envoi par 24 h** (via l'événement `security_alert` du journal d'audit).
C'est ce throttle qui rend la ronde sans danger — ne le retirez pas.

---

## 5. Une vérification doit pouvoir échouer

Une sonde qui teste une **liste de noms connus** ne trouve que ce qu'elle connaît déjà.
Le 4 août 2026, un bureau a rendu « Fichiers `/api/` : propre » après avoir testé trois
noms — alors que six fichiers de diagnostic et un dossier entier y traînaient, invisibles
parce qu'ils n'étaient pas dans la liste.

Fais lire **l'état réel** : `/api/health` pour les empreintes, le Gestionnaire de
fichiers pour un dossier, une requête qui énumère plutôt qu'une qui confirme.

Et rappelle-toi que **chaque empreinte ne prouve que son propre fichier** : `empreinte`
couvre `api/index.php`, `empreinteSeo` couvre `seo.php`, `empreinteSite` couvre
`index.html`. Conclure sur l'un en lisant l'autre, c'est une vérification qui ne peut pas
échouer.

---

## 6. La remise du rapport

Les bureaux sont en **lecture seule** : ils ne modifient, ne commitent, ni ne déploient
rien. Ils remettent des propositions prêtes à exécuter.

Sans accès en écriture au dépôt, le rapport va au **🗂️ Secrétariat**, qui le consigne
dans `.claude/bureaux/JOURNAL.md`.

Une notification poussée se réserve à ce qui coûte cher chaque minute : une panne de
disponibilité, une fuite, un blocage de parcours. Le reste attend le rapport.
