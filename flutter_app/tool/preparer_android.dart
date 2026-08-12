// Prépare le dossier `android/` de l'app Flutter, prêt à construire l'AAB signé.
//
// Le dossier `android/` n'est PAS dans le dépôt (comme pour le site) : il se
// régénère. Ce script est l'équivalent Flutter du `cap sync` de l'ancienne app —
// il régénère `android/` PUIS y applique toute la configuration Chap.ci :
//
//   • identifiant d'application `ci.chap.app` (le MÊME que l'app Play Store
//     actuelle → c'est une MISE À JOUR, pas une nouvelle app) ;
//   • minSdk 22, targetSdk 35 (comme l'app actuelle) ;
//   • le nom affiché « Chap.ci » et les autorisations réellement utilisées
//     (Internet, appareil photo, position) ;
//   • l'icône de lancement, générée depuis le logo (`assets/icon/`) ;
//   • la signature de production lue depuis `android/key.properties` — que VOUS
//     remplissez chez vous avec votre keystore, et qui n'entre jamais dans Git.
//
// À lancer depuis le dossier `flutter_app/` :
//
//     dart run tool/preparer_android.dart
//
// Il est ré-exécutable sans risque : il régénère puis reconfigure à chaque fois.
// Voir le guide pas-à-pas dans README.md, section « Construire l'app Android ».

import 'dart:io';

const _appId = 'ci.chap.app';

void main() {
  // 1. On doit être à la racine du projet Flutter (flutter_app/).
  final pubspec = File('pubspec.yaml');
  if (!pubspec.existsSync() ||
      !pubspec.readAsStringSync().contains('name: chapci')) {
    _stop('Lancez ce script depuis le dossier flutter_app/ '
        '(dart run tool/preparer_android.dart).');
  }

  // 2. Régénère le dossier android/ (templates Flutter, sans le SDK Android).
  _etape('Génération du dossier android/…');
  _executer('flutter', [
    'create', '--platforms=android', '--project-name', 'chapci', '.',
  ]);

  // `flutter create` recrée un test de démonstration qui ne compile pas contre
  // notre app : on le retire (nos vrais bancs sont ailleurs dans test/).
  final demo = File('test/widget_test.dart');
  if (demo.existsSync()) demo.deleteSync();

  // 3. build.gradle.kts : identifiant, SDK, signature.
  _etape('Configuration de android/app/build.gradle.kts…');
  File('android/app/build.gradle.kts').writeAsStringSync(_buildGradleKts);

  // 4. MainActivity dans le paquet ci.chap.app (cohérent avec le namespace).
  _etape('Déplacement de MainActivity dans $_appId…');
  final kotlin = Directory('android/app/src/main/kotlin');
  final cible = Directory('${kotlin.path}/ci/chap/app')
    ..createSync(recursive: true);
  File('${cible.path}/MainActivity.kt').writeAsStringSync(
    'package ci.chap.app\n\n'
    'import io.flutter.embedding.android.FlutterActivity\n\n'
    'class MainActivity : FlutterActivity()\n',
  );
  final exemple = Directory('${kotlin.path}/com');
  if (exemple.existsSync()) exemple.deleteSync(recursive: true);

  // 5. AndroidManifest.xml : nom affiché + autorisations.
  _etape('Nom « Chap.ci » et autorisations dans AndroidManifest.xml…');
  final manifestFichier = File('android/app/src/main/AndroidManifest.xml');
  var manifest = manifestFichier.readAsStringSync();
  manifest =
      manifest.replaceFirst('android:label="chapci"', 'android:label="Chap.ci"');
  const ouverture =
      '<manifest xmlns:android="http://schemas.android.com/apk/res/android">';
  if (!manifest.contains('android.permission.INTERNET')) {
    manifest = manifest.replaceFirst(ouverture, '$ouverture\n$_permissions');
  }
  manifestFichier.writeAsStringSync(manifest);

  // 6. Icône de lancement, depuis le logo (assets/icon/).
  _etape('Génération de l’icône de lancement…');
  _executer('dart', ['run', 'flutter_launcher_icons']);

  // 7. Rappel des dernières étapes, sur la machine du Patron.
  final aKey = File('android/key.properties').existsSync();
  stdout.writeln('\n✅ Dossier android/ prêt (ci.chap.app, minSdk 22, targetSdk 35).');
  if (!aKey) {
    stdout.writeln('\n⚠️  Il manque android/key.properties pour signer en production.');
    stdout.writeln('   Copiez le modèle et remplissez-le avec VOTRE keystore :');
    stdout.writeln('     cp tool/key.properties.exemple android/key.properties');
    stdout.writeln('   (ce fichier et le keystore restent chez vous, jamais dans Git.)');
  }
  stdout.writeln('\nEnsuite, pour l’AAB à déposer sur le Play Store :');
  stdout.writeln('     flutter build appbundle --release');
  stdout.writeln('   L’AAB sort dans build/app/outputs/bundle/release/app-release.aab');
  stdout.writeln('\nPensez au versionCode : il DOIT être supérieur au dernier publié');
  stdout.writeln('   (20 pour la v1.19). Il se règle dans pubspec.yaml (champ « version »).');
}

const _permissions =
    '    <uses-permission android:name="android.permission.INTERNET"/>\n'
    '    <uses-permission android:name="android.permission.CAMERA"/>\n'
    '    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION"/>\n'
    '    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION"/>';

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
