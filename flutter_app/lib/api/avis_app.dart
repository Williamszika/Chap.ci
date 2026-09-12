// =============================================================================
//  L'AVIS SUR CHAP.CI — une note, un commentaire, UNE SEULE FOIS.
//
//  Demandé par le Patron le 13/09/2026, au lendemain du refus d'accès à la
//  production : Google reproche « un engagement insuffisant des testeurs », et
//  nous n'avions aucun moyen de savoir ce que les gens pensent de l'application.
//
//  Précisé par le Patron le 13/09 : **le rappel doit envoyer sur le Play Store**,
//  et revenir **à chaque utilisation** tant que la personne n'a rien fait.
//  C'est ce qui est écrit ici. Deux remarques accompagnent cette règle, parce
//  qu'elles ne disparaîtront pas en étant tues.
//
//  ─────────────────────────────────────────────────────────────────────────────
//  1. « S'IL A DÉJÀ ÉVALUÉ, NE PLUS AFFICHER » — LA LIMITE EST CHEZ GOOGLE
//  ─────────────────────────────────────────────────────────────────────────────
//     **Aucune application au monde ne sait si vous l'avez notée.** Ni l'API
//     d'avis de Google ni celle d'Apple ne renvoient le résultat ; c'est écrit
//     dans leur documentation, et c'est délibéré de leur part.
//
//     La seule version applicable de la règle est donc : **« s'il a été ENVOYÉ
//     noter, ne plus afficher »**. Le serveur enregistre le départ vers la fiche
//     (`profiles.avis_magasin_at`) — le nom de la colonne dit ce qu'elle sait, et
//     ce qu'elle ne sait pas. Une personne qui part vers le Play Store et ferme
//     la page sans rien écrire ne sera plus relancée : c'est le prix à payer, et
//     il n'existe pas d'autre implémentation honnête.
//
//     La mémoire vit sur le SERVEUR, pas dans le téléphone : elle vaut donc aussi
//     sur un second appareil, après une réinstallation, après un vidage de cache.
//
//  ─────────────────────────────────────────────────────────────────────────────
//  2. « À CHAQUE UTILISATION » — APPLIQUÉ, ET LE RISQUE EST ÉCRIT
//  ─────────────────────────────────────────────────────────────────────────────
//     J'avais proposé « tous les dix lancements » ; le Patron a redemandé « à
//     chaque utilisation ». C'est sa décision et elle est appliquée
//     (`_tousLes = 1`, à partir du 2ᵉ lancement).
//
//     Ce qu'il faut surveiller : **un testeur agacé qui désinstalle remet à zéro
//     les quatorze jours de Google**. Si le compteur d'installations actives
//     baisse dans la console avant le 26/09, c'est la première chose à regarder —
//     et la cadence se change en un caractère, ci-dessous.
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

/// Enregistre, sur le serveur, que cette personne a été envoyée noter.
///
/// ⚠️ CE N'EST PAS « elle a noté ». **Personne ne peut savoir ça** : ni l'API
/// d'avis de Google ni celle d'Apple ne renvoient le résultat. C'est la limite
/// que la demande du Patron — « si l'utilisateur a déjà évalué, ne plus
/// afficher » — rencontre, et la seule version honnête de cette règle est
/// « s'il a été envoyé noter, ne plus afficher ».
///
/// L'échec est volontairement silencieux : quelqu'un qui part vers le Play Store
/// ne doit pas être arrêté par un serveur lent. Au pire la carte reparaît une
/// fois, ce qui est moins grave que de bloquer le geste qu'on lui demande.
Future<void> marquerEnvoyeAuMagasin() async {
  try {
    await ApiClient.instance.post('/avis-app/magasin', const {});
  } catch (_) {}
}

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

  /// Premier lancement où l'on propose. **2**, et non 1 : demander son avis à
  /// quelqu'un qui vient d'ouvrir l'application pour la première fois, c'est
  /// récolter une étoile sur une application qu'il n'a pas vue.
  static const int _seuilPremier = 2;

  /// Ensuite, **à chaque lancement** — décision du Patron, redemandée le
  /// 13/09/2026 après que j'aie proposé « tous les dix ».
  ///
  /// ⚠️ LE RISQUE EST CONNU ET IL EST ÉCRIT ICI, PAS ESCAMOTÉ : une invitation
  /// qui revient à chaque ouverture agace, et un testeur agacé qui désinstalle
  /// **remet à zéro les quatorze jours de Google**. La croix « Plus tard » reste
  /// donc à portée de pouce, et cette valeur se change en un caractère.
  static const int _tousLes = 1;

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
