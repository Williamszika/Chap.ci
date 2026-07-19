---
name: moderation-ci
description: Modération des annonces d'une marketplace ivoirienne — détecter et traiter les interdits (produits illégaux, contrefaçons, faune protégée, médicaments, armes), les arnaques et signaux de fraude (Mobile Money frauduleux, faux dépôt, « transitaire », prix trop beau, hors CI), les doublons/spam, et le contenu inapproprié. Barème de décision (laisser · masquer · bannir), file de priorités, messages à l'utilisateur en « vous » respectueux, conformité ARTCI/loi ivoirienne. À utiliser dès qu'on modère des annonces, conçoit des règles de modération, ou traite des signalements sur Chap.ci.
---

# Modération Chap.ci — confiance & propreté du catalogue 🧭

Une marketplace vit de la **confiance**. Une seule arnaque visible fait fuir dix
acheteurs. Le bureau **Confiance & Sécurité** modère pour que chaque annonce soit
**vraie, légale et sûre** — sans pénaliser les vendeurs honnêtes.

> Principe : **protéger l'acheteur d'abord**, mais présumer la bonne foi du vendeur.
> On explique toujours **pourquoi** en « vous » respectueux, et on donne la voie de recours.

## 1. Les interdits (retrait immédiat)

Catégories à **masquer d'office** puis notifier le vendeur :
- **Illégal** : drogue, armes/munitions, faux papiers, moyens de paiement volés.
- **Faune/flore protégée** : ivoire, écailles, espèces menacées (CITES) — sensible en CI.
- **Médicaments & produits de santé** sur ordonnance, produits « miracle », dépigmentants interdits.
- **Contrefaçons** ostensibles (marques copiées vendues comme authentiques).
- **Contenu adulte / à caractère sexuel**, prostitution déguisée.
- **Données personnelles** en vente, comptes/abonnements piratés.
- **Multi-level / arnaques financières**, « investissement garanti », loterie.

## 2. Les signaux d'arnaque (le nerf ivoirien)

Contexte local : beaucoup de fraudes passent par **Mobile Money** (Orange/MTN/Moov)
et le registre de la « bonne affaire trop belle ». Signaux à pondérer :

- **Prix anormalement bas** vs marché (iPhone neuf à 40 000 FCFA → suspect).
- Demande de **paiement d'avance** / « frais de transitaire » / « frais de dédouanement ».
- Vendeur qui **pousse hors plateforme** (« WhatsApp seulement », numéro dans la photo).
- **Localisation incohérente** : « à Abidjan » mais expédie « depuis l'étranger ».
- Photos **volées** (mêmes images sur plusieurs annonces / trouvées ailleurs).
- Texte au **copier-coller** identique sur plusieurs comptes récents.
- Compte **neuf** + première annonce à prix élevé + urgence (« vite, ça part »).
- Faux **numéro de dépôt Mobile Money** / capture de paiement retouchée.

Aucun signal seul ne condamne : c'est le **faisceau** qui décide. Deux signaux forts
→ masquer + vérifier. Un seul → surveiller / demander une précision.

## 3. Doublons & spam

- **Même annonce répétée** (même titre/photo) pour occuper la grille → garder 1, masquer le reste.
- **Bourrage de mots-clés** dans le titre → demander un titre propre.
- **Mauvaise catégorie** (mise en avant abusive) → recatégoriser ou renvoyer au vendeur.

## 4. Barème de décision

| Situation | Action | Réversible ? |
|---|---|---|
| Interdit clair (illégal, faune, armes) | **Masquer** + notifier + tracer | Non (sauf erreur) |
| Faisceau d'arnaque fort | **Masquer** + demander preuves | Oui si vendeur prouve |
| Doublon / spam | **Masquer les copies** | Oui |
| Photo/titre non conforme | **Laisser + demander correction** (délai) | — |
| Doute léger | **Laisser + surveiller** | — |
| Récidive / fraude avérée | **Bannir le compte** + alerte Sécurité | Escalade Patron |

Toujours : **journaliser** la décision (qui, quoi, pourquoi) pour l'audit.

## 5. Messages au vendeur (« vous », respectueux)

Ton ferme mais courtois, jamais accusateur d'emblée :

> « Bonjour, votre annonce **“…”** a été mise en pause car elle ne respecte pas
> nos règles (**motif : …**). Si vous pensez qu'il s'agit d'une erreur, vous
> pouvez nous répondre ici avec une preuve (facture, photo réelle). Merci de
> votre compréhension. — L'équipe Chap.ci »

## 6. File de priorités (le Modérateur, quotidien)

1. **Signalements utilisateurs** (les acheteurs voient ce qu'on rate).
2. **Annonces neuves de comptes récents** (surface d'arnaque #1).
3. **Catégories sensibles** (téléphonie, argent, véhicules, immobilier).
4. **Doublons / spam** de la journée.

## 7. Conformité & garde-fous

- Respecter la **loi ivoirienne** et l'**ARTCI** (voir bureau Juridique).
- **RGPD/vie privée** : ne pas exposer les données personnelles dans les motifs publics.
- La modération est **traçable et réversible** : une erreur doit pouvoir être annulée.
- Règle d'or : la routine **propose** les cas + décisions recommandées et **peut
  masquer via l'outil admin prévu**, mais **ne bannit pas seule** un compte ni ne
  modifie le code — bannissement définitif = validation du Patron.

## Checklist quotidienne

- [ ] Signalements traités (0 en attente > 24 h).
- [ ] Comptes neufs du jour passés en revue.
- [ ] Catégories sensibles balayées (faisceau d'arnaque).
- [ ] Doublons/spam nettoyés.
- [ ] Décisions journalisées + entrée au Journal des bureaux.
- [ ] Cas graves (fraude, illégal) remontés à la Sécurité + au Patron.
