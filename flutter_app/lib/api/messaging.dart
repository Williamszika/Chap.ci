import 'api_client.dart';

/// Une conversation, telle que la renvoie `GET /conversations`.
/// Le serveur l'enrichit déjà (titre et image de l'annonce, nom de l'autre
/// personne, dernier message) — on ne recalcule rien côté app.
class Conversation {
  final String id;
  final String? listingId;
  final String? listingTitle;
  final String? listingImage;
  final String? otherName;
  final String? lastMessage;
  final int? lastAt;
  final String? lastSenderId;

  const Conversation({
    required this.id,
    this.listingId,
    this.listingTitle,
    this.listingImage,
    this.otherName,
    this.lastMessage,
    this.lastAt,
    this.lastSenderId,
  });

  factory Conversation.fromJson(Map<String, dynamic> j) => Conversation(
        id: (j['id'] ?? '').toString(),
        listingId: j['listingId']?.toString(),
        listingTitle: j['listingTitle']?.toString(),
        listingImage: j['listingImage']?.toString(),
        otherName: j['otherName']?.toString(),
        lastMessage: j['lastMessage']?.toString(),
        lastAt: (j['lastAt'] is num) ? (j['lastAt'] as num).toInt() : null,
        lastSenderId: j['lastSenderId']?.toString(),
      );

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

  const Msg({
    required this.id,
    required this.conversationId,
    required this.senderId,
    required this.body,
    required this.createdAt,
  });

  factory Msg.fromJson(Map<String, dynamic> j) => Msg(
        id: (j['id'] ?? '').toString(),
        conversationId: (j['conversationId'] ?? '').toString(),
        senderId: (j['senderId'] ?? '').toString(),
        body: (j['body'] ?? '').toString(),
        createdAt:
            (j['createdAt'] is num) ? (j['createdAt'] as num).toInt() : 0,
      );

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
