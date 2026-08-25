import 'package:flutter/material.dart';
import '../api/api_client.dart';
import '../data/categories.dart';
import '../i18n/categories_i18n.dart';
import '../i18n/textes.dart';
import '../theme.dart';

/// Devenir professionnel — le dossier « boutique ».
///
/// Une « boutique » n'est pas réservée aux commerces : une école vend ses
/// formations, un employeur publie ses offres, une association donne. Le
/// formulaire demande donc d'abord le TYPE d'organisation, et le justificatif
/// s'adapte (RCCM pour un commerce, récépissé pour une association, agrément
/// pour une école). La validation est humaine, sous 24-48 h.
///
/// États : jamais demandé → formulaire ; en attente → patience ; refusé →
/// motif + formulaire pour redéposer ; approuvé → félicitations.
class DevenirProScreen extends StatefulWidget {
  const DevenirProScreen({super.key});
  @override
  State<DevenirProScreen> createState() => _DevenirProScreenState();
}

class _DevenirProScreenState extends State<DevenirProScreen> {
  final _nom = TextEditingController();
  final _numero = TextEditingController();
  final _tel = TextEditingController();
  String _type = 'commerce';
  String? _secteur;
  String _statut = '';
  String? _motif;
  String? _proNom;
  bool _chargement = true;
  bool _envoi = false;
  String? _erreur;

  static const _types = ['commerce', 'services', 'formation', 'emploi', 'association'];
  static const _emojis = {
    'commerce': '🏪', 'services': '🛠️', 'formation': '🎓',
    'emploi': '🏢', 'association': '❤️',
  };

  @override
  void initState() {
    super.initState();
    _charger();
  }

  @override
  void dispose() {
    _nom.dispose();
    _numero.dispose();
    _tel.dispose();
    super.dispose();
  }

  Future<void> _charger() async {
    try {
      final d = await ApiClient.instance.get('/pro/statut');
      if (d is Map && mounted) {
        setState(() {
          _statut = (d['status'] as String?) ?? '';
          _motif = d['motif'] as String?;
          _proNom = d['nom'] as String?;
          // Pré-remplir le formulaire avec le dossier précédent (refus → correction).
          if ((d['nom'] as String?)?.isNotEmpty ?? false) _nom.text = d['nom'] as String;
          if ((d['numero'] as String?)?.isNotEmpty ?? false) _numero.text = d['numero'] as String;
          if (_types.contains(d['type'])) _type = d['type'] as String;
          if ((d['secteur'] as String?)?.isNotEmpty ?? false) _secteur = d['secteur'] as String?;
        });
      }
    } catch (_) {/* hors ligne : le formulaire reste utilisable */}
    if (mounted) setState(() => _chargement = false);
  }

  /// Le libellé du champ « numéro officiel » suit le type d'organisation.
  String _labelNumero() {
    switch (_type) {
      case 'association':
        return tr(context, 'pro.numero.recepisse');
      case 'formation':
        return tr(context, 'pro.numero.agrement');
      default:
        return tr(context, 'pro.numero.rccm');
    }
  }

  Future<void> _envoyer() async {
    if (_nom.text.trim().length < 2) {
      setState(() => _erreur = tr(context, 'insc.indiquezNom'));
      return;
    }
    setState(() {
      _envoi = true;
      _erreur = null;
    });
    try {
      await ApiClient.instance.post('/pro/demande', {
        'type': _type,
        'nom': _nom.text.trim(),
        'numero': _numero.text.trim(),
        'secteur': _secteur ?? '',
        'tel': _tel.text.trim(),
      });
      if (mounted) setState(() => _statut = 'en_attente');
    } on ApiException catch (e) {
      if (mounted) setState(() => _erreur = e.message);
    } finally {
      if (mounted) setState(() => _envoi = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(tr(context, 'pro.titre'))),
      body: _chargement
          ? const Center(
              child: CircularProgressIndicator(color: ChapColors.orange))
          : _statut == 'approuve'
              ? _vueApprouve()
              : _statut == 'en_attente'
                  ? _vueAttente()
                  : _vueFormulaire(),
    );
  }

