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
//   • Android : minSdk 22, targetSdk 36 ; iOS : nom + permissions ;
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
  _etape('Android : build.gradle.kts (ci.chap.app, minSdk 22, targetSdk 36)…');
  File('android/app/build.gradle.kts').writeAsStringSync(_buildGradleKts);

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

  manifestFichier.writeAsStringSync(manifest);
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
  }
  // Connexion Google : le schéma d'URL (client ID iOS inversé) et le GIDClientID
  // doivent être dans l'Info.plist, sinon la redirection Google échoue sur iOS.
  // Ce sont des identifiants PUBLICS de client OAuth, pas des secrets.
  if (!plist.contains('GIDClientID')) {
    plist = plist.replaceFirst(
        '</dict>\n</plist>', '$_googleIos</dict>\n</plist>');
  }
  plistFichier.writeAsStringSync(plist);
}

// ─────────────────────────── Rappels finaux ─────────────────────────────────

void _rappels() {
  final aKey = File('android/key.properties').existsSync();
  stdout.writeln('\n✅ android/ et ios/ prêts (ci.chap.app, minSdk 22, targetSdk 36).');

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
    '\t<string>Pour prendre une photo de votre annonce.</string>\n'
    '\t<key>NSLocationWhenInUseUsageDescription</key>\n'
    '\t<string>Pour placer votre annonce à l’endroit exact.</string>\n';

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

const _buildGradleKts = '''
import java.util.Properties
import java.io.FileInputStream

plugins {
    id("com.android.application")
    // Le plugin Flutter s'applique après les plugins Android et Kotlin.
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
        minSdk = 22
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
