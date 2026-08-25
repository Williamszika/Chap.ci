import 'package:flutter/material.dart';
import '../../api/api_client.dart';
import '../../format.dart';
import '../../theme.dart';

/// Administration — les demandes de comptes professionnels.
///
/// La liste (`GET /admin/pro`) montre les dossiers en attente en premier, puis
/// les décidés. Pour chaque dossier : le type d'organisation, le nom
/// commercial, le numéro officiel (RCCM / récépissé / agrément — à vérifier
/// sur rccm.ohada.org pour un commerce), et les boutons Approuver / Refuser
/// (`POST /admin/pro/decider`). L'écran reste en français : il est à vous.
class DemandesProScreen extends StatefulWidget {
  const DemandesProScreen({super.key});
  @override
  State<DemandesProScreen> createState() => _DemandesProScreenState();
}

class _DemandesProScreenState extends State<DemandesProScreen> {
  List<Map<String, dynamic>> _demandes = [];
  bool _chargement = true;
  String? _erreur;

  static const Map<String, String> _types = {
    'boutique': '🏪 Boutique / Commerce',
    'commerce': '🏪 Boutique / Commerce', // ancien nom, première version
    'vehicules': '🚗 Auto-moto / Garage',
    'immobilier': '🏠 Agence immobilière',
    'services': '🛠️ Artisan / Prestataire de services',
    'formation': '🎓 École / Centre de formation',
    'emploi': '🏢 Employeur / Recruteur',
    'voyage': '✈️ Agence de voyage',
    'agro': '🌾 Producteur / Agro-élevage',
    'sante': '💊 Santé & Bien-être',
    'association': '❤️ Association / ONG',
  };

  @override
  void initState() {
    super.initState();
    _charger();
  }

  Future<void> _charger() async {
    setState(() {
      _chargement = true;
      _erreur = null;
    });
    try {
      final d = await ApiClient.instance.get('/admin/pro');
      if (d is Map && d['demandes'] is List && mounted) {
        setState(() => _demandes = (d['demandes'] as List)
            .whereType<Map>()
            .map((e) => Map<String, dynamic>.from(e))
            .toList());
      }
    } on ApiException catch (e) {
      if (mounted) setState(() => _erreur = e.message);
    } finally {
      if (mounted) setState(() => _chargement = false);
    }
  }