  Widget _vueAttente() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(28),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.hourglass_top_rounded,
                size: 52, color: ChapColors.orange),
            const SizedBox(height: 16),
            Text(tr(context, 'pro.enAttente'),
                textAlign: TextAlign.center,
                style: const TextStyle(
                    fontSize: 18, fontWeight: FontWeight.w800)),
            const SizedBox(height: 8),
            Text(tr(context, 'pro.envoyeeCorps'),
                textAlign: TextAlign.center,
                style:
                    const TextStyle(color: ChapColors.gray600, height: 1.45)),
          ],
        ),
      ),
    );
  }

  Widget _vueApprouve() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(28),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding:
                  const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
              decoration: BoxDecoration(
                color: const Color(0xFF2E7DB8),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text('💼 ${tr(context, 'pro.badge')}',
                  style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w800,
                      fontSize: 15)),
            ),
            const SizedBox(height: 16),
            Text(_proNom ?? tr(context, 'pro.approuve'),
                textAlign: TextAlign.center,
                style: const TextStyle(
                    fontSize: 19, fontWeight: FontWeight.w800)),
            const SizedBox(height: 8),
            Text(tr(context, 'pro.felicitations'),
                textAlign: TextAlign.center,
                style:
                    const TextStyle(color: ChapColors.gray600, height: 1.45)),
          ],
        ),
      ),
    );
  }

  Widget _vueFormulaire() {
    return Center(
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 480),
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 20, 20, 28),
          children: [
            Text(tr(context, 'pro.intro'),
                style:
                    const TextStyle(color: ChapColors.gray600, height: 1.5)),
            if (_statut == 'refuse' && (_motif?.isNotEmpty ?? false)) ...[
              const SizedBox(height: 14),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFFFFF4E0),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFFF3D9A6)),
                ),
                child: Text(
                    '${tr(context, 'pro.motifRefus')} : $_motif',
                    style: const TextStyle(
                        color: ChapColors.ocreDark, height: 1.4)),
              ),
            ],
            const SizedBox(height: 18),
            Text(tr(context, 'pro.typeTitre'),
                style: const TextStyle(
                    fontWeight: FontWeight.w700, fontSize: 15)),
            const SizedBox(height: 8),
            for (final t in _types)
              Padding(
                padding: const EdgeInsets.only(bottom: 7),
                child: InkWell(
                  onTap: () => setState(() => _type = t),
                  borderRadius: BorderRadius.circular(12),
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 12, vertical: 11),
                    decoration: BoxDecoration(
                      color: _type == t
                          ? ChapColors.cream100
                          : ChapColors.cream,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: _type == t
                            ? ChapColors.orange
                            : ChapColors.line2,
                        width: _type == t ? 2 : 1,
                      ),
                    ),
                    child: Row(
                      children: [
                        Text(_emojis[t]!,
                            style: const TextStyle(fontSize: 19)),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(tr(context, 'pro.type.$t'),
                              style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: _type == t
                                      ? FontWeight.w700
                                      : FontWeight.w500)),
                        ),
                        if (_type == t)
                          const Icon(Icons.check_circle,
                              size: 19, color: ChapColors.orange),
                      ],
                    ),
                  ),
                ),
              ),
            const SizedBox(height: 12),
            TextField(
              controller: _nom,
              textCapitalization: TextCapitalization.words,
              decoration: InputDecoration(
                labelText: tr(context, 'pro.nomOrg'),
                hintText: tr(context, 'pro.nomOrgHint'),
                prefixIcon: const Icon(Icons.storefront_outlined),
              ),
            ),
            const SizedBox(height: 14),
            TextField(
              controller: _numero,
              decoration: InputDecoration(
                labelText: _labelNumero(),
                helperText: tr(context, 'pro.numeroAide'),
                helperMaxLines: 2,
                prefixIcon: const Icon(Icons.badge_outlined),
              ),
            ),
            const SizedBox(height: 14),
            DropdownButtonFormField<String>(
              initialValue: _secteur,
              isExpanded: true,
              decoration: InputDecoration(
                labelText: tr(context, 'pro.secteur'),
                prefixIcon: const Icon(Icons.category_outlined),
              ),
              items: [
                for (final c in categories)
                  DropdownMenuItem(
                      value: c.id,
                      child: Text(
                          '${c.emoji}  ${nomCategorieTr(context, c.id)}')),
              ],
              onChanged: (v) => setState(() => _secteur = v),
            ),
            const SizedBox(height: 14),
            TextField(
              controller: _tel,
              keyboardType: TextInputType.phone,
              decoration: InputDecoration(
                labelText: tr(context, 'pro.telBusiness'),
                hintText: '07 …',
                prefixIcon: const Icon(Icons.phone_outlined),
              ),
            ),
            if (_erreur != null) ...[
              const SizedBox(height: 12),
              Text(_erreur!,
                  style: const TextStyle(color: Color(0xFFB42318))),
            ],
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: _envoi ? null : _envoyer,
              child: _envoi
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(
                          strokeWidth: 2, color: Colors.white))
                  : Text(tr(context, 'pro.envoyer')),
            ),
          ],
        ),
      ),
    );
  }
}
