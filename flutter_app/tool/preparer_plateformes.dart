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
//   • Android : minSdk 22, targetSdk 35 ; iOS : nom + permissions ;
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

import 'dart:convert';
import 'dart:io';

void main() {
  final pubspec = File('pubspec.yaml');
  if (!pubspec.existsSync() ||
      !pubspec.readAsStringSync().contains('name: chapci')) {
    _stop('Lancez ce script depuis le dossier flutter_app/ '
        '(dart run tool/preparer_plateformes.dart).');
  }

  // Jeton client Facebook, lu depuis social.json (hors dépôt). Absent → la
  // connexion Facebook n'est pas configurée (le bouton échouera proprement) ;
  // Google, lui, ne dépend pas de ce fichier.
  final fbToken = _jetonFacebook();

  // 1. Régénère android/ et ios/ (templates Flutter, sans SDK ni Xcode).
  _etape('Génération des dossiers android/ et ios/…');
  _executer('flutter', [
    'create', '--platforms=android,ios', '--project-name', 'chapci', '.',
  ]);
  final demo = File('test/widget_test.dart');
  if (demo.existsSync()) demo.deleteSync();

  _configurerAndroid(fbToken);
  _configurerIos(fbToken);

  // Icône de lancement (android + ios), depuis assets/icon/ (config pubspec).
  _etape('Génération des icônes de lancement…');
  _executer('dart', ['run', 'flutter_launcher_icons']);

  _rappels();
}

// ───────────────────────────── Android ──────────────────────────────────────

void _configurerAndroid(String? fbToken) {
  _etape('Android : build.gradle.kts (ci.chap.app, minSdk 22, targetSdk 35)…');
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

  // Connexion Facebook : les ressources (App ID, jeton client, schéma) et les
  // deux activités du SDK. Uniquement si social.json fournit le jeton client.
  if (fbToken != null) {
    _etape('Android : connexion Facebook (strings.xml + AndroidManifest)…');
    File('android/app/src/main/res/values/strings_facebook.xml')
        .writeAsStringSync(_fbStrings(fbToken));
    if (!manifest.contains('com.facebook.sdk.ApplicationId')) {
      manifest =
          manifest.replaceFirst('</application>', '$_fbManifest    </application>');
    }
  }

  manifestFichier.writeAsStringSync(manifest);
}

// ─────────────────────────────── iOS ────────────────────────────────────────

void _configurerIos(String? fbToken) {
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
  // Connexions Google (toujours) et Facebook (si social.json fournit le jeton) :
  // schémas d'URL et clés que les SDK lisent dans l'Info.plist. Le client ID
  // Google et l'App ID Facebook sont PUBLICS ; seul le jeton client vient du
  // fichier hors dépôt.
  if (!plist.contains('GIDClientID')) {
    plist = plist.replaceFirst(
        '</dict>\n</plist>', '${_blocIos(fbToken)}</dict>\n</plist>');
  }
  plistFichier.writeAsStringSync(plist);
}

// ─────────────────────────── Rappels finaux ─────────────────────────────────

void _rappels() {
  final aKey = File('android/key.properties').existsSync();
  stdout.writeln('\n✅ android/ et ios/ prêts (ci.chap.app, minSdk 22, targetSdk 35).');

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

  stdout.writeln('\nversionCode : il DOIT dépasser le dernier publié (20 pour la v1.19).');
  stdout.writeln('  Réglé dans pubspec.yaml (champ « version »). Mettez ensuite à jour');
  stdout.writeln('  store/APP-VERSIONS.md.');
}

// ─────────────────────────── Gabarits / texte ───────────────────────────────

const _permsAndroid =
    '    <uses-permission android:name="android.permission.INTERNET"/>\n'
    '    <uses-permission android:name="android.permission.CAMERA"/>\n'
    '    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION"/>\n'
    '    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION"/>';

const _permsIos =
    '\t<key>NSPhotoLibraryUsageDescription</key>\n'
    '\t<string>Pour choisir les photos de vos annonces.</string>\n'
    '\t<key>NSCameraUsageDescription</key>\n'
    '\t<string>Pour prendre une photo de votre annonce.</string>\n'
    '\t<key>NSLocationWhenInUseUsageDescription</key>\n'
    '\t<string>Pour placer votre annonce à l’endroit exact.</string>\n';