  Future<void> _decider(Map<String, dynamic> d, String action) async {
    String motif = '';
    if (action == 'refuser') {
      final ctrl = TextEditingController();
      final ok = await showDialog<bool>(
        context: context,
        builder: (c) => AlertDialog(
          backgroundColor: ChapColors.cream,
          title: const Text('Refuser la demande ?'),
          content: TextField(
            controller: ctrl,
            maxLength: 300,
            maxLines: 3,
            decoration: const InputDecoration(
              labelText: 'Motif (envoyé à la personne)',
              hintText: 'Ex : numéro RCCM introuvable au registre.',
            ),
          ),
          actions: [
            TextButton(
                onPressed: () => Navigator.pop(c, false),
                child: const Text('Annuler')),
            TextButton(
                onPressed: () => Navigator.pop(c, true),
                child: const Text('Refuser',
                    style: TextStyle(color: Color(0xFFB42318)))),
          ],
        ),
      );
      if (ok != true) return;
      motif = ctrl.text.trim();
    }
    try {
      await ApiClient.instance.post('/admin/pro/decider', {
        'userId': d['userId'],
        'action': action,
        'motif': motif,
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(action == 'approuver'
              ? '${d['proNom']} est maintenant un compte Pro.'
              : 'Demande refusée — la personne est prévenue par e-mail.'),
          backgroundColor:
              action == 'approuver' ? ChapColors.greenDark : null,
        ));
        _charger();
      }
    } on ApiException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text(e.message)));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Demandes Pro')),
      body: _chargement
          ? const Center(
              child: CircularProgressIndicator(color: ChapColors.orange))
          : RefreshIndicator(
              color: ChapColors.orange,
              onRefresh: _charger,
              child: _erreur != null
                  ? ListView(children: [
                      Padding(
                        padding: const EdgeInsets.all(28),
                        child: Text(_erreur!,
                            textAlign: TextAlign.center,
                            style:
                                const TextStyle(color: Color(0xFFB42318))),
                      ),
                    ])
                  : _demandes.isEmpty
                      ? ListView(children: const [
                          SizedBox(height: 120),
                          Icon(Icons.workspace_premium_outlined,
                              size: 46, color: ChapColors.line2),
                          SizedBox(height: 12),
                          Center(
                              child: Text('Aucune demande pour le moment.',
                                  style: TextStyle(
                                      color: ChapColors.gray600))),
                        ])
                      : ListView.builder(
                          padding: const EdgeInsets.fromLTRB(14, 14, 14, 28),
                          itemCount: _demandes.length,
                          itemBuilder: (c, i) => _carte(_demandes[i]),
                        ),
            ),
    );
  }

  Widget _carte(Map<String, dynamic> d) {
    final statut = (d['status'] as String?) ?? '';
    final enAttente = statut == 'en_attente';
    final Color bord = enAttente
        ? ChapColors.orange
        : statut == 'approuve'
            ? const Color(0xFFBEE6D1)
            : const Color(0xFFF1C9C4);
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: ChapColors.cream,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: bord, width: enAttente ? 1.6 : 1),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text((d['proNom'] as String?) ?? '—',
                    style: const TextStyle(
                        fontSize: 15.5, fontWeight: FontWeight.w800)),
              ),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: enAttente
                      ? const Color(0xFFFFF4E0)
                      : statut == 'approuve'
                          ? const Color(0xFFE6F6EE)
                          : const Color(0xFFFDECEC),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                    enAttente
                        ? 'En attente'
                        : statut == 'approuve'
                            ? 'Approuvée'
                            : 'Refusée',
                    style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: enAttente
                            ? ChapColors.ocreDark
                            : statut == 'approuve'
                                ? ChapColors.greenDark
                                : const Color(0xFFB42318))),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(_types[d['type']] ?? (d['type'] as String? ?? ''),
              style:
                  const TextStyle(fontSize: 13, color: ChapColors.gray700)),
          const SizedBox(height: 8),
          _ligneInfo('Compte', '${d['nom'] ?? '—'} · ${d['email'] ?? ''}'),
          _ligneInfo('Numéro officiel',
              (d['numero'] as String?)?.isNotEmpty == true
                  ? d['numero'] as String
                  : '— non fourni —'),
          if ((d['tel'] as String?)?.isNotEmpty == true)
            _ligneInfo('Téléphone', d['tel'] as String),
          if ((d['secteur'] as String?)?.isNotEmpty == true)
            _ligneInfo('Secteur', d['secteur'] as String),
          if (d['demandeAt'] is int && (d['demandeAt'] as int) > 0)
            _ligneInfo('Déposée', tempsEcoule(d['demandeAt'] as int)),
          if ((d['motif'] as String?)?.isNotEmpty == true)
            _ligneInfo('Motif du refus', d['motif'] as String),
          if (enAttente) ...[
            const SizedBox(height: 6),
            const Text(
              'Commerce : vérifiez le numéro RCCM sur rccm.ohada.org avant d’approuver.',
              style: TextStyle(fontSize: 11.5, color: ChapColors.gray500),
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                Expanded(
                  child: ElevatedButton(
                    onPressed: () => _decider(d, 'approuver'),
                    style: ElevatedButton.styleFrom(
                        backgroundColor: ChapColors.greenDark),
                    child: const Text('Approuver'),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => _decider(d, 'refuser'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: const Color(0xFFB42318),
                      side: const BorderSide(color: Color(0xFFF1C9C4)),
                    ),
                    child: const Text('Refuser'),
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _ligneInfo(String label, String valeur) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 3),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 110,
            child: Text(label,
                style: const TextStyle(
                    fontSize: 12, color: ChapColors.gray500)),
          ),
          Expanded(
            child: Text(valeur,
                style: const TextStyle(
                    fontSize: 12.5, fontWeight: FontWeight.w600)),
          ),
        ],
      ),
    );
  }
}
