import 'api_client.dart';

/// Une publicité de l'écran d'accueil (`GET /ads/active`).
///
/// Trois origines, même rendu : `paid` (un annonceur a payé), `admin` (une
/// diffusion Chap.ci) et `seo` (le Bureau de Croissance, une par jour). Le texte
/// s'affiche dans un [style] et s'anime selon [anims] (une ou plusieurs
/// animations enchaînées, avec une pause [animGap] entre chacune).
class Pub {
  final String id, titre, description;
  final String? lien, style, couleurTexte;
  final List<String> images;
  final String kind;
  final List<String> anims;

  /// Pause (secondes) entre deux animations.
  final int animGap;

  /// Rejouer les animations en boucle pendant l'affichage.
  final bool animLoop;

  const Pub({
    required this.id,
    required this.titre,
    required this.description,
    required this.lien,
    required this.style,
    required this.couleurTexte,
    required this.images,
    required this.kind,
    required this.anims,
    required this.animGap,
    required this.animLoop,
  });

  /// A-t-elle un texte à afficher (sinon : image seule, plein cadre) ?
  bool get aTexte => titre.trim().isNotEmpty || description.trim().isNotEmpty;

  /// La première image, s'il y en a une.
  String? get image => images.isNotEmpty ? images.first : null;

  factory Pub.depuis(Map m) {
    final imgs = (m['images'] is List)
        ? (m['images'] as List).map((e) => '$e').where((s) => s.isNotEmpty).toList()
        : <String>[];
    final anims = (m['anims'] is List && (m['anims'] as List).isNotEmpty)
        ? (m['anims'] as List).map((e) => '$e').toList()
        : (m['anim'] != null && '${m['anim']}'.isNotEmpty ? ['${m['anim']}'] : <String>['fondu']);
    return Pub(
      id: (m['id'] ?? '').toString(),
      titre: (m['title'] ?? '').toString(),
      description: (m['description'] ?? '').toString(),
      lien: (m['link'] is String && (m['link'] as String).isNotEmpty) ? m['link'] as String : null,
      style: m['style'] as String?,
      couleurTexte: (m['textColor'] is String && (m['textColor'] as String).isNotEmpty)
          ? m['textColor'] as String
          : null,
      images: imgs,
      kind: (m['kind'] ?? 'paid').toString(),
      anims: anims,
      animGap: (m['animGap'] is num) ? (m['animGap'] as num).toInt().clamp(5, 60) : 8,
      animLoop: m['animLoop'] != false,
    );
  }
}

/// L'écran publicitaire : lecture des pubs actives + comptage vues / clics.
class PubApi {
  /// Les publicités actives (ordre du serveur ; l'écran les mélange).
  static Future<List<Pub>> actives() async {
    final d = await ApiClient.instance.get('/ads/active');
    if (d is List) {
      return d.whereType<Map>().map(Pub.depuis).toList();
    }
    return const [];
  }

  /// Compte une vue (`view`) ou un clic (`click`). Sans attente ni erreur
  /// remontée : une statistique perdue ne doit jamais gêner l'affichage.
  static void tracker(String id, String type) {
    if (id.isEmpty) return;
    () async {
      try {
        await ApiClient.instance.post('/ads/$id/$type', const {});
      } catch (_) {/* une vue perdue ne casse rien */}
    }();
  }
}
