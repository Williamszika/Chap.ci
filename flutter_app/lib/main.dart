import 'package:flutter/material.dart';
import 'api/api_client.dart';
import 'favoris.dart';
import 'theme.dart';
import 'screens/home_screen.dart';
import 'screens/browse_screen.dart';
import 'screens/messages_screen.dart';
import 'screens/account_screen.dart';
import 'screens/publier_screen.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  // On recharge la session (le jeton) avant d'afficher quoi que ce soit,
  // puis les favoris (locaux, fusionnés au compte si connecté).
  await ApiClient.instance.chargerSession();
  await Favoris.instance.charger();
  runApp(const ChapApp());
}

class ChapApp extends StatelessWidget {
  const ChapApp({super.key});
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Chap.ci',
      debugShowCheckedModeBanner: false,
      theme: chapTheme(),
      home: const AccueilShell(),
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

class _AccueilShellState extends State<AccueilShell> {
  late int _onglet = widget.initialTab;

  Future<void> _publier() async {
    if (!ApiClient.instance.connecte) {
      setState(() => _onglet = 3); // vers Compte pour se connecter
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text('Connectez-vous pour publier une annonce.')));
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
      HomeScreen(onVoirTout: () => setState(() => _onglet = 1)),
      const BrowseScreen(),
      MessagesScreen(onVersCompte: () => setState(() => _onglet = 3)),
      const AccountScreen(),
    ];

    return Scaffold(
      body: IndexedStack(index: _onglet, children: pages),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _publier,
        backgroundColor: ChapColors.orange,
        foregroundColor: Colors.white,
        icon: const Icon(Icons.add),
        label: const Text('Publier'),
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _onglet,
        onDestinationSelected: (i) => setState(() => _onglet = i),
        backgroundColor: ChapColors.cream,
        indicatorColor: ChapColors.cream100,
        destinations: const [
          NavigationDestination(
              icon: Icon(Icons.home_outlined),
              selectedIcon: Icon(Icons.home, color: ChapColors.orange),
              label: 'Accueil'),
          NavigationDestination(
              icon: Icon(Icons.grid_view_outlined),
              selectedIcon: Icon(Icons.grid_view, color: ChapColors.orange),
              label: 'Explorer'),
          NavigationDestination(
              icon: Icon(Icons.chat_bubble_outline),
              selectedIcon:
                  Icon(Icons.chat_bubble, color: ChapColors.orange),
              label: 'Messages'),
          NavigationDestination(
              icon: Icon(Icons.person_outline),
              selectedIcon: Icon(Icons.person, color: ChapColors.orange),
              label: 'Compte'),
        ],
      ),
    );
  }
}
