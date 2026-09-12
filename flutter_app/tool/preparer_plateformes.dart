// Prépare les dossiers de plateforme (`android/` et `ios/`) de l'app Flutter,
// prêts à construire les binaires signés.
//
// Ces dossiers ne sont PAS dans le dépôt (comme pour le site) : ils se
// régénèrent. Ce script est l'équivalent Flutter du `cap sync` de l'ancienne
// app — il régénère `android/` et `ios/` PUIS y applique toute la configuration
// Chap.ci, pour ne rien laisser à corriger à la main :
//
//   • identifiant `ci.chap.app` — le MÊME que l'app actuelle sur les stores, pour
//     que ce soit une MISE À JOUR et non une nouvelle app (applicationId Android
//     ET bundle identifier iOS) ;
//   • Android : minSdk 23, targetSdk 36 ; iOS : nom + permissions ;
//   • le nom affiché « Chap.ci » et les autorisations réellement utilisées
//     (Internet, appareil photo, position) sur les deux plateformes ;
//   • l'icône de lancement, générée depuis le logo (`assets/icon/`) ;
//   • Android : la signature de production lue depuis `android/key.properties`
//     (voir README §3). iOS se signe dans Xcode, sur un Mac.
//
// À lancer depuis le dossier `flutter_app/` :
//
//     dart run tool/preparer_plateformes.dart
//
// Ré-exécutable sans risque : il régénère puis reconfigure à chaque fois.

import 'dart:io';

void main() {
  final pubspec = File('pubspec.yaml');
  if (!pubspec.existsSync() ||
      !pubspec.readAsStringSync().contains('name: chapci')) {
    _stop('Lancez ce script depuis le dossier flutter_app/ '
        '(dart run tool/preparer_plateformes.dart).');
  }

  // 1. Régénère android/ et ios/ (templates Flutter, sans SDK ni Xcode).
  _etape('Génération des dossiers android/ et ios/…');
  _executer('flutter', [
    'create', '--platforms=android,ios', '--project-name', 'chapci', '.',
  ]);
  final demo = File('test/widget_test.dart');
  if (demo.existsSync()) demo.deleteSync();

  _configurerAndroid();
  _configurerIos();

  // Icône de lancement (android + ios), depuis assets/icon/ (config pubspec).
  _etape('Génération des icônes de lancement…');
  _executer('dart', ['run', 'flutter_launcher_icons']);

  // Écran de démarrage natif (flutter_native_splash.yaml, images dans
  // assets/marque/splash/). Le paquet COPIE les images dans android/ et ios/,
  // il ne les lit pas au démarrage : il doit donc repasser après chaque
  // régénération des dossiers — c'est ici que l'oubli devient impossible.
  _etape('Écran de démarrage natif (flutter_native_splash)…');
  _executer('dart', ['run', 'flutter_native_splash:create']);

  _rappels();
}

// ───────────────────────────── Android ──────────────────────────────────────

