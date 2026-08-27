import 'package:flutter/material.dart';
import '../api/api_client.dart';
import '../api/models.dart';
import '../format.dart';
import '../i18n/textes.dart';
import '../theme.dart';
import '../widgets/espace_pro_panel.dart';
import 'listing_detail_screen.dart';
import 'modifier_profil_screen.dart';
import 'verifier_email_screen.dart';

/// Le contenu de l'onglet Compte quand on est connecté : l'identité (avec l'état
/// de vérification et le badge de confiance), trois chiffres clés, et
/// « Mes annonces » avec leur état, leurs vues et les actions vendeur.
///
/// Tous les réglages (profil, mot de passe, 2FA, notifications, aide,
/// suppression…) sont rassemblés dans l'écran Paramètres, atteint par
/// l'engrenage de la barre du haut.
class MonCompteView extends StatefulWidget {
  const MonCompteView({super.key});
  @override
  State<MonCompteView> createState() => _MonCompteViewState();
}

class _MonCompteViewState extends State<MonCompteView> {
  late Future<Map<String, dynamic>> _infos;
  late Future<List<Listing>> _annonces;

  @override
  void initState() {
    super.initState();
    _infos = _chargerInfos();
    _annonces = Listing.miennes();
  }

  Future<void> _recharger() async {
    setState(() {
      _infos = _chargerInfos();
      _annonces = Listing.miennes();
    });
    await _annonces;
  }

