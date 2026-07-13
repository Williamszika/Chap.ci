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

  // Dossier des photos (au niveau racine du site, servi directement en HTTP).
  'uploads_dir' => getenv('CHAPCI_UPLOADS_DIR') ?: __DIR__ . '/../uploads',
  // Chemin public des photos (relatif à la racine du site).
  'uploads_path'=> getenv('CHAPCI_UPLOADS_PATH') ?: '/uploads',

  // Origine autorisée (CORS). En mono-domaine (front + api sur le même site),
  // laissez '*' ou mettez votre domaine, ex. https://chap.ci
  'cors_origin' => getenv('CHAPCI_CORS') ?: '*',
];
