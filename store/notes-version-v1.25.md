# Notes de version — v1.25 (versionCode 26)

Construite le **12/09/2026**. Première mise à jour reçue par les douze testeurs
depuis la **v1.20 du 15 août** — trente-huit chantiers d'écart.

Le français « vous » respectueux, comme partout sur Chap.ci.

> ⚠️ **Ces notes s'adressent à douze testeurs qui n'ont rien reçu depuis quatre
> semaines**, et à qui Google reproche de ne pas assez utiliser l'application.
> Elles ne servent donc pas seulement à informer : **elles doivent donner envie
> d'ouvrir l'application et de dire ce qu'on en pense.** D'où la dernière ligne.

---

## Google Play — « Nouveautés » (max 500 caractères)

> Play Console → Version → Notes de version (**fr-FR**).

```
Une grosse mise à jour, et c’est vous qui la testez en premier.

• Une vidéo sur vos annonces — jusqu’à une minute
• Une affiche prête pour votre statut WhatsApp
• « Faire une offre » : négociez sans quitter la conversation
• Chap.ci écrit l’annonce à partir de votre photo
• Empreinte digitale et Face ID
• Comptes Pro : stock, alertes de rupture, offres d’emploi

Dites-nous ce qui cloche : dans le Play Store, « Envoyer des commentaires ». 🧡
```

*(487 caractères espaces comprises.)*

---

## Version courte (secours, si l'espace manque)

```
Vidéo d’une minute sur vos annonces, affiche pour votre statut WhatsApp, « Faire une offre », l’annonce écrite depuis votre photo, empreinte digitale, stock et offres d’emploi pour les Pro. Dites-nous ce qui cloche : « Envoyer des commentaires ». 🧡
```

---

## App Store Connect — « Nouveautés » (iOS, le jour venu)

```
Une grosse mise à jour de Chap.ci.

Vendre plus vite :
• Ajoutez une vidéo à votre annonce, jusqu’à une minute — c’est ainsi qu’on vend à Abidjan.
• Une affiche toute faite pour votre statut WhatsApp, avec le prix et le lien.
• Chap.ci remplit l’annonce à partir de votre première photo : titre, catégorie, description. Vous relisez, vous corrigez, vous publiez.
• « Ça vaut combien ? » vous donne la fourchette des prix pratiqués.

S’entendre sur le prix :
• « Faire une offre » : proposez un montant, le vendeur accepte, refuse ou contre-propose — sans quitter la conversation.

Pour les comptes professionnels :
• Votre stock, avec une alerte quand un produit passe sous le minimum.
• Vos offres d’emploi, avec le formulaire de candidature que vous dessinez.
• Vos abonnés sont prévenus de chaque nouveauté.

Et aussi :
• Empreinte digitale et Face ID pour ouvrir l’application.
• Chaque notification ouvre enfin l’écran dont elle parle.
• Les vidéos ne se lancent plus toutes seules, et leur poids est écrit avant que vous n’appuyiez.
• Mot de passe oublié : la procédure marche maintenant dans l’application.

Merci de faire vivre Chap.ci. Bonne vente ! 🧡
```

---

## Ce qu'il ne faut PAS écrire, et pourquoi

- **Pas de « des milliers d'annonces »** ni aucune promesse de volume. Le 27/07/2026,
  la fiche du store en portait pour un catalogue de **trois** annonces : tout a dû
  être réécrit, et c'était un risque au regard du règlement de Google sur les
  métadonnées.
- **Ne promettez pas les notifications qui réveillent le téléphone.** Le code est là,
  mais elles n'ont **jamais été vues sonner** : il faut `api/data/fcm.json` sur le
  serveur ET cette version-ci installée. **Tant que personne n'a entendu un
  téléphone sonner, on n'en parle pas dans une note de version.**
- **Rien sur iOS** dans les notes Android.

---

## Rappel

- Cocher **fr-FR**, la même langue que la fiche.
- Pas de « reconnectez-vous une fois » cette fois : contrairement à la v1.20, rien
  ne change dans le rangement de la session. La mise à jour est transparente.
