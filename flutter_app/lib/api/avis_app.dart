// =============================================================================
//  L'AVIS SUR CHAP.CI — une note, un commentaire, UNE SEULE FOIS.
//
//  Demandé par le Patron le 13/09/2026, au lendemain du refus d'accès à la
//  production : Google reproche « un engagement insuffisant des testeurs », et
//  nous n'avions aucun moyen de savoir ce que les gens pensent de l'application.
//
//  ─────────────────────────────────────────────────────────────────────────────
//  DEUX CHOSES DE LA DEMANDE INITIALE NE SE FONT PAS, ET IL FAUT SAVOIR POURQUOI
//  ─────────────────────────────────────────────────────────────────────────────
//
//  1. « SI L'UTILISATEUR A DÉJÀ ÉVALUÉ, NE PLUS AFFICHER » — fait, mais pas avec
//     le magasin. La fenêtre de notation de Google (`in_app_review`) ne dit JAMAIS
//     si la personne a noté : ni l'API Android ni celle d'Apple ne renvoient le
//     résultat, c'est écrit dans leur documentation. Bâtir « ne plus afficher »
//     sur elle donnerait une règle qu'on ne peut pas appliquer.
//     Notre avis à nous, lui, est enregistré sur NOTRE serveur : on sait
//     exactement qui a répondu, et la réponse suit le compte — donc elle vaut
//     aussi sur un second téléphone et après une réinstallation, ce qu'une
//     mémoire locale ne saurait pas faire.
//
//  2. « À CHAQUE UTILISATION LE RAPPELER » — non, et c'est un service à rendre.
//     Une invitation qui revient à chaque lancement se fait désinstaller. Or un
//     testeur qui désinstalle REMET À ZÉRO les quatorze jours de Google : la
//     demande insistante coûterait précisément ce qu'elle cherche à obtenir.
//     Règle retenue : la carte apparaît au 3ᵉ lancement, puis, si l'on a répondu
//     « plus tard », réapparaît tous les 10 lancements. Jamais avant d'avoir vu
//     l'application fonctionner — on ne demande pas son avis à quelqu'un qui
//     vient d'ouvrir la porte.
//
//  ⚠️ ET UNE RÈGLE DE GOOGLE QU'ON NE CONTOURNE PAS. Les consignes de l'API
//  d'avis interdisent de poser une question avant d'ouvrir la fenêtre du magasin
//  — y compris « aimez-vous l'application ? ». Le procédé courant (n'envoyer au
//  magasin que ceux qui ont mis 5 étoiles) est donc exclu ici : le bouton
//  « Noter sur le Play Store » est proposé à TOUT LE MONDE, quelle que soit la
//  note donnée, et il ne dépend d'aucune réponse préalable.
// =============================================================================
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:url_launcher/url_launcher.dart';

import '../version_generee.dart';
import 'api_client.dart';

export '../version_generee.dart' show versionApplication;

/// `android`, `ios` ou `web` — ce que le serveur accepte, et rien d'autre.
/// Passe par `defaultTargetPlatform` plutôt que par `Platform` de `dart:io`,
/// qui ne se compile pas pour le web.
String plateformeCourante() {
  if (kIsWeb) return 'web';
  switch (defaultTargetPlatform) {
    case TargetPlatform.android:
      return 'android';
    case TargetPlatform.iOS:
      return 'ios';
    default:
      return 'web';
  }
}

/// Y a-t-il une fiche de magasin où envoyer les gens ?
///
/// **Android seulement, aujourd'hui.** Chap.ci n'est pas sur l'App Store — le
/// volet iOS est bloqué faute de compte Apple Developer (`store/APP-VERSIONS.md`).
/// Proposer « notez-nous sur le magasin » à quelqu'un qui tombera sur une page
/// inexistante est pire que de ne rien proposer.
bool get magasinDisponible =>
    !kIsWeb && defaultTargetPlatform == TargetPlatform.android;

/// Ouvre la fiche Chap.ci du Play Store, à l'endroit où l'on note.
///
/// ⚠️ CE N'EST PAS LA FENÊTRE D'AVIS INTÉGRÉE de Google (`in_app_review`), et
/// c'est un choix. Cette fenêtre-là demande un greffon natif de plus — or le
/// 12/09/2026 on a découvert qu'une bibliothèque avait relevé en silence le
/// plancher Android de 23 à 24, sans un mot dans la sortie du build. Ajouter un
/// greffon la veille du jour où douze testeurs doivent enfin ouvrir
/// l'application n'en valait pas le risque. Un lien vers la fiche fait le même
/// travail, avec `url_launcher` qui est déjà là.
///
/// `market://` ouvre l'application Play Store directement ; l'adresse `https`
/// sert de repli quand elle est absente.
Future<void> ouvrirNoteMagasin() async {
  if (!magasinDisponible) return;
  const paquet = 'ci.chap.app';
  final natif = Uri.parse('market://details?id=$paquet');
  final web = Uri.parse('https://play.google.com/store/apps/details?id=$paquet');
  try {
    if (await canLaunchUrl(natif)) {
      await launchUrl(natif, mode: LaunchMode.externalApplication);
      return;
    }
    await launchUrl(web, mode: LaunchMode.externalApplication);
  } catch (_) {
    // Un magasin qui ne s'ouvre pas ne doit jamais casser l'écran de
    // remerciement : l'avis, lui, est déjà enregistré.
  }
}

