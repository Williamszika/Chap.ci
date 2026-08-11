import 'package:flutter/material.dart';
import '../../api/admin.dart';
import '../../api/api_client.dart';
import '../../theme.dart';

/// Écrire un e-mail et l'envoyer à **tous les abonnés** de la newsletter.
///
/// Le message est du texte simple : le serveur l'habille (paragraphes sûrs,
/// bouton « Voir les annonces », signature). L'envoi part **par lots** — l'app
/// boucle avec un décalage croissant et montre l'avancement — parce qu'un envoi
/// coupé au milieu ne se rattrape pas : on ne saurait plus qui a reçu quoi.
class CampagneScreen extends StatefulWidget {
  /// Aperçu (captures / tests) : nombre de destinataires fourni, sans réseau.
  final int? apercu;
  const CampagneScreen({super.key, this.apercu});
  @override
  State<CampagneScreen> createState() => _CampagneScreenState();
}

class _CampagneScreenState extends State<CampagneScreen> {
  final _objet = TextEditingController();
  final _message = TextEditingController();

  int? _total;
  String? _erreur; // erreur de chargement du nombre
  bool _enCours = false;
  int _traites = 0;
  int _envoyes = 0;
  bool _fini = false;
  String? _erreurEnvoi; // panne survenue en cours d'envoi

  @override
  void initState() {
    super.initState();
    if (widget.apercu != null) {
      _total = widget.apercu;
    } else {
      _charger();
    }
  }

  @override
  void dispose() {
    _objet.dispose();
    _message.dispose();
    super.dispose();
  }

