import 'package:flutter/material.dart';
import '../api/admin.dart';
import '../api/api_client.dart';
import '../api/models.dart';
import '../format.dart';
import '../liens_site.dart';
import '../theme.dart';
import 'admin/tableau_bord_screen.dart';
import 'listing_detail_screen.dart';
import 'modifier_profil_screen.dart';
import 'securite_2fa_screen.dart';
import 'supprimer_compte_screen.dart';
import 'verifier_email_screen.dart';

/// Le contenu de l'onglet Compte quand on est connecté : l'identité, et
/// « Mes annonces » avec leur état (en ligne / masquée / vendue), leurs vues,
/// et les actions vendeur (voir, masquer/afficher, supprimer).
class MonCompteView extends StatefulWidget {
  const MonCompteView({super.key});
  @override
  State<MonCompteView> createState() => _MonCompteViewState();
}

class _MonCompteViewState extends State<MonCompteView> {
  late Future<Map<String, dynamic>> _infos;
  late Future<List<Listing>> _annonces;
  bool _estAdmin = false; // l'entrée du tableau de bord n'apparaît que pour eux

  @override
  void initState() {
    super.initState();
    _infos = _chargerInfos();
    _annonces = Listing.miennes();
    _verifierAdmin();
  }

  Future<void> _verifierAdmin() async {
    if (!ApiClient.instance.connecte) return;
    final acces = await AdminApi.verifier();
    if (mounted && acces.admin) setState(() => _estAdmin = true);
  }

  Future<void> _recharger() async {
    setState(() {
      _infos = _chargerInfos();
      _annonces = Listing.miennes();
    });
    await _annonces;
  }

  /// Identité (nom, e-mail, e-mail confirmé) + photo de profil, en une fois.
  Future<Map<String, dynamic>> _chargerInfos() async {
    final moi = await ApiClient.instance.moi();
    String? avatar;
    final id = moi?['id'] as String?;
    if (id != null) {
      try {
        final p = await ApiClient.instance.get('/profile/$id');
        if (p is Map) avatar = p['avatarUrl'] as String?;
      } catch (_) {/* pas de profil, pas grave */}
    }
    return {
      'aCompte': moi != null,
      'nom': (moi?['user_metadata']?['full_name'] as String?)?.trim(),
      'email': moi?['email'] as String? ?? '',
      'verifie': moi?['emailVerified'] == true,
      'avatarUrl': avatar,
    };
  }

