---
name: design-ivoirien
description: Identité visuelle de la Côte d'Ivoire pour le design d'interface, d'annonces et d'affiches — la « note ivoirienne ». Palette (orange/blanc/vert + terres chaudes), textiles et motifs (pagne wax, pagne baoulé, tissu Korhogo/Senufo, kita, masques), ton et langue (français ivoirien + Nouchi comme « chap-chap »), énergie urbaine d'Abidjan, formatage FCFA. À utiliser dès qu'on conçoit ou revoit un visuel Chap.ci qui doit « sonner ivoirien » : couleurs, motifs de fond, ambiance, vocabulaire, sans tomber dans le cliché.
---

# Design ivoirien — la « note ivoirienne » 🇨🇮

Cette base sert de **couche culturelle** aux autres skills design (typographie, marketplace, affiche). Objectif : que Chap.ci soit reconnu instantanément comme **100 % ivoirien**, avec fierté et modernité — **jamais** avec du folklore forcé.

## Principe directeur

> **Moderne d'abord, ivoirien dans les détails.** L'ossature est propre et actuelle (comme une app de qualité internationale) ; l'ivoirité vit dans la **palette**, les **accents de motifs**, le **vocabulaire** et l'**énergie**. On évoque, on ne déguise pas.

Le nom même — **« Chap.ci »** — est déjà une note ivoirienne : *chap-chap* (Nouchi = « vite, rapidement ») + *.ci* (le pays). Tout le design prolonge cette idée : **rapide, populaire, fier**.

## Palette

Base marque (déjà dans `tailwind.config.js`) :

| Rôle | Couleur | Usage |
| --- | --- | --- |
| Orange Chap (principal) | `#F77F00` | Actions, prix, accents — l'orange du drapeau + énergie |
| Orange clair / foncé | `#FFA243` / `#D95F00` | Dégradés, survols, profondeur |
| Vert ivoire | `#009E60` | Confiance, succès, « .ci », badges neuf/livraison |
| Encre | `#1B1A17` | Texte principal (pas de noir pur → plus chaud) |
| Crème | `#FFFDF9` / `#FFF3E4` | Fonds — lumière chaude, jamais blanc froid |

**Élargissements autorisés** (terres chaudes ivoiriennes, à doser) : terracotta `#C1440E`, ocre/latérite `#B5651D`, or `#E8A100`, sable `#EAD9C0`. Le **rouge du drapeau n'existe pas** — attention, le drapeau ivoirien est **orange-blanc-vert** (≠ Ghana rouge-jaune-vert). Ne jamais mélanger les deux.

Règles :
- **Orange = accent, pas fond plein partout.** Un aplat orange géant fatigue au soleil. L'orange ponctue ; le crème respire.
- Sur orange vif, texte blanc **avec** ombre légère (`.txt-legible`) pour le plein soleil.
- Contraste AA minimum — beaucoup d'utilisateurs sont **dehors, en plein jour**, sur écran moyen de gamme.

## Textiles & motifs (les « accents »)

À utiliser en **fonds discrets, bordures, séparateurs, filigranes** — jamais en aplat qui écrase le contenu.

| Motif | Origine | Emploi juste |
| --- | --- | --- |
| **Pagne wax** | Adopté partout (marchés d'Adjamé, Treichville) | Bandeau festif, en-tête d'affiche, opacité faible |
| **Pagne baoulé** (bandes tissées) | Peuple Baoulé (centre) | Séparateurs, lignes rythmées, motif géométrique sobre |
| **Tissu Korhogo / Senufo** (figures peintes : masques, animaux, danseurs) | Nord (Korhogo) | Illustrations, icônes de catégories, filigrane élégant |
| **Kita** (tissé, apparenté au kente akan) | Sud akan | Accents de fête, indépendance, célébrations |
| **Masques Baoulé / Senufo, Poro** | — | Symboles graphiques stylisés, jamais caricaturaux |

⚠️ **Respect** : ce sont des objets culturels vivants. On **stylise et abstrait** (motifs géométriques inspirés), on ne colle pas une photo de masque sacré sur une pub de téléphone. Éviter le pastiche « safari / Afrique générique » (girafes, savane orange coucher de soleil) : ça, c'est le cliché à fuir.

## Ton & langue

- **Français** clair et chaleureux, base de tout.
- **Touches de Nouchi** bien dosées pour la complicité : *chap-chap* (vite), *enjaillé* (content), *le boucan* (l'ambiance), *gérer* (assurer). À réserver aux **micro-copies** (boutons, encouragements, notifications), jamais aux mentions légales.
- **Éviter** le Nouchi lourd ou mal orthographié qui exclurait une partie des utilisateurs. Règle : *compréhensible par une grand-mère à Korhogo comme par un étudiant à Cocody*.
- Monnaie : **FCFA**, format `1 500 FCFA` (voir skill `typographie`).
- Politesse ivoirienne : direct mais respectueux (« Bienvenue », « On gère ça pour toi »).

## Énergie & ambiance

L'ivoirité visuelle, c'est aussi un **rythme** :
- **Abidjan** = mouvement, marché, débrouille, modernité (Plateau, Cocody) + populaire (Adjamé, Yopougon).
- Musique/culture : **coupé-décalé, zouglou** — vibrant, généreux, coloré, mais l'app reste **lisible** (l'énergie est dans les accents, pas dans le désordre).
- **WhatsApp-first** : en Côte d'Ivoire, tout se partage sur WhatsApp/Facebook. Les visuels (affiches, cartes d'annonce) doivent être **beaux même compressés**, pensés pour le **statut WhatsApp** (9:16).

## Checklist « ça sonne ivoirien ? »
- [ ] Palette orange-blanc-vert respectée (jamais le rouge du Ghana)
- [ ] Fond crème chaud, pas blanc froid
- [ ] Motif culturel en **accent discret**, stylisé, respectueux (pas de cliché safari)
- [ ] Micro-copie avec une touche de Nouchi compréhensible par tous
- [ ] FCFA bien formaté, lisible en plein soleil
- [ ] Beau même compressé sur WhatsApp
- [ ] Moderne d'abord — l'ivoirité est dans les détails, pas dans le déguisement
