// =============================================================================
//  LES RÉPONSES — l'écran des phrases qui répondent à votre place.
//
//  Portage du site (`src/components/ReponsesAuto.tsx`), chantier 2 du
//  04/09/2026 : « l'application à égalité avec le site ». Deux blocs :
//
//   · « 🤖 Réponse automatique » — comptes professionnels approuvés seulement :
//     la phrase qui part toute seule au premier message d'un acheteur ;
//   · « ⚡ Réponses toutes prêtes » — pour tout le monde : les phrases qu'on
//     retape vingt fois par jour, posées d'un appui dans la conversation.
//
//  Sur le site, ces deux blocs vivaient au bas de la liste des messages et le
//  Patron a redemandé deux fois une fonction déjà en ligne parce qu'il ne
//  l'avait jamais vue. Ici : une tuile dans la console pro, une ligne dans
//  Mon compte, et l'éclair dans la barre de saisie de chaque conversation.
// =============================================================================
import 'package:flutter/material.dart';

import '../api/api_client.dart';
import '../api/messaging.dart';
import '../i18n/textes.dart';
import '../theme.dart';

class ReponsesScreen extends StatefulWidget {
  /// Compte professionnel approuvé : montre aussi la réponse automatique.
  final bool pro;
  const ReponsesScreen({super.key, this.pro = false});

  @override
  State<ReponsesScreen> createState() => _ReponsesScreenState();
}

class _ReponsesScreenState extends State<ReponsesScreen> {
  // ── Réponses toutes prêtes ────────────────────────────────────────────────
  List<ReponsePrete> _pretes = [];
  bool _chargement = true;
  final _nouvelle = TextEditingController();
  bool _ajout = false;

  // ── Réponse automatique ───────────────────────────────────────────────────
  final _auto = TextEditingController();
  bool _autoActive = false;
  bool _autoChargee = false;
  bool _autoModifiee = false;
  bool _autoOccupee = false;
  bool _autoEnregistree = false;

  @override
  void initState() {
    super.initState();
    _charger();
  }

  @override
  void dispose() {
    _nouvelle.dispose();
    _auto.dispose();
    super.dispose();
  }

  Future<void> _charger() async {
    try {
      final p = await ReponsePrete.mes();
      if (mounted) setState(() => _pretes = p);
    } on ApiException catch (e) {
      _toast(e.message);
    } finally {
      if (mounted) setState(() => _chargement = false);
    }
    if (widget.pro) {
      try {
        final a = await ReponseAuto.lire();
        if (mounted) {
          setState(() {
            _auto.text = a.texte;
            _autoActive = a.active;
            _autoChargee = true;
          });
        }
      } catch (_) {
        if (mounted) setState(() => _autoChargee = true);
      }
    }
  }

