import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../api/admin.dart';
import '../../api/api_client.dart';
import '../../format.dart';
import '../../theme.dart';

/// L'équipe d'administration (réservé au propriétaire) : ajouter un modérateur,
/// **cocher ses permissions**, le bloquer ou le retirer.
///
/// C'est la **seule** façon prévue de créer un administrateur : passer par ici
/// tient à jour l'empreinte d'intégrité de la table `admins` côté serveur. Une
/// insertion directe en base déclencherait au contraire l'alerte `admins_tampered`.
class ModerateursScreen extends StatefulWidget {
  /// Aperçu (captures / tests) : équipe fournie, sans réseau.
  final EquipeAdmin? apercu;
  const ModerateursScreen({super.key, this.apercu});
  @override
  State<ModerateursScreen> createState() => _ModerateursScreenState();
}

class _ModerateursScreenState extends State<ModerateursScreen> {
  EquipeAdmin? _equipe;
  String? _erreur;

  @override
  void initState() {
    super.initState();
    if (widget.apercu != null) {
      _equipe = widget.apercu;
    } else {
      _charger();
    }
  }

  Future<void> _charger() async {
    try {
      final e = await AdminApi.equipe();
      if (mounted) {
        setState(() {
          _equipe = e;
          _erreur = null;
        });
      }
    } on ApiException catch (e) {
      if (mounted) setState(() => _erreur = e.message);
    }
  }

  void _dire(String m) {
    if (!mounted) return;
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(content: Text(m)));
  }

  Map<String, String> get _libelles {
    final m = <String, String>{};
    for (final f in _equipe?.fonctions ?? const <FonctionMod>[]) {
      m[f.cle] = f.libelle;
    }
    return m;
  }

  Future<void> _ouvrirEditeur({Moderateur? existant}) async {
    final e = _equipe;
    if (e == null) return;
    final ok = await Navigator.of(context).push<bool>(MaterialPageRoute(
      builder: (_) => _EditeurModerateur(fonctions: e.fonctions, existant: existant),
    ));
    if (ok == true) await _charger();
  }

  Future<void> _bloquer(Moderateur m) async {
    try {
      await AdminApi.bloquerModerateur(m.email, !m.bloque);
      _dire(m.bloque ? 'Accès rétabli.' : 'Accès coupé.');
      await _charger();
    } on ApiException catch (e) {
      _dire(e.message);
    }
  }

  Future<void> _retirer(Moderateur m) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (c) => AlertDialog(
        title: const Text('Retirer ce modérateur ?'),
        content: Text('${m.email} perdra tout accès au tableau de bord. '
            'On peut le rajouter plus tard.'),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(c, false),
              child: const Text('Annuler')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red.shade700),
            onPressed: () => Navigator.pop(c, true),
            child: const Text('Retirer'),
          ),
        ],
      ),
    );
    if (ok != true) return;
    try {
      await AdminApi.retirerModerateur(m.email);
      _dire('Modérateur retiré.');
      await _charger();
    } on ApiException catch (e) {
      _dire(e.message);
    }
  }

  @override
  Widget build(BuildContext context) {
    final e = _equipe;
    return Scaffold(
      appBar: AppBar(title: const Text('Modérateurs')),
      floatingActionButton: e == null
          ? null
          : FloatingActionButton.extended(
              onPressed: () => _ouvrirEditeur(),
              backgroundColor: ChapColors.orange,
              foregroundColor: Colors.white,
              icon: const Icon(Icons.person_add_alt_1),
              label: const Text('Ajouter'),
            ),
      body: e == null
          ? _centre(_erreur)
          : RefreshIndicator(
              color: ChapColors.orange,
              onRefresh: _charger,
              child: ListView(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 90),
                children: [
                  const Text(
                    'Qui peut entrer dans le tableau de bord, et pour y faire quoi. '
                    'Chaque modérateur reçoit un code d’accès personnel.',
                    style: TextStyle(color: ChapColors.gray600, height: 1.35),
                  ),
                  const SizedBox(height: 16),
                  _titre('Propriétaire'),
                  const SizedBox(height: 8),
                  for (final o in e.proprietaires) _carteProprietaire(o),
                  const SizedBox(height: 18),
                  _titre('Modérateurs (${e.moderateurs.length})'),
                  const SizedBox(height: 8),
                  if (e.moderateurs.isEmpty)
                    const Padding(
                      padding: EdgeInsets.symmetric(vertical: 16),
                      child: Text(
                        'Aucun modérateur pour l’instant. Vous gérez tout seul — '
                        'ajoutez quelqu’un pour partager la charge.',
                        style: TextStyle(color: ChapColors.gray500),
                      ),
                    )
                  else
                    for (final m in e.moderateurs) _carteModerateur(m),
                ],
              ),
            ),
    );
  }

  Widget _titre(String t) => Text(t,
      style: const TextStyle(
          fontSize: 16, fontWeight: FontWeight.w800, color: ChapColors.gray900));

  Widget _carteProprietaire(String email) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: const Color(0xFFEAF7F0),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: ChapColors.green),
      ),
      child: Row(
        children: [
          const Icon(Icons.shield_outlined, color: ChapColors.greenDark, size: 22),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(email,
                    style: const TextStyle(
                        fontWeight: FontWeight.w700, color: ChapColors.gray900)),
                const Text('Accès total — non modifiable',
                    style: TextStyle(fontSize: 12.5, color: ChapColors.greenDark)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _carteModerateur(Moderateur m) {
    final labels = _libelles;
    final perms = m.permissions.map((k) => labels[k] ?? k).toList();
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.fromLTRB(14, 12, 6, 12),
      decoration: BoxDecoration(
        color: ChapColors.cream,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: m.bloque ? ChapColors.orangeLight : ChapColors.line2),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Flexible(
                      child: Text(m.email,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                              fontWeight: FontWeight.w700,
                              color: ChapColors.gray900)),
                    ),
                    if (m.bloque) ...[
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: ChapColors.cream100,
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: ChapColors.orangeLight),
                        ),
                        child: const Text('Bloqué',
                            style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w700,
                                color: ChapColors.ocreDark)),
                      ),
                    ],
                  ],
                ),
                const SizedBox(height: 6),
                if (perms.isEmpty)
                  const Text('Aucune permission cochée',
                      style: TextStyle(fontSize: 12.5, color: ChapColors.gray500))
                else
                  Wrap(
                    spacing: 6,
                    runSpacing: 6,
                    children: [for (final p in perms) _puce(p)],
                  ),
                const SizedBox(height: 6),
                Text(
                  '${m.aCode ? 'Code d’accès défini' : 'Sans code'} · ajouté ${tempsEcoule(m.cree)}',
                  style: const TextStyle(fontSize: 11.5, color: ChapColors.gray500),
                ),
              ],
            ),
          ),
          PopupMenuButton<String>(
            icon: const Icon(Icons.more_vert, color: ChapColors.gray600),
            onSelected: (v) {
              if (v == 'modifier') _ouvrirEditeur(existant: m);
              if (v == 'bloquer') _bloquer(m);
              if (v == 'retirer') _retirer(m);
            },
            itemBuilder: (_) => [
              const PopupMenuItem(value: 'modifier', child: Text('Modifier les permissions')),
              PopupMenuItem(
                  value: 'bloquer',
                  child: Text(m.bloque ? 'Rétablir l’accès' : 'Bloquer l’accès')),
              const PopupMenuItem(value: 'retirer', child: Text('Retirer')),
            ],
          ),
        ],
      ),
    );
  }

  Widget _puce(String texte) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
        decoration: BoxDecoration(
          color: ChapColors.cream100,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: ChapColors.line2),
        ),
        child: Text(texte,
            style: const TextStyle(fontSize: 11.5, color: ChapColors.gray700)),
      );

  Widget _centre(String? m) => ListView(children: [
        const SizedBox(height: 120),
        Center(
          child: m == null
              ? const CircularProgressIndicator(color: ChapColors.orange)
              : Padding(
                  padding: const EdgeInsets.all(24),
                  child: Text(m,
                      textAlign: TextAlign.center,
                      style: const TextStyle(color: ChapColors.gray600)),
                ),
        ),
      ]);
}

