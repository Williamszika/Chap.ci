import 'api_client.dart';

/// Une conversation, telle que la renvoie `GET /conversations`.
/// Le serveur l'enrichit déjà (titre et image de l'annonce, nom de l'autre
/// personne, dernier message) — on ne recalcule rien côté app.
class Conversation {
  final String id;
  final String? listingId;
  final String? buyerId;
  final String? sellerId;
  final String? listingTitle;
  final String? listingImage;
  final String? otherName;
  final String? lastMessage;
  final int? lastAt;
  final String? lastSenderId;
  final bool archived; // archivée de MON côté
  final bool pinned; // épinglée de MON côté (remonte en haut de la liste)
  final bool blockedByMe; // j'ai bloqué l'autre
  final bool blockedMe; // l'autre m'a bloqué

  /// Une offre de l'AUTRE qui M'attend (montant), ou `null`. C'est la
  /// pastille « Offre : 45 000 FCFA » de la liste : le vendeur la voit avant
  /// d'ouvrir — « trois offres reçues » se lit ligne par ligne.
  final num? offreEnAttente;

  const Conversation({
    required this.id,
    this.listingId,
    this.buyerId,
    this.sellerId,
    this.listingTitle,
    this.listingImage,
    this.otherName,
    this.lastMessage,
    this.lastAt,
    this.lastSenderId,
    this.archived = false,
    this.pinned = false,
    this.blockedByMe = false,
    this.blockedMe = false,
    this.offreEnAttente,
  });

  factory Conversation.fromJson(Map<String, dynamic> j) => Conversation(
        id: (j['id'] ?? '').toString(),
        listingId: j['listingId']?.toString(),
        buyerId: j['buyerId']?.toString(),
        sellerId: j['sellerId']?.toString(),
        listingTitle: j['listingTitle']?.toString(),
        listingImage: j['listingImage']?.toString(),
        otherName: j['otherName']?.toString(),
        lastMessage: j['lastMessage']?.toString(),
        lastAt: (j['lastAt'] is num) ? (j['lastAt'] as num).toInt() : null,
        lastSenderId: j['lastSenderId']?.toString(),
        archived: j['archived'] == true,
        pinned: j['pinned'] == true,
        blockedByMe: j['blockedByMe'] == true,
        blockedMe: j['blockedMe'] == true,
        offreEnAttente:
            (j['offreEnAttente'] is num) ? j['offreEnAttente'] as num : null,
      );

  /// Supprime la conversation de MON côté (l'autre garde la sienne).
  static Future<void> supprimer(String id) async {
    await ApiClient.instance.delete('/conversations/$id');
  }

  /// Archive ou désarchive de MON côté.
  static Future<void> archiver(String id, bool archiver) async {
    await ApiClient.instance
        .post('/conversations/$id/archive', {'archived': archiver});
  }

  /// Épingle ou désépingle de MON côté (remonte la conversation en haut).
  static Future<void> epingler(String id, bool epingler) async {
    await ApiClient.instance
        .post('/conversations/$id/pin', {'pinned': epingler});
  }

  /// Bloque ou débloque l'autre participant ; renvoie l'état résultant.
  static Future<bool> bloquer(String id, bool bloquer) async {
    final d = await ApiClient.instance
        .post('/conversations/$id/block', {'block': bloquer});
    return (d is Map && d['blocked'] == true);
  }

  /// Signale la conversation à la modération (motifs cochés + détail libre).
  static Future<void> signaler(
      String id, List<String> motifs, String details) async {
    await ApiClient.instance
        .post('/conversations/$id/report', {'reasons': motifs, 'details': details});
  }

  /// Mes conversations.
  static Future<List<Conversation>> mes() async {
    final d = await ApiClient.instance.get('/conversations');
    if (d is! List) return const [];
    return d
        .whereType<Map<String, dynamic>>()
        .map(Conversation.fromJson)
        .toList();
  }

  /// Ouvre (ou crée) la conversation avec un vendeur à propos d'une annonce,
  /// et renvoie son id. C'est ce que fait « Contacter » sur la fiche.
  static Future<String> ouvrirAvec(String? listingId, String sellerId) async {
    final d = await ApiClient.instance.post('/conversations', {
      'listingId': listingId,
      'sellerId': sellerId,
    });
    final id = (d is Map) ? d['id']?.toString() : null;
    if (id == null || id.isEmpty) {
      throw ApiException('Impossible d’ouvrir la conversation.');
    }
    return id;
  }
}

/// « FAIRE UNE OFFRE » — la négociation structurée (nouveauté n° 4 du
/// 03/09/2026, portée du site). Une offre est un MESSAGE qui porte un montant
/// et un état ; elle vit dans le fil, avec le reste de la discussion.
///
/// Accepter n'est pas payer, et ne change pas le prix affiché de l'annonce :
/// c'est une parole donnée dans la conversation. C'est écrit sous le bouton,
/// parce qu'un acheteur qui croit avoir « acheté » en acceptant se sentirait
/// floué à la remise en main propre.
class Offre {
  final num montant;

  /// 'proposee' | 'acceptee' | 'refusee' | 'remplacee'
  final String statut;

  /// L'id de qui a fait l'offre.
  final String par;

  const Offre({required this.montant, required this.statut, required this.par});

  bool get ouverte => statut == 'proposee';

  factory Offre.fromJson(Map<String, dynamic> j) => Offre(
        montant: (j['montant'] is num) ? j['montant'] as num : 0,
        statut: (j['statut'] ?? 'proposee').toString(),
        par: (j['par'] ?? '').toString(),
      );

  /// Propose un montant dans la conversation. Ma précédente offre encore
  /// ouverte, s'il y en a une, passe « remplacée » côté serveur.
  static Future<void> proposer(String conversationId, num montant) async {
    await ApiClient.instance
        .post('/conversations/$conversationId/offre', {'montant': montant});
  }

