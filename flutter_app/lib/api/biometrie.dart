// =============================================================================
//  DÉVERROUILLAGE PAR EMPREINTE DIGITALE / FACE ID (07/09/2026).
//
//  Le Patron : « permettre de se connecter via empreintes ou Face ID ».
//
//  CE QUE ÇA FAIT, EXACTEMENT — et ce que ça ne fait pas.
//
//  Le jeton de session vit DÉJÀ sur le téléphone (`shared_preferences`,
//  `ApiClient._tokenKey`) : une fois connecté, on le reste, et quiconque ouvre
//  le téléphone entre dans le compte. La biométrie ne remplace donc pas le mot
//  de passe — elle GARDE L'USAGE de cette session : à l'ouverture, l'écran
//  reste verrouillé tant que le doigt ou le visage n'a pas répondu.
//
//  AUCUN MOT DE PASSE N'EST STOCKÉ, ni ici ni ailleurs. Enregistrer un mot de
//  passe pour le rejouer serait la seule façon de « se connecter » vraiment
//  par empreinte, et ce serait échanger une commodité contre un secret posé
//  sur l'appareil : on ne le fait pas. L'empreinte ne quitte jamais le
//  téléphone non plus — Android et iOS ne la donnent à personne, ils
//  répondent seulement « c'est bien lui » ou « non ».
//
//  Le réglage est éteint par défaut et ne s'allume qu'après une connexion
//  classique réussie (voir Paramètres → Sécurité).
// =============================================================================
import 'package:flutter/services.dart';
import 'package:local_auth/local_auth.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'api_client.dart';

class Biometrie {
  Biometrie._();
  static final Biometrie instance = Biometrie._();

  static const _cleActive = 'chapci.biometrie.active';
  final _auth = LocalAuthentication();

  /// Le téléphone sait-il lire une empreinte ou un visage, ET en a-t-il une
  /// d'enregistrée ? Faux sur un appareil sans capteur, ou dont le
  /// propriétaire n'a rien configuré — dans ce cas on ne propose rien.
  Future<bool> disponible() async {
    try {
      if (!await _auth.isDeviceSupported()) return false;
      if (!await _auth.canCheckBiometrics) return false;
      return (await _auth.getAvailableBiometrics()).isNotEmpty;
    } on PlatformException {
      return false;
    } catch (_) {
      return false;
    }
  }

  /// Le déverrouillage est-il allumé par la personne ? Éteint par défaut.
  Future<bool> active() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      return prefs.getBool(_cleActive) ?? false;
    } catch (_) {
      return false;
    }
  }

  /// Allume ou éteint le réglage.
  Future<void> definirActive(bool valeur) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setBool(_cleActive, valeur);
    } catch (_) {/* le réglage n'a pas pu être écrit : on n'a rien cassé */}
  }

  /// Faut-il verrouiller l'écran à l'ouverture ? Seulement si le réglage est
  /// allumé, qu'une session existe, et que le téléphone sait encore lire une
  /// empreinte (le propriétaire a pu la retirer depuis).
  Future<bool> verrouAttendu() async {
    if (!ApiClient.instance.connecte) return false;
    if (!await active()) return false;
    return disponible();
  }

  /// Demande le doigt ou le visage. Rend vrai si le téléphone a reconnu la
  /// personne. `motif` est la phrase que le système affiche.
  ///
  /// Le repli par le code de l'appareil est autorisé (`biometricOnly: false`) :
  /// un doigt mouillé ou un visage mal éclairé ne doit pas enfermer quelqu'un
  /// hors de son propre compte.
  Future<bool> demander(String motif) async {
    try {
      return await _auth.authenticate(
        localizedReason: motif,
        options: const AuthenticationOptions(
          biometricOnly: false,
          stickyAuth: true,
          useErrorDialogs: true,
        ),
      );
    } on PlatformException {
      return false;
    } catch (_) {
      return false;
    }
  }
}
