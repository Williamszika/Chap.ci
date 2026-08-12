import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

/// Pages d'information et légales de Chap.ci.
///
/// Elles vivent sur le site (React) et changent rarement. Plutôt que de les
/// redessiner en Flutter — ce qui obligerait à les tenir à jour à deux endroits
/// —, on les ouvre depuis le site dans un navigateur INTÉGRÉ (feuille Safari
/// sur iOS, onglet personnalisé sur Android). Résultat : elles restent
/// synchronisées automatiquement avec le site, pour toujours.
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

/// Ouvre une page du site dans un navigateur intégré, avec repli sur le
/// navigateur externe si l'intégré n'est pas disponible.
Future<void> ouvrirPageSite(BuildContext context, String route) async {
  final uri = Uri.parse('$_baseSite$route');
  for (final mode in const [
    LaunchMode.inAppBrowserView,
    LaunchMode.externalApplication,
  ]) {
    try {
      if (await launchUrl(uri, mode: mode)) return;
    } catch (_) {/* on essaie le mode suivant */}
  }
  if (context.mounted) {
    ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Impossible d’ouvrir la page.')));
  }
}
