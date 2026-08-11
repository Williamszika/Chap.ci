import 'package:flutter/material.dart';
import '../../api/admin.dart';
import '../../api/api_client.dart';
import '../../format.dart';
import '../../theme.dart';

/// Les comptes, vus du tableau de bord : chercher un compte, voir son activité,
/// et — quand il le faut — le **restreindre** ou le **bloquer**. Un compte
/// bloqué ne peut plus se connecter (le serveur le refuse partout).
class UtilisateursScreen extends StatefulWidget {
  /// Aperçu (captures / tests) : liste fournie, sans réseau.
  final List<Utilisateur>? apercu;
  const UtilisateursScreen({super.key, this.apercu});
  @override
  State<UtilisateursScreen> createState() => _UtilisateursScreenState();
}

class _UtilisateursScreenState extends State<UtilisateursScreen> {
  List<Utilisateur>? _tous;
  String? _erreur;
  String _recherche = '';
  final _occupe = <String>{};

  @override
  void initState() {
    super.initState();
    if (widget.apercu != null) {
      _tous = widget.apercu;
    } else {
      _charger();
    }
  }

  Future<void> _charger() async {
    try {
      final l = await AdminApi.utilisateurs();
      if (mounted) {
        setState(() {
          _tous = l;
          _erreur = null;
        });
      }
    } on ApiException catch (e) {
      if (mounted) setState(() => _erreur = e.message);
    }
  }

  List<Utilisateur> get _filtres {
    final tous = _tous ?? const <Utilisateur>[];
    final q = _recherche.trim().toLowerCase();
    if (q.isEmpty) return tous;
    return tous.where((u) {
      return u.nom.toLowerCase().contains(q) ||
          u.email.toLowerCase().contains(q) ||
          (u.commune ?? '').toLowerCase().contains(q) ||
          (u.telephone ?? '').contains(q);
    }).toList();
  }