void _configurerAndroid() {
  // D'ABORD le fichier Firebase : c'est lui qui décide si on branche le plugin
  // Google dans Gradle. Le déclarer sans le fichier fait ÉCHOUER le build avec
  // « File google-services.json is missing » — on ne l'ajoute donc que s'il est
  // réellement là.
  final avecFirebase = _copierGoogleServices();

  _etape('Android : build.gradle.kts (ci.chap.app, minSdk 23, targetSdk 36)…');
  File('android/app/build.gradle.kts')
      .writeAsStringSync(_buildGradleKts(avecFirebase));
  _declarerPluginGoogle(avecFirebase);

  _etape('Android : MainActivity dans le paquet ci.chap.app…');
  // On repart d'un dossier kotlin/ VIDE : selon l'org que « flutter create »
  // déduit, le MainActivity de départ peut atterrir sous com/example/… ou
  // ci/chap/chapci/… — on efface tout et on n'écrit QUE le nôtre, pour ne
  // jamais laisser un MainActivity orphelin dans un ancien paquet.
  final kotlin = Directory('android/app/src/main/kotlin');
  if (kotlin.existsSync()) kotlin.deleteSync(recursive: true);
  final cible = Directory('${kotlin.path}/ci/chap/app')
    ..createSync(recursive: true);
  File('${cible.path}/MainActivity.kt').writeAsStringSync(
    'package ci.chap.app\n\n'
    'import io.flutter.embedding.android.FlutterActivity\n\n'
    'class MainActivity : FlutterActivity()\n',
  );

  _etape('Android : nom « Chap.ci » et autorisations (AndroidManifest.xml)…');
  final manifestFichier = File('android/app/src/main/AndroidManifest.xml');
  var manifest = manifestFichier.readAsStringSync();
  manifest =
      manifest.replaceFirst('android:label="chapci"', 'android:label="Chap.ci"');
  const ouverture =
      '<manifest xmlns:android="http://schemas.android.com/apk/res/android">';
  if (!manifest.contains('android.permission.INTERNET')) {
    manifest = manifest.replaceFirst(ouverture, '$ouverture\n$_permsAndroid');
  }

  // Connexion Facebook « web » : l'activité de rappel de flutter_web_auth_2, qui
  // capte le retour `chapci://…` du navigateur. Sur iOS, rien à déclarer (la
  // session d'auth du système renvoie directement à l'app).
  if (!manifest.contains('flutter_web_auth_2.CallbackActivity')) {
    manifest =
        manifest.replaceFirst('</application>', '$_callbackWebAuth    </application>');
  }

  // Android 11+ : sans cette déclaration, url_launcher ne trouve aucun
  // navigateur pour ouvrir les pages du site (aide, FAQ, mentions légales) ni
  // les liens des publicités. On déclare l'intention « ouvrir une URL https ».
  if (!manifest.contains('<queries>')) {
    manifest = manifest.replaceFirst('</manifest>', '$_queriesAndroid</manifest>');
  }

  // Les liens qui ouvrent l'application (App Links) : https://chap.ci/annonce/…
  // et /vendeur/… arrivent dans MainActivity, que lib/liens_entrants.dart
  // écoute. `autoVerify` demande à Android de vérifier, à l'installation, que
  // chap.ci déclare bien cette application (/.well-known/assetlinks.json,
  // servi par web/seo.php quand `android_sha256` est dans config.php). Sans
  // cette déclaration en ligne, rien ne casse : le lien ouvre le navigateur.
  // Le filtre se glisse APRÈS le premier </intent-filter> du manifeste, celui
  // du lanceur, qui est dans MainActivity.
  if (!manifest.contains('android:autoVerify')) {
    manifest = manifest.replaceFirst(
        '</intent-filter>', '</intent-filter>\n$_liensAndroid');
  }

  manifestFichier.writeAsStringSync(manifest);
}

