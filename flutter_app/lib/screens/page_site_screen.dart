import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:webview_flutter/webview_flutter.dart';

/// Affiche une page du site (aide, FAQ, CGU, confidentialité…) DANS l'app, en
/// vue web embarquée.
///
/// Le contenu reste servi par chap.ci (source unique — on ne redessine pas ces
/// pages en Flutter, elles resteraient à maintenir à deux endroits), mais
/// l'utilisateur ne quitte JAMAIS l'application : barre de titre Chap.ci +
/// flèche retour, comme n'importe quel écran natif. Aucune barre de navigateur.
///
/// Seule la navigation vers chap.ci reste dans cette vue de confiance : tout
/// lien externe (autre domaine, tel:, mailto:) part dans l'app dédiée du
/// téléphone, jamais chargé ici.
class PageSiteScreen extends StatefulWidget {
  final String url;
  final String titre;

  const PageSiteScreen({super.key, required this.url, required this.titre});

  @override
  State<PageSiteScreen> createState() => _PageSiteScreenState();
}

class _PageSiteScreenState extends State<PageSiteScreen> {
  late final WebViewController _controleur;
  bool _charge = true;

  @override
  void initState() {
    super.initState();
    _controleur = WebViewController()
      // Le site est une application React : sans JavaScript, la page reste vide.
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(NavigationDelegate(
        onPageFinished: (_) {
          if (mounted) setState(() => _charge = false);
        },
        onNavigationRequest: (requete) {
          final uri = Uri.tryParse(requete.url);
          final host = uri?.host ?? '';
          // On ne garde DANS l'app que chap.ci (et ses sous-domaines). Le test
          // est strict : `endsWith('chap.ci')` laisserait passer « evilchap.ci ».
          final surChapci = host == 'chap.ci' || host.endsWith('.chap.ci');
          if (surChapci) return NavigationDecision.navigate;
          // Lien externe : hors de la vue de confiance → navigateur/app du
          // téléphone. On n'ouvre QUE des schémas attendus (web, tel, mail,
          // sms) ; tout autre (intent:, javascript:, file:…) est refusé en
          // silence — durcissement, même si le contenu vient de notre site.
          const schemasOk = {'https', 'http', 'tel', 'mailto', 'sms'};
          if (uri != null && schemasOk.contains(uri.scheme)) {
            launchUrl(uri, mode: LaunchMode.externalApplication);
          }
          return NavigationDecision.prevent;
        },
      ))
      ..loadRequest(Uri.parse(widget.url));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(widget.titre)),
      body: Stack(
        children: [
          WebViewWidget(controller: _controleur),
          if (_charge)
            const Align(
              alignment: Alignment.topCenter,
              child: LinearProgressIndicator(),
            ),
        ],
      ),
    );
  }
}