  void _toast(String texte) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(texte)));
  }

  Future<void> _ajouter([String? texte]) async {
    final t = (texte ?? _nouvelle.text).trim();
    if (t.isEmpty || _ajout) return;
    if (_pretes.length >= ReponsePrete.maximum) {
      _toast(tr(context, 'reponses.limite'));
      return;
    }
    setState(() => _ajout = true);
    try {
      final r = await ReponsePrete.ajouter(t);
      if (!mounted) return;
      setState(() {
        _pretes = [..._pretes, r];
        _nouvelle.clear();
      });
    } on ApiException catch (e) {
      _toast(e.message);
    } finally {
      if (mounted) setState(() => _ajout = false);
    }
  }

  Future<void> _retirer(ReponsePrete r) async {
    setState(() => _pretes = _pretes.where((x) => x.id != r.id).toList());
    try {
      await ReponsePrete.supprimer(r.id);
    } on ApiException catch (e) {
      _toast(e.message);
      _charger();
    }
  }

  Future<void> _enregistrerAuto(bool active) async {
    if (_autoOccupee) return;
    setState(() => _autoOccupee = true);
    try {
      final a = await ReponseAuto.enregistrer(_auto.text, active);
      if (!mounted) return;
      setState(() {
        _auto.text = a.texte;
        _autoActive = a.active;
        _autoModifiee = false;
        _autoEnregistree = true;
      });
      // Une confirmation qui s'efface : sans elle, on ne sait pas si le
      // bouton a fait quelque chose, et on appuie trois fois.
      Future.delayed(const Duration(milliseconds: 2500), () {
        if (mounted) setState(() => _autoEnregistree = false);
      });
    } on ApiException catch (e) {
      _toast(e.message);
    } finally {
      if (mounted) setState(() => _autoOccupee = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(tr(context, 'reponses.titre'))),
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 560),
          child: ListView(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 40),
            children: [
              if (widget.pro && _autoChargee) ...[
                _blocAuto(),
                const SizedBox(height: 16),
              ],
              _blocPretes(),
            ],
          ),
        ),
      ),
    );
  }

  // ── « 🤖 Réponse automatique » ────────────────────────────────────────────
  Widget _blocAuto() {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: ChapColors.cream100,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: ChapColors.ocreDark.withValues(alpha: 0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('🤖 ${tr(context, 'reponses.autoTitre')}',
                        style: const TextStyle(
                            fontSize: 14.5,
                            fontWeight: FontWeight.w800,
                            color: ChapColors.ink)),
                    const SizedBox(height: 2),
                    Text(tr(context, 'reponses.autoSous'),
                        style: const TextStyle(
                            fontSize: 12.5, height: 1.35, color: ChapColors.gray600)),
                  ],
                ),
              ),
              Switch(
                value: _autoActive,
                activeThumbColor: ChapColors.marque,
                onChanged: (_autoOccupee || (!_autoActive && _auto.text.trim().isEmpty))
                    ? null
                    : (v) => _enregistrerAuto(v),
              ),
            ],
          ),
          const SizedBox(height: 10),
          TextField(
            controller: _auto,
            minLines: 2,
            maxLines: 4,
            maxLength: 400,
            textCapitalization: TextCapitalization.sentences,
            onChanged: (_) => setState(() => _autoModifiee = true),
            decoration: InputDecoration(
              hintText: tr(context, 'reponses.autoPlaceholder'),
              counterText: '',
            ),
          ),
          const SizedBox(height: 8),
          Wrap(
            spacing: 6,
            runSpacing: 6,
            children: [
              for (final m in ReponseAuto.modeles)
                _modele(m, () => setState(() {
                      _auto.text = m;
                      _autoModifiee = true;
                    })),
            ],
          ),
          if (_autoModifiee) ...[
            const SizedBox(height: 10),
            ElevatedButton(
              onPressed: _autoOccupee ? null : () => _enregistrerAuto(_autoActive),
              child: Text(tr(context, 'reponses.autoEnregistrer')),
            ),
          ],
          if (_autoEnregistree && !_autoModifiee) ...[
            const SizedBox(height: 8),
            Text(
              '✓ ${tr(context, _autoActive ? 'reponses.autoPartira' : 'reponses.autoActivezLa')}',
              style: const TextStyle(
                  fontSize: 12.5,
                  fontWeight: FontWeight.w700,
                  color: ChapColors.greenDark),
            ),
          ],
          const SizedBox(height: 8),
          Text(tr(context, 'reponses.autoNote'),
              style: const TextStyle(
                  fontSize: 11.5, height: 1.35, color: ChapColors.gray500)),
        ],
      ),
    );
  }

  // ── « ⚡ Réponses toutes prêtes » ─────────────────────────────────────────
  Widget _blocPretes() {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: ChapColors.cream,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: ChapColors.line),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('⚡ ${tr(context, 'reponses.pretesTitre')}',
              style: const TextStyle(
                  fontSize: 14.5, fontWeight: FontWeight.w800, color: ChapColors.ink)),
          const SizedBox(height: 2),
          Text(tr(context, 'reponses.pretesSous'),
              style: const TextStyle(
                  fontSize: 12.5, height: 1.35, color: ChapColors.gray600)),
          const SizedBox(height: 12),
          if (_chargement)
            const Center(
                child: Padding(
              padding: EdgeInsets.all(12),
              child: SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(
                      strokeWidth: 2, color: ChapColors.marque)),
            ))
          else ...[
            Wrap(
              spacing: 6,
              runSpacing: 6,
              children: [
                for (final r in _pretes)
                  Container(
                    constraints: const BoxConstraints(maxWidth: 520),
                    padding: const EdgeInsets.fromLTRB(12, 6, 6, 6),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(999),
                      border: Border.all(color: ChapColors.line2),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Flexible(
                          child: Text(r.texte,
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                  fontSize: 13, fontWeight: FontWeight.w600, color: ChapColors.gray700)),
                        ),
                        const SizedBox(width: 4),
                        InkWell(
                          customBorder: const CircleBorder(),
                          onTap: () => _retirer(r),
                          child: Tooltip(
                            message: tr(context, 'reponses.retirer'),
                            child: const Padding(
                              padding: EdgeInsets.all(6),
                              child: Icon(Icons.close, size: 15, color: ChapColors.gray500),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
              ],
            ),
            if (_pretes.isEmpty) ...[
              Text(tr(context, 'reponses.modeles'),
                  style: const TextStyle(fontSize: 12, color: ChapColors.gray600)),
              const SizedBox(height: 6),
              Wrap(
                spacing: 6,
                runSpacing: 6,
                children: [
                  for (final m in ReponsePrete.modeles) _modele(m, () => _ajouter(m)),
                ],
              ),
            ],
            const SizedBox(height: 12),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: TextField(
                    controller: _nouvelle,
                    maxLength: 400,
                    minLines: 1,
                    maxLines: 3,
                    textCapitalization: TextCapitalization.sentences,
                    textInputAction: TextInputAction.done,
                    onSubmitted: (_) => _ajouter(),
                    decoration: InputDecoration(
                      hintText: tr(context, 'reponses.nouvelle'),
                      counterText: '',
                      isDense: true,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                SizedBox(
                  height: 48,
                  child: ElevatedButton(
                    onPressed: _ajout ? null : () => _ajouter(),
                    style: ElevatedButton.styleFrom(
                        minimumSize: const Size(0, 48),
                        padding: const EdgeInsets.symmetric(horizontal: 14)),
                    child: Text(tr(context, 'reponses.ajouter')),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 6),
            Text(
              '${_pretes.length} / ${ReponsePrete.maximum} · ${tr(context, 'reponses.limite')}',
              style: const TextStyle(fontSize: 11.5, color: ChapColors.gray500),
            ),
          ],
        ],
      ),
    );
  }

  Widget _modele(String texte, VoidCallback onTap) {
    return InkWell(
      borderRadius: BorderRadius.circular(999),
      onTap: onTap,
      child: Container(
        constraints: const BoxConstraints(maxWidth: 520),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(999),
          border: Border.all(color: ChapColors.line2),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.add, size: 13, color: ChapColors.gray600),
            const SizedBox(width: 4),
            Flexible(
              child: Text(texte,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                      fontSize: 12, fontWeight: FontWeight.w600, color: ChapColors.gray600)),
            ),
          ],
        ),
      ),
    );
  }
}
