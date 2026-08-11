// Point d'entrée RÉSERVÉ AUX CAPTURES (non embarqué dans l'app).
// Construit avec : flutter build web -t lib/main_shots.dart --dart-define=API_BASE=/api
// L'URL choisit l'écran :  ?shot=explorer&tok=<jeton>
import 'package:flutter/material.dart';
import 'api/api_client.dart';
import 'api/messaging.dart';
import 'api/models.dart';
import 'data/formulaires/electronique.dart';
import 'data/formulaires/maison.dart';
import 'data/formulaires/mode.dart';
import 'favoris.dart';
import 'main.dart';
import 'notifications.dart';
import 'theme.dart';
import 'screens/conversation_screen.dart';
import 'screens/formulaire_dynamique.dart';
import 'screens/notifications_screen.dart';
import 'screens/securite_2fa_screen.dart';
import 'screens/verifier_2fa_screen.dart';
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
    case 'publier-maquis':
      return const PublierScreen(initialCategorie: 'materiel-pro', initialSous: 'Restauration & Maquis');
    case 'publier-don':
      return const PublierScreen(initialCategorie: 'a-donner', initialSous: 'Meubles & électroménager');
    case 'coloris':
      return const _ColorisDemo();
    case 'coloris-tel':
      return const _ColorisTelDemo();
    case 'coloris-bois':
      return const _ColorisBoisDemo();
    case 'twofa':
      return const Verifier2faScreen(mfaToken: 'demo');
    case 'twofa-setup':
      return const Securite2faScreen(apercu: (
        secret: 'JBSWY3DPEHPK3PXP',
        uri: 'otpauth://totp/Chap.ci:vendeur@chap.ci?secret=JBSWY3DPEHPK3PXP&issuer=Chap.ci',
      ));
    case 'notifs':
      final t = DateTime.now().millisecondsSinceEpoch;
      return NotificationsScreen(apercu: [
        NotifItem(
            id: '1', type: 'message', titre: 'Nouveau message de Aïcha',
            corps: 'Bonjour, la robe wax est-elle toujours disponible ?',
            lien: '#/messages/c1', lue: false, cree: t - 5 * 60000),
        NotifItem(
            id: '2', type: 'favorite', titre: 'Quelqu’un a aimé votre annonce',
            corps: 'Votre « iPhone 13 128 Go » a été mis en favori.',
            lien: '#/annonce/abc123', lue: false, cree: t - 55 * 60000),
        NotifItem(
            id: '3', type: 'listing', titre: 'Annonce publiée ✅',
            corps: 'Votre « Table à manger en teck » est maintenant en ligne.',
            lien: '#/annonce/def456', lue: true, cree: t - 26 * 3600000),
        NotifItem(
            id: '4', type: 'listing', titre: 'Annonce à mettre à jour',
            corps: 'Ajoutez le dossier foncier pour la remettre en ligne.',
            lien: '#/modifier/ghi789', lue: true, cree: t - 3 * 86400000),
      ]);
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

/// Le bloc couleurs / variantes, avec deux coloris déjà cochés — pour montrer
/// « les tailles restantes dans cette couleur ». Réservé aux captures.
class _ColorisDemo extends StatelessWidget {
  const _ColorisDemo();
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Couleurs & variantes')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 60),
        children: [
          FormulaireDynamique(
            schema: mode['Vêtements Femme']!,
            onChange: (_) {},
            initiales: const {
              'typeF': 'Robe',
              'tailles': ['38', '40', '42', '44'],
              'matiere': 'Wax',
              'couleurs': ['Rouge', 'Noir'],
              'var_Rouge_prix': '25000',
              'var_Rouge_note': 'dernière pièce',
              'var_Rouge_tailles': ['40', '42'],
              'var_Noir_tailles': ['38'],
            },
          ),
        ],
      ),
    );
  }
}

/// Un smartphone décliné en deux coloris (Noir 128 Go, Bleu 256 Go) — pour la
/// capture des variantes sur l'Électronique. Réservé aux captures.
class _ColorisTelDemo extends StatelessWidget {
  const _ColorisTelDemo();
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Un téléphone, deux coloris')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 60),
        children: [
          FormulaireDynamique(
            schema: electronique['Smartphones']!,
            onChange: (_) {},
            initiales: const {
              'marque': 'Samsung',
              'modele': 'Galaxy A55',
              'stockage': '128 Go',
              'provenance': 'Occasion Côte d’Ivoire',
              'comptes': 'Déconnectés — prêt à l’emploi',
              'couleurs': ['Noir', 'Bleu'],
              'var_Noir_stockage': ['128 Go'],
              'var_Noir_prix': '95000',
              'var_Bleu_stockage': ['256 Go'],
              'var_Bleu_prix': '110000',
              'var_Bleu_note': 'dernière pièce',
            },
          ),
        ],
      ),
    );
  }
}

/// Un meuble décliné en essences de bois — pour la capture de la palette du
/// métier (teck, iroko, wengé). Réservé aux captures.
class _ColorisBoisDemo extends StatelessWidget {
  const _ColorisBoisDemo();
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Un meuble, ses essences')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 60),
        children: [
          FormulaireDynamique(
            schema: maison['Meubles']!,
            onChange: (_) {},
            initiales: const {
              'typeMeuble': 'Table à manger',
              'couleurs': ['Teck', 'Wengé / brun foncé'],
              'var_Teck_prix': '150000',
              'var_Teck_note': 'bois massif',
            },
          ),
        ],
      ),
    );
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