/// Pose `google-services.json` — le fichier qui relie l'application au projet
/// Firebase, et sans lequel aucune notification n'arrive.
///
/// ⚠️ CE FICHIER N'EST PAS DANS LE DÉPÔT, ET C'EST VOULU.
///
/// Il porte une clé d'API Firebase. Google la documente comme non secrète (elle
/// se lit de toute façon dans l'APK que tout le monde télécharge), mais le
/// dépôt de Chap.ci est public et la règle de la maison ne se discute pas :
/// aucun secret n'y entre. Le fichier vit donc sur la machine du Patron, dans
/// `tool/secrets/`, que `.gitignore` écarte.
///
/// Il ne peut pas non plus rester dans `android/app/` : ce dossier est effacé
/// et régénéré à chaque passage de cet outil. D'où la copie, ici, à chaque
/// fois.
///
/// **S'il manque, on ne s'arrête pas.** L'application se construit et tourne
/// exactement comme avant, sans notification native — c'est ce qu'a fait
/// `PushNatif.disponible = false` pendant des semaines. On le DIT, en revanche,
/// et clairement : une application construite sans ce fichier ne sonnera
/// jamais, et il ne faut pas passer trois jours à chercher pourquoi.
bool _copierGoogleServices() {
  _etape('Android : google-services.json (notifications Firebase)…');
  final source = File('tool/secrets/google-services.json');
  final cible = File('android/app/google-services.json');

  if (!source.existsSync()) {
    stdout.writeln(
      '   ⚠️  ABSENT — tool/secrets/google-services.json n’est pas là.\n'
      '       L’application se construira normalement, MAIS AUCUN TÉLÉPHONE NE\n'
      '       SONNERA quand elle est fermée. Pour l’activer : téléchargez le\n'
      '       fichier depuis console.firebase.google.com (Paramètres du projet\n'
      '       → Vos applications → ci.chap.app → google-services.json) et\n'
      '       déposez-le dans flutter_app/tool/secrets/.',
    );
    // Et on efface la copie d'un passage précédent. `flutter create` ne la
    // connaît pas et ne l'emporte donc pas : sans ce nettoyage, un
    // google-services.json orphelin resterait dans android/app/ après le
    // retrait du fichier source — de quoi croire Firebase actif alors que le
    // plugin Gradle vient d'être retiré. Un état qui ment est pire qu'un
    // état absent.
    if (cible.existsSync()) {
      cible.deleteSync();
      stdout.writeln('   ✓ ancienne copie effacée de android/app/');
    }
    return false;
  }

  // Un garde-fou qui a sa raison d'être : la console Firebase fait télécharger
  // DEUX fichiers .json au cours de la configuration — celui-ci, et la clé du
  // compte de service. Les confondre mettrait un vrai secret dans l'APK de tout
  // le monde. On refuse plutôt que de copier à l'aveugle.
  final contenu = source.readAsStringSync();
  if (contenu.contains('"private_key"') || contenu.contains('BEGIN PRIVATE KEY')) {
    stderr.writeln(
      '\n❌ ARRÊT : tool/secrets/google-services.json contient une CLÉ PRIVÉE.\n'
      '   Ce n’est pas le bon fichier — c’est la clé du compte de service, celle\n'
      '   qui vit sur le SERVEUR (api/data/fcm.json) et ne doit jamais entrer\n'
      '   dans une application. Reprenez le fichier depuis Paramètres du projet\n'
      '   → Vos applications, PAS depuis l’onglet Comptes de service.\n',
    );
    exit(1);
  }
  if (!contenu.contains('ci.chap.app')) {
    stderr.writeln(
      '\n❌ ARRÊT : ce google-services.json ne mentionne pas « ci.chap.app ».\n'
      '   Il vient d’un autre projet ou d’une autre application. Les\n'
      '   notifications iraient à une adresse qui n’est pas la vôtre.\n',
    );
    exit(1);
  }

  cible.writeAsStringSync(contenu);
  stdout.writeln('   ✓ posé dans android/app/ (ci.chap.app)');
  return true;
}

