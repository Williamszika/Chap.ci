import 'api_client.dart';

// =============================================================================
//  LES OFFRES D'EMPLOI DES STRUCTURES (06/09/2026)
//
//  Une entreprise, une ONG, un centre de formation — tout compte professionnel
//  APPROUVÉ — publie des offres sur sa page. Chaque offre se postule par le
//  lien de la structure (Google Forms, WhatsApp, son site), par le formulaire
//  qu'elle a dessiné (douze questions au plus, six types), ou les deux. Mêmes
//  routes que le site : /offres, /offres/{id}, /offres/{id}/candidater,
//  /offres/{id}/candidatures, /offres/mine.
// =============================================================================

String? _texte(dynamic v) {
  if (v == null) return null;
  final s = v.toString().trim();
  return s.isEmpty ? null : s;
}

/// Une question du formulaire de candidature.
class ChampFormulaire {
  final String id;
  final String label;

  /// texte | long | email | tel | choix | ouinon
  final String type;
  final bool requis;

  /// Pour un « choix » : au moins deux options.
  final List<String> options;

  const ChampFormulaire({
    required this.id,
    required this.label,
    this.type = 'texte',
    this.requis = false,
    this.options = const [],
  });

  factory ChampFormulaire.fromJson(Map j) => ChampFormulaire(
        id: (j['id'] ?? '').toString(),
        label: (j['label'] ?? '').toString(),
        type: (j['type'] ?? 'texte').toString(),
        requis: j['requis'] == true,
        options: (j['options'] is List)
            ? (j['options'] as List).map((e) => e.toString()).toList()
            : const [],
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'label': label,
        'type': type,
        'requis': requis,
        if (type == 'choix') 'options': options,
      };

  static List<ChampFormulaire> liste(dynamic brut) => (brut is List)
      ? brut.whereType<Map>().map(ChampFormulaire.fromJson).toList()
      : const [];
}

/// Une offre d'emploi telle que le serveur la rend (`offre_out`).
class OffreEmploi {
  final String id;
  final String userId;

  /// L'enseigne, son logo, son type (commerce, association…).
  final String entreprise;
  final String? logo;
  final String? typeStructure;

  final String titre;
  final String description;
  final String? contrat;
  final String? lieu;
  final String? salaire;

  /// Le formulaire EXTERNE, s'il y en a un.
  final String? lien;

  /// Le formulaire MAISON — vide si l'offre se postule par son lien.
  final List<ChampFormulaire> formulaire;

  /// ouverte | fermee
  final String statut;

  /// Le nombre de candidatures — pour l'auteur seulement, sinon null.
  final int? candidatures;
  final int createdAt;
  final int? expiresAt;

  /// Pour un visiteur connecté : a-t-il déjà postulé ?
  final bool dejaCandidate;

  /// À la publication : combien d'abonnés ont été prévenus.
  final int abonnesPrevenus;

  const OffreEmploi({
    required this.id,
    required this.userId,
    required this.entreprise,
    required this.titre,
    required this.description,
    this.logo,
    this.typeStructure,
    this.contrat,
    this.lieu,
    this.salaire,
    this.lien,
    this.formulaire = const [],
    this.statut = 'ouverte',
    this.candidatures,
    this.createdAt = 0,
    this.expiresAt,
    this.dejaCandidate = false,
    this.abonnesPrevenus = 0,
  });

  /// Ouverte par la structure, et pas au bout de ses soixante jours.
  bool get ouverte =>
      statut == 'ouverte' &&
      (expiresAt == null ||
          expiresAt! > DateTime.now().millisecondsSinceEpoch);

  factory OffreEmploi.fromJson(Map j) => OffreEmploi(
        id: (j['id'] ?? '').toString(),
        userId: (j['userId'] ?? '').toString(),
        entreprise: (j['entreprise'] ?? '').toString(),
        logo: _texte(j['logo']),
        typeStructure: _texte(j['typeStructure']),
        titre: (j['titre'] ?? '').toString(),
        description: (j['description'] ?? '').toString(),
        contrat: _texte(j['contrat']),
        lieu: _texte(j['lieu']),
        salaire: _texte(j['salaire']),
        lien: _texte(j['lien']),
        formulaire: ChampFormulaire.liste(j['formulaire']),
        statut: (j['statut'] ?? 'ouverte').toString(),
        candidatures:
            (j['candidatures'] is num) ? (j['candidatures'] as num).toInt() : null,
        createdAt: (j['createdAt'] is num) ? (j['createdAt'] as num).toInt() : 0,
        expiresAt: (j['expiresAt'] is num) ? (j['expiresAt'] as num).toInt() : null,
        dejaCandidate: j['dejaCandidate'] == true,
        abonnesPrevenus: (j['abonnesPrevenus'] is num)
            ? (j['abonnesPrevenus'] as num).toInt()
            : 0,
      );

