<?php
// =============================================================================
//  Chap.ci — Configuration du backend PHP (hébergement mutualisé cPanel)
// =============================================================================
//  À PERSONNALISER sur TPE Cloud : renseignez les identifiants MySQL créés dans
//  cPanel (Bases de données MySQL). Laissez SQLite pour un test local.
// =============================================================================

return [
  // ---------------------------------------------------------------------------
  //  L'ENTITÉ, telle qu'elle apparaît sur les documents comptables.
  //
  //  Ces lignes sortent en tête du registre des recettes, du registre des
  //  dépenses et de l'état financier de fin d'exercice. Un document comptable
  //  qui ne dit pas QUI l'a établi ne vaut rien devant l'administration.
  //
  //  Elles peuvent rester vides tant que l'activité n'est pas immatriculée :
  //  les documents s'impriment alors au seul nom « Chap.ci ». Renseignez-les
  //  dès l'obtention du RCCM et du compte contribuable — c'est le moment où
  //  les registres deviennent opposables.
  //
  //  RCCM = Registre du commerce et du crédit mobilier (greffe du tribunal).
  //  NCC  = Numéro de compte contribuable, délivré par la DGI.
  // ---------------------------------------------------------------------------
  'entite' => [
    'nom'      => getenv('CHAPCI_ENTITE_NOM') ?: 'Chap.ci',
    'activite' => getenv('CHAPCI_ENTITE_ACTIVITE') ?: 'Plateforme de petites annonces en ligne',
    'adresse'  => getenv('CHAPCI_ENTITE_ADRESSE') ?: 'Abidjan, Côte d’Ivoire',
    'rccm'     => getenv('CHAPCI_ENTITE_RCCM') ?: '',
    'ncc'      => getenv('CHAPCI_ENTITE_NCC') ?: '',
  ],

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

  // Mode debug : laissez false en production. Mettez true (ou la variable
  // d'environnement CHAPCI_DEBUG=1) uniquement le temps de diagnostiquer une
  // panne : les messages d'erreur afficheront alors le détail technique.
  'debug'       => (getenv('CHAPCI_DEBUG') ?: '') === '1',

  // Clé secrète des tâches planifiées (cron : sauvegardes, « offres du jour »…).
  // Laissez VIDE : générée automatiquement et affichée dans votre tableau de bord
  // admin (section Sauvegardes) pour construire l'URL cron. Surchargeable via
  // CHAPCI_CRON_KEY. NE la laissez JAMAIS sur une valeur d'exemple publique.
  'cron_key'    => getenv('CHAPCI_CRON_KEY') ?: '',

  // IP ou préfixes à IGNORER dans les statistiques de sécurité « suspectes »
  // (monitoring interne, Claude/Anthropic, votre IP fixe…). Séparez par des
  // virgules ; un préfixe se termine par un point (ex. « 160.79. » ignore
  // 160.79.*.*). Évite les fausses alertes sur votre propre surveillance.
  'security_ignore_ips' => getenv('CHAPCI_SECURITY_IGNORE_IPS') ?: '160.79.',

  // Emails administrateurs : seuls ces comptes peuvent voir/exporter les abonnés
  // à la newsletter. Séparez par des virgules.
  //
  // ⚠️ AUCUNE valeur par défaut, et c'est volontaire. Ce dépôt est PUBLIC :
  // une adresse écrite ici est lisible par n'importe qui, et désigne le compte
  // à viser pour un hameçonnage ou un bourrage d'identifiants. Renseignez-la
  // dans le config.php DU SERVEUR (qui n'est jamais livré par le zip) ou dans
  // la variable d'environnement CHAPCI_ADMIN_EMAILS.
  //
  // Une liste vide ne bloque rien de visible côté visiteur : elle retire
  // seulement l'accès aux écrans d'administration. Si vous perdez cet accès
  // après une mise à jour, c'est ici qu'il faut regarder en premier.
  'admin_emails' => array_filter(array_map('trim',
    explode(',', getenv('CHAPCI_ADMIN_EMAILS') ?: ''))),

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

  // --- Connexion Facebook -------------------------------------------------
  //   developers.facebook.com → créez une app → produit « Facebook Login »
  //   → Paramètres : ajoutez le domaine https://chap.ci (URI de redirection OAuth).
  //   App ID = public, App Secret = SECRET (à garder ici uniquement).
  // Laissez vide pour masquer/désactiver le bouton « Continuer avec Facebook ».
  'facebook_app_id'     => getenv('CHAPCI_FACEBOOK_APP_ID')     ?: '',
  'facebook_app_secret' => getenv('CHAPCI_FACEBOOK_APP_SECRET') ?: '',

  // --- Connexion par téléphone (code SMS) ----------------------------------
  // provider : 'orange', 'twilio', 'http' ou '' (désactivé).
  //   • 'orange' : API Orange SMS — RECOMMANDÉ pour la Côte d'Ivoire (livraison
  //                locale immédiate, self-service ~10 min sur developer.orange.com).
  //                Renseignez orange_auth (en-tête « Basic … » fourni par Orange),
  //                orange_sender (adresse expéditeur, ex. 'tel:+2250000') et
  //                éventuellement orange_name (nom affiché, 11 car. max).
  //   • 'twilio' : renseignez twilio_sid / twilio_token / twilio_from. ⚠️ Pour la
  //                CI, le Sender ID doit être pré-enregistré (~3 semaines).
  //   • 'http'   : passerelle SMS générique. http_url avec les jetons {to}, {text},
  //                {sender}. http_auth = en-tête Authorization (ex. 'Bearer XXX').
  // debug : true (CHAPCI_SMS_DEBUG=1) renvoie le code dans la réponse — PRATIQUE
  //   POUR TESTER SANS SMS. ⚠️ REMETTEZ debug=false / provider réel en production.
  'sms' => [
    'provider'      => getenv('CHAPCI_SMS_PROVIDER')     ?: '',
    'debug'         => (getenv('CHAPCI_SMS_DEBUG')       ?: '') === '1',
    'twilio_sid'    => getenv('CHAPCI_TWILIO_SID')       ?: '',
    'twilio_token'  => getenv('CHAPCI_TWILIO_TOKEN')     ?: '',
    'twilio_from'   => getenv('CHAPCI_TWILIO_FROM')      ?: '', // n° ou Messaging Service SID
    'orange_auth'   => getenv('CHAPCI_ORANGE_AUTH')      ?: '', // en-tête « Basic … » d'Orange Developer
    'orange_sender' => getenv('CHAPCI_ORANGE_SENDER')    ?: '', // ex. 'tel:+2250000' (fourni par Orange)
    'orange_name'   => getenv('CHAPCI_ORANGE_NAME')      ?: '', // nom affiché (facultatif, 11 car.)
    'http_method'   => getenv('CHAPCI_SMS_HTTP_METHOD')  ?: 'GET',
    'http_url'      => getenv('CHAPCI_SMS_HTTP_URL')     ?: '',
    'http_auth'     => getenv('CHAPCI_SMS_HTTP_AUTH')    ?: '',
    'sender'        => getenv('CHAPCI_SMS_SENDER')       ?: 'Chap.ci',
  ],

  // Dossier des photos (au niveau racine du site, servi directement en HTTP).
  'uploads_dir' => getenv('CHAPCI_UPLOADS_DIR') ?: __DIR__ . '/../uploads',
  // Chemin public des photos (relatif à la racine du site).
  'uploads_path'=> getenv('CHAPCI_UPLOADS_PATH') ?: '/uploads',

  // Origine autorisée (CORS). En mono-domaine (front + api sur le même site),
  // laissez '*' ou mettez votre domaine, ex. https://chap.ci
  'cors_origin' => getenv('CHAPCI_CORS') ?: '*',
];