/// Déclare le plugin Gradle de Google dans `android/settings.gradle.kts`.
///
/// C'est lui qui lit `google-services.json` au moment de la compilation et en
/// fait des valeurs que Firebase retrouve à l'exécution. Sans cette ligne, le
/// fichier serait copié pour rien.
///
/// `flutter create` écrit ce `settings.gradle.kts` : on le retouche plutôt que
/// de le remplacer, pour ne pas figer une version de Flutter dans notre outil.
void _declarerPluginGoogle(bool avecFirebase) {
  final f = File('android/settings.gradle.kts');
  if (!f.existsSync()) return;
  var t = f.readAsStringSync();
  // 4.5.0 : la version que la console Firebase affiche elle-même en septembre
  // 2026. La 4.4.x visait le plugin Android Gradle 8 ; « flutter create »
  // installe aujourd'hui le 9.1, et un plugin trop ancien s'y refuse.
  const ligne = '    id("com.google.gms.google-services") version "4.5.0" apply false';
  final deja = t.contains('com.google.gms.google-services');

  if (!avecFirebase) {
    // Pas de fichier Firebase : on RETIRE la ligne si un passage précédent
    // l'avait posée. Sinon Gradle réclamerait un fichier absent et le build
    // échouerait — exactement la panne qu'on cherche à éviter.
    if (deja) {
      t = t.split('\n').where((l) => !l.contains('com.google.gms.google-services')).join('\n');
      f.writeAsStringSync(t);
      _etape('Android : plugin Google retiré (pas de google-services.json)…');
    }
    return;
  }
  if (deja) {
    // Le 12/09/2026, ce `return` était muet. Le Patron, qui suivait une fiche
    // disant « vous devez voir deux lignes ✓ », n'en a vu qu'une et s'est arrêté
    // avant de construire — alors que tout allait bien : la ligne était là
    // depuis le passage du 8 septembre. Un silence qui veut dire « c'est bon »
    // se lit exactement comme un silence qui veut dire « ça a échoué ».
    // Une étape muette n'est pas une étape rassurante : c'est une étape illisible.
    _etape('Android : plugin Google déjà déclaré (settings.gradle.kts) — rien à faire…');
    return;
  }

  // On s'accroche au plugin Android, qui est toujours déclaré là.
  final ancre = RegExp(r'(\n\s*id\("com\.android\.application"\)[^\n]*)');
  final m = ancre.firstMatch(t);
  if (m == null) {
    stderr.writeln(
      '\n⚠️  settings.gradle.kts a changé de forme : le plugin Google n’a pas pu\n'
      '   être déclaré automatiquement. Ajoutez à la main, dans son bloc\n'
      '   plugins { … } :\n$ligne\n',
    );
    return;
  }
  t = t.replaceFirst(m.group(1)!, '${m.group(1)}\n$ligne');
  f.writeAsStringSync(t);
  _etape('Android : plugin Google déclaré (settings.gradle.kts)…');
}

// ─────────────────────────────── iOS ────────────────────────────────────────

