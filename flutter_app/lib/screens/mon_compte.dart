import 'package:flutter/material.dart';
import '../api/api_client.dart';
import '../api/models.dart';
import '../format.dart';
import '../theme.dart';
import 'listing_detail_screen.dart';

/// Le contenu de l'onglet Compte quand on est connecté : l'identité, et
/// « Mes annonces » avec leur état (en ligne / masquée / vendue), leurs vues,
/// et les actions vendeur (voir, masquer/afficher, supprimer).
class MonCompteView extends StatefulWidget {
  const MonCompteView({super.key});
  @override
  State<MonCompteView> createState() => _MonCompteViewState();
}

class _MonCompteViewState extends State<MonCompteView> {
  late Future<Map<String, dynamic>?> _moi;
  late Future<List<Listing>> _annonces;

  @override
  void initState() {
    super.initState();
    _moi = ApiClient.instance.moi();
    _annonces = Listing.miennes();
  }

  Future<void> _recharger() async {
    setState(() {
      _moi = ApiClient.instance.moi();
      _annonces = Listing.miennes();
    });
    await _annonces;
  }

  /// Exécute une action vendeur, montre l'erreur éventuelle, puis recharge.
  Future<void> _action(Future<void> Function() op) async {
    try {
      await op();
      await _recharger();
    } on ApiException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(e.message)));
      }
    }
  }

  Future<void> _supprimer(Listing a) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: ChapColors.cream,
        title: const Text('Supprimer l’annonce ?'),
        content: Text('« ${a.title} » sera retirée définitivement.'),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text('Annuler')),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Supprimer',
                style: TextStyle(color: Color(0xFFB42318))),
          ),
        ],
      ),
    );
    if (ok == true) {
      await _action(() => ApiClient.instance.delete('/listings/${a.id}'));
    }
  }

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      color: ChapColors.orange,
      onRefresh: _recharger,
      child: ListView(
        padding: const EdgeInsets.only(bottom: 24),
        children: [
          _entete(),
          const Padding(
            padding: EdgeInsets.fromLTRB(16, 18, 16, 6),
            child: Text('Mes annonces',
                style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: ChapColors.gray900)),
          ),
          FutureBuilder<List<Listing>>(
            future: _annonces,
            builder: (context, snap) {
              if (snap.connectionState == ConnectionState.waiting) {
                return const Padding(
                  padding: EdgeInsets.symmetric(vertical: 40),
                  child: Center(
                      child:
                          CircularProgressIndicator(color: ChapColors.orange)),
                );
              }
              if (snap.hasError) {
                return _vide('Impossible de charger vos annonces.',
                    'Tirez vers le bas pour réessayer.');
              }
              final annonces = snap.data ?? const <Listing>[];
              if (annonces.isEmpty) {
                return _vide(
                  'Vous n’avez pas encore d’annonce.',
                  'La publication depuis l’application arrive bientôt. En attendant, vous pouvez publier sur chap.ci.',
                );
              }
              return Column(
                children: [for (final a in annonces) _ligne(a)],
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _entete() {
    return FutureBuilder<Map<String, dynamic>?>(
      future: _moi,
      builder: (context, snap) {
        final u = snap.data;
        final nom = (u?['user_metadata']?['full_name'] as String?)?.trim();
        final email = u?['email'] as String? ?? '';
        final verifie = u?['emailVerified'] == true;
        return Container(
          margin: const EdgeInsets.fromLTRB(16, 16, 16, 0),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: ChapColors.cream,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: ChapColors.line),
          ),
          child: Column(
            children: [
              Row(
                children: [
                  const CircleAvatar(
                    radius: 26,
                    backgroundColor: ChapColors.cream100,
                    child: Icon(Icons.person,
                        color: ChapColors.orange, size: 28),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          (nom != null && nom.isNotEmpty) ? nom : 'Mon compte',
                          style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: ChapColors.gray900),
                        ),
                        if (email.isNotEmpty)
                          Text(email,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                  fontSize: 12.5, color: ChapColors.gray600)),
                      ],
                    ),
                  ),
                ],
              ),
              if (u != null && !verifie) ...[
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFFF4E0),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: const Color(0xFFF3D9A6)),
                  ),
                  child: const Row(
                    children: [
                      Icon(Icons.mark_email_unread_outlined,
                          size: 18, color: ChapColors.ocreDark),
                      SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          'Confirmez votre e-mail pour pouvoir publier une annonce.',
                          style: TextStyle(
                              fontSize: 12.5, color: ChapColors.ocreDark),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ],
          ),
        );
      },
    );
  }

  Widget _ligne(Listing a) {
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 0, 16, 10),
      decoration: BoxDecoration(
        color: ChapColors.cream,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: ChapColors.line),
      ),
      child: Padding(
        padding: const EdgeInsets.all(10),
        child: Row(
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(10),
              child: SizedBox(
                width: 58,
                height: 58,
                child: _vignette(a),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(a.title,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: ChapColors.gray900)),
                  const SizedBox(height: 2),
                  Text(formatFCFA(a.prixAffiche),
                      style: const TextStyle(
                          fontSize: 13.5,
                          fontWeight: FontWeight.w800,
                          color: ChapColors.orangeDark)),
                  const SizedBox(height: 5),
                  Row(
                    children: [
                      _statut(a),
                      const SizedBox(width: 8),
                      const Icon(Icons.visibility_outlined,
                          size: 13, color: ChapColors.gray500),
                      const SizedBox(width: 3),
                      Text('${a.views}',
                          style: const TextStyle(
                              fontSize: 11.5, color: ChapColors.gray600)),
                    ],
                  ),
                ],
              ),
            ),
            _menu(a),
          ],
        ),
      ),
    );
  }

  Widget _vignette(Listing a) {
    if (a.images.isEmpty) {
      return Container(
        color: ChapColors.cream100,
        child: const Icon(Icons.image_outlined, color: ChapColors.line2),
      );
    }
    final src = ImageSource.resoudre(a.images.first);
    if (src.bytes != null) return Image.memory(src.bytes!, fit: BoxFit.cover);
    if (src.url != null) {
      return Image.network(src.url!,
          fit: BoxFit.cover,
          errorBuilder: (c, e, s) => Container(color: ChapColors.cream100));
    }
    return Container(color: ChapColors.cream100);
  }

  Widget _statut(Listing a) {
    late String texte;
    late Color fond;
    late Color txt;
    if (a.sold) {
      texte = 'Vendue';
      fond = const Color(0xFFE7EDF5);
      txt = const Color(0xFF3B5A80);
    } else if (a.hidden) {
      texte = 'Masquée';
      fond = const Color(0xFFFFF4E0);
      txt = ChapColors.ocreDark;
    } else {
      texte = 'En ligne';
      fond = const Color(0xFFE6F6EE);
      txt = ChapColors.greenDark;
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration:
          BoxDecoration(color: fond, borderRadius: BorderRadius.circular(20)),
      child: Text(texte,
          style: TextStyle(
              fontSize: 11, fontWeight: FontWeight.w700, color: txt)),
    );
  }

  Widget _menu(Listing a) {
    return PopupMenuButton<String>(
      icon: const Icon(Icons.more_vert, color: ChapColors.gray600),
      onSelected: (v) {
        switch (v) {
          case 'voir':
            Navigator.of(context).push(MaterialPageRoute(
                builder: (_) => ListingDetailScreen(annonce: a)));
            break;
          case 'masquer':
            _action(() => ApiClient.instance
                .post('/listings/${a.id}/visibility', {'hidden': true}));
            break;
          case 'afficher':
            _action(() => ApiClient.instance
                .post('/listings/${a.id}/visibility', {'hidden': false}));
            break;
          case 'supprimer':
            _supprimer(a);
            break;
        }
      },
      itemBuilder: (context) => [
        const PopupMenuItem(value: 'voir', child: Text('Voir l’annonce')),
        if (a.hidden)
          const PopupMenuItem(value: 'afficher', child: Text('Remettre en ligne'))
        else
          const PopupMenuItem(value: 'masquer', child: Text('Masquer')),
        const PopupMenuItem(
          value: 'supprimer',
          child: Text('Supprimer', style: TextStyle(color: Color(0xFFB42318))),
        ),
      ],
    );
  }

  Widget _vide(String titre, String detail) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(28, 24, 28, 24),
      child: Column(
        children: [
          const Icon(Icons.inventory_2_outlined,
              size: 44, color: ChapColors.line2),
          const SizedBox(height: 12),
          Text(titre,
              textAlign: TextAlign.center,
              style: const TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.bold,
                  color: ChapColors.gray900)),
          const SizedBox(height: 6),
          Text(detail,
              textAlign: TextAlign.center,
              style: const TextStyle(color: ChapColors.gray600, fontSize: 13)),
        ],
      ),
    );
  }
}
