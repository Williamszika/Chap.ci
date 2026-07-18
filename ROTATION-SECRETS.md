# 🔐 Rotation des secrets — Chap.ci

Procédure pour remplacer les secrets qui ont pu être exposés (clé cron, secret JWT,
mot de passe base de données). **Aucune valeur secrète ne transite par le chat** :
le serveur régénère lui-même les secrets, et tu lis les nouvelles valeurs depuis
ton propre cPanel / ton tableau de bord admin.

> Le code (`chapci_hardened_secret()`) est fait pour ça : si `jwt_secret` ou
> `cron_key` sont **vides** dans `config.php`, un secret aléatoire fort est généré
> et rangé dans `api/data/.secret_*` (dossier interdit au web).

---

## A. Secret JWT — le plus important ⚠️

Un JWT volé permet de **se faire passer pour n'importe quel utilisateur (dont toi,
admin)**. On le régénère.

1. cPanel → **Gestionnaire de fichiers** → `public_html/api/config.php` → *Modifier*.
2. Trouve la ligne `'jwt_secret' => '...'` et remets-la **vide** :
   ```php
   'jwt_secret'  => '',
   ```
3. (Pour être sûr d'avoir un secret NEUF) dans `public_html/api/data/`, supprime le
   fichier `.secret_jwt` **s'il existe**. (Coche « Afficher les fichiers cachés ».)
4. Enregistre.
5. ✅ Effet : le serveur crée un nouveau secret. **Tout le monde est déconnecté une
   fois** (il faudra se reconnecter). L'ancien JWT volé ne vaut plus rien.

---

## B. Clé cron — régénérée puis lue depuis le tableau de bord

1. Dans le même `config.php`, remets la clé cron **vide** :
   ```php
   'cron_key'    => '',
   ```
2. (Optionnel, pour une clé neuve) supprime `public_html/api/data/.secret_cron` s'il existe.
3. Enregistre.
4. Reconnecte-toi au site (admin), va dans **Tableau de bord admin → Sauvegardes** :
   la **nouvelle clé cron** y est affichée. Copie-la.
5. Mets à jour **partout** où l'ancienne clé servait (voir §D).

---

## C. Mot de passe de la base de données

1. cPanel → **Bases de données PostgreSQL** → section *Utilisateurs actuels* →
   ton utilisateur DB → **Modifier le mot de passe**.
2. Clique **Générateur de mot de passe**, coche « J'ai copié ce mot de passe »,
   **copie-le**, valide.
3. Retourne dans `api/config.php`, mets à jour :
   ```php
   'db_pass'  => 'LE_NOUVEAU_MOT_DE_PASSE',
   ```
4. Enregistre, puis **recharge chap.ci** : si le site s'affiche, la base est OK.
   (S'il affiche une erreur DB : le mot de passe de `config.php` ne correspond pas —
   recopie-le exactement.)

---

## D. Mettre à jour la clé cron partout (après §B)

Remplace `VOTRE_NOUVELLE_CLE` par la clé lue au §B.4.

**Crons cPanel** (Tâches Cron) — chaque URL de la forme :
```
https://chap.ci/api/cron/XXXX?key=VOTRE_NOUVELLE_CLE
```
(digest, suggestions, alerts, stats, security, cleanup, report, backup, review-invites)

**Routines Claude** (dans l'UI claude.ci → Routines) — partout où le prompt contient
`CHAPCI_CRON_KEY=...` ou `?key=...`, remets la nouvelle clé.

---

## E. Vérification finale

- [ ] chap.ci s'affiche (base OK).
- [ ] Connexion / création de compte fonctionne (JWT OK — reconnexion nécessaire).
- [ ] Une URL cron avec la nouvelle clé renvoie `200` (pas `403 Clé invalide`).
- [ ] Les anciennes valeurs (`c46e748b…`, `6c9e9f08…`, ancien mot de passe DB) ne
      sont plus dans `config.php`.

> ℹ️ Si après avoir vidé `jwt_secret`/`cron_key` la connexion ou le cron se comporte
> mal, c'est que le dossier `api/data/` n'est **pas inscriptible**. Dans ce cas,
> mets une valeur explicite forte que **tu génères toi-même** (bouton *Générateur*
> de cPanel), longue et aléatoire (≥ 32 caractères), directement dans `config.php`.