void _configurerIos() {
  final pbxproj = File('ios/Runner.xcodeproj/project.pbxproj');
  if (!pbxproj.existsSync()) return; // pas d'ios/ (create sans la plateforme)

  _etape('iOS : bundle identifier ci.chap.app (Runner.xcodeproj)…');
  var pb = pbxproj.readAsStringSync();
  pb = pb.replaceAllMapped(
    RegExp(r'(PRODUCT_BUNDLE_IDENTIFIER = )([\w.]+)(;)'),
    (m) {
      final id = m.group(2)!.endsWith('.RunnerTests')
          ? 'ci.chap.app.RunnerTests'
          : 'ci.chap.app';
      return '${m.group(1)}$id${m.group(3)}';
    },
  );

  // ⚠️ LA VERSION MINIMALE D'iOS SE POSE ICI, PAS DANS XCODE.
  // `flutter create` ne réécrit PAS un project.pbxproj qui existe déjà : un
  // dossier ios/ fabriqué par un Flutter plus ancien garde sa valeur d'origine
  // (12.0, voire 11.0). Or les plugins ont monté leurs exigences depuis :
  // webview_flutter_wkwebview et shared_preferences_foundation réclament 13.0,
  // google_sign_in_ios 12.0. En dessous, `pod install` s'arrête sur un mur de
  // texte CocoaPods, à la seule étape que le Patron ne peut pas diagnostiquer.
  // On force donc la valeur du gabarit Flutter courant (15.0), qui couvre tout.
  // Conséquence à connaître : l'iPhone doit tourner sous iOS 15 ou plus récent.
  var releve = 0;
  pb = pb.replaceAllMapped(
    RegExp(r'IPHONEOS_DEPLOYMENT_TARGET = ([0-9]+(?:\.[0-9]+)?);'),
    (m) {
      final actuel = double.tryParse(m.group(1)!) ?? 0;
      if (actuel >= _iosMini) return m.group(0)!;
      releve++;
      return 'IPHONEOS_DEPLOYMENT_TARGET = $_iosMini;';
    },
  );
  if (releve > 0) {
    _etape('iOS : version minimale relevée à $_iosMini '
        '($releve emplacement${releve > 1 ? 's' : ''} — les plugins l’exigent)…');
  }
  pb = _liensIos(pb);
  pbxproj.writeAsStringSync(pb);

  _etape('iOS : nom « Chap.ci » et autorisations (Info.plist)…');
  final plistFichier = File('ios/Runner/Info.plist');
  var plist = plistFichier.readAsStringSync();
  plist = plist.replaceAllMapped(
    RegExp(r'(<key>CFBundleDisplayName</key>\s*<string>)[^<]*(</string>)'),
    (m) => '${m.group(1)}Chap.ci${m.group(2)}',
  );
  if (!plist.contains('NSPhotoLibraryUsageDescription')) {
    plist = plist.replaceFirst(
        '</dict>\n</plist>', '$_permsIos</dict>\n</plist>');
  } else {
    // Un dossier ios/ préparé AVANT une nouveauté a déjà les autres clés : on
    // n'ajoute que celles qui manquent, une par une. (Le micro est arrivé le
    // 04/09/2026 avec la vidéo, Face ID le 07/09 avec le déverrouillage.)
    if (!plist.contains('NSMicrophoneUsageDescription')) {
      plist = plist.replaceFirst('</dict>\n</plist>',
          '\t<key>NSMicrophoneUsageDescription</key>\n'
          '\t<string>Pour filmer votre annonce avec le son.</string>\n'
          '</dict>\n</plist>');
    }
    if (!plist.contains('NSFaceIDUsageDescription')) {
      plist = plist.replaceFirst('</dict>\n</plist>',
          '\t<key>NSFaceIDUsageDescription</key>\n'
          '\t<string>Pour déverrouiller Chap.ci avec votre visage.</string>\n'
          '</dict>\n</plist>');
    }
  }
  // Connexion Google : le schéma d'URL (client ID iOS inversé) et le GIDClientID
  // doivent être dans l'Info.plist, sinon la redirection Google échoue sur iOS.
  // Ce sont des identifiants PUBLICS de client OAuth, pas des secrets.
  if (!plist.contains('GIDClientID')) {
    plist = plist.replaceFirst(
        '</dict>\n</plist>', '$_googleIos</dict>\n</plist>');
  }
  plistFichier.writeAsStringSync(plist);

  // Le Podfile du gabarit laisse `platform :ios` EN COMMENTAIRE : CocoaPods
  // reprend alors la valeur du project.pbxproj, qu'on vient de relever. Mais un
  // Podfile plus ancien peut porter la ligne active avec une vieille version,
  // et elle l'emporte. On la remet d'accord plutôt que de laisser deux sources
  // se contredire.
  final podfile = File('ios/Podfile');
  if (podfile.existsSync()) {
    final avant = podfile.readAsStringSync();
    final apres = avant.replaceAllMapped(
      RegExp(r"^(\s*)platform :ios, '([0-9]+(?:\.[0-9]+)?)'", multiLine: true),
      (m) {
        final actuel = double.tryParse(m.group(2)!) ?? 0;
        if (actuel >= _iosMini) return m.group(0)!;
        return "${m.group(1)}platform :ios, '$_iosMini'";
      },
    );
    if (apres != avant) {
      _etape('iOS : Podfile remis à $_iosMini (il portait une version plus ancienne)…');
      podfile.writeAsStringSync(apres);
    }
  }
}

/// Version minimale d'iOS. C'est celle du gabarit Flutter courant ; elle couvre
/// le plugin le plus exigeant (13.0 pour webview_flutter et shared_preferences).
/// La changer veut dire vérifier d'abord `deployment_target` dans les podspecs.
const double _iosMini = 15.0;

