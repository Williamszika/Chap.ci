# ⚠️ Guide obsolète — ne pas suivre

Ce guide datait de l'époque **Supabase**, abandonnée en juillet 2026. Il demandait de
déclarer chez Google des adresses qui n'existent plus :

- une URL de rappel `…supabase.co/auth/v1/callback` — le projet Supabase est fermé ;
- des origines `williamszika.github.io` — le site est sur **chap.ci**.

**Le suivre aujourd'hui casserait la connexion Google du site.** C'est pour cela qu'il
n'est pas simplement supprimé : quelqu'un pourrait le retrouver dans l'historique et le
prendre au sérieux.

## Le guide à jour

👉 **[`server/GUIDE-CONNEXION-GOOGLE-TELEPHONE.md`](server/GUIDE-CONNEXION-GOOGLE-TELEPHONE.md)**

Il couvre la connexion Google et la connexion par téléphone (code SMS) telles qu'elles
fonctionnent réellement : tout se règle dans `api/config.php` sur le serveur, sans
reconstruire le site.

## Et pour l'application Android

👉 **[`store/CONNEXION-GOOGLE-APP.md`](store/CONNEXION-GOOGLE-APP.md)**

L'empreinte SHA-1 du client OAuth Android se lit dans la **Play Console → Intégrité de
l'application**, jamais dans le keystore.

## Et Apple

Il n'y a **pas d'application iOS**, et il n'y en aura pas tant qu'un Mac et Xcode
manquent. Aucun réglage Apple n'est à faire aujourd'hui.