/// Ce que le serveur sait de l'avis de la personne connectée.
class EtatAvisApp {
  /// A-t-elle déjà donné son avis ? C'est la seule chose qui décide de
  /// l'affichage — et elle vient du serveur, pas du téléphone.
  final bool aEvalue;

  /// La note donnée, si elle l'a été. Sert à l'écran « merci », jamais à filtrer.
  final int? note;

  const EtatAvisApp({required this.aEvalue, this.note});

  factory EtatAvisApp.depuisJson(Map<String, dynamic> j) => EtatAvisApp(
        aEvalue: j['aEvalue'] == true,
        note: j['note'] is num ? (j['note'] as num).toInt() : null,
      );

  /// L'état par défaut : on ne sait pas, donc on ne demande rien. Un appel
  /// réseau en échec ne doit jamais faire surgir une carte chez quelqu'un qui a
  /// déjà répondu.
  static const inconnu = EtatAvisApp(aEvalue: true);
}

class AvisApp {
  AvisApp._();

  static const _cleLancements = 'chapci.avis.lancements';
  static const _clePlusTard = 'chapci.avis.plusTard';

  /// Premier lancement où l'on ose demander. Trois ouvertures, c'est le moment
  /// où quelqu'un a vu assez de l'application pour en penser quelque chose.
  static const int _seuilPremier = 3;

  /// Et ensuite, tous les dix lancements. Assez rare pour ne pas peser, assez
  /// régulier pour que la question revienne un jour où la personne a le temps.
  static const int _tousLes = 10;

  /// Demande au serveur si la personne a déjà donné son avis.
  ///
  /// **En cas d'échec, on répond « elle a déjà évalué ».** Le silence est du côté
  /// du calme : mieux vaut ne pas demander à quelqu'un qui a déjà répondu que de
  /// redemander à cause d'un réseau capricieux.
  static Future<EtatAvisApp> etat() async {
    try {
      final r = await ApiClient.instance.get('/avis-app/mien');
      if (r is Map<String, dynamic>) return EtatAvisApp.depuisJson(r);
    } catch (_) {
      // Hors ligne, ou non connecté : on ne demande rien.
    }
    return EtatAvisApp.inconnu;
  }

  /// Envoie la note et le commentaire. Lève une [ApiException] si le serveur
  /// refuse — notamment un 409 quand un avis existe déjà pour ce compte.
  static Future<void> envoyer({
    required int note,
    String commentaire = '',
    required String plateforme,
    required String version,
  }) async {
    await ApiClient.instance.post('/avis-app', {
      'note': note,
      'commentaire': commentaire.trim(),
      'plateforme': plateforme,
      'version': version,
    });
    // La question ne se reposera plus : le serveur fait foi, mais on éteint
    // aussi le compteur local pour que la carte disparaisse dans la seconde,
    // sans attendre le prochain appel réseau.
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_clePlusTard, false);
    await prefs.setInt(_cleLancements, 0);
  }

  /// À appeler UNE FOIS au démarrage. Incrémente le compteur de lancements et
  /// dit si c'est un tour où l'on a le droit de proposer la carte.
  ///
  /// Ne consulte pas le serveur : c'est l'appelant qui croise ce « oui » avec
  /// [etat]. Séparer les deux évite un appel réseau à chaque lancement pour une
  /// question à laquelle on répondra « non » neuf fois sur dix.
  static Future<bool> tourDeDemander() async {
    final prefs = await SharedPreferences.getInstance();
    final n = (prefs.getInt(_cleLancements) ?? 0) + 1;
    await prefs.setInt(_cleLancements, n);

    if (n < _seuilPremier) return false;
    if (n == _seuilPremier) return true;
    // Après un « plus tard », on laisse passer dix lancements.
    if (prefs.getBool(_clePlusTard) == true) {
      return (n - _seuilPremier) % _tousLes == 0;
    }
    // Ni répondu, ni reporté (carte jamais vue, ex. hors ligne) : on retente
    // à la même cadence plutôt que d'abandonner.
    return (n - _seuilPremier) % _tousLes == 0;
  }

  /// « Plus tard » : on note le report. La carte reviendra dans dix lancements.
  static Future<void> reporter() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_clePlusTard, true);
  }
}