/// Les liens universels iOS (https://chap.ci/annonce/… ouvre l'application).
///
/// ⚠️ SUR DEMANDE SEULEMENT : `CHAPCI_LIENS_UNIVERSELS=1 dart run tool/…`.
/// Le droit « Associated Domains » n'existe qu'avec l'Apple Developer Program
/// payant. Avec l'identifiant Apple gratuit qui installe l'application sur
/// l'iPhone du Patron, Xcode REFUSE de signer une application qui le réclame :
/// « Provisioning profile doesn't support the Associated Domains capability »,
/// et `flutter run` s'arrête net. Le poser d'office aurait cassé l'installation
/// qui marche aujourd'hui. Le jour du compte payant, une variable d'environnement
/// suffit — rien à cliquer dans Xcode.
String _liensIos(String pb) {
  if (Platform.environment['CHAPCI_LIENS_UNIVERSELS'] != '1') return pb;
  _etape('iOS : liens universels (applinks:chap.ci — compte Apple payant requis)…');
  File('ios/Runner/Runner.entitlements').writeAsStringSync(_entitlementsIos);
  if (pb.contains('CODE_SIGN_ENTITLEMENTS')) return pb;
  // Le réglage se pose dans les configurations du Runner (Debug, Release,
  // Profile) — celles dont le bundle est ci.chap.app, pas les RunnerTests.
  return pb.replaceAll(
    'PRODUCT_BUNDLE_IDENTIFIER = ci.chap.app;',
    'CODE_SIGN_ENTITLEMENTS = Runner/Runner.entitlements;\n'
        '\t\t\t\tPRODUCT_BUNDLE_IDENTIFIER = ci.chap.app;',
  );
}

// ─────────────────────────── Rappels finaux ─────────────────────────────────

void _rappels() {
  final aKey = File('android/key.properties').existsSync();
  stdout.writeln('\n✅ android/ et ios/ prêts (ci.chap.app, minSdk 23, targetSdk 36).');

  stdout.writeln('\nANDROID → l’AAB à déposer sur le Play Store :');
  if (!aKey) {
    stdout.writeln('  1. cp tool/key.properties.exemple android/key.properties');
    stdout.writeln('     puis remplissez-le avec VOTRE keystore (jamais dans Git).');
  }
  stdout.writeln('  2. flutter build appbundle --release');
  stdout.writeln('     → build/app/outputs/bundle/release/app-release.aab');

  stdout.writeln('\niOS → sur un Mac avec Xcode et un compte Apple Developer :');
  stdout.writeln('  1. ouvrez ios/Runner.xcworkspace, onglet Signing & Capabilities,');
  stdout.writeln('     choisissez votre équipe (Team) — le bundle est déjà ci.chap.app.');
  stdout.writeln('  2. flutter build ipa   (puis Transporter / Xcode vers App Store Connect)');

  stdout.writeln('\nversionCode : il DOIT dépasser le dernier téléversé sur le Play Store');
  stdout.writeln('  (voir store/APP-VERSIONS.md, qui fait foi). Réglé dans pubspec.yaml');
  stdout.writeln('  (champ « version »). Mettez ensuite à jour store/APP-VERSIONS.md.');
}

// ─────────────────────────── Gabarits / texte ───────────────────────────────

const _permsAndroid =
    '    <uses-permission android:name="android.permission.INTERNET"/>\n'
    '    <uses-permission android:name="android.permission.CAMERA"/>\n'
    '    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION"/>\n'
    '    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION"/>';

// Android 11+ : autorise url_launcher à ouvrir des pages web (https) — pages
// d'info du site et liens des publicités.
const _queriesAndroid =
    '    <queries>\n'
    '        <intent>\n'
    '            <action android:name="android.intent.action.VIEW"/>\n'
    '            <data android:scheme="https"/>\n'
    '        </intent>\n'
    '    </queries>\n';

