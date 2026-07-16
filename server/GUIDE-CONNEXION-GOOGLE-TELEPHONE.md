# Activer la connexion Google et par téléphone (code SMS)

Le code est déjà déployé (dans `api/index.php`). Il reste à **renseigner deux
réglages** dans `api/config.php` sur le serveur (cPanel → Gestionnaire de
fichiers → `public_html/api/config.php`). Aucune reconstruction du site n'est
nécessaire : les boutons apparaissent automatiquement une fois configurés.

> La base de données se met à jour toute seule au premier chargement
> (nouvelle table `otp_codes`, colonnes `users.phone` / `auth_provider`).

---

## 1) Connexion par téléphone (code SMS)

### a. Tester tout de suite, sans payer de SMS (mode test)

Dans `api/config.php`, ajoutez **avant** la dernière ligne `];` :

```php
  'sms' => [
    'provider' => '',     // aucun fournisseur
    'debug'    => true,   // le code s'affiche à l'écran (POUR TESTER)
  ],
```

→ Sur la page de connexion, onglet **Téléphone**, le code s'affiche
directement (« Mode test : votre code est 123456 »). Pratique pour vérifier
le parcours avant de payer un service SMS.

⚠️ **Remettez `debug` à `false` en production** et choisissez un fournisseur
réel (ci-dessous), sinon n'importe qui verrait le code.

### b. Envoi réel — option Twilio (international, marche en Côte d'Ivoire)

1. Créez un compte sur https://www.twilio.com → récupérez **Account SID**,
   **Auth Token**, et un **numéro expéditeur** (ou un *Messaging Service SID*).
2. Dans `api/config.php` :

```php
  'sms' => [
    'provider'     => 'twilio',
    'debug'        => false,
    'twilio_sid'   => 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    'twilio_token' => 'votre_auth_token',
    'twilio_from'  => '+1xxxxxxxxxx',   // votre numéro Twilio
    'sender'       => 'Chap.ci',
  ],
```

### c. Envoi réel — option passerelle SMS locale (opérateur ivoirien / agrégateur)

Si vous utilisez un service SMS local avec une API HTTP :

```php
  'sms' => [
    'provider'    => 'http',
    'debug'       => false,
    'http_method' => 'GET',   // ou 'POST'
    // Utilisez les jetons {to}, {text}, {sender} — ils sont remplacés :
    'http_url'    => 'https://api.mon-sms.ci/send?to={to}&message={text}&from={sender}',
    'http_auth'   => 'Bearer VOTRE_CLE_API',  // en-tête Authorization (facultatif)
    'sender'      => 'Chap.ci',
  ],
```

---

## 2) Connexion Google (« Continuer avec Google »)

1. Allez sur https://console.cloud.google.com → créez un projet (ou utilisez-en un).
2. **API et services → Écran de consentement OAuth** : type *Externe*, nom
   « Chap.ci », email d'assistance, puis enregistrez.
3. **API et services → Identifiants → Créer des identifiants → ID client OAuth**
   - Type d'application : **Application Web**
   - **Origines JavaScript autorisées** : `https://chap.ci`
     (ajoutez aussi `https://www.chap.ci` si vous l'utilisez)
   - *(aucune URI de redirection nécessaire)*
4. Copiez l'**ID client** (se termine par `.apps.googleusercontent.com`).
5. Dans `api/config.php`, ajoutez avant `];` :

```php
  'google_client_id' => 'VOTRE_ID_CLIENT.apps.googleusercontent.com',
```

Le bouton Google apparaît alors automatiquement sur les pages de connexion et
d'inscription.

> L'ID client Google **n'est pas un secret** : il est public par conception.
> Ce qui compte, c'est la liste des origines autorisées (étape 3).

---

## Récapitulatif du bloc à coller dans `api/config.php`

```php
  // Connexion Google
  'google_client_id' => 'VOTRE_ID_CLIENT.apps.googleusercontent.com',
  // Connexion par téléphone (choisissez UNE des options du guide)
  'sms' => [
    'provider'     => 'twilio',   // 'twilio' | 'http' | '' (désactivé)
    'debug'        => false,      // true = mode test (code à l'écran)
    'twilio_sid'   => '',
    'twilio_token' => '',
    'twilio_from'  => '',
    'http_method'  => 'GET',
    'http_url'     => '',
    'http_auth'    => '',
    'sender'       => 'Chap.ci',
  ],
```

À coller **juste avant** la ligne finale `];` du fichier.
