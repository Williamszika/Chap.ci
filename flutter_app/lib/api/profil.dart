import 'api_client.dart';

/// Le profil public d'un vendeur (`GET /profile/{id}`) — mêmes champs que le
/// site : nom, bio, avatar, badge de vérification.
class ProfilPublic {
  final String id;
  final String nom;
  final String? bio;
  final String? avatarUrl;
  final bool verified;

  /// Nom commercial et type d'organisation — seulement si le compte est un
  /// professionnel approuvé (sinon null).
  final String? proNom;
  final String? proType;

  /// LA VITRINE. Tout ceci partait déjà du serveur à chaque chargement ; l'app,
  /// comme le site avant le 28/08, n'en lisait que le nom et le type.
  final String? proSecteur;
  final String? proBanniere;
  final String? proLogo;
  final String? proDescription;

  /// Les sept jours d'ouverture, DU LUNDI AU DIMANCHE (index 0 = lundi).
  final List<HoraireJour>? proHoraires;

  /// Le registre a été contrôlé par l'équipe. Le NUMÉRO ne sort pas du serveur
  /// (décision du Patron du 28/08) : on dit « vérifié », on ne publie pas
  /// l'immatriculation.
  final bool proRegistreVerifie;

  /// Ventes conclues — celles que l'acheteur a confirmées reçues.
  final int proVentes;

  /// Date d'approbation du dossier, en millisecondes.
  final int? proDepuis;

  const ProfilPublic({
    required this.id,
    required this.nom,
    this.bio,
    this.avatarUrl,
    this.verified = false,
    this.proNom,
    this.proType,
    this.proSecteur,
    this.proBanniere,
    this.proLogo,
    this.proDescription,
    this.proHoraires,
    this.proRegistreVerifie = false,
    this.proVentes = 0,
    this.proDepuis,
  });

  /// Vrai quand le compte a une vitrine à montrer.
  bool get estPro => proNom != null;

  factory ProfilPublic.fromJson(Map<String, dynamic> j) => ProfilPublic(
        id: (j['id'] ?? '').toString(),
        nom: (j['fullName'] ?? 'Vendeur').toString(),
        bio: (j['bio']?.toString().trim().isEmpty ?? true)
            ? null
            : j['bio'].toString(),
        avatarUrl: j['avatarUrl']?.toString(),
        verified: j['verified'] == true,
        proNom: (j['pro'] is Map) ? j['pro']['nom'] as String? : null,
        proType: (j['pro'] is Map) ? j['pro']['type'] as String? : null,
        proSecteur: (j['pro'] is Map) ? j['pro']['secteur'] as String? : null,
        proBanniere: (j['pro'] is Map) ? j['pro']['banniere'] as String? : null,
        proLogo: (j['pro'] is Map) ? j['pro']['logo'] as String? : null,
        proDescription:
            (j['pro'] is Map) ? j['pro']['description'] as String? : null,
        proHoraires: (j['pro'] is Map && j['pro']['horaires'] is List)
            ? (j['pro']['horaires'] as List)
                .whereType<Map>()
                .map(HoraireJour.fromJson)
                .toList()
            : null,
        proRegistreVerifie:
            (j['pro'] is Map) && j['pro']['registreVerifie'] == true,
        proVentes: (j['pro'] is Map && j['pro']['ventes'] is num)
            ? (j['pro']['ventes'] as num).toInt()
            : 0,
        proDepuis: (j['pro'] is Map && j['pro']['depuis'] is num)
            ? (j['pro']['depuis'] as num).toInt()
            : null,
      );
}

/// Un jour d'ouverture de la boutique.
class HoraireJour {
  final bool ouvert;
  final String de;
  final String a;
  const HoraireJour({required this.ouvert, required this.de, required this.a});

  factory HoraireJour.fromJson(Map j) => HoraireJour(
        ouvert: j['ouvert'] == true,
        de: (j['de'] ?? '').toString(),
        a: (j['a'] ?? '').toString(),
      );
}

/// Un avis reçu par une personne (`GET /reviews?target_id={id}`).
class Avis {
  final String id;
  final int note; // 1..5
  final String? commentaire;
  final String auteur;
  final int createdAt; // ms

  const Avis({
    required this.id,
    required this.note,
    required this.auteur,
    required this.createdAt,
    this.commentaire,
  });

  factory Avis.fromJson(Map<String, dynamic> j) => Avis(
        id: (j['id'] ?? '').toString(),
        note: (j['rating'] is num) ? (j['rating'] as num).toInt() : 0,
        commentaire: (j['comment']?.toString().trim().isEmpty ?? true)
            ? null
            : j['comment'].toString(),
        auteur: (j['reviewerName'] ?? 'Utilisateur').toString(),
        createdAt:
            (j['createdAt'] is num) ? (j['createdAt'] as num).toInt() : 0,
      );
}

class ProfilApi {
  ProfilApi._();

  /// Le profil public, ou null s'il n'existe pas.
  static Future<ProfilPublic?> profil(String id) async {
    final d = await ApiClient.instance.get('/profile/$id');
    if (d is Map<String, dynamic>) return ProfilPublic.fromJson(d);
    return null;
  }

  /// Le délai de réponse habituel du vendeur, en secondes — `null` s'il n'a
  /// jamais été contacté. C'est le premier des quatre chiffres de la vitrine :
  /// l'acheteur se demande d'abord si quelqu'un va lui répondre.
  static Future<int?> delaiReponse(String sellerId) async {
    try {
      final d = await ApiClient.instance
          .get('/seller/response-time?seller_id=$sellerId');
      if (d is Map && d['medianSeconds'] is num) {
        return (d['medianSeconds'] as num).toInt();
      }
    } catch (_) {/* un chiffre manquant ne casse pas la page */}
    return null;
  }

  /// Tous les avis REÇUS par cette personne (comme vendeur et comme acheteur),
  /// les plus récents d'abord.
  static Future<List<Avis>> avis(String cibleId) async {
    final d = await ApiClient.instance.get('/reviews?target_id=$cibleId');
    if (d is! List) return const [];
    return d.whereType<Map<String, dynamic>>().map(Avis.fromJson).toList();
  }
}