  /// Identité (nom, e-mail), photo de profil, et l'état de confiance
  /// (e-mail confirmé, badge, ancienneté) — le tout en une passe.
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
    Map verif = const {};
    try {
      final v = await ApiClient.instance.get('/verify/status');
      if (v is Map) verif = v;
    } catch (_) {/* on se rabat sur /me */}
    return {
      'aCompte': moi != null,
      'pro': (moi?['pro'] is Map) &&
          (moi!['pro']['status'] as String?) == 'approuve',
      'proNom': (moi?['pro'] is Map) ? moi!['pro']['nom'] as String? : null,
      'nom': (moi?['user_metadata']?['full_name'] as String?)?.trim(),
      'email': moi?['email'] as String? ?? '',
      'verifie': (verif['emailVerified'] ?? moi?['emailVerified']) == true,
      'badge': (verif['badge'] ?? moi?['badge']) as String? ?? '',
      'mois': (verif['mois'] as num?)?.toInt() ?? 0,
      'moisRestants': (verif['moisRestants'] as num?)?.toInt() ?? 0,
      'avatarUrl': avatar,
    };
  }

  Future<void> _ouvrirProfil() async {
    final ok = await Navigator.of(context).push<bool>(
        MaterialPageRoute(builder: (_) => const ModifierProfilScreen()));
    if (ok == true) _recharger();
  }

  Future<void> _ouvrirVerif() async {
    final ok = await Navigator.of(context).push<bool>(
        MaterialPageRoute(builder: (_) => const VerifierEmailScreen()));
    if (ok == true) _recharger();
  }

  /// Exécute une action vendeur, montre l'erreur éventuelle, puis recharge.
  Future<void> _action(Future<void> Function() op) async {
    try {
      await op();
      await _recharger();
    } on ApiException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text(e.message)));
      }
    }
  }

  Future<void> _supprimer(Listing a) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: ChapColors.cream,
        title: Text(tr(context, 'annonce.supprimerTitre')),
        content:
            Text('« ${a.title} » ${tr(context, 'annonce.supprimerCorps')}'),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: Text(tr(context, 'action.annuler'))),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: Text(tr(context, 'action.supprimer'),
                style: const TextStyle(color: Color(0xFFB42318))),
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
          // Pour un compte PRO approuvé, l'onglet Compte devient l'espace
          // professionnel : le tableau de bord de marque arrive TOUT EN HAUT,
          // comme sur les maquettes validées par le Patron (27/08) — la carte
          // du profil vient après, et les annonces restent en dessous. Le
          // bouton Publier du panneau est masqué : l'onglet a déjà le sien.
          FutureBuilder<Map<String, dynamic>>(
            future: _infos,
            builder: (context, infos) {
              if (infos.data?['pro'] == true) {
                return Column(children: [
                  const Padding(
                    padding: EdgeInsets.fromLTRB(16, 6, 16, 0),
                    child: EspaceProPanel(avecPublier: false),
                  ),
                  _entete(),
                ]);
              }
              return Column(children: [
                _entete(),
                FutureBuilder<List<Listing>>(
                  future: _annonces,
                  builder: (context, snap) {
                    final annonces = snap.data ?? const <Listing>[];
                    if (snap.connectionState == ConnectionState.done &&
                        annonces.isNotEmpty) {
                      return _chiffres(annonces);
                    }
                    return const SizedBox.shrink();
                  },
                ),
              ]);
            },
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 18, 16, 6),
            child: Text(tr(context, 'compte.mesAnnonces'),
                style: const TextStyle(
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
                return _vide(tr(context, 'compte.chargeErreur'),
                    tr(context, 'compte.tirezReessayer'));
              }
              final annonces = snap.data ?? const <Listing>[];
              if (annonces.isEmpty) {
                return _vide(
                  tr(context, 'compte.aucuneAnnonce'),
                  tr(context, 'compte.publierBientot'),
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

  /// Les trois chiffres clés du vendeur : en ligne, vendues, vues cumulées.
  Widget _chiffres(List<Listing> annonces) {
    final enLigne = annonces.where((a) => !a.hidden && !a.sold).length;
    final vendues = annonces.where((a) => a.sold).length;
    final vues = annonces.fold<int>(0, (s, a) => s + a.views);
    Widget carte(String n, String libelle, Color couleur) => Expanded(
          child: Container(
            padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 6),
            decoration: BoxDecoration(
              color: ChapColors.cream,
              borderRadius: BorderRadius.circular(13),
              border: Border.all(color: ChapColors.line),
            ),
            child: Column(
              children: [
                Text(n,
                    style: TextStyle(
                        fontSize: 19,
                        fontWeight: FontWeight.w800,
                        color: couleur)),
                const SizedBox(height: 4),
                Text(libelle,
                    style: const TextStyle(
                        fontSize: 11, color: ChapColors.gray600)),
              ],
            ),
          ),
        );
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 0),
      child: Row(
        children: [
          carte('$enLigne', tr(context, 'statut.enLigne'), ChapColors.greenDark),
          const SizedBox(width: 8),
          carte('$vendues', tr(context, 'statut.vendue'), ChapColors.gray900),
          const SizedBox(width: 8),
          carte('$vues', tr(context, 'stat.vues'), ChapColors.orangeDark),
        ],
      ),
    );
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
        final badge = d['badge'] as String? ?? '';
        final pro = d['pro'] == true;
        final mois = d['mois'] as int? ?? 0;
        final moisRestants = d['moisRestants'] as int? ?? 0;
        return Container(
          margin: const EdgeInsets.fromLTRB(16, 16, 16, 0),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [ChapColors.cream100, ChapColors.cream],
              stops: [0, 0.7],
            ),
            borderRadius: BorderRadius.circular(18),
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
                          (nom != null && nom.isNotEmpty)
                              ? nom
                              : tr(context, 'compte.titre'),
                          style: const TextStyle(
                              fontSize: 16.5,
                              fontWeight: FontWeight.w800,
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
                      tooltip: tr(context, 'prof.modifier'),
                      onPressed: _ouvrirProfil,
                    ),
                ],
              ),
              if (aCompte) ...[
                const SizedBox(height: 12),
                _puces(verifie: verifie, badge: badge, mois: mois,
                    moisRestants: moisRestants, pro: pro),
              ],
              if (aCompte && !verifie) ...[
                const SizedBox(height: 12),
                _banniereVerif(),
              ],
            ],
          ),
        );
      },
    );
  }

  /// Les puces d'état : e-mail confirmé, et le badge de confiance (l'ancienneté
  /// que le serveur calcule déjà, ou « équipe » pour l'administration).
  Widget _puces({
    required bool verifie,
    required String badge,
    required int mois,
    required int moisRestants,
    bool pro = false,
  }) {
    final puces = <Widget>[];
    if (pro) {
      puces.add(Container(
        padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
        decoration: BoxDecoration(
          color: const Color(0xFF2E7DB8),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Text('💼 ${tr(context, 'pro.badge')}',
            style: const TextStyle(
                fontSize: 11.5,
                fontWeight: FontWeight.w800,
                color: Colors.white)),
      ));
    }
    if (verifie) {
      puces.add(_puce(tr(context, 'badge.emailConfirme'),
          icone: Icons.check_circle,
          fond: const Color(0xFFE6F6EE),
          bord: const Color(0xFFBEE6D1),
          couleur: ChapColors.greenDark));
    }
    if (badge == 'admin') {
      puces.add(_puce(tr(context, 'badge.equipe'),
          icone: Icons.verified,
          fond: const Color(0xFFE7EDF5),
          bord: const Color(0xFFC7D6E8),
          couleur: const Color(0xFF3B5A80)));
    } else if (badge == 'anciennete') {
      puces.add(_puce(
          mois > 0
              ? '${tr(context, 'badge.membre')} · $mois ${tr(context, 'common.mois')}'
              : tr(context, 'badge.membre'),
          icone: Icons.workspace_premium,
          fond: const Color(0xFFFFF3E4),
          bord: ChapColors.line2,
          couleur: ChapColors.ocreDark));
    } else if (verifie && moisRestants > 0) {
      puces.add(_puce(
          '${tr(context, 'badge.confianceDans')} $moisRestants ${tr(context, 'common.mois')}',
          icone: Icons.schedule,
          fond: ChapColors.cream100,
          bord: ChapColors.line2,
          couleur: ChapColors.gray600));
    }
    if (puces.isEmpty) return const SizedBox.shrink();
    return Align(
      alignment: Alignment.centerLeft,
      child: Wrap(spacing: 6, runSpacing: 6, children: puces),
    );
  }

  Widget _puce(String libelle,
      {required IconData icone,
      required Color fond,
      required Color bord,
      required Color couleur}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
      decoration: BoxDecoration(
        color: fond,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: bord),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icone, size: 13, color: couleur),
          const SizedBox(width: 5),
          Text(libelle,
              style: TextStyle(
                  fontSize: 11.5, fontWeight: FontWeight.w700, color: couleur)),
        ],
      ),
    );
  }

  Widget _banniereVerif() {
    return InkWell(
      onTap: _ouvrirVerif,
      borderRadius: BorderRadius.circular(10),
      child: Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: const Color(0xFFFFF4E0),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: const Color(0xFFF3D9A6)),
        ),
        child: Row(
          children: [
            const Icon(Icons.mark_email_unread_outlined,
                size: 18, color: ChapColors.ocreDark),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                tr(context, 'compte.confirmezBanniere'),
                style: const TextStyle(
                    fontSize: 12.5,
                    fontWeight: FontWeight.w600,
                    color: ChapColors.ocreDark),
              ),
            ),
            const Icon(Icons.chevron_right,
                size: 18, color: ChapColors.ocreDark),
          ],
        ),
      ),
    );
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
      backgroundColor: ChapColors.cream,
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
      texte = tr(context, 'statut.vendue');
      fond = const Color(0xFFE7EDF5);
      txt = const Color(0xFF3B5A80);
    } else if (a.hidden) {
      texte = tr(context, 'statut.masquee');
      fond = const Color(0xFFFFF4E0);
      txt = ChapColors.ocreDark;
    } else {
      texte = tr(context, 'statut.enLigne');
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
        PopupMenuItem(value: 'voir', child: Text(tr(context, 'menu.voir'))),
        if (a.hidden)
          PopupMenuItem(
              value: 'afficher', child: Text(tr(context, 'menu.remettre')))
        else
          PopupMenuItem(
              value: 'masquer', child: Text(tr(context, 'menu.masquer'))),
        PopupMenuItem(
          value: 'supprimer',
          child: Text(tr(context, 'action.supprimer'),
              style: const TextStyle(color: Color(0xFFB42318))),
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