// ─────────────────────── Connexion sociale (Google / Facebook) ──────────────

// Identifiants PUBLICS, embarqués dans toute application. Le SECRET Facebook
// reste sur le serveur ; le jeton client vient de social.json (hors dépôt).
const _googleIosClientId =
    '564942885290-l33tp6lok4ge79lmdjh6mu9a1q5aeu29.apps.googleusercontent.com';
const _googleIosScheme =
    'com.googleusercontent.apps.564942885290-l33tp6lok4ge79lmdjh6mu9a1q5aeu29';
const _fbAppId = '1617587653705134';

/// Le jeton client Facebook, lu depuis social.json à la racine de flutter_app.
/// Renvoie null si le fichier manque ou ne le contient pas.
String? _jetonFacebook() {
  final f = File('social.json');
  if (!f.existsSync()) return null;
  try {
    final j = jsonDecode(f.readAsStringSync());
    final t = (j is Map) ? j['facebookClientToken'] : null;
    final s = t?.toString().trim() ?? '';
    return s.isEmpty ? null : s;
  } catch (_) {
    return null;
  }
}

/// Le bloc Info.plist iOS : GIDClientID, les schémas d'URL (Google, et Facebook
/// si configuré), puis les clés Facebook.
String _blocIos(String? fbToken) {
  final schemes = <String>[
    _googleIosScheme,
    if (fbToken != null) 'fb$_fbAppId',
  ];
  final b = StringBuffer()
    ..write('\t<key>GIDClientID</key>\n')
    ..write('\t<string>$_googleIosClientId</string>\n')
    ..write('\t<key>CFBundleURLTypes</key>\n\t<array>\n');
  for (final s in schemes) {
    b
      ..write('\t\t<dict>\n')
      ..write('\t\t\t<key>CFBundleURLSchemes</key>\n\t\t\t<array>\n')
      ..write('\t\t\t\t<string>$s</string>\n')
      ..write('\t\t\t</array>\n\t\t</dict>\n');
  }
  b.write('\t</array>\n');
  if (fbToken != null) {
    b
      ..write('\t<key>FacebookAppID</key>\n\t<string>$_fbAppId</string>\n')
      ..write('\t<key>FacebookClientToken</key>\n\t<string>$fbToken</string>\n')
      ..write('\t<key>FacebookDisplayName</key>\n\t<string>Chap.ci</string>\n')
      ..write('\t<key>LSApplicationQueriesSchemes</key>\n\t<array>\n');
    for (final q in const [
      'fbapi',
      'fb-messenger-share-api',
      'fbauth2',
      'fbshareextension'
    ]) {
      b.write('\t\t<string>$q</string>\n');
    }
    b.write('\t</array>\n');
  }
  return b.toString();
}

/// strings_facebook.xml : App ID, schéma de connexion et jeton client.
String _fbStrings(String token) => '<?xml version="1.0" encoding="utf-8"?>\n'
    '<resources>\n'
    '    <string name="facebook_app_id">$_fbAppId</string>\n'
    '    <string name="fb_login_protocol_scheme">fb$_fbAppId</string>\n'
    '    <string name="facebook_client_token">$token</string>\n'
    '</resources>\n';

/// Le bloc à insérer dans <application> de l'AndroidManifest pour Facebook.
const _fbManifest =
    '        <meta-data android:name="com.facebook.sdk.ApplicationId" android:value="@string/facebook_app_id"/>\n'
    '        <meta-data android:name="com.facebook.sdk.ClientToken" android:value="@string/facebook_client_token"/>\n'
    '        <activity android:name="com.facebook.FacebookActivity" android:configChanges="keyboard|keyboardHidden|screenLayout|screenSize|orientation" android:label="Chap.ci"/>\n'
    '        <activity android:name="com.facebook.CustomTabActivity" android:exported="true">\n'
    '            <intent-filter>\n'
    '                <action android:name="android.intent.action.VIEW"/>\n'
    '                <category android:name="android.intent.category.DEFAULT"/>\n'
    '                <category android:name="android.intent.category.BROWSABLE"/>\n'
    '                <data android:scheme="@string/fb_login_protocol_scheme"/>\n'
    '            </intent-filter>\n'
    '        </activity>\n';

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
        targetSdk = 35
        // versionCode / versionName viennent de pubspec.yaml (`version: 1.20.0+21`).
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
