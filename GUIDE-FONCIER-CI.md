# Vendre un terrain ou une maison en Côte d'Ivoire — ce que le formulaire doit demander

État du droit au 29 juillet 2026, d'après les publications des services de l'État
(MCLU, AFOR, Service public de Côte d'Ivoire) et la presse spécialisée.

Ce document sert de référence à l'enrichissement du formulaire de la catégorie
**Immobilier**. Il ne remplace pas un notaire, et le site ne doit jamais laisser
croire le contraire.

---

## 1. Les documents, et ce qu'ils valent réellement

Sept documents circulent couramment. **Trois seulement donnent la propriété.**

### Zone urbaine (lotissement approuvé)

| Document | Délivré par | Valeur |
|---|---|---|
| **Titre foncier (TF)** | Conservation foncière — Livre foncier | **Définitif.** Propriété pleine et entière. |
| **ACD** — Arrêté de Concession Définitive | Ministère de la Construction (MCLU), ou le Préfet hors Abidjan | **Définitif.** C'est l'acte qui donne la propriété du sol urbain. Ouvre le permis de construire et le prêt bancaire, et donne lieu à l'inscription au Livre foncier. |
| **ACP** — Arrêté de Concession Provisoire | MCLU | Provisoire, sous condition de mise en valeur. Doit devenir un ACD. Peut être retiré. |
| **ADU** — Attestation de Droit d'Usage coutumier | MCLU, **avec QR code** | Provisoire. Depuis le 1ᵉʳ janvier 2025, c'est le **seul document d'entrée accepté** pour demander un ACD. Ne vaut pas titre de propriété. |
| **Lettre d'attribution** | Mairie ou société de lotissement | Transitoire. Ne prouve pas la propriété. |
| **Attestation villageoise** | Chefferie | **Sans valeur de propriété.** Depuis le 31 mars 2025, elle n'ouvre plus de dossier ACD. |

### Zone rurale (domaine coutumier)

| Document | Délivré par | Valeur |
|---|---|---|
| **Titre foncier rural** | Immatriculation après certificat foncier | **Définitif.** |
| **Certificat foncier** | AFOR — Agence Foncière Rurale | Étape légale obligatoire vers le titre foncier rural. Pas encore la pleine propriété. |
| **ADU** | MCLU | Voir ci-dessus. |

Base légale rurale : loi n° 98-750 du 23 décembre 1998 relative au domaine foncier
rural, et ses modifications. Modernisation numérique encadrée par l'ordonnance
n° 2025-85 du 12 février 2025 (signature électronique, accélération de la
délivrance des certificats).

---

## 2. La réforme de 2025 — la raison d'être de ce formulaire

Au **1ᵉʳ janvier 2025**, l'**ADU** munie d'un QR code est devenue le seul document
d'entrée pour une demande d'ACD. La période de transition accordée aux détenteurs
d'attestations villageoises déjà enregistrées dans la base foncière s'est achevée
le **31 mars 2025**.

Le QR code existe pour une raison précise : **empêcher qu'une même parcelle soit
attribuée deux fois**. La double vente est de loin la première fraude foncière du
pays.

Conséquence directe pour Chap.ci : un vendeur qui présente une attestation
villageoise en 2026 ne peut plus faire avancer le dossier. L'acheteur doit le
savoir **avant** d'appeler, pas après avoir versé un acompte.

---

## 3. Le notaire

Le transfert de propriété passe par un **acte notarié** : sans lui, la mutation ne
peut pas être enregistrée. Un « papier de vente » signé entre particuliers ne
transfère rien.

Recommandation constante à afficher côté acheteur : **choisir son propre notaire**
et **faire passer le paiement par lui**.

---

## 4. Les cinq fraudes les plus fréquentes

1. **La double vente** — la même parcelle vendue à plusieurs acheteurs, souvent sur
   attestations villageoises successives.
2. **La photocopie** — l'original n'est jamais présenté, parce qu'il n'existe pas
   ou qu'il est falsifié.
3. **Le lotissement fantôme** — un « lot » vendu dans un lotissement jamais
   approuvé, annulé, ou en sursis.
4. **Le faux mandataire** — vente « pour le compte du propriétaire » sans
   procuration notariée ; ou un héritier qui vend seul un bien indivis.
5. **Le prix trop beau** — 40 % sous le marché du quartier cache presque toujours
   un litige, un enclavement, une emprise publique ou un dossier vide.

Le foncier pèse une part majeure du contentieux civil ivoirien : la prévention
coûte moins cher que le procès.

---

## 5. Vérifications gratuites, accessibles à tous

- **Lotissements — portail public du MCLU**
  <https://construction.gouv.ci/mclulotissement/index.php>
  Recherche par nom de lotissement, région, département. Trois statuts officiels :
  *approuvé*, *annulé*, *en sursis*. Vérifié comme accessible publiquement.
- **AFOR — Agence Foncière Rurale** — <https://www.afor.ci/>
- **Service public de Côte d'Ivoire** — <https://servicepublic.gouv.ci/>

L'authenticité d'un titre foncier ou d'un ACD se contrôle **à la Conservation
foncière du lieu, ou par un notaire**.

L'**IDUFCI** (Identifiant Unique du Foncier de Côte d'Ivoire, institué par décret
en 2019) identifie chaque parcelle du pays, mais sa plateforme
(idufci.construction.gouv.ci) est **réservée aux structures publiques et aux
professionnels habilités** — géomètres, notaires, banques. Le site ne doit donc pas
inviter un particulier à s'y rendre : le numéro se demande au notaire.

