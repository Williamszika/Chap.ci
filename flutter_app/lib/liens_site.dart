import 'package:flutter/material.dart';
import 'i18n/langues.dart';
import 'i18n/textes.dart';
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
  /// Le guide du compte professionnel. Il n'est PAS dans `_clesTitres` : les
  /// six autres pages sont traduites et prennent leur titre de la barre des
  /// Paramètres, celle-ci s'ouvre depuis un bouton qui donne son propre titre.
  static const guidePro = 'guide/pro';
}

/// Titre affiché dans la barre de l'app, par page — les mêmes clés `tr` que
/// les lignes de l'écran Paramètres, pour suivre la langue choisie.
const Map<String, String> _clesTitres = {
  PagesSite.aide: 'item.aide',
  PagesSite.faq: 'item.faq',
  PagesSite.contact: 'item.contact',
  PagesSite.aPropos: 'item.apropos',
  PagesSite.conditions: 'item.conditions',
  PagesSite.confidentialite: 'item.confidentialite',
};

/// Ouvre une page du site DANS l'app, sans jamais partir dans un navigateur
/// séparé. Le contenu reste servi par chap.ci.
///
/// L'app dit toujours sa langue au site par `?lang=` — le site étant en
/// HashRouter, le paramètre voyage dans le hash (`#/aide?lang=en`) et les six
/// pages d'information s'affichent dans la langue de l'app. `fr` est envoyé
/// aussi, exprès : le site mémorise la dernière langue reçue pour ses liens
/// internes, et un `fr` explicite reprend la main sur cette mémoire quand
/// l'utilisateur revient au français.
Future<void> ouvrirPageSite(BuildContext context, String route,
    {String? titre}) {
  final langue = LangueController.instance.code;
  final suffixe = '?lang=$langue';
  final cle = _clesTitres[route];
  // `titre` l'emporte quand l'appelant en donne un : toutes les pages du site
  // ne sont pas des lignes de l'écran Paramètres, et « Chap.ci » en barre de
  // titre ne dit pas ce qu'on est en train de lire.
  final titreFinal = titre ?? (cle == null ? 'Chap.ci' : tr(context, cle));
  return Navigator.of(context).push<void>(MaterialPageRoute<void>(
    builder: (_) => PageSiteScreen(
      url: '$_baseSite$route$suffixe',
      titre: titreFinal,
    ),
  ));
}
