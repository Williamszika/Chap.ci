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

  // Secret pour signer les jetons de connexion (JWT). METTEZ une longue chaîne
  // aléatoire unique en production.
  'jwt_secret'  => getenv('CHAPCI_JWT_SECRET') ?: 'CHANGEZ-MOI-mettez-un-secret-long-et-aleatoire',

  // Emails administrateurs : seuls ces comptes peuvent voir/exporter les abonnés
  // à la newsletter. Séparez par des virgules. METTEZ VOTRE email de compte.
  'admin_emails' => array_filter(array_map('trim',
    explode(',', getenv('CHAPCI_ADMIN_EMAILS') ?: 'bracknetswilliam@gmail.com'))),

  // Emails envoyés par le site (notification des modérateurs, etc.).
  // Utilisez une adresse de VOTRE domaine (créée dans cPanel) pour la
  // délivrabilité (SPF/DKIM). 'site_url' = adresse publique du site.
  'mail_from'      => getenv('CHAPCI_MAIL_FROM') ?: 'no-reply@chap.ci',
  'mail_from_name' => getenv('CHAPCI_MAIL_FROM_NAME') ?: 'Chap.ci',
  'mail_reply_to'  => getenv('CHAPCI_MAIL_REPLYTO') ?: 'contact@chap.ci',
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

  // Dossier des photos (au niveau racine du site, servi directement en HTTP).
  'uploads_dir' => getenv('CHAPCI_UPLOADS_DIR') ?: __DIR__ . '/../uploads',
  // Chemin public des photos (relatif à la racine du site).
  'uploads_path'=> getenv('CHAPCI_UPLOADS_PATH') ?: '/uploads',

  // Origine autorisée (CORS). En mono-domaine (front + api sur le même site),
  // laissez '*' ou mettez votre domaine, ex. https://chap.ci
  'cors_origin' => getenv('CHAPCI_CORS') ?: '*',
];
