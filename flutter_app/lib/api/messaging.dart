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

/// Un message dans une conversation.
class Msg {
  final String id;
  final String conversationId;
  final String senderId;
  final String body;
  final int createdAt;
  final bool deleted; // supprimé pour tout le monde

  const Msg({
    required this.id,
    required this.conversationId,
    required this.senderId,
    required this.body,
    required this.createdAt,
    this.deleted = false,
  });

  factory Msg.fromJson(Map<String, dynamic> j) => Msg(
        id: (j['id'] ?? '').toString(),
        conversationId: (j['conversationId'] ?? '').toString(),
        senderId: (j['senderId'] ?? '').toString(),
        body: (j['body'] ?? '').toString(),
        createdAt:
            (j['createdAt'] is num) ? (j['createdAt'] as num).toInt() : 0,
        deleted: j['deleted'] == true,
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
