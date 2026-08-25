import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'api/api_client.dart';
import 'api/push_natif.dart';
import 'favoris.dart';
import 'i18n/langues.dart';
import 'i18n/textes.dart';
import 'notifications.dart';
import 'theme.dart';
import 'screens/home_screen.dart';
import 'screens/browse_screen.dart';
import 'screens/messages_screen.dart';
import 'screens/account_screen.dart';
import 'screens/publier_screen.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  // Barre d'état : fond transparent, icônes SOMBRES (le fond de l'app est clair)
  // — y compris sur l'accueil, qui n'a pas d'AppBar pour l'imposer lui-même.
  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    statusBarColor: Colors.transparent,
    statusBarIconBrightness: Brightness.dark, // Android
    statusBarBrightness: Brightness.light, // iOS
  ));
  // On recharge la session (le jeton) avant d'afficher quoi que ce soit,
  // puis les favoris (locaux, fusionnés au compte si connecté).
  await ApiClient.instance.chargerSession();
  await Favoris.instance.charger();
  // La langue choisie (français par défaut), avant le premier rendu.
  await LangueController.instance.charger();
  // Le compteur de la cloche (léger, best-effort, silencieux si hors ligne).
  Notifications.instance.rafraichirCompte();
  // Le push natif (FCM) — neutre tant qu'il n'est pas activé (voir README).
  PushNatif.instance.demarrer();
  runApp(const ChapApp());
}

class ChapApp extends StatelessWidget {
  const ChapApp({super.key});
  @override
  Widget build(BuildContext context) {
    // On reconstruit MaterialApp quand la langue change : tout l'arbre est
    // redessiné, chaque `tr(...)` relit la langue courante, et l'arabe passe
    // seul en droite-à-gauche.
    return AnimatedBuilder(
      animation: LangueController.instance,
      builder: (context, _) => MaterialApp(
        title: 'Chap.ci',
        debugShowCheckedModeBanner: false,
        theme: chapTheme(),
        locale: LangueController.instance.locale,
        supportedLocales:
            languesDisponibles.map((l) => Locale(l.code)).toList(),
        localizationsDelegates: const [
          GlobalMaterialLocalizations.delegate,
          GlobalWidgetsLocalizations.delegate,
          GlobalCupertinoLocalizations.delegate,
        ],
        // Sur tablette et grands écrans, on borne la largeur du contenu et on le
        // centre — comme le site (max-w-4xl) — pour éviter des lignes qui
        // s'étirent à l'infini. Sous 900 px (téléphones), c'est sans effet.
        builder: (context, child) => ColoredBox(
          color: ChapColors.cream200,
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 900),
              child: child,
            ),
          ),
        ),
        home: const AccueilShell(),
      ),
    );
  }
}

/// La coquille avec la barre du bas : Accueil · Explorer · Compte.
/// Les autres onglets du site (Publier, Messages…) s'ajouteront ici.
class AccueilShell extends StatefulWidget {
  final int initialTab;
  const AccueilShell({super.key, this.initialTab = 0});
  @override
  State<AccueilShell> createState() => _AccueilShellState();
}

class _AccueilShellState extends State<AccueilShell> with WidgetsBindingObserver {
  late int _onglet = widget.initialTab;
  late final PageController _pages =
      PageController(initialPage: widget.initialTab);

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _pages.dispose();
    super.dispose();
  }

  /// Aller à un onglet, que ce soit par la barre du bas ou par un bouton
  /// interne (« Voir tout », « Aller à mon compte »). On saute directement à
  /// la page (jumpToPage) pour ne pas défiler à travers les onglets voisins.
  void _aller(int i) {
    if (!mounted) return;
    setState(() => _onglet = i);
    if (_pages.hasClients) _pages.jumpToPage(i);
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    // Le téléphone revient au premier plan : on rafraîchit la pastille.
    if (state == AppLifecycleState.resumed) {
      Notifications.instance.rafraichirCompte();
    }
  }

  Future<void> _publier() async {
    if (!ApiClient.instance.connecte) {
      _aller(3); // vers Compte pour se connecter
      ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(tr(context, 'login.connectezVous'))));
      return;
    }
    final ok = await Navigator.of(context)
        .push<bool>(MaterialPageRoute(builder: (_) => const PublierScreen()));
    if (ok == true && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('Votre annonce est en ligne 🎉'),
        backgroundColor: ChapColors.greenDark,
      ));
    }
  }

  @override
  Widget build(BuildContext context) {
    final pages = [
      HomeScreen(onVoirTout: () => _aller(1)),
      const BrowseScreen(),
      MessagesScreen(onVersCompte: () => _aller(3)),
      const AccountScreen(),
    ];

    return Scaffold(
      // On glisse de gauche à droite pour changer d'onglet. Chaque page est
      // gardée en vie (comme le faisait l'IndexedStack) pour ne pas se
      // recharger à chaque passage.
      body: PageView(
        controller: _pages,
        onPageChanged: (i) => setState(() => _onglet = i),
        children: [for (final p in pages) _Vivante(child: p)],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _publier,
        backgroundColor: ChapColors.orange,
        foregroundColor: Colors.white,
        icon: const Icon(Icons.add),
        label: Text(tr(context, 'action.publier')),
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _onglet,
        onDestinationSelected: _aller,
        backgroundColor: ChapColors.cream,
        indicatorColor: ChapColors.cream100,
        destinations: [
          NavigationDestination(
              icon: const Icon(Icons.home_outlined),
              selectedIcon: const Icon(Icons.home, color: ChapColors.orange),
              label: tr(context, 'nav.accueil')),
          NavigationDestination(
              icon: const Icon(Icons.grid_view_outlined),
              selectedIcon: const Icon(Icons.grid_view, color: ChapColors.orange),
              label: tr(context, 'nav.explorer')),
          NavigationDestination(
              icon: const Icon(Icons.chat_bubble_outline),
              selectedIcon:
                  const Icon(Icons.chat_bubble, color: ChapColors.orange),
              label: tr(context, 'nav.messages')),
          NavigationDestination(
              icon: const Icon(Icons.person_outline),
              selectedIcon: const Icon(Icons.person, color: ChapColors.orange),
              label: tr(context, 'nav.compte')),
        ],
      ),
    );
  }
}

/// Garde une page vivante quand le PageView la fait sortir de l'écran — sinon
/// chaque glissement rechargerait l'onglet (liste, position de défilement…).
class _Vivante extends StatefulWidget {
  final Widget child;
  const _Vivante({required this.child});
  @override
  State<_Vivante> createState() => _VivanteState();
}

class _VivanteState extends State<_Vivante>
    with AutomaticKeepAliveClientMixin {
  @override
  bool get wantKeepAlive => true;

  @override
  Widget build(BuildContext context) {
    super.build(context);
    return widget.child;
  }
}