  /// Accepte ou refuse l'offre portée par le message [messageId]. Seul le
  /// destinataire le peut ; le serveur refuse le reste (403, 409).
  static Future<void> repondre(
      String conversationId, String messageId, String action) async {
    await ApiClient.instance.post(
        '/conversations/$conversationId/offre/$messageId', {'action': action});
  }
}

/// « ⚡ RÉPONSES TOUTES PRÊTES » — les phrases qu'on retape vingt fois par jour
/// (« Oui, c'est disponible. », « Je livre à… »), enregistrées une bonne fois.
/// Elles se posent d'un appui dans la conversation. Douze au maximum : au-delà,
/// on ne les retrouve plus. Portées du site le 04/09/2026 (chantier 2 :
/// l'application à égalité).
class ReponsePrete {
  final String id;
  final String texte;
  final int createdAt;
  const ReponsePrete({required this.id, required this.texte, required this.createdAt});

  factory ReponsePrete.fromJson(Map<String, dynamic> j) => ReponsePrete(
        id: (j['id'] ?? '').toString(),
        texte: (j['texte'] ?? '').toString(),
        createdAt: (j['createdAt'] is num) ? (j['createdAt'] as num).toInt() : 0,
      );

  /// Les phrases proposées tant que le vendeur n'en a enregistré aucune.
  static const List<String> modeles = [
    'Oui, c’est disponible.',
    'Je livre à…',
    'Mon dernier prix est…',
  ];

  static const int maximum = 12;

  static Future<List<ReponsePrete>> mes() async {
    final d = await ApiClient.instance.get('/reponses');
    if (d is! List) return const [];
    return d.whereType<Map<String, dynamic>>().map(ReponsePrete.fromJson).toList();
  }

  static Future<ReponsePrete> ajouter(String texte) async {
    final d = await ApiClient.instance.post('/reponses', {'texte': texte.trim()});
    if (d is Map<String, dynamic>) return ReponsePrete.fromJson(d);
    throw ApiException('La phrase n’a pas été enregistrée.');
  }

  static Future<void> supprimer(String id) async {
    await ApiClient.instance.delete('/reponses/$id');
  }
}

/// « 🤖 RÉPONSE AUTOMATIQUE » — la phrase qui part toute seule quand un acheteur
/// écrit pour la première fois. Réservée aux comptes professionnels approuvés
/// (le serveur le vérifie). Elle achète du temps, elle ne remplace personne :
/// elle ne compte pas dans le taux de réponse, et la conversation reste dans
/// « Sans réponse » tant que le vendeur n'a pas écrit lui-même.
class ReponseAuto {
  final String texte;
  final bool active;
  const ReponseAuto({required this.texte, required this.active});

  factory ReponseAuto.fromJson(Map<String, dynamic> j) => ReponseAuto(
        texte: (j['texte'] ?? '').toString(),
        active: j['active'] == true,
      );

  /// Trois phrases d'accueil proposées, pour ne pas partir d'une page blanche.
  static const List<String> modeles = [
    'Bonjour et merci pour votre message. Je vous réponds dans la journée.',
    'Bonjour ! Nous sommes ouverts du lundi au samedi. Je reviens vers vous très vite.',
    'Merci de votre intérêt. Dites-moi la quantité et votre commune, je vous fais un prix.',
  ];

  static Future<ReponseAuto> lire() async {
    final d = await ApiClient.instance.get('/pro/reponse-auto');
    if (d is Map<String, dynamic>) return ReponseAuto.fromJson(d);
    return const ReponseAuto(texte: '', active: false);
  }

  static Future<ReponseAuto> enregistrer(String texte, bool active) async {
    final d = await ApiClient.instance
        .post('/pro/reponse-auto', {'texte': texte.trim(), 'active': active});
    if (d is Map<String, dynamic>) return ReponseAuto.fromJson(d);
    throw ApiException('La phrase n’a pas été enregistrée.');
  }
}

/// Un message dans une conversation.
class Msg {
  final String id;
  final String conversationId;
  final String senderId;
  final String body;
  final int createdAt;
  final bool deleted; // supprimé pour tout le monde

  /// Non nul quand le message EST une offre (montant + état).
  final Offre? offre;

  const Msg({
    required this.id,
    required this.conversationId,
    required this.senderId,
    required this.body,
    required this.createdAt,
    this.deleted = false,
    this.offre,
  });

  factory Msg.fromJson(Map<String, dynamic> j) => Msg(
        id: (j['id'] ?? '').toString(),
        conversationId: (j['conversationId'] ?? '').toString(),
        senderId: (j['senderId'] ?? '').toString(),
        body: (j['body'] ?? '').toString(),
        createdAt:
            (j['createdAt'] is num) ? (j['createdAt'] as num).toInt() : 0,
        deleted: j['deleted'] == true,
        offre: (j['offre'] is Map)
            ? Offre.fromJson(Map<String, dynamic>.from(j['offre'] as Map))
            : null,
      );

  /// Supprime un de MES messages (pour tout le monde).
  static Future<void> supprimer(String conversationId, String messageId) async {
    await ApiClient.instance
        .delete('/conversations/$conversationId/messages/$messageId');
  }

  static Future<List<Msg>> pour(String conversationId) async {
    final d = await ApiClient.instance
        .get('/conversations/$conversationId/messages');
    if (d is! List) return const [];
    return d.whereType<Map<String, dynamic>>().map(Msg.fromJson).toList();
  }

  static Future<void> envoyer(String conversationId, String corps) async {
    await ApiClient.instance
        .post('/conversations/$conversationId/messages', {'body': corps});
  }
}
