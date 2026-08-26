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
    return InkWell(
      borderRadius: BorderRadius.circular(14),
      onTap: () async {
        // La fiche complète : QUI demande (compte, historique) et QUOI (le
        // dossier), et la décision au même endroit.
        await Navigator.of(context).push(MaterialPageRoute(
            builder: (_) => FicheDemandePro(demande: d)));
        _charger();
      },
      child: Container(
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

/// La fiche complète d'une demande : QUI demande — le compte, son historique
/// (`GET /admin/users/{id}`) — et QUOI — le dossier déposé —, puis la
/// décision, le tout au même endroit. L'écran reste en français : il est à
/// l'équipe.
class FicheDemandePro extends StatefulWidget {
  final Map<String, dynamic> demande;
  const FicheDemandePro({super.key, required this.demande});

  @override
  State<FicheDemandePro> createState() => _FicheDemandeProState();
}

class _FicheDemandeProState extends State<FicheDemandePro> {
  Map<String, dynamic>? _compte;
  String? _erreur;
  bool _occupe = false;

  static const Map<String, String> _types = _DemandesProScreenState._types;

  @override
  void initState() {
    super.initState();
    _charger();
  }

  Future<void> _charger() async {
    try {
      final d = await ApiClient.instance
          .get('/admin/users/${widget.demande['userId']}');
      if (d is Map && mounted) {
        setState(() => _compte = Map<String, dynamic>.from(d));
      }
    } on ApiException catch (e) {
      if (mounted) setState(() => _erreur = e.message);
    }
  }

  Future<void> _decider(String action) async {
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
    setState(() => _occupe = true);
    try {
      await ApiClient.instance.post('/admin/pro/decider', {
        'userId': widget.demande['userId'],
        'action': action,
        'motif': motif,
      });
      if (mounted) Navigator.of(context).pop();
    } on ApiException catch (e) {
      if (mounted) {
        setState(() => _occupe = false);
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text(e.message)));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final d = widget.demande;
    final enAttente = (d['status'] as String?) == 'en_attente';
    final chiffres = (_compte?['chiffres'] as Map?) ?? const {};
    return Scaffold(
      appBar: AppBar(title: const Text('Demande Pro')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(14, 14, 14, 28),
        children: [
          // -- Le dossier ------------------------------------------------------
          _bloc('LE DOSSIER', [
            _ligne('Nom commercial', (d['proNom'] as String?) ?? '—'),
            _ligne('Type',
                _types[d['type']] ?? (d['type'] as String? ?? '—')),
            _ligne('Numéro officiel',
                (d['numero'] as String?)?.isNotEmpty == true
                    ? d['numero'] as String
                    : '— non fourni —'),
            if ((d['secteur'] as String?)?.isNotEmpty == true)
              _ligne('Secteur', d['secteur'] as String),
            if ((d['tel'] as String?)?.isNotEmpty == true)
              _ligne('Téléphone pro', d['tel'] as String),
            if (d['demandeAt'] is int && (d['demandeAt'] as int) > 0)
              _ligne('Déposée', tempsEcoule(d['demandeAt'] as int)),
            if ((d['motif'] as String?)?.isNotEmpty == true)
              _ligne('Motif du refus', d['motif'] as String),
          ]),
          const SizedBox(height: 12),
          // -- Le compte -------------------------------------------------------
          if (_erreur != null)
            Text(_erreur!,
                style: const TextStyle(color: Color(0xFFB42318)))
          else if (_compte == null)
            const Padding(
              padding: EdgeInsets.all(20),
              child: Center(
                  child:
                      CircularProgressIndicator(color: ChapColors.orange)),
            )
          else ...[
            _bloc('LE COMPTE', [
              _ligne('Nom', (_compte!['fullName'] as String?) ?? '—'),
              _ligne('E-mail', (_compte!['email'] as String?) ?? '—'),
              _ligne('E-mail vérifié',
                  _compte!['emailVerifie'] == true ? 'Oui ✓' : 'Non'),
              if ((_compte!['phone'] as String?)?.isNotEmpty == true)
                _ligne('Téléphone', _compte!['phone'] as String),
              if ((_compte!['commune'] as String?)?.isNotEmpty == true)
                _ligne('Commune', _compte!['commune'] as String),
              if (_compte!['createdAt'] is int)
                _ligne('Inscrit', tempsEcoule(_compte!['createdAt'] as int)),
              _ligne('Connexion',
                  (_compte!['provider'] as String?) ?? 'email'),
            ]),
            const SizedBox(height: 12),
            _bloc('SON HISTORIQUE', [
              _ligne('Annonces', '${chiffres['annonces'] ?? 0}'
                  '${(chiffres['annoncesVendues'] ?? 0) != 0 ? ' · ${chiffres['annoncesVendues']} vendues' : ''}'),
              _ligne('Signalements subis',
                  '${chiffres['signalementsSubis'] ?? 0}'),
              _ligne('Avis reçus', '${chiffres['avisRecus'] ?? 0}'),
              _ligne('Conversations', '${chiffres['conversations'] ?? 0}'),
            ]),
          ],
          if (enAttente) ...[
            const SizedBox(height: 8),
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 2),
              child: Text(
                'Commerce : vérifiez le numéro RCCM sur rccm.ohada.org avant d’approuver.',
                style: TextStyle(fontSize: 11.5, color: ChapColors.gray500),
              ),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: ElevatedButton(
                    onPressed: _occupe ? null : () => _decider('approuver'),
                    style: ElevatedButton.styleFrom(
                        backgroundColor: ChapColors.greenDark,
                        padding: const EdgeInsets.symmetric(vertical: 14)),
                    child: Text(_occupe ? '…' : 'Approuver la demande'),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: OutlinedButton(
                    onPressed: _occupe ? null : () => _decider('refuser'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: const Color(0xFFB42318),
                      side: const BorderSide(color: Color(0xFFF1C9C4)),
                      padding: const EdgeInsets.symmetric(vertical: 14),
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

  Widget _bloc(String titre, List<Widget> lignes) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: ChapColors.cream,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: ChapColors.line2),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(titre,
              style: const TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 0.8,
                  color: ChapColors.gray500)),
          const SizedBox(height: 8),
          ...lignes,
        ],
      ),
    );
  }

  Widget _ligne(String label, String valeur) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 118,
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