// Les App Links (voir _configurerAndroid) : les deux chemins que l'application
// sait ouvrir. Pas la racine ni les autres pages : elles restent au site.
const _liensAndroid =
    '            <intent-filter android:autoVerify="true">\n'
    '                <action android:name="android.intent.action.VIEW"/>\n'
    '                <category android:name="android.intent.category.DEFAULT"/>\n'
    '                <category android:name="android.intent.category.BROWSABLE"/>\n'
    '                <data android:scheme="https" android:host="chap.ci" android:pathPrefix="/annonce/"/>\n'
    '                <data android:scheme="https" android:host="chap.ci" android:pathPrefix="/vendeur/"/>\n'
    '            </intent-filter>\n';

// Le droit « Associated Domains » d'iOS : la contrepartie du fichier
// /.well-known/apple-app-site-association servi par le site. Voir _liensIos.
const _entitlementsIos = '''<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
\t<key>com.apple.developer.associated-domains</key>
\t<array>
\t\t<string>applinks:chap.ci</string>
\t</array>
</dict>
</plist>
''';

// Activité de rappel de flutter_web_auth_2 : capte le retour de la connexion
// Facebook web (schéma privé `chapci://`).
const _callbackWebAuth =
    '        <activity android:name="com.linusu.flutter_web_auth_2.CallbackActivity" android:exported="true">\n'
    '            <intent-filter android:label="flutter_web_auth_2">\n'
    '                <action android:name="android.intent.action.VIEW"/>\n'
    '                <category android:name="android.intent.category.DEFAULT"/>\n'
    '                <category android:name="android.intent.category.BROWSABLE"/>\n'
    '                <data android:scheme="chapci"/>\n'
    '            </intent-filter>\n'
    '        </activity>\n';

const _permsIos =
    '\t<key>NSPhotoLibraryUsageDescription</key>\n'
    '\t<string>Pour choisir les photos de vos annonces.</string>\n'
    '\t<key>NSCameraUsageDescription</key>\n'
    '\t<string>Pour prendre une photo ou filmer votre annonce.</string>\n'
    // La vidéo de quinze secondes se filme AVEC le son : iOS refuse
    // d'enregistrer une vidéo sans cette clé, et l'app se fermerait sans un
    // mot au moment d'appuyer sur « Filmer ».
    '\t<key>NSMicrophoneUsageDescription</key>\n'
    '\t<string>Pour filmer votre annonce avec le son.</string>\n'
    '\t<key>NSLocationWhenInUseUsageDescription</key>\n'
    '\t<string>Pour placer votre annonce à l’endroit exact.</string>\n'
    // Face ID (07/09/2026). SANS CETTE CLÉ, iOS ferme l'application au moment
    // exact où elle demande le visage — pas d'erreur, pas de message : elle
    // disparaît. C'est la même mécanique que le micro le 04/09.
    '\t<key>NSFaceIDUsageDescription</key>\n'
    '\t<string>Pour déverrouiller Chap.ci avec votre visage.</string>\n';

// Connexion Google sur iOS. Le schéma d'URL est le client ID iOS « inversé »
// (com.googleusercontent.apps.<id>), tel que l'exige google_sign_in.
const _googleIos =
    '\t<key>GIDClientID</key>\n'
    '\t<string>564942885290-l33tp6lok4ge79lmdjh6mu9a1q5aeu29.apps.googleusercontent.com</string>\n'
    '\t<key>CFBundleURLTypes</key>\n'
    '\t<array>\n'
    '\t\t<dict>\n'
    '\t\t\t<key>CFBundleURLSchemes</key>\n'
    '\t\t\t<array>\n'
    '\t\t\t\t<string>com.googleusercontent.apps.564942885290-l33tp6lok4ge79lmdjh6mu9a1q5aeu29</string>\n'
    '\t\t\t</array>\n'
    '\t\t</dict>\n'
    '\t</array>\n';

