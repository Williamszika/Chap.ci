<?php
// =============================================================================
//  Chap.ci — Configuration du backend PHP (hébergement mutualisé cPanel)
// =============================================================================
//  À PERSONNALISER sur TPE Cloud : renseignez les identifiants MySQL créés dans
//  cPanel (Bases de données MySQL). Laissez SQLite pour un test local.
// =============================================================================

return [
  'db' => [
    // 'mysql' OU 'pgsql' en production (selon ce que propose cPanel),
    // 'sqlite' pour un test local. Les tables se créent automatiquement.
    'driver'      => getenv('CHAPCI_DB_DRIVER') ?: 'pgsql',
    'host'        => getenv('CHAPCI_DB_HOST') ?: 'localhost',
    // Port : laissez vide (défaut MySQL 3306 / PostgreSQL 5432) ou précisez-le.
    'port'        => getenv('CHAPCI_DB_PORT') ?: '',
    'name'        => getenv('CHAPCI_DB_NAME') ?: 'chapci',
    'user'        => getenv('CHAPCI_DB_USER') ?: 'chapci',
    'pass'        => getenv('CHAPCI_DB_PASS') ?: '',
    'sqlite_path' => getenv('CHAPCI_SQLITE') ?: __DIR__ . '/data/chapci.sqlite',
  ],

  // Secret pour signer les jetons de connexion (JWT).
  // Laissez VIDE : un secret aléatoire fort est généré automatiquement et rangé
  // hors du code (dossier data protégé), unique à votre installation. Vous pouvez
  // aussi imposer le vôtre via la variable d'environnement CHAPCI_JWT_SECRET
  // (≥ 24 caractères aléatoires). NE mettez JAMAIS une valeur « exemple » ici.
  'jwt_secret'  => getenv('CHAPCI_JWT_SECRET') ?: '',

  // Clé secrète des tâches planifiées (cron : sauvegardes, « offres du jour »…).
  // Laissez VIDE : générée automatiquement et affichée dans votre tableau de bord
  // admin (section Sauvegardes) pour construire l'URL cron. Surchargeable via
  // CHAPCI_CRON_KEY. NE la laissez JAMAIS sur une valeur d'exemple publique.
  'cron_key'    => getenv('CHAPCI_CRON_KEY') ?: '',

  // Emails administrateurs : seuls ces comptes peuvent voir/exporter les abonnés
  // à la newsletter. Séparez par des virgules. METTEZ VOTRE email de compte.
  'admin_emails' => array_filter(array_map('trim',
    explode(',', getenv('CHAPCI_ADMIN_EMAILS') ?: 'bracknetswilliam@gmail.com'))),

  // Destinataire des RAPPORTS automatiques (signalements, sauvegardes, alertes du
  // Bureau des développeurs). Séparé des admins : eux gardent l'accès au site,
  // mais les rapports arrivent ici. Séparez plusieurs adresses par des virgules.
  'report_email' => array_filter(array_map('trim',
    explode(',', getenv('CHAPCI_REPORT_EMAIL') ?: 'contact@chap.ci'))),

  // Emails envoyés par le site (notification des modérateurs, etc.).
  // Utilisez une adresse de VOTRE domaine (créée dans cPanel) pour la
  // délivrabilité (SPF/DKIM). 'site_url' = adresse publique du site.
  'mail_from'      => getenv('CHAPCI_MAIL_FROM') ?: 'no-reply@chap.ci',
  'mail_from_name' => getenv('CHAPCI_MAIL_FROM_NAME') ?: 'Chap.ci',
  'mail_reply_to'  => getenv('CHAPCI_MAIL_REPLYTO') ?: 'contact@chap.ci',
  // Expéditeur de la NEWSLETTER (adresse à laquelle les gens peuvent répondre).
  'mail_newsletter_from' => getenv('CHAPCI_NEWSLETTER_FROM') ?: 'hello@chap.ci',
  'site_url'       => getenv('CHAPCI_SITE_URL') ?: 'https://chap.ci',

  // Réseaux sociaux affichés en pied des emails. Mettez vos liens (laissez
  // vides pour masquer). Ex : 'https://facebook.com/votrepage'.
  'social' => [
    'Facebook'  => getenv('CHAPCI_FACEBOOK')  ?: '',
    'Instagram' => getenv('CHAPCI_INSTAGRAM') ?: '',
    'WhatsApp'  => getenv('CHAPCI_WHATSAPP')  ?: '',
  ],

  // --- Envoi des emails via SMTP (FORTEMENT recommandé) ---------------------
  // Beaucoup d'hébergeurs bloquent la fonction mail() de PHP. Pour un envoi
  // FIABLE, renseignez le mot de passe de la boîte no-reply@chap.ci ci-dessous :
  // l'application enverra alors les emails via SMTP authentifié. Laissez 'pass'
  // vide pour utiliser mail() (par défaut).
  //   host   : serveur SMTP de votre hébergeur (souvent 'localhost' ou 'mail.chap.ci')
  //   port   : 465 (SSL) ou 587 (TLS)
  //   secure : 'ssl' pour 465, 'tls' pour 587
  'smtp' => [
    'host'   => getenv('CHAPCI_SMTP_HOST')   ?: 'localhost',
    'port'   => getenv('CHAPCI_SMTP_PORT')   ?: '465',
    'secure' => getenv('CHAPCI_SMTP_SECURE') ?: 'ssl',
    'user'   => getenv('CHAPCI_SMTP_USER')   ?: 'no-reply@chap.ci',
    'pass'   => getenv('CHAPCI_SMTP_PASS')   ?: '', // ← mot de passe de no-reply@chap.ci
  ],

  // --- Connexion Google (Sign-In) ------------------------------------------
  // ID client OAuth « Web » créé dans Google Cloud Console :
  //   console.cloud.google.com → API et services → Identifiants
  //   → Créer des identifiants → ID client OAuth → Type « Application Web ».
  //   • Origines JavaScript autorisées : https://chap.ci
  //   • (le même identifiant doit être fourni au frontend : VITE_GOOGLE_CLIENT_ID)
  // Laissez vide pour masquer/désactiver le bouton « Continuer avec Google ».
  'google_client_id' => getenv('CHAPCI_GOOGLE_CLIENT_ID') ?: '',

  // --- Connexion par téléphone (code SMS) ----------------------------------
  // provider : 'twilio', 'http' ou '' (désactivé).
  //   • 'twilio' : renseignez twilio_sid / twilio_token / twilio_from.
  //   • 'http'   : passerelle SMS générique (opérateur local). http_url est une
  //                URL avec les jetons {to}, {text}, {sender}. Ex. :
  //                'https://api.mon-sms.ci/send?to={to}&msg={text}&from={sender}'
  //                http_auth = valeur de l'en-tête Authorization (ex. 'Bearer XXX').
  // debug : true (CHAPCI_SMS_DEBUG=1) renvoie le code dans la réponse — PRATIQUE
  //   POUR TESTER SANS SMS. ⚠️ REMETTEZ debug=false / provider réel en production.
  'sms' => [
    'provider'     => getenv('CHAPCI_SMS_PROVIDER')     ?: '',
    'debug'        => (getenv('CHAPCI_SMS_DEBUG')       ?: '') === '1',
    'twilio_sid'   => getenv('CHAPCI_TWILIO_SID')       ?: '',
    'twilio_token' => getenv('CHAPCI_TWILIO_TOKEN')     ?: '',
    'twilio_from'  => getenv('CHAPCI_TWILIO_FROM')      ?: '', // n° ou Messaging Service SID
    'http_method'  => getenv('CHAPCI_SMS_HTTP_METHOD')  ?: 'GET',
    'http_url'     => getenv('CHAPCI_SMS_HTTP_URL')     ?: '',
    'http_auth'    => getenv('CHAPCI_SMS_HTTP_AUTH')    ?: '',
    'sender'       => getenv('CHAPCI_SMS_SENDER')       ?: 'Chap.ci',
  ],

  // Dossier des photos (au niveau racine du site, servi directement en HTTP).
  'uploads_dir' => getenv('CHAPCI_UPLOADS_DIR') ?: __DIR__ . '/../uploads',
  // Chemin public des photos (relatif à la racine du site).
  'uploads_path'=> getenv('CHAPCI_UPLOADS_PATH') ?: '/uploads',

  // Origine autorisée (CORS). En mono-domaine (front + api sur le même site),
  // laissez '*' ou mettez votre domaine, ex. https://chap.ci
  'cors_origin' => getenv('CHAPCI_CORS') ?: '*',
];