---

## 6. Champs proposés pour le formulaire

La maquette testable reprend exactement cette structure. Les champs marqués ⚠️
n'existent pas aujourd'hui dans `src/data/categoryForms.ts`.

### 1. Le bien
`transaction` (Vente / Location) · `nature` ⚠️ (Terrain nu, Terrain agricole,
Maison / Villa, Appartement, Immeuble, Bureau / Commerce) · `zone` ⚠️ (urbaine /
rurale) · `commune` ⚠️ · `quartier` ⚠️ · `surface` · `habitable` ⚠️ · `chambres` ⚠️ ·
`sdb` ⚠️ · `etat` ⚠️

### 2. Le dossier foncier (vente uniquement) ⚠️
`docs` **(choix multiple)** — les 9 documents, filtrés par zone. Un vendeur détient
souvent plusieurs pièces à la fois (une ADU **et** la lettre d'attribution, par
exemple) : il les coche toutes. « Aucun document » est exclusif dans les deux sens.
Le verdict affiché est celui du **meilleur** document coché ; si le vendeur en coche
plusieurs, l'acheteur reçoit un contrôle supplémentaire — vérifier qu'ils désignent
bien la même parcelle.

`numeros` — un numéro **obligatoire** par document coché qui en porte un ·
`lotissement` · `lot` · `idufci` **obligatoire** · `titulaire` (Moi-même / Un parent
— succession / Ma société / Un tiers — procuration) · `bornage` (Borné par un
géomètre agréé / Non borné / Je ne sais pas) · `plan` · `permis` · `conformite`

### 3. Situation ⚠️
`juridique` (Libre de tout litige / Succession en cours / Litige en cours /
Hypothèque en cours) · `occupation` · `acces` · `viabilisation` (choix multiple)

### 4. Prix et frais
`prix` (+ prix au m² calculé) · `negociable` · `notaire` ⚠️ · `frais` ⚠️ (choix
multiple) · `vendeur` ⚠️

### 5. Engagement du vendeur ⚠️
Trois cases **bloquantes** : sans les trois, la publication est refusée. Le bouton
« Publier » reste visible mais grisé, et le clic emmène le vendeur au premier champ
manquant plutôt que de le laisser chercher.

Celle-ci doit rester mot pour mot : « Je comprends que **Chap.ci ne vérifie aucun
document** et ne garantit aucune vente. »

### 6. Menu dépliant sous chaque annonce ⚠️
Sous la fiche, un `<details>` « Comprendre les documents fonciers » reprend
l'intégralité du guide : tableau des neuf documents, réforme de 2025, cinq arnaques,
liens de vérification gratuite. Même contenu que l'onglet Documents, servi par la
même fonction — une seule source, pas deux textes qui divergent.

---

## 7. Ce que le schéma actuel ne sait pas faire

`src/data/categoryForms.ts` décrit une liste plate de champs par catégorie
(`text` / `number` / `chips` / `toggle`). Il manque trois choses pour porter ce
formulaire :

1. **Les champs conditionnels** — le bloc foncier ne concerne que la vente ; les
   chambres ne concernent que le bâti ; la liste des documents dépend de la zone.
   Il faut une fonction de visibilité par champ.
2. **Le choix multiple** — `viabilisation` et `frais` acceptent plusieurs valeurs ;
   `chips` n'en garde qu'une.
3. **Les options portant un niveau de risque** — chaque document doit transporter
   son verdict (`ok` / `warn` / `bad`), sa description et le conseil affiché à
   l'acheteur. Une simple liste de chaînes ne suffit pas.

Il faudra aussi, côté serveur, décider si l'attribut `docs` est repris dans les
filtres de recherche (« terrain avec ACD ») — ce serait un argument commercial
réel, et gratuit.

---

## 7 bis. L'IDUFCI obligatoire — la réserve à garder en tête

L'IDUFCI est exigé à la publication, sur demande du Patron. La conséquence est
connue et assumée : **un vendeur dont l'ACD ou le titre foncier est antérieur à
2019 n'a pas ce numéro sur ses papiers**, et la plateforme qui le délivre n'est
ouverte qu'aux géomètres, notaires et banques. Il devra passer par son notaire
avant de pouvoir publier.

C'est un filtre volontaire : il écarte le vendeur pressé en même temps que
l'escroc. Si le terrain montre qu'il écarte surtout des vendeurs honnêtes, la
soupape la moins coûteuse est une case « Je ne l'ai pas encore » qui laisse
publier, en affichant la mention sur la fiche — l'acheteur reste informé, le
vendeur n'est plus bloqué.

---

## 8. La limite à ne jamais franchir

Chap.ci **ne vérifie aucun document**. Tout ce que le formulaire recueille est
**déclaré par le vendeur**. La fiche doit le dire, en clair, à chaque fois.

Afficher un dossier comme « définitif » sans cette réserve créerait exactement le
faux signal de confiance dont vivent les escrocs.
