# 🛒➡️🇨🇮 Moteur de sourcing / arbitrage — Europe → Abidjan

Système d'agents automatiques qui repèrent des articles **peu chers en Europe**
(Kleinanzeigen & marketplaces d'occasion), calculent le **coût total rendu Abidjan**
(achat + fret + douane) et le **prix de revente réaliste à Abidjan**, puis classent
les **meilleures affaires** pour Chap.ci.

> Exécuté **3×/semaine** (lun. / mer. / ven.) par une *Routine* Claude, avec envoi du
> rapport **par email** à l'administrateur du site.

---

## 1. Ce que font les agents

| Agent | Rôle |
|-------|------|
| **Demande Abidjan** | Étudie ce que les Ivoiriens achètent le plus + les **prix de revente réels** à Abidjan (FCFA), par catégorie. |
| **Sourcing Europe** | Repère les **prix d'achat bas** sur Kleinanzeigen et marketplaces similaires (occasion/déstockage) pour les articles ciblés. |
| **Logistique & douane** | Estime le **fret** (aérien €/kg vs maritime/groupage) et la **fiscalité d'import ivoirienne** (droits de douane UEMOA + TVA + redevances). |
| **Économiste (synthèse)** | Assemble tout, calcule la **marge nette par article** (aérien ET maritime) et **classe** par rentabilité/ROI. |
| **Étude de marché (critique)** | Vérifie le réalisme, écarte les pièges (contrefaçon, articles interdits, saturation, saisonnalité) et finalise le **top des affaires**. |

Chaque exécution produit un rapport structuré : **Top affaires**, calcul de marge
détaillé, et conseils d'achat concrets.

---

## 2. Modèle économique (le calcul)

Monnaie : **1 € = 655,957 FCFA** (le FCFA/XOF est arrimé à l'euro — taux fixe, fiable).

### Coût de revient rendu-dédouané (par article)

```
Coût_revient =  Prix_achat
             +  Frais_acquisition        (≈ 5 % : déplacement, négo, risque)
             +  Fret_Abidjan             (aérien OU maritime, le moins cher retenu)
             +  Douane_import            (droits + TVA 18 % + redevances)
             +  Dédouanement_local       (transitaire + manutention Abidjan)
```

### Fret (repères — à réactualiser par l'agent logistique)

| Mode | Délai | Tarif indicatif « tout compris » | Bon pour |
|------|-------|----------------------------------|----------|
| **Aérien** (groupage/transitaire) | 7–12 j | ~ **9–13 €/kg** | Petit + forte valeur/kg (téléphones, montres, pièces rares) |
| **Maritime** (groupage LCL) | 4–8 sem | ~ **1,5–3 €/kg** équiv. (facturé au volume/CBM, minimum de groupage) | Volumineux/lourd (électroménager, meubles, lots) |

> Règle : **valeur/kg élevée → aérien**. **Volumineux/lourd → maritime**.
> L'agent calcule les deux et garde le plus rentable.

### Fiscalité d'import Côte d'Ivoire (repères UEMOA/TEC — à confirmer par l'agent)

Base taxable = **CIF** (valeur article + fret + assurance).

| Élément | Taux indicatif |
|---------|----------------|
| Droit de douane (DD) | 0 % / 5 % / 10 % / 20 % selon catégorie (TEC UEMOA) |
| TVA | **18 %** |
| Redevances (RSTA, RS, prél. communautaires…) | ~ 1,5–2,6 % |
| **Charge d'import effective (ordre de grandeur)** | **~ 25–40 % de la valeur CIF** pour l'électronique/téléphones d'occasion |

> ⚠️ L'agent doit **confirmer les taux réels** par catégorie et signaler les
> **articles réglementés/interdits** (ex. matériel radio, produits contrefaits,
> certains produits d'occasion). Import **déclaré et conforme** uniquement.

### Rentabilité

```
Marge_nette  =  Prix_revente_Abidjan  −  Coût_revient  −  Frais_de_vente (≈ 5 % : négo/retour)
ROI (%)      =  Marge_nette / Capital_investi × 100
```

### Seuils de sélection (un article n'est proposé que si)

- **Marge nette ≥ 30 %** du coût de revient **ET**
- **Marge nette ≥ 20 000 FCFA** par unité (sinon l'effort logistique n'en vaut pas la peine), **ET**
- Article **non réglementé**, demande **avérée** à Abidjan, risque contrefaçon **faible**.

---

## 3. Contraintes du cycle (réglages actuels)

- **Budget/capital par envoi :** **< 1 000 €** → priorité aux articles à **forte valeur au kilo**.
- **Fret :** les agents **comparent aérien et maritime** et gardent le meilleur.
- **Catégories :** **libres** — les agents choisissent les niches les plus rentables.
- **Cibles prioritaires** (fort import vers Abidjan) : Téléphones, Électronique
  (PC portables, TV, consoles, photo), Électroménager compact, Pièces auto,
  Outillage/Matériel Pro, Loisirs (vélos, fitness), Mode de marque, Puériculture.

Ces réglages se changent en éditant la section **CONFIG** de
`sourcing-arbitrage.mjs` (budget, modes de fret, seuils, catégories).

---

## 4. Livraison

- **Email à l'administrateur avec le rapport PDF en pièce jointe**, à chaque exécution.
  - La routine lance `deliver-report.mjs` : il génère le **PDF paysage** (Chromium système, sans dépendance npm) puis l'envoie via l'endpoint serveur **`POST /api/cron/report-email`** (authentifié par la clé cron, SMTP du site).
  - Le corps de l'email contient déjà le **top des affaires + les liens d'achat** ; le **PDF complet** (tableau + tous les liens cliquables + conseils + note de marché) est **joint**.
  - Repli : si le PDF échoue, l'email part en HTML seul ; la notification de la Routine sert de filet de sécurité (rapport en texte).
- Fréquence : **3×/semaine — lundi, mercredi, vendredi (07:00 GMT = heure d'Abidjan).**

### Fichiers du moteur
| Fichier | Rôle |
|---------|------|
| `sourcing-arbitrage.mjs` | Workflow multi-agents (recherche → économie → rapport). |
| `deliver-report.mjs` | Génère le PDF + envoie l'email (appelé par la routine). Aucune dépendance npm. |
| `README.md` | Ce document (modèle économique + fonctionnement). |

> ⚙️ **Côté serveur** : l'envoi d'email avec pièce jointe nécessite l'endpoint
> `cron/report-email` (ajouté dans `server/index.php`). Il doit être **déployé**
> sur chap.ci (`api/index.php`) pour que le PDF soit joint.

## 5. Limites (honnêteté)

Kleinanzeigen bloque le scraping massif : les agents font une **recherche best-effort**
(prix indicatifs, fourchettes, articles à cibler + calcul complet). C'est un
**outil d'aide à la décision** — l'humain valide et achète. Les prix réels de
chaque annonce doivent être vérifiés au moment de l'achat.