  static List<OffreEmploi> liste(dynamic brut) => (brut is List)
      ? brut.whereType<Map>().map(OffreEmploi.fromJson).toList()
      : const [];
}

/// Une candidature reçue — pour l'auteur de l'offre.
class Candidature {
  final String id;
  final String nom;
  final String email;
  final String? tel;

  /// id de la question → réponse.
  final Map<String, String> reponses;
  final int createdAt;

  const Candidature({
    required this.id,
    required this.nom,
    required this.email,
    this.tel,
    this.reponses = const {},
    this.createdAt = 0,
  });

  factory Candidature.fromJson(Map j) => Candidature(
        id: (j['id'] ?? '').toString(),
        nom: (j['nom'] ?? '').toString(),
        email: (j['email'] ?? '').toString(),
        tel: _texte(j['tel']),
        reponses: (j['reponses'] is Map)
            ? {
                for (final e in (j['reponses'] as Map).entries)
                  e.key.toString(): (e.value ?? '').toString(),
              }
            : const {},
        createdAt: (j['createdAt'] is num) ? (j['createdAt'] as num).toInt() : 0,
      );
}

class OffresApi {
  OffresApi._();

  /// Les offres ouvertes d'une structure.
  static Future<List<OffreEmploi>> deStructure(String userId) async =>
      OffreEmploi.liste(await ApiClient.instance.get('/offres?user_id=$userId'));

  /// Mes offres, ouvertes ou fermées, avec le nombre de candidatures.
  static Future<List<OffreEmploi>> miennes() async =>
      OffreEmploi.liste(await ApiClient.instance.get('/offres/mine'));

  static Future<OffreEmploi> une(String id) async {
    final d = await ApiClient.instance.get('/offres/$id');
    if (d is Map) return OffreEmploi.fromJson(d);
    throw ApiException('OffreEmploi introuvable.', 404);
  }

  static Future<OffreEmploi> creer(Map<String, dynamic> corps) async {
    final d = await ApiClient.instance.post('/offres', corps);
    if (d is Map) return OffreEmploi.fromJson(d);
    throw ApiException('Réponse inattendue du serveur.');
  }

  static Future<OffreEmploi> modifier(String id, Map<String, dynamic> corps) async {
    final d = await ApiClient.instance.put('/offres/$id', corps);
    if (d is Map) return OffreEmploi.fromJson(d);
    throw ApiException('Réponse inattendue du serveur.');
  }

  static Future<void> supprimer(String id) async {
    await ApiClient.instance.delete('/offres/$id');
  }

  /// Postuler : les réponses, question par question (id → réponse).
  static Future<void> candidater(String id,
      {required Map<String, String> reponses, String? nom, String? tel}) async {
    await ApiClient.instance.post('/offres/$id/candidater', {
      'reponses': reponses,
      if (nom != null && nom.isNotEmpty) 'nom': nom,
      if (tel != null && tel.isNotEmpty) 'tel': tel,
    });
  }

  /// Les candidatures reçues, avec le formulaire pour retrouver les libellés.
  static Future<({List<ChampFormulaire> formulaire, List<Candidature> candidatures})>
      candidatures(String id) async {
    final d = await ApiClient.instance.get('/offres/$id/candidatures');
    if (d is! Map) return (formulaire: <ChampFormulaire>[], candidatures: <Candidature>[]);
    return (
      formulaire: ChampFormulaire.liste(d['formulaire']),
      candidatures: (d['candidatures'] is List)
          ? (d['candidatures'] as List)
              .whereType<Map>()
              .map(Candidature.fromJson)
              .toList()
          : <Candidature>[],
    );
  }
}