  Future<void> _ouvrirProfil() async {
    final ok = await Navigator.of(context).push<bool>(
        MaterialPageRoute(builder: (_) => const ModifierProfilScreen()));
    if (ok == true) _recharger();
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

  Future<void> _ouvrirVerif() async {
    final ok = await Navigator.of(context).push<bool>(
        MaterialPageRoute(builder: (_) => const VerifierEmailScreen()));
    if (ok == true) _recharger();
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
          _sectionAide(),
        ],
      ),
    );
  }

  /// « Aide & informations » : les pages du site (FAQ, contact, mentions
  /// légales…) ouvertes dans un navigateur intégré — donc toujours à jour avec
  /// le site — puis la suppression de compte (exigée par les stores).
  Widget _sectionAide() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Padding(
          padding: EdgeInsets.fromLTRB(16, 22, 16, 6),
          child: Text('Aide & informations',
              style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: ChapColors.gray900)),
        ),
        Container(
          margin: const EdgeInsets.symmetric(horizontal: 16),
          decoration: BoxDecoration(
            color: ChapColors.cream,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: ChapColors.line),
          ),
          child: Column(
            children: [
              _tuile(Icons.help_outline, 'Aide',
                  () => ouvrirPageSite(context, PagesSite.aide)),
              _sep(),
              _tuile(Icons.quiz_outlined, 'Questions fréquentes (FAQ)',
                  () => ouvrirPageSite(context, PagesSite.faq)),
              _sep(),
              _tuile(Icons.mail_outline, 'Nous contacter',
                  () => ouvrirPageSite(context, PagesSite.contact)),
              _sep(),
              _tuile(Icons.info_outline, 'À propos',
                  () => ouvrirPageSite(context, PagesSite.aPropos)),
              _sep(),
              _tuile(Icons.description_outlined, 'Conditions d’utilisation',
                  () => ouvrirPageSite(context, PagesSite.conditions)),
              _sep(),
              _tuile(Icons.privacy_tip_outlined, 'Confidentialité',
                  () => ouvrirPageSite(context, PagesSite.confidentialite)),
            ],
          ),
        ),
        const SizedBox(height: 16),
        Container(
          margin: const EdgeInsets.symmetric(horizontal: 16),
          decoration: BoxDecoration(
            color: ChapColors.cream,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFFF1C9C4)),
          ),
          child: _tuile(Icons.delete_outline, 'Supprimer mon compte',
              _ouvrirSuppression,
              danger: true),
        ),
      ],
    );
  }

  Widget _tuile(IconData icone, String titre, VoidCallback onTap,
      {bool danger = false}) {
    final couleur = danger ? const Color(0xFFB42318) : ChapColors.gray900;
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
        child: Row(
          children: [
            Icon(icone, size: 20, color: couleur),
            const SizedBox(width: 12),
            Expanded(
              child: Text(titre,
                  style: TextStyle(
                      fontSize: 14,
                      fontWeight:
                          danger ? FontWeight.w600 : FontWeight.w500,
                      color: couleur)),
            ),
            Icon(Icons.chevron_right,
                size: 20,
                color: danger
                    ? const Color(0xFFB42318)
                    : ChapColors.gray500),
          ],
        ),
      ),
    );
  }

  Widget _sep() =>
      const Divider(height: 1, thickness: 1, color: ChapColors.line);

  Future<void> _ouvrirSuppression() async {
    await Navigator.of(context).push(MaterialPageRoute(
        builder: (_) => const SupprimerCompteScreen()));
    if (mounted) setState(() {}); // le compte peut avoir été supprimé
  }

  Widget _entete() {
    return FutureBuilder<Map<String, dynamic>>(
      future: _infos,
      builder: (context, snap) {
        final d = snap.data ?? const <String, dynamic>{};
        final nom = d['nom'] as String?;
        final email = d['email'] as String? ?? '';
        final verifie = d['verifie'] == true;
        final aCompte = d['aCompte'] == true;
        final avatarUrl = d['avatarUrl'] as String?;
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
                  _avatarWidget(avatarUrl),
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
                  if (aCompte)
                    IconButton(
                      icon: const Icon(Icons.edit_outlined,
                          size: 20, color: ChapColors.gray600),
                      tooltip: 'Modifier le profil',
                      onPressed: _ouvrirProfil,
                    ),
                ],
              ),
              if (aCompte && !verifie) ...[
                const SizedBox(height: 12),
                InkWell(
                  onTap: _ouvrirVerif,
                  borderRadius: BorderRadius.circular(10),
                  child: Container(
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
                            'Confirmez votre e-mail pour pouvoir publier.',
                            style: TextStyle(
                                fontSize: 12.5,
                                fontWeight: FontWeight.w600,
                                color: ChapColors.ocreDark),
                          ),
                        ),
                        Icon(Icons.chevron_right,
                            size: 18, color: ChapColors.ocreDark),
                      ],
                    ),
                  ),
                ),
              ],
              if (aCompte) ...[
                const SizedBox(height: 12),
                InkWell(
                  onTap: _ouvrirSecurite,
                  borderRadius: BorderRadius.circular(10),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: ChapColors.line2),
                    ),
                    child: const Row(
                      children: [
                        Icon(Icons.shield_outlined,
                            size: 20, color: ChapColors.gray700),
                        SizedBox(width: 10),
                        Expanded(
                          child: Text('Double authentification',
                              style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w600,
                                  color: ChapColors.gray900)),
                        ),
                        Icon(Icons.chevron_right,
                            size: 20, color: ChapColors.gray600),
                      ],
                    ),
                  ),
                ),
              ],
              if (aCompte && _estAdmin) ...[
                const SizedBox(height: 10),
                InkWell(
                  onTap: _ouvrirTableauBord,
                  borderRadius: BorderRadius.circular(10),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                    decoration: BoxDecoration(
                      color: ChapColors.cream100.withValues(alpha: 0.6),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: ChapColors.orange.withValues(alpha: 0.4)),
                    ),
                    child: const Row(
                      children: [
                        Icon(Icons.dashboard_outlined,
                            size: 20, color: ChapColors.orangeDark),
                        SizedBox(width: 10),
                        Expanded(
                          child: Text('Tableau de bord',
                              style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w700,
                                  color: ChapColors.orangeDark)),
                        ),
                        Icon(Icons.chevron_right,
                            size: 20, color: ChapColors.orangeDark),
                      ],
                    ),
                  ),
                ),
              ],
            ],
          ),
        );
      },
    );
  }

  Future<void> _ouvrirTableauBord() async {
    await Navigator.of(context).push(
        MaterialPageRoute(builder: (_) => const TableauBordScreen()));
  }

  Future<void> _ouvrirSecurite() async {
    await Navigator.of(context).push(
        MaterialPageRoute(builder: (_) => const Securite2faScreen()));
  }

  Widget _avatarWidget(String? url) {
    if (url != null && url.isNotEmpty) {
      final src = ImageSource.resoudre(url);
      if (src.url != null) {
        return CircleAvatar(radius: 26, backgroundImage: NetworkImage(src.url!));
      }
      if (src.bytes != null) {
        return CircleAvatar(radius: 26, backgroundImage: MemoryImage(src.bytes!));
      }
    }
    return const CircleAvatar(
      radius: 26,
      backgroundColor: ChapColors.cream100,
      child: Icon(Icons.person, color: ChapColors.orange, size: 28),
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