/// Le `build.gradle.kts` du module application.
///
/// `avecFirebase` décide d'UNE ligne : `id("com.google.gms.google-services")`.
/// Déclarer ce plugin sans le fichier `google-services.json` fait échouer le
/// build — d'où le paramètre plutôt qu'une constante.
String _buildGradleKts(bool avecFirebase) => '''
import java.util.Properties
import java.io.FileInputStream

plugins {
    id("com.android.application")
${avecFirebase ? '''    // Lit google-services.json et en fait les valeurs que Firebase retrouve
    // à l'exécution. Déclaré SEULEMENT quand le fichier est là (voir
    // _copierGoogleServices) : sinon Gradle s'arrête sur « File
    // google-services.json is missing ».
    id("com.google.gms.google-services")
''' : ''}    // Le plugin Flutter s'applique après les plugins Android et Kotlin.
    id("dev.flutter.flutter-gradle-plugin")
}

// Signature de production : lue depuis android/key.properties, qui n'entre JAMAIS
// dans Git (le keystore reste sur la machine du Patron). Fichier absent → on signe
// avec la clé de debug, pour que `flutter run` fonctionne quand même sans keystore.
val keystoreProperties = Properties()
val keystorePropertiesFile = rootProject.file("key.properties")
val hasKeystore = keystorePropertiesFile.exists()
if (hasKeystore) {
    keystoreProperties.load(FileInputStream(keystorePropertiesFile))
}

android {
    namespace = "ci.chap.app"
    compileSdk = flutter.compileSdkVersion
    ndkVersion = flutter.ndkVersion

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    defaultConfig {
        // MÊME identifiant que l'app Play Store actuelle : c'est une MISE À JOUR.
        applicationId = "ci.chap.app"
        // ANDROID 6.0 MINIMUM DEPUIS LE 08/09/2026 (c'était 5.1).
        //
        // Ce n'est pas un choix de confort : `firebase_core` refuse de se
        // compiler en dessous (son `android/local-config.gradle` fixe
        // `minSdk=23`). Sans lui, aucun téléphone ne sonne quand l'application
        // est fermée — la première fuite de la place de marché.
        //
        // Ce que ça coûte : les téléphones restés sous Android 5.1, sorti en
        // mars 2015, ne recevront plus les mises à jour. Ils gardent la version
        // installée, qui continue de fonctionner. Le Patron a validé cet
        // arbitrage après avoir vu le chiffre réel de sa Play Console.
        minSdk = 23
        // targetSdk 36 (Android 16) : OBLIGATOIRE pour tout dépôt à partir du
        // 31/08/2026 — Google refuse targetSdk 35 après le 30/08. compileSdk
        // vient de Flutter (36 depuis Flutter récent) et doit rester ≥ targetSdk.
        targetSdk = 36
        // versionCode / versionName viennent de pubspec.yaml (`version: 1.21.0+22`).
        // Le versionCode DOIT rester supérieur à celui déjà publié (20 pour la v1.19).
        versionCode = flutter.versionCode
        versionName = flutter.versionName
    }

    signingConfigs {
        create("release") {
            if (hasKeystore) {
                keyAlias = keystoreProperties["keyAlias"] as String
                keyPassword = keystoreProperties["keyPassword"] as String
                storeFile = (keystoreProperties["storeFile"] as String?)?.let { file(it) }
                storePassword = keystoreProperties["storePassword"] as String
            }
        }
    }

    buildTypes {
        release {
            signingConfig = if (hasKeystore) {
                signingConfigs.getByName("release")
            } else {
                signingConfigs.getByName("debug")
            }
        }
    }
}

kotlin {
    compilerOptions {
        jvmTarget = org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17
    }
}

flutter {
    source = "../.."
}
''';

void _etape(String m) => stdout.writeln('• $m');

void _stop(String m) {
  stderr.writeln('✗ $m');
  exit(1);
}

void _executer(String programme, List<String> arguments) {
  final r = Process.runSync(programme, arguments, runInShell: true);
  stdout.write(r.stdout);
  if (r.exitCode != 0) {
    stderr.write(r.stderr);
    _stop('Échec de « $programme ${arguments.join(' ')} » (code ${r.exitCode}).');
  }
}