  Future<void> _charger() async {
    try {
      final n = await AdminApi.nombreDestinataires();
      if (mounted) {
        setState(() {
          _total = n;
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

  Future<void> _demarrer() async {
    final objet = _objet.text.trim();
    final message = _message.text.trim();
    if (objet.isEmpty || message.isEmpty) {
      _dire('Objet et message obligatoires.');
      return;
    }
    final total = _total ?? 0;
    if (total <= 0) {
      _dire('Aucun abonné à qui écrire pour l’instant.');
      return;
    }
    // Écrire à de vraies personnes ne se défait pas : on confirme d'abord.
    final ok = await showDialog<bool>(
      context: context,
      builder: (c) => AlertDialog(
        title: const Text('Envoyer la campagne ?'),
        content: Text(
          '« $objet » partira à $total abonné${total > 1 ? 's' : ''}. '
          'C’est définitif — on ne peut pas rappeler un e-mail.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(c, false),
            child: const Text('Annuler'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(c, true),
            child: Text('Envoyer à $total'),
          ),
        ],
      ),
    );
    if (ok == true) await _boucle(objet, message, reprendre: false);
  }

  Future<void> _boucle(String objet, String message,
      {required bool reprendre}) async {
    if (!reprendre) {
      _traites = 0;
      _envoyes = 0;
    }
    setState(() {
      _enCours = true;
      _erreurEnvoi = null;
      _fini = false;
    });
    try {
      var fini = false;
      while (!fini) {
        final lot = await AdminApi.envoyerLotCampagne(
          objet: objet,
          message: message,
          offset: _traites,
          limit: 25,
        );
        if (!mounted) return;
        setState(() {
          _envoyes += lot.envoyes;
          _traites = lot.traites;
          _total = lot.total;
        });
        fini = lot.fini;
      }
      if (mounted) {
        setState(() {
          _enCours = false;
          _fini = true;
        });
      }
    } on ApiException catch (e) {
      // On garde _traites : « Reprendre » repartira d'où l'envoi s'est arrêté,
      // sans réexpédier aux abonnés déjà servis.
      if (mounted) {
        setState(() {
          _enCours = false;
          _erreurEnvoi = e.message;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final total = _total;
    return Scaffold(
      appBar: AppBar(title: const Text('Campagne')),
      body: total == null
          ? _centre(_erreur)
          : ListView(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 28),
              children: [
                const Text(
                  'Un e-mail à tous les abonnés de la newsletter. Écrivez en '
                  'texte simple — une ligne vide sépare les paragraphes. Chap.ci '
                  'ajoute le bouton « Voir les annonces » et la signature.',
                  style: TextStyle(color: ChapColors.gray600, height: 1.35),
                ),
                const SizedBox(height: 14),
                _carteDestinataires(total),
                const SizedBox(height: 16),
                TextField(
                  controller: _objet,
                  enabled: !_enCours,
                  textCapitalization: TextCapitalization.sentences,
                  style: const TextStyle(color: ChapColors.gray900),
                  decoration: const InputDecoration(
                    labelText: 'Objet',
                    hintText: 'Les bonnes affaires de la semaine',
                    isDense: true,
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _message,
                  enabled: !_enCours,
                  minLines: 6,
                  maxLines: 12,
                  textCapitalization: TextCapitalization.sentences,
                  style: const TextStyle(color: ChapColors.gray900, height: 1.35),
                  decoration: const InputDecoration(
                    labelText: 'Message',
                    hintText:
                        'Bonjour,\n\nDe nouvelles annonces viennent d’arriver…',
                    alignLabelWithHint: true,
                  ),
                ),
                const SizedBox(height: 18),
                if (_enCours) _progression(total),
                if (_fini) _succes(total),
                if (_erreurEnvoi != null) _panne(),
                if (!_enCours && !_fini) _boutonEnvoi(total),
              ],
            ),
    );
  }

  Widget _carteDestinataires(int total) {
    final vide = total <= 0;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: vide ? ChapColors.cream100 : ChapColors.cream,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
            color: vide ? ChapColors.orangeLight : ChapColors.line2),
      ),
      child: Row(
        children: [
          Icon(vide ? Icons.info_outline : Icons.campaign_outlined,
              size: 22,
              color: vide ? ChapColors.orangeDark : ChapColors.orange),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              vide
                  ? 'Aucun abonné pour l’instant : personne à qui écrire.'
                  : '$total abonné${total > 1 ? 's' : ''} recevront ce message.',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w700,
                color: vide ? ChapColors.ocreDark : ChapColors.gray900,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _boutonEnvoi(int total) {
    return ElevatedButton.icon(
      onPressed: total <= 0 ? null : _demarrer,
      icon: const Icon(Icons.send_outlined, size: 20),
      label: Text(total <= 0
          ? 'Aucun destinataire'
          : 'Envoyer à $total abonné${total > 1 ? 's' : ''}'),
    );
  }

  Widget _progression(int total) {
    final ratio = total > 0 ? (_traites / total).clamp(0.0, 1.0) : null;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: ChapColors.cream,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: ChapColors.line2),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Envoi en cours… $_traites / $total',
              style: const TextStyle(
                  fontWeight: FontWeight.w700, color: ChapColors.gray900)),
          const SizedBox(height: 10),
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: LinearProgressIndicator(
              value: ratio,
              minHeight: 8,
              backgroundColor: ChapColors.line,
              color: ChapColors.orange,
            ),
          ),
          const SizedBox(height: 8),
          const Text('Ne quittez pas cet écran avant la fin.',
              style: TextStyle(fontSize: 12.5, color: ChapColors.gray500)),
        ],
      ),
    );
  }

  Widget _succes(int total) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFEAF7F0),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: ChapColors.green),
      ),
      child: Row(
        children: [
          const Icon(Icons.check_circle, color: ChapColors.greenDark, size: 24),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              'Campagne envoyée : $_envoyes e-mail${_envoyes > 1 ? 's' : ''} '
              'parti${_envoyes > 1 ? 's' : ''} sur $total abonné${total > 1 ? 's' : ''}.',
              style: const TextStyle(
                  fontWeight: FontWeight.w700, color: ChapColors.greenDark),
            ),
          ),
        ],
      ),
    );
  }

  Widget _panne() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: ChapColors.cream100,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: ChapColors.orangeLight),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Envoi interrompu à $_traites (déjà partis : $_envoyes). $_erreurEnvoi',
            style: const TextStyle(
                fontWeight: FontWeight.w600, color: ChapColors.ocreDark),
          ),
          const SizedBox(height: 12),
          ElevatedButton.icon(
            onPressed: () =>
                _boucle(_objet.text.trim(), _message.text.trim(), reprendre: true),
            icon: const Icon(Icons.play_arrow, size: 20),
            label: const Text('Reprendre où ça s’est arrêté'),
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
              : Padding(
                  padding: const EdgeInsets.all(24),
                  child: Text(m,
                      textAlign: TextAlign.center,
                      style: const TextStyle(color: ChapColors.gray600)),
                ),
        ),
      ]);
}
