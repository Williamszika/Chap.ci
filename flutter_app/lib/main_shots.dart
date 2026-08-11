// Point d'entrée RÉSERVÉ AUX CAPTURES (non embarqué dans l'app).
// Construit avec : flutter build web -t lib/main_shots.dart --dart-define=API_BASE=/api
// L'URL choisit l'écran :  ?shot=explorer&tok=<jeton>
import 'package:flutter/material.dart';
import 'api/api_client.dart';
import 'api/messaging.dart';
import 'api/models.dart';
import 'favoris.dart';
import 'main.dart';
import 'theme.dart';
import 'screens/conversation_screen.dart';
import 'screens/favoris_screen.dart';
import 'screens/listing_detail_screen.dart';
import 'screens/modifier_profil_screen.dart';
import 'screens/publier_screen.dart';
import 'screens/register_screen.dart';
import 'screens/verifier_email_screen.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final params = Uri.base.queryParameters;
  final tok = params['tok'];
  if (tok != null && tok.isNotEmpty) {
    await ApiClient.instance.definirJeton(tok);
  } else {
    await ApiClient.instance.chargerSession();
  }
  await Favoris.instance.charger();
  runApp(MaterialApp(
    debugShowCheckedModeBanner: false,
    theme: chapTheme(),
    home: _pour(params['shot'] ?? 'home'),
  ));
}

Widget _pour(String shot) {
  switch (shot) {
    case 'explorer':
      return const AccueilShell(initialTab: 1);
    case 'messages':
      return const AccueilShell(initialTab: 2);
    case 'login':
    case 'compte':
      return const AccueilShell(initialTab: 3);
    case 'register':
      return const RegisterScreen();
    case 'verify':
      return const VerifierEmailScreen();
    case 'publier':
      return const PublierScreen();
    case 'publier-mode':
      return const PublierScreen(initialCategorie: 'mode', initialSous: 'Vêtements Femme');
    case 'publier-beaute':
      return const PublierScreen(initialCategorie: 'mode', initialSous: 'Beauté & Cosmétiques');
    case 'publier-tel':
      return const PublierScreen(initialCategorie: 'electronique', initialSous: 'Smartphones');
    case 'publier-ordi':
      return const PublierScreen(initialCategorie: 'electronique', initialSous: 'Ordinateurs');
    case 'publier-voiture':
      return const PublierScreen(initialCategorie: 'vehicules', initialSous: 'Voitures');
    case 'publier-meuble':
      return const PublierScreen(initialCategorie: 'maison', initialSous: 'Meubles');
    case 'publier-deco':
      return const PublierScreen(initialCategorie: 'maison', initialSous: 'Décoration');
    case 'publier-vivriers':
      return const PublierScreen(initialCategorie: 'alimentation', initialSous: 'Produits vivriers');
    case 'publier-poisson':
      return const PublierScreen(initialCategorie: 'alimentation', initialSous: 'Poisson & Produits de mer');
    case 'publier-oiseaux':
      return const PublierScreen(initialCategorie: 'animaux', initialSous: 'Oiseaux, Poissons & Reptiles');
    case 'publier-betail':
      return const PublierScreen(initialCategorie: 'animaux', initialSous: 'Bétail & Élevage');
    case 'publier-formation':
      return const PublierScreen(initialCategorie: 'services', initialSous: 'Cours & Formation');
    case 'publier-btp':
      return const PublierScreen(initialCategorie: 'services', initialSous: 'BTP & Rénovation');
    case 'publier-offre':
      return const PublierScreen(initialCategorie: 'emploi', initialSous: 'Offres d’emploi');
    case 'publier-complement':
      return const PublierScreen(initialCategorie: 'sante', initialSous: 'Compléments & Tisanes');
    case 'publier-jouet':
      return const PublierScreen(initialCategorie: 'bebe', initialSous: 'Jouets & Éveil');
    case 'publier-visa':
      return const PublierScreen(initialCategorie: 'voyage', initialSous: 'Visas & formalités');
    case 'publier-velo':
      return const PublierScreen(initialCategorie: 'loisirs', initialSous: 'Vélos & Trottinettes');
    case 'publier-fourniture':
      return const PublierScreen(initialCategorie: 'scolaire', initialSous: 'Fournitures & papeterie');
    case 'profil':
      return const ModifierProfilScreen();
    case 'favoris':
      return const FavorisScreen();
    case 'detail':
      return const _PremiereAnnonce();
    case 'discussion':
      return const _PremiereConversation();
    default:
      return const AccueilShell(initialTab: 0);
  }
}

/// Ouvre la fiche de la première annonce publique (pour la capture « détail »).
class _PremiereAnnonce extends StatelessWidget {
  const _PremiereAnnonce();
  @override
  Widget build(BuildContext context) {
    return FutureBuilder<List<Listing>>(
      future: Listing.toutes(),
      builder: (context, snap) {
        final l = snap.data;
        if (l == null) {
          return const Scaffold(
              body: Center(
                  child: CircularProgressIndicator(color: ChapColors.orange)));
        }
        if (l.isEmpty) {
          return const Scaffold(body: Center(child: Text('—')));
        }
        return ListingDetailScreen(annonce: l.first);
      },
    );
  }
}

/// Ouvre la première conversation (pour la capture « discussion »).
class _PremiereConversation extends StatelessWidget {
  const _PremiereConversation();
  @override
  Widget build(BuildContext context) {
    return FutureBuilder<List<Conversation>>(
      future: Conversation.mes(),
      builder: (context, snap) {
        final c = snap.data;
        if (c == null) {
          return const Scaffold(
              body: Center(
                  child: CircularProgressIndicator(color: ChapColors.orange)));
        }
        if (c.isEmpty) {
          return const Scaffold(body: Center(child: Text('—')));
        }
        final conv = c.first;
        return ConversationScreen(
            conversationId: conv.id,
            titre: conv.otherName ?? conv.listingTitle ?? 'Discussion');
      },
    );
  }
}
