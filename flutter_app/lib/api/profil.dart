import 'api_client.dart';

/// Le profil public d'un vendeur (`GET /profile/{id}`) — mêmes champs que le
/// site : nom, bio, avatar, badge de vérification.
class ProfilPublic {
  final String id;
  final String nom;
  final String? bio;
  final String? avatarUrl;
  final bool verified;

  const ProfilPublic({
    required this.id,
    required this.nom,
    this.bio,
    this.avatarUrl,
    this.verified = false,
  });

  factory ProfilPublic.fromJson(Map<String, dynamic> j) => ProfilPublic(
        id: (j['id'] ?? '').toString(),
        nom: (j['fullName'] ?? 'Vendeur').toString(),
        bio: (j['bio']?.toString().trim().isEmpty ?? true)
            ? null
            : j['bio'].toString(),
        avatarUrl: j['avatarUrl']?.toString(),
        verified: j['verified'] == true,
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

  /// Tous les avis REÇUS par cette personne (comme vendeur et comme acheteur),
  /// les plus récents d'abord.
  static Future<List<Avis>> avis(String cibleId) async {
    final d = await ApiClient.instance.get('/reviews?target_id=$cibleId');
    if (d is! List) return const [];
    return d.whereType<Map<String, dynamic>>().map(Avis.fromJson).toList();
  }
}
