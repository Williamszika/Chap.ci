// =============================================================================
//  LES LIENS QUI OUVRENT L'APPLICATION — https://chap.ci/annonce/{id}
//
//  Demande du Patron, le 04/09/2026, devant son statut WhatsApp : « je veux
//  que lorsqu'on clique sur Voir l'annonce, cela ouvre le site, ou l'app si la
//  personne l'a installée ». C'est ce qu'Apple appelle un lien universel et
//  Google un App Link : la même adresse https://chap.ci/annonce/… ouvre
//  l'application quand elle est là, le site sinon. Rien ne change pour celui
//  qui partage ; c'est le téléphone de celui qui reçoit qui décide.
//
//  Ce fichier fait la moitié « application » : recevoir l'adresse (au
//  lancement, ou pendant que l'app tourne) et ouvrir la bonne fiche. L'autre
//  moitié — dire au téléphone que chap.ci appartient à cette application — est
//  une déclaration sur le site (`/.well-known/…`, servie par web/seo.php) et
//  une déclaration dans l'application (tool/preparer_plateformes.dart), qui
//  ne valent qu'avec deux identifiants que seul le Patron possède : voir
//  store/LIENS-UNIVERSELS.md.
//
//  Tant que ces déclarations manquent, ce fichier ne reçoit rien et ne gêne
//  rien : le lien continue d'ouvrir le site.
// =============================================================================
import 'dart:async';

import 'package:app_links/app_links.dart';
import 'package:flutter/material.dart';

import 'api/models.dart';
import 'screens/listing_detail_screen.dart';
import 'screens/vendeur_screen.dart';

/// Ce qu'une adresse chap.ci désigne : une annonce ou un vendeur, avec son
/// identifiant — ou `null` si elle ne mène à rien que l'application sache
/// ouvrir (l'accueil, l'aide, une page inconnue : le site s'en charge).
///
/// Accepte les deux formes qui circulent : `https://chap.ci/annonce/{id}`
/// (les pages SEO, l'affiche, les aperçus) et `https://chap.ci/#/annonce/{id}`
/// (le routage à dièse de l'application web).
({String type, String id})? lireLienChapci(Uri u) {
  final hote = u.host.toLowerCase();
  if (hote != 'chap.ci' && hote != 'www.chap.ci') return null;
  var segments = u.pathSegments.where((s) => s.isNotEmpty).toList();
  if (segments.isEmpty && u.fragment.isNotEmpty) {
    segments = u.fragment.split('/').where((s) => s.isNotEmpty).toList();
  }
  if (segments.length < 2) return null;
  final type = segments[0];
  final id = segments[1];
  if (type != 'annonce' && type != 'vendeur') return null;
  if (!RegExp(r'^[A-Za-z0-9-]{4,64}$').hasMatch(id)) return null;
  return (type: type, id: id);
}

/// Reçoit les liens et ouvre la fiche. Un seul exemplaire, démarré par la
/// coquille d'accueil une fois le navigateur en place.
class LiensEntrants {
  LiensEntrants._();
  static final LiensEntrants instance = LiensEntrants._();

  final _liens = AppLinks();
  StreamSubscription<Uri>? _abonnement;
  bool _demarre = false;
  GlobalKey<NavigatorState>? _navigateur;

  /// À appeler une fois, quand [navigateur] a un état (l'accueil est monté).
  /// Traite le lien qui a lancé l'application, puis écoute ceux qui arrivent
  /// pendant qu'elle tourne. Silencieux si la plateforme ne sait rien dire.
  Future<void> demarrer(GlobalKey<NavigatorState> navigateur) async {
    _navigateur = navigateur;
    if (_demarre) return;
    _demarre = true;
    try {
      final initial = await _liens.getInitialLink();
      if (initial != null) await ouvrir(initial);
    } catch (_) {
      // Pas de lien au lancement, ou plateforme sans support : rien à faire.
    }
    _abonnement = _liens.uriLinkStream.listen(
      (u) => ouvrir(u),
      onError: (_) {/* un lien illisible n'a pas à casser l'écran */},
    );
  }

  void arreter() {
    _abonnement?.cancel();
    _abonnement = null;
    _demarre = false;
  }

  /// Ouvre ce que désigne [u], s'il désigne quelque chose. Une annonce retirée
  /// ou introuvable laisse l'écran où il est : le site, lui, dira « annonce
  /// introuvable » à qui suit le lien sans l'application.
  Future<void> ouvrir(Uri u) async {
    final cible = lireLienChapci(u);
    if (cible == null) return;
    final nav = _navigateur?.currentState;
    if (nav == null) return;
    if (cible.type == 'vendeur') {
      nav.push(MaterialPageRoute(
          builder: (_) => VendeurScreen(sellerId: cible.id, sellerName: '')));
      return;
    }
    try {
      final annonce = await Listing.parId(cible.id);
      nav.push(MaterialPageRoute(
          builder: (_) => ListingDetailScreen(annonce: annonce)));
    } catch (_) {
      // Annonce retirée, réseau coupé : on reste où on est.
    }
  }
}