/// L'éditeur d'un modérateur : e-mail, cases de permissions, code d'accès.
class _EditeurModerateur extends StatefulWidget {
  final List<FonctionMod> fonctions;
  final Moderateur? existant;
  const _EditeurModerateur({required this.fonctions, this.existant});
  @override
  State<_EditeurModerateur> createState() => _EditeurModerateurState();
}

class _EditeurModerateurState extends State<_EditeurModerateur> {
  final _email = TextEditingController();
  final _code = TextEditingController();
  late final Set<String> _coches;
  bool _enCours = false;

  bool get _nouveau => widget.existant == null;

  @override
  void initState() {
    super.initState();
    final ex = widget.existant;
    if (ex != null) {
      _email.text = ex.email;
      _coches = {...ex.permissions};
    } else {
      _coches = {};
    }
  }

  @override
  void dispose() {
    _email.dispose();
    _code.dispose();
    super.dispose();
  }

  void _dire(String m) {
    if (!mounted) return;
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(content: Text(m)));
  }

  bool _emailValide(String v) =>
      RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(v);

  Future<void> _enregistrer() async {
    final email = _email.text.trim();
    final code = _code.text.trim();
    if (_nouveau && !_emailValide(email)) {
      _dire('Adresse e-mail invalide.');
      return;
    }
    if (code.isNotEmpty && code.length < 6) {
      _dire('Le code d’accès doit faire au moins 6 caractères.');
      return;
    }
    setState(() => _enCours = true);
    try {
      final res = await AdminApi.enregistrerModerateur(
        email: email,
        permissions: _coches.toList(),
        code: code.isEmpty ? null : code,
      );
      if (!mounted) return;
      // Le code en clair n'apparaît qu'une fois : on le montre tout de suite.
      if (res.code != null) {
        await _montrerCode(email, res.code!);
      }
      if (!mounted) return;
      Navigator.pop(context, true);
    } on ApiException catch (e) {
      if (mounted) setState(() => _enCours = false);
      _dire(e.message);
    }
  }

  Future<void> _montrerCode(String email, String code) async {
    await showDialog<void>(
      context: context,
      barrierDismissible: false,
      builder: (c) => AlertDialog(
        title: const Text('Code d’accès'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Transmettez ce code à $email. '
                'Il ne sera plus affiché — notez-le maintenant.'),
            const SizedBox(height: 14),
            Center(
              child: SelectableText(
                code,
                style: const TextStyle(
                  fontSize: 26,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 4,
                  color: ChapColors.orangeDark,
                ),
              ),
            ),
          ],
        ),
        actions: [
          TextButton.icon(
            onPressed: () {
              Clipboard.setData(ClipboardData(text: code));
              _dire('Code copié.');
            },
            icon: const Icon(Icons.copy, size: 18),
            label: const Text('Copier'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(c),
            child: const Text('J’ai noté'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final ex = widget.existant;
    return Scaffold(
      appBar: AppBar(
          title: Text(_nouveau ? 'Nouveau modérateur' : 'Modifier le modérateur')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 28),
        children: [
          TextField(
            controller: _email,
            enabled: _nouveau,
            keyboardType: TextInputType.emailAddress,
            style: const TextStyle(color: ChapColors.gray900),
            decoration: InputDecoration(
              labelText: 'E-mail du modérateur',
              hintText: 'moderateur@exemple.com',
              helperText: _nouveau
                  ? 'Il doit déjà avoir un compte Chap.ci avec cette adresse.'
                  : 'L’adresse ne se change pas ; retirez et rajoutez au besoin.',
              helperMaxLines: 2,
              isDense: true,
            ),
          ),
          const SizedBox(height: 18),
          Row(
            children: [
              const Expanded(
                child: Text('Permissions',
                    style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                        color: ChapColors.gray900)),
              ),
              TextButton(
                onPressed: () => setState(
                    () => _coches.addAll(widget.fonctions.map((f) => f.cle))),
                child: const Text('Tout'),
              ),
              TextButton(
                onPressed: () => setState(() => _coches.clear()),
                child: const Text('Aucun'),
              ),
            ],
          ),
          const Text(
            'Cochez ce que ce modérateur peut voir et faire. Ce qui touche aux '
            'secrets (e-mails, sauvegardes, modérateurs) reste à vous seul.',
            style: TextStyle(fontSize: 12.5, color: ChapColors.gray600, height: 1.3),
          ),
          const SizedBox(height: 6),
          Material(
            color: ChapColors.cream,
            clipBehavior: Clip.antiAlias,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(14),
              side: const BorderSide(color: ChapColors.line2),
            ),
            child: Column(
              children: [
                for (final f in widget.fonctions)
                  CheckboxListTile(
                    value: _coches.contains(f.cle),
                    onChanged: (v) => setState(() {
                      if (v == true) {
                        _coches.add(f.cle);
                      } else {
                        _coches.remove(f.cle);
                      }
                    }),
                    activeColor: ChapColors.orange,
                    controlAffinity: ListTileControlAffinity.leading,
                    dense: true,
                    title: Text(f.libelle,
                        style: const TextStyle(color: ChapColors.gray900)),
                  ),
              ],
            ),
          ),
          const SizedBox(height: 18),
          TextField(
            controller: _code,
            textCapitalization: TextCapitalization.characters,
            style: const TextStyle(
                color: ChapColors.gray900, letterSpacing: 2, fontWeight: FontWeight.w600),
            decoration: InputDecoration(
              labelText: 'Code d’accès (optionnel)',
              hintText: '6 caractères ou plus',
              helperText: _nouveau || (ex != null && !ex.aCode)
                  ? 'Laissé vide, un code est généré et affiché une seule fois.'
                  : 'Laissé vide, le code actuel est gardé. Tapez-en un nouveau pour le changer.',
              helperMaxLines: 2,
              isDense: true,
            ),
          ),
          const SizedBox(height: 20),
          ElevatedButton.icon(
            onPressed: _enCours ? null : _enregistrer,
            icon: _enCours
                ? const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(
                        strokeWidth: 2, color: Colors.white))
                : const Icon(Icons.check, size: 20),
            label: Text(_enCours
                ? 'Enregistrement…'
                : (_nouveau ? 'Créer le modérateur' : 'Enregistrer')),
          ),
        ],
      ),
    );
  }
}