  Future<void> _changer(Utilisateur u, String statut) async {
    setState(() => _occupe.add(u.id));
    try {
      await AdminApi.changerStatut(u.id, statut);
      // Mise à jour optimiste locale.
      final maj = Utilisateur.depuis({
        'id': u.id, 'email': u.email, 'fullName': u.nom, 'status': statut,
        'phone': u.telephone, 'commune': u.commune, 'listings': u.annonces,
        'createdAt': u.cree, 'derniereActivite': u.derniereActivite,
        'enLigne': u.enLigne,
      });
      if (mounted) {
        setState(() {
          _tous = _tous!.map((x) => x.id == u.id ? maj : x).toList();
        });
      }
      if (mounted) {
        const mots = {
          'active': 'Compte réactivé.',
          'restricted': 'Compte restreint.',
          'blocked': 'Compte bloqué : il ne peut plus se connecter.',
        };
        ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(mots[statut] ?? 'Fait.')));
      }
    } on ApiException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text(e.message)));
      }
    } finally {
      if (mounted) setState(() => _occupe.remove(u.id));
    }
  }

  @override
  Widget build(BuildContext context) {
    final tous = _tous;
    return Scaffold(
      appBar: AppBar(title: const Text('Utilisateurs')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(12, 10, 12, 6),
            child: TextField(
              onChanged: (v) => setState(() => _recherche = v),
              decoration: const InputDecoration(
                prefixIcon: Icon(Icons.search, size: 20),
                hintText: 'Chercher un nom, un e-mail, une commune…',
                isDense: true,
              ),
            ),
          ),
          Expanded(
            child: RefreshIndicator(
              color: ChapColors.orange,
              onRefresh: _charger,
              child: tous == null
                  ? (_erreur != null ? _centre(_erreur!) : _centre(null))
                  : _liste(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _centre(String? m) => ListView(children: [
        const SizedBox(height: 120),
        Center(
          child: m == null
              ? const CircularProgressIndicator(color: ChapColors.orange)
              : Text(m, style: const TextStyle(color: ChapColors.gray600)),
        ),
      ]);

  Widget _liste() {
    final list = _filtres;
    if (list.isEmpty) {
      return _centre('Aucun compte ne correspond.');
    }
    return ListView.separated(
      padding: const EdgeInsets.only(bottom: 20),
      itemCount: list.length,
      separatorBuilder: (_, __) => const Divider(height: 1, color: ChapColors.line),
      itemBuilder: (context, i) => _ligne(list[i]),
    );
  }

  Widget _ligne(Utilisateur u) {
    final occupe = _occupe.contains(u.id);
    final initiale = (u.nom.trim().isNotEmpty && u.nom != '—')
        ? u.nom.trim()[0].toUpperCase()
        : (u.email.isNotEmpty ? u.email[0].toUpperCase() : '?');
    return Padding(
      padding: const EdgeInsets.fromLTRB(14, 12, 8, 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Stack(
            children: [
              CircleAvatar(
                radius: 20,
                backgroundColor: ChapColors.cream100,
                child: Text(initiale,
                    style: const TextStyle(
                        color: ChapColors.orangeDark, fontWeight: FontWeight.bold)),
              ),
              if (u.enLigne)
                Positioned(
                  right: 0,
                  bottom: 0,
                  child: Container(
                    width: 11,
                    height: 11,
                    decoration: BoxDecoration(
                      color: ChapColors.green,
                      shape: BoxShape.circle,
                      border: Border.all(color: ChapColors.cream200, width: 2),
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Flexible(
                      child: Text(u.nom,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                              fontSize: 14.5,
                              fontWeight: FontWeight.w700,
                              color: ChapColors.gray900)),
                    ),
                    const SizedBox(width: 8),
                    _chipStatut(u),
                  ],
                ),
                Text(u.email,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontSize: 12.5, color: ChapColors.gray600)),
                const SizedBox(height: 2),
                Text(_meta(u),
                    style: const TextStyle(fontSize: 11.5, color: ChapColors.gray500)),
              ],
            ),
          ),
          if (occupe)
            const Padding(
              padding: EdgeInsets.only(right: 12, top: 8),
              child: SizedBox(
                  height: 18,
                  width: 18,
                  child: CircularProgressIndicator(
                      strokeWidth: 2, color: ChapColors.orange)),
            )
          else
            PopupMenuButton<String>(
              icon: const Icon(Icons.more_vert, color: ChapColors.gray600),
              onSelected: (v) => _changer(u, v),
              itemBuilder: (context) => [
                _item('active', 'Réactiver', Icons.check_circle_outline,
                    ChapColors.greenDark, u.statut == 'active'),
                _item('restricted', 'Restreindre', Icons.remove_circle_outline,
                    ChapColors.orangeDark, u.statut == 'restricted'),
                _item('blocked', 'Bloquer', Icons.block,
                    const Color(0xFFB42318), u.statut == 'blocked'),
              ],
            ),
        ],
      ),
    );
  }

  PopupMenuItem<String> _item(
      String v, String t, IconData ic, Color c, bool actuel) {
    return PopupMenuItem<String>(
      value: v,
      enabled: !actuel,
      child: Row(
        children: [
          Icon(ic, size: 18, color: actuel ? ChapColors.gray500 : c),
          const SizedBox(width: 10),
          Text(actuel ? '$t (actuel)' : t,
              style: TextStyle(color: actuel ? ChapColors.gray500 : ChapColors.gray900)),
        ],
      ),
    );
  }

  Widget _chipStatut(Utilisateur u) {
    final (texte, couleur) = u.bloque
        ? ('Bloqué', const Color(0xFFB42318))
        : u.restreint
            ? ('Restreint', ChapColors.orangeDark)
            : ('Actif', ChapColors.greenDark);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
      decoration: BoxDecoration(
        color: couleur.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(texte,
          style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.w700, color: couleur)),
    );
  }

  String _meta(Utilisateur u) {
    final bouts = <String>[
      if (u.commune != null && u.commune!.isNotEmpty) u.commune!,
      '${u.annonces} annonce${u.annonces > 1 ? 's' : ''}',
      u.enLigne
          ? 'en ligne'
          : (u.derniereActivite > 0 ? 'vu ${tempsEcoule(u.derniereActivite)}' : 'jamais vu'),
    ];
    return bouts.join(' · ');
  }
}
