import 'package:flutter/material.dart';
import 'screens/page_site_screen.dart';

/// Pages d'information et légales de Chap.ci.
///
/// Elles vivent sur le site (React) et changent rarement. Plutôt que de les
/// redessiner en Flutter — ce qui obligerait à les tenir à jour à deux endroits
/// —, on les affiche depuis le site DANS une page de l'app (vue web embarquée,
/// voir `PageSiteScreen`). Résultat : elles restent synchronisées avec le site
/// pour toujours, ET l'utilisateur ne part jamais dans un navigateur séparé.
const String _baseSite = 'https://chap.ci/#/';

/// Les routes des pages du site (les mêmes que le navigateur web).
class PagesSite {
  PagesSite._();
  static const aide = 'aide';
  static const faq = 'faq';
  static const contact = 'contact';
  static const aPropos = 'a-propos';
  static const conditions = 'conditions';
  static const confidentialite = 'confidentialite';
}

/// Titre affiché dans la barre de l'app, par page.
const Map<String, String> _titres = {
  PagesSite.aide: 'Aide',
  PagesSite.faq: 'Questions fréquentes',
  PagesSite.contact: 'Nous contacter',
  PagesSite.aPropos: 'À propos',
  PagesSite.conditions: 'Conditions d’utilisation',
  PagesSite.confidentialite: 'Confidentialité',
};

/// Ouvre une page du site DANS l'app, sans jamais partir dans un navigateur
/// séparé. Le contenu reste servi par chap.ci.
Future<void> ouvrirPageSite(BuildContext context, String route) {
  return Navigator.of(context).push<void>(MaterialPageRoute<void>(
    builder: (_) => PageSiteScreen(
      url: '$_baseSite$route',
      titre: _titres[route] ?? 'Chap.ci',
    ),
  ));
}
