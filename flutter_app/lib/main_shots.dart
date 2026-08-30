// Point d'entrée RÉSERVÉ AUX CAPTURES (non embarqué dans l'app).
// Construit avec : flutter build web -t lib/main_shots.dart --dart-define=API_BASE=/api
// L'URL choisit l'écran :  ?shot=explorer&tok=<jeton>
import 'package:flutter/material.dart';
import 'api/api_client.dart';
import 'api/messaging.dart';
import 'api/models.dart';
import 'api/pub.dart';
import 'screens/home_screen.dart';
import 'widgets/ecran_pub.dart';
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
import 'api/admin.dart';
import 'screens/admin/annonces_screen.dart';
import 'screens/admin/avis_screen.dart';
import 'screens/admin/campagne_screen.dart';
import 'screens/admin/commandes_screen.dart';
import 'screens/admin/contact_screen.dart';
import 'screens/admin/conversations_screen.dart';
import 'screens/admin/emails_screen.dart';
import 'screens/admin/moderateurs_screen.dart';
import 'screens/admin/moderation_screen.dart';
import 'screens/admin/newsletter_screen.dart';
import 'screens/admin/sauvegardes_screen.dart';
import 'screens/admin/tableau_bord_screen.dart';
import 'screens/admin/utilisateurs_screen.dart';
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
    case 'pub-demo':
      // Démo vidéo : l'écran de pub qui enchaîne styles et animations.
      return const Scaffold(
        backgroundColor: ChapColors.cream200,
        body: SafeArea(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Padding(
                padding: EdgeInsets.fromLTRB(16, 14, 16, 6),
                child: Text.rich(TextSpan(
                  style: TextStyle(fontSize: 26, fontWeight: FontWeight.w900),
                  children: [
                    TextSpan(text: 'Chap', style: TextStyle(color: ChapColors.ink)),
                    TextSpan(text: '.ci', style: TextStyle(color: ChapColors.marque)),
                  ],
                )),
              ),
              EcranPub(
                demoRotation: Duration(seconds: 5),
                apercu: [
                  Pub(
                    id: 'd1', titre: 'Grand déstockage à Adjamé',
                    description: 'Téléphones et accessoires à prix cassés tout le week-end.',
                    lien: null, style: 'ivoire', couleurTexte: null, images: [],
                    kind: 'paid', anims: ['pop'], animGap: 5, animLoop: true,
                  ),
                  Pub(
                    id: 'd2', titre: 'Win Immobilier',
                    description: 'Studios et 2 pièces à louer à Cocody et Yopougon.',
                    lien: 'https://exemple.ci', style: 'neon', couleurTexte: null, images: [],
                    kind: 'paid', anims: ['glissement'], animGap: 5, animLoop: true,
                  ),
                  Pub(
                    id: 'd3', titre: 'Promo spéciale week-end',
                    description: 'Jusqu’à −40 % chez les vendeurs partenaires.',
                    lien: null, style: 'impact', couleurTexte: null, images: [],
                    kind: 'admin', anims: ['zoom'], animGap: 5, animLoop: true,
                  ),
                  Pub(
                    id: 'd4', titre: 'Nouveau : livraison à Abidjan',
                    description: 'Faites-vous livrer partout dans la ville.',
                    lien: null, style: 'classique', couleurTexte: null, images: [],
                    kind: 'seo', anims: ['machine'], animGap: 5, animLoop: true,
                  ),
                  Pub(
                    id: 'd5', titre: 'Élégance à petit prix',
                    description: 'La mode ivoirienne, du pagne au prêt-à-porter.',
                    lien: null, style: 'script', couleurTexte: null, images: [],
                    kind: 'paid', anims: ['fondu-bas'], animGap: 5, animLoop: true,
                  ),
                ],
              ),
              Spacer(),
            ],
          ),
        ),
      );
    case 'accueil':
      return HomeScreen(
        apercuPubs: const [
          Pub(
            id: 'p1',
            titre: 'Grand déstockage à Adjamé',
            description:
                'Téléphones, écouteurs et accessoires à prix cassés tout le week-end.',
            lien: null,
            style: 'ivoire',
            couleurTexte: null,
            images: [],
            kind: 'paid',
            anims: ['pop'],
            animGap: 8,
            animLoop: true,
          ),
          Pub(
            id: 'p2',
            titre: 'Win Immobilier',
            description: 'Studios et 2 pièces à louer à Cocody et Yopougon.',
            lien: 'https://exemple.ci',
            style: 'neon',
            couleurTexte: null,
            images: [],
            kind: 'paid',
            anims: ['fondu'],
            animGap: 8,
            animLoop: true,
          ),
          Pub(
            id: 'p3',
            titre: 'Vendez plus vite sur Chap.ci',
            description: '',
            lien: null,
            style: 'impact',
            couleurTexte: null,
            images: [],
            kind: 'seo',
            anims: ['glissement'],
            animGap: 8,
            animLoop: true,
          ),
        ],
        apercuAnnonces: [
          Listing.fromJson(const {
            'id': 'l1', 'title': 'iPhone 12 — 64 Go, très propre', 'price': 120000,
            'categoryId': 'electronique', 'commune': 'Cocody', 'images': [],
          }),
          Listing.fromJson(const {
            'id': 'l2', 'title': 'Canapé d’angle en tissu', 'price': 150000,
            'categoryId': 'maison', 'commune': 'Marcory', 'images': [],
          }),
          Listing.fromJson(const {
            'id': 'l3', 'title': 'Robe en pagne wax (taille M)', 'price': 18000,
            'categoryId': 'mode', 'commune': 'Yopougon', 'images': [],
          }),
          Listing.fromJson(const {
            'id': 'l4', 'title': 'Toyota Yaris 2015, essence', 'price': 4200000,
            'categoryId': 'vehicules', 'commune': 'Treichville', 'images': [],
          }),
        ],
      );
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
    case 'admin':
      return TableauBordScreen(
          apercu: StatsAdmin.depuis(const {
        'users': 1284, 'listings': 3691, 'conversations': 872, 'messages': 5140,
        'orders': 218, 'reviews': 143, 'newsletter': 402, 'reportsOpen': 3,
        'ordersValue': 4875000,
        'visites': {'jour': 148, 'semaine': 936, 'parJour': 134},
        'parcours': {
          'j7': {'visiteurs': 936, 'comptes': 61, 'publie': 24, 'vendu': 7},
          'j30': {'visiteurs': 3820, 'comptes': 240, 'publie': 96, 'vendu': 33},
          'tout': {'visiteurs': 41200, 'comptes': 1284, 'publie': 540, 'vendu': 190},
        },
        'series': [
          {'date': '2026-08-01', 'users': 8, 'listings': 21},
          {'date': '2026-08-02', 'users': 12, 'listings': 30},
          {'date': '2026-08-03', 'users': 6, 'listings': 18},
          {'date': '2026-08-04', 'users': 15, 'listings': 41},
          {'date': '2026-08-05', 'users': 11, 'listings': 27},
          {'date': '2026-08-06', 'users': 9, 'listings': 33},
          {'date': '2026-08-07', 'users': 14, 'listings': 38},
          {'date': '2026-08-08', 'users': 7, 'listings': 22},
          {'date': '2026-08-09', 'users': 13, 'listings': 35},
          {'date': '2026-08-10', 'users': 10, 'listings': 29},
          {'date': '2026-08-11', 'users': 16, 'listings': 44},
          {'date': '2026-08-12', 'users': 9, 'listings': 26},
          {'date': '2026-08-13', 'users': 12, 'listings': 31},
          {'date': '2026-08-14', 'users': 18, 'listings': 47},
        ],
        'security': {
          'failedLogins': 6, 'adminsIntegrity': true, 'owner2fa': true, 'alerts': 0,
        },
      }));
    case 'newsletter':
      final t = DateTime.now().millisecondsSinceEpoch;
      return NewsletterScreen(apercu: [
        Abonne('awa.kone@gmail.com', t - 2 * 3600000),
        Abonne('boutique.229@yahoo.fr', t - 26 * 3600000),
        Abonne('k.traore@gmail.com', t - 3 * 86400000),
        Abonne('mariam.diallo@hotmail.fr', t - 8 * 86400000),
        Abonne('serge.gbagbo@gmail.com', t - 15 * 86400000),
        Abonne('fatou@chap.ci', t - 40 * 86400000),
      ]);
    case 'campagne':
      return const CampagneScreen(apercu: 128);
    case 'conversations':
      final t = DateTime.now().millisecondsSinceEpoch;
      return ConversationsScreen(apercu: [
        ConversationAdmin(
          id: 'v1',
          acheteurEmail: 'awa.kone@gmail.com',
          vendeurEmail: 'boutique.cocody@chap.ci',
          annonceTitre: 'Canapé 3 places en tissu',
          dernierMessage: 'D’accord, je passe le prendre demain vers 16 h. '
              'Vous êtes bien à la Riviera ?',
          messages: 12,
          cree: t - 90 * 60000,
        ),
        ConversationAdmin(
          id: 'v2',
          acheteurEmail: 'kader.229@yahoo.fr',
          vendeurEmail: 'tech.abidjan@chap.ci',
          annonceTitre: 'Casque audio sans fil',
          dernierMessage: 'Le prix est-il négociable ? Je propose 80 000.',
          messages: 4,
          cree: t - 8 * 3600000,
        ),
        ConversationAdmin(
          id: 'v3',
          acheteurEmail: 'mariam.d@hotmail.fr',
          vendeurEmail: 'mode.plateau@chap.ci',
          annonceTitre: null,
          dernierMessage: 'Merci beaucoup, la robe est superbe !',
          messages: 7,
          cree: t - 3 * 86400000,
        ),
      ]);
    case 'commandes':
      final t = DateTime.now().millisecondsSinceEpoch;
      return CommandesScreen(apercu: [
        Commande(
          id: 'o1',
          statut: 'finalise',
          acheteurEmail: 'awa.kone@gmail.com',
          vendeurEmail: 'boutique.cocody@chap.ci',
          cree: t - 3 * 3600000,
          total: 165000,
          articles: const [
            ArticleCommande('Canapé 3 places en tissu', 150000, null),
            ArticleCommande('Coussins décoratifs (x2)', 15000, null),
          ],
        ),
        Commande(
          id: 'o2',
          statut: 'en_cours',
          acheteurEmail: 'kader.229@yahoo.fr',
          vendeurEmail: 'tech.abidjan@chap.ci',
          cree: t - 26 * 3600000,
          total: 90000,
          articles: const [
            ArticleCommande('Casque audio sans fil', 90000, null),
          ],
        ),
        Commande(
          id: 'o3',
          statut: 'annule',
          acheteurEmail: 'mariam.d@hotmail.fr',
          vendeurEmail: 'mode.plateau@chap.ci',
          cree: t - 5 * 86400000,
          total: 25000,
          articles: const [
            ArticleCommande('Robe en pagne', 25000, null),
          ],
        ),
      ]);
    case 'avis':
      final t = DateTime.now().millisecondsSinceEpoch;
      return AvisScreen(apercu: [
        Avis(
          id: 'a1',
          note: 5,
          commentaire: 'Vendeur très sérieux, canapé conforme à l’annonce '
              'et livraison rapide. Je recommande !',
          auteurNom: 'Awa Koné',
          auteurEmail: 'awa.kone@gmail.com',
          vendeurEmail: 'boutique.cocody@chap.ci',
          annonceTitre: 'Canapé 3 places en tissu',
          cree: t - 5 * 3600000,
        ),
        Avis(
          id: 'a2',
          note: 1,
          commentaire: 'Arnaqueur ! Il a pris mon acompte et ne répond plus. '
              'À bannir absolument.',
          auteurNom: 'Kader D.',
          auteurEmail: 'kader.229@yahoo.fr',
          vendeurEmail: 'ventes.rapides@gmail.com',
          annonceTitre: 'iPhone 13 — prix cassé',
          cree: t - 30 * 3600000,
        ),
        Avis(
          id: 'a3',
          note: 4,
          commentaire: null,
          auteurNom: 'Mariam',
          auteurEmail: 'mariam.d@hotmail.fr',
          vendeurEmail: 'boutique.cocody@chap.ci',
          annonceTitre: 'Table basse en bois',
          cree: t - 4 * 86400000,
        ),
      ]);
    case 'contact':
      final t = DateTime.now().millisecondsSinceEpoch;
      return ContactScreen(apercu: [
        MessageContact(
          id: 'c1',
          sujet: 'Problème pour publier mon annonce',
          message:
              'Bonjour, je n’arrive pas à ajouter les photos de mon canapé, '
              'l’application affiche une erreur à la 3e photo. Merci d’avance.',
          nom: 'Awa Koné',
          email: 'awa.kone@gmail.com',
          reponse: null,
          reponduPar: null,
          traite: false,
          cree: t - 2 * 3600000,
          reponduLe: 0,
        ),
        MessageContact(
          id: 'c2',
          sujet: 'Signalement d’un faux profil',
          message:
              'Un vendeur me demande de payer d’avance par Wave avant la '
              'livraison, ça me paraît louche.',
          nom: 'Kader Diomandé',
          email: 'kader.229@yahoo.fr',
          reponse: null,
          reponduPar: null,
          traite: false,
          cree: t - 20 * 3600000,
          reponduLe: 0,
        ),
        MessageContact(
          id: 'c3',
          sujet: 'Merci pour ce super site !',
          message: 'Bravo à toute l’équipe, Chap.ci m’a beaucoup aidé.',
          nom: 'Mariam',
          email: 'mariam.diallo@hotmail.fr',
          reponse: 'Bonjour Mariam,\n\nMerci beaucoup, votre message fait '
              'très plaisir à toute l’équipe !',
          reponduPar: 'patron@chap.ci',
          traite: true,
          cree: t - 4 * 86400000,
          reponduLe: t - 3 * 86400000,
        ),
      ]);
    case 'moderateurs':
      final t = DateTime.now().millisecondsSinceEpoch;
      return ModerateursScreen(
        apercu: EquipeAdmin(
          const ['patron@chap.ci'],
          [
            Moderateur(
              email: 'awa.kone@chap.ci',
              cree: t - 12 * 86400000,
              permissions: const ['listings', 'reports', 'users'],
              aCode: true,
              bloque: false,
            ),
            Moderateur(
              email: 'kader.diomande@gmail.com',
              cree: t - 3 * 86400000,
              permissions: const ['campaigns', 'newsletter'],
              aCode: true,
              bloque: true,
            ),
          ],
          const [
            FonctionMod('visitors', 'Visiteurs'),
            FonctionMod('listings', 'Annonces'),
            FonctionMod('users', 'Utilisateurs'),
            FonctionMod('reports', 'Signalements'),
            FonctionMod('contact', 'Messages de contact'),
            FonctionMod('ads', 'Publicités'),
            FonctionMod('orders', 'Commandes'),
            FonctionMod('conversations', 'Conversations'),
            FonctionMod('reviews', 'Avis'),
            FonctionMod('newsletter', 'Abonnés'),
            FonctionMod('campaigns', 'Campagnes'),
          ],
        ),
      );
    case 'emails':
      return const EmailsScreen(
        apercu: ReglagesSmtp(
          hote: 'mail.chap.ci',
          port: '465',
          securite: 'ssl',
          utilisateur: 'no-reply@chap.ci',
          configure: true,
        ),
      );
    case 'sauvegardes':
      final t = DateTime.now().millisecondsSinceEpoch;
      return SauvegardesScreen(apercu: [
        Sauvegarde.depuis({'file': 'chapci-2026-08-14-030000.json', 'bytes': 1319948, 'at': t - 5 * 3600000}),
        Sauvegarde.depuis({'file': 'chapci-2026-08-13-030000.json', 'bytes': 1305210, 'at': t - 29 * 3600000}),
        Sauvegarde.depuis({'file': 'chapci-2026-08-12-030000.json', 'bytes': 1298004, 'at': t - 53 * 3600000}),
        Sauvegarde.depuis({'file': 'chapci-2026-08-11-030000.json', 'bytes': 1287771, 'at': t - 77 * 3600000}),
      ]);
    case 'annonces-admin':
      return AnnoncesAdminScreen(apercu: [
        AnnonceAdmin.depuis(const {
          'id': 'l1', 'title': 'Table à manger en teck massif', 'price': 150000,
          'categoryId': 'maison', 'commune': 'Cocody',
          'sellerEmail': 'awa.kone@gmail.com', 'images': [],
        }),
        AnnonceAdmin.depuis(const {
          'id': 'l2', 'title': 'iPhone 15 Pro Max — 90 000 FCFA', 'price': 90000,
          'categoryId': 'electronique', 'commune': 'Yopougon', 'hidden': true,
          'sellerEmail': 'promo.rapide@gmail.com', 'images': [],
        }),
        AnnonceAdmin.depuis(const {
          'id': 'l3', 'title': 'Robe wax taille 40', 'price': 25000,
          'categoryId': 'mode', 'commune': 'Marcory', 'sold': true,
          'sellerEmail': 'boutique.229@yahoo.fr', 'images': [],
        }),
      ]);
    case 'utilisateurs':
      final t = DateTime.now().millisecondsSinceEpoch;
      return UtilisateursScreen(apercu: [
        Utilisateur.depuis({
          'id': 'u1', 'email': 'awa.kone@gmail.com', 'fullName': 'Awa Koné',
          'status': 'active', 'commune': 'Cocody', 'listings': 12,
          'createdAt': t, 'derniereActivite': t - 90000, 'enLigne': true,
        }),
        Utilisateur.depuis({
          'id': 'u2', 'email': 'boutique.229@yahoo.fr', 'fullName': 'Boutique 229',
          'status': 'restricted', 'commune': 'Yopougon', 'listings': 47,
          'createdAt': t, 'derniereActivite': t - 3 * 3600000, 'enLigne': false,
        }),
        Utilisateur.depuis({
          'id': 'u3', 'email': 'promo.rapide@gmail.com', 'fullName': 'Promo Rapide',
          'status': 'blocked', 'commune': 'Abobo', 'listings': 3,
          'createdAt': t, 'derniereActivite': t - 5 * 86400000, 'enLigne': false,
        }),
        Utilisateur.depuis({
          'id': 'u4', 'email': 'k.traore@chap.ci', 'fullName': 'Kader Traoré',
          'status': 'active', 'commune': 'Marcory', 'listings': 2,
          'createdAt': t, 'derniereActivite': t - 40 * 60000, 'enLigne': false,
        }),
      ]);
    case 'moderation':
      return ModerationScreen(apercu: [
        Signalement.depuis({
          'id': 'r1', 'listingId': 'l1',
          'listingTitle': 'iPhone 15 Pro Max — 90 000 FCFA',
          'listingHidden': false, 'reason': 'Prix trop beau / arnaque',
          'details': 'Le vendeur demande un dépôt Mobile Money avant livraison.',
          'reporterEmail': 'awa****@gmail.com', 'status': 'open',
          'createdAt': DateTime.now().millisecondsSinceEpoch - 25 * 60000,
        }),
        Signalement.depuis({
          'id': 'r2', 'listingId': 'l2',
          'listingTitle': 'Parfum « Dior » — lot de 12',
          'listingHidden': false, 'reason': 'Contrefaçon',
          'reporterEmail': 'k****@yahoo.fr', 'status': 'open',
          'createdAt': DateTime.now().millisecondsSinceEpoch - 3 * 3600000,
        }),
        Signalement.depuis({
          'id': 'r3', 'listingId': 'l3',
          'listingTitle': 'Studio meublé Cocody',
          'listingHidden': false, 'reason': 'Doublon', 'status': 'closed',
          'createdAt': DateTime.now().millisecondsSinceEpoch - 2 * 86400000,
        }),
      ]);
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
