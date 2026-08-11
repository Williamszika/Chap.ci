import 'package:flutter/material.dart';
import 'api/api_client.dart';
import 'theme.dart';
import 'screens/home_screen.dart';
import 'screens/browse_screen.dart';
import 'screens/account_screen.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  // On recharge la session (le jeton) avant d'afficher quoi que ce soit.
  await ApiClient.instance.chargerSession();
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
  const AccueilShell({super.key});
  @override
  State<AccueilShell> createState() => _AccueilShellState();
}

class _AccueilShellState extends State<AccueilShell> {
  int _onglet = 0;

  @override
  Widget build(BuildContext context) {
    final pages = [
      HomeScreen(onVoirTout: () => setState(() => _onglet = 1)),
      const BrowseScreen(),
      const AccountScreen(),
    ];

    return Scaffold(
      body: IndexedStack(index: _onglet, children: pages),
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
              icon: Icon(Icons.person_outline),
              selectedIcon: Icon(Icons.person, color: ChapColors.orange),
              label: 'Compte'),
        ],
      ),
    );
  }
}
