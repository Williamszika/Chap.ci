import 'package:flutter/material.dart';
import '../../api/admin.dart';
import '../../api/api_client.dart';
import '../../format.dart';
import '../../theme.dart';
import 'annonces_screen.dart';
import 'moderation_screen.dart';
import 'newsletter_screen.dart';
import 'sauvegardes_screen.dart';
import 'utilisateurs_screen.dart';

/// Le tableau de bord, réservé au Patron (et aux modérateurs habilités).
///
/// Deux serrures, comme le site : être admin (l'entrée n'apparaît que pour eux
/// dans Mon compte), puis **déverrouiller** avec le code d'accès. Une fois
/// déverrouillé, l'aperçu : les visiteurs, les grands compteurs, le parcours
/// (arrivés → inscrits → ont publié → ont vendu) et les 14 derniers jours.
class TableauBordScreen extends StatefulWidget {
  /// Aperçu (captures / tests) : quand il est fourni, l'écran s'ouvre
  /// directement sur le tableau avec ces chiffres, sans réseau.
  final StatsAdmin? apercu;
  const TableauBordScreen({super.key, this.apercu});
  @override
  State<TableauBordScreen> createState() => _TableauBordScreenState();
}

enum _Vue { chargement, verrouille, tableau }

class _TableauBordScreenState extends State<TableauBordScreen> {
  _Vue _vue = _Vue.chargement;
  bool _proprietaire = false;
  final _code = TextEditingController();
  bool _enCours = false;
  String? _message;
  StatsAdmin? _stats;

  @override
  void initState() {
    super.initState();
    if (widget.apercu != null) {
      _stats = widget.apercu;
      _vue = _Vue.tableau;
    } else {
      _init();
    }
  }

  @override
  void dispose() {
    _code.dispose();
    super.dispose();
  }

  Future<void> _init() async {
    final acces = await AdminApi.verifier();
    _proprietaire = acces.proprietaire;
    if (await AdminApi.estDeverrouille()) {
      await _chargerStats();
    } else {
      if (mounted) setState(() => _vue = _Vue.verrouille);
    }
  }

  Future<void> _chargerStats() async {
    try {
      final s = await AdminApi.stats();
      if (mounted) {
        setState(() {
          _stats = s;
          _vue = _Vue.tableau;
        });
      }
    } on ApiException catch (e) {
      // 423 = verrouillé (le jeton a expiré) → on redemande le code.
      if (e.statusCode == 423) {
        await AdminApi.reverrouiller();
        if (mounted) setState(() => _vue = _Vue.verrouille);
      } else if (mounted) {
        setState(() {
          _vue = _Vue.verrouille;
          _message = e.message;
        });
      }
    }
  }

  Future<void> _deverrouiller() async {
    final code = _code.text.trim();
    if (code.isEmpty) {
      setState(() => _message = 'Entrez le code d’accès.');
      return;
    }
    setState(() {
      _enCours = true;
      _message = null;
    });
    try {
      await AdminApi.deverrouiller(code);
      _code.clear();
      setState(() => _vue = _Vue.chargement);
      await _chargerStats();
    } on ApiException catch (e) {
      if (mounted) setState(() => _message = e.message);
    } finally {
      if (mounted) setState(() => _enCours = false);
    }
  }

  Future<void> _recevoirCode() async {
    setState(() => _enCours = true);
    final m = await AdminApi.demanderCodeParEmail();
    if (mounted) {
      setState(() {
        _message = m;
        _enCours = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Tableau de bord')),
      body: switch (_vue) {
        _Vue.chargement => const Center(
            child: CircularProgressIndicator(color: ChapColors.orange)),
        _Vue.verrouille => _vueVerrou(),
        _Vue.tableau => RefreshIndicator(
            color: ChapColors.orange,
            onRefresh: _chargerStats,
            child: _vueTableau(_stats!),
          ),
      },
    );
  }

  // — Écran verrouillé : le code d'accès —
  Widget _vueVerrou() {
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(20, 30, 20, 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Icon(Icons.lock_outline, size: 52, color: ChapColors.orange),
          const SizedBox(height: 14),
          const Text('Tableau de bord verrouillé',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 19, fontWeight: FontWeight.w800)),
          const SizedBox(height: 8),
          Text(
            _proprietaire
                ? 'Entrez le code d’accès à usage unique reçu par e-mail. S’il a expiré, demandez-en un nouveau.'
                : 'Entrez le code d’accès que l’administrateur principal vous a remis.',
            textAlign: TextAlign.center,
            style: const TextStyle(color: ChapColors.gray600, height: 1.4),
          ),
          const SizedBox(height: 20),
          TextField(
            controller: _code,
            textAlign: TextAlign.center,
            textCapitalization: TextCapitalization.characters,
            style: const TextStyle(
                fontSize: 20, fontWeight: FontWeight.w800, letterSpacing: 4),
            decoration: const InputDecoration(hintText: 'code d’accès'),
            onSubmitted: (_) => _deverrouiller(),
          ),
          if (_message != null) ...[
            const SizedBox(height: 10),
            Text(_message!,
                textAlign: TextAlign.center,
                style: const TextStyle(color: ChapColors.gray700)),
          ],
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: _enCours ? null : _deverrouiller,
            child: _enCours
                ? const SizedBox(
                    height: 20,
                    width: 20,
                    child: CircularProgressIndicator(
                        strokeWidth: 2, color: Colors.white))
                : const Text('Déverrouiller'),
          ),
          if (_proprietaire) ...[
            const SizedBox(height: 6),
            TextButton(
              onPressed: _enCours ? null : _recevoirCode,
              child: const Text('Recevoir le code par e-mail',
                  style: TextStyle(color: ChapColors.gray700)),
            ),
          ],
        ],
      ),
    );
  }

  // — L'aperçu —
  Widget _vueTableau(StatsAdmin s) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 30),
      children: [
        _carteVisiteurs(s),
        const SizedBox(height: 14),
        _grilleCompteurs(s),
        const SizedBox(height: 12),
        _boutonModeration(s.reportsOpen),
        const SizedBox(height: 8),
        OutlinedButton.icon(
          onPressed: () => Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => const UtilisateursScreen())),
          icon: const Icon(Icons.people_outline, size: 18),
          label: const Text('Utilisateurs'),
          style: OutlinedButton.styleFrom(
            minimumSize: const Size.fromHeight(46),
            foregroundColor: ChapColors.orange,
            side: BorderSide(color: ChapColors.orange.withValues(alpha: 0.5)),
          ),
        ),
        const SizedBox(height: 8),
        OutlinedButton.icon(
          onPressed: () => Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => const AnnoncesAdminScreen())),
          icon: const Icon(Icons.sell_outlined, size: 18),
          label: const Text('Annonces'),
          style: OutlinedButton.styleFrom(
            minimumSize: const Size.fromHeight(46),
            foregroundColor: ChapColors.orange,
            side: BorderSide(color: ChapColors.orange.withValues(alpha: 0.5)),
          ),
        ),
        const SizedBox(height: 8),
        OutlinedButton.icon(
          onPressed: () => Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => const SauvegardesScreen())),
          icon: const Icon(Icons.backup_outlined, size: 18),
          label: const Text('Sauvegardes'),
          style: OutlinedButton.styleFrom(
            minimumSize: const Size.fromHeight(46),
            foregroundColor: ChapColors.orange,
            side: BorderSide(color: ChapColors.orange.withValues(alpha: 0.5)),
          ),
        ),
        const SizedBox(height: 8),
        OutlinedButton.icon(
          onPressed: () => Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => const NewsletterScreen())),
          icon: const Icon(Icons.mail_outline, size: 18),
          label: const Text('Newsletter'),
          style: OutlinedButton.styleFrom(
            minimumSize: const Size.fromHeight(46),
            foregroundColor: ChapColors.orange,
            side: BorderSide(color: ChapColors.orange.withValues(alpha: 0.5)),
          ),
        ),
        const SizedBox(height: 18),
        _titre('Le parcours'),
        const SizedBox(height: 4),
        const Text(
          'Arrivés → inscrits → ont publié → ont vendu. L’écart entre deux '
          'marches est une perte : il désigne l’étape à réparer.',
          style: TextStyle(fontSize: 12.5, color: ChapColors.gray600, height: 1.3),
        ),
        const SizedBox(height: 10),
        _parcours('7 derniers jours', s.j7),
        _parcours('30 derniers jours', s.j30),
        _parcours('Depuis le début', s.tout),
        const SizedBox(height: 18),
        _titre('Les 14 derniers jours'),
        const SizedBox(height: 10),
        _graphique(s.serie),
        if (s.securite != null) ...[
          const SizedBox(height: 18),
          _titre('Sécurité'),
          const SizedBox(height: 10),
          _carteSecurite(s.securite!),
        ],
      ],
    );
  }

  Widget _carteSecurite(SecuriteApercu sec) {
    const rouge = Color(0xFFB42318);
    // Intégrité de la table des administrateurs.
    final (intTexte, intCouleur, intIc) = sec.adminsIntacts == true
        ? ('Intacte', ChapColors.greenDark, Icons.verified_user_outlined)
        : sec.adminsIntacts == false
            ? ('Altérée — à vérifier', rouge, Icons.gpp_bad_outlined)
            : ('Référence absente', ChapColors.gray500, Icons.help_outline);
    return Container(
      padding: const EdgeInsets.all(6),
      decoration: BoxDecoration(
        color: ChapColors.cream,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: ChapColors.line2),
      ),
      child: Column(
        children: [
          _ligneSecurite(
            Icons.lock_outline,
            'Connexions échouées (7 j)',
            '${sec.connexionsEchouees}',
            sec.connexionsEchouees > 10 ? rouge : ChapColors.gray900,
          ),
          _ligneSecurite(intIc, 'Table des administrateurs', intTexte, intCouleur),
          _ligneSecurite(
            Icons.shield_outlined,
            'Double authentification (vous)',
            sec.proprietaire2fa ? 'Activée' : 'Non activée',
            sec.proprietaire2fa ? ChapColors.greenDark : ChapColors.orangeDark,
          ),
          _ligneSecurite(
            Icons.warning_amber_outlined,
            'Alertes (7 j)',
            '${sec.alertes}',
            sec.alertes > 0 ? rouge : ChapColors.greenDark,
          ),
        ],
      ),
    );
  }

  Widget _ligneSecurite(IconData ic, String label, String valeur, Color couleur) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 10),
      child: Row(
        children: [
          Icon(ic, size: 19, color: couleur),
          const SizedBox(width: 10),
          Expanded(
            child: Text(label,
                style: const TextStyle(fontSize: 13.5, color: ChapColors.gray700)),
          ),
          Text(valeur,
              style: TextStyle(
                  fontSize: 13.5, fontWeight: FontWeight.w700, color: couleur)),
        ],
      ),
    );
  }

  Widget _boutonModeration(int ouverts) {
    final urgent = ouverts > 0;
    final c = urgent ? const Color(0xFFB42318) : ChapColors.orange;
    return OutlinedButton.icon(
      onPressed: () => Navigator.of(context).push(
          MaterialPageRoute(builder: (_) => const ModerationScreen())),
      icon: const Icon(Icons.gavel_outlined, size: 18),
      label: Text(urgent
          ? 'Modération — $ouverts à traiter'
          : 'Modération — file vide'),
      style: OutlinedButton.styleFrom(
        minimumSize: const Size.fromHeight(46),
        foregroundColor: c,
        side: BorderSide(color: c.withValues(alpha: 0.5)),
      ),
    );
  }

  Widget _titre(String t) => Text(t,
      style: const TextStyle(
          fontSize: 16, fontWeight: FontWeight.w800, color: ChapColors.gray900));

  Widget _carteVisiteurs(StatsAdmin s) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [ChapColors.orange, ChapColors.orangeDark],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.groups_outlined, color: Colors.white, size: 18),
              SizedBox(width: 6),
              Text('Visiteurs uniques',
                  style: TextStyle(
                      color: Colors.white, fontWeight: FontWeight.w600, fontSize: 13)),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              _visiteurBloc('Aujourd’hui', s.visJour),
              _visiteurBloc('7 jours', s.visSemaine),
              _visiteurBloc('Moy./jour', s.visParJour),
            ],
          ),
        ],
      ),
    );
  }

  Widget _visiteurBloc(String label, int n) {
    return Expanded(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('$n',
              style: const TextStyle(
                  color: Colors.white, fontSize: 24, fontWeight: FontWeight.w900)),
          Text(label,
              style: TextStyle(
                  color: Colors.white.withValues(alpha: 0.85), fontSize: 11.5)),
        ],
      ),
    );
  }

  Widget _grilleCompteurs(StatsAdmin s) {
    final items = <(IconData, String, String, Color?)>[
      (Icons.person_outline, 'Comptes', '${s.users}', null),
      (Icons.sell_outlined, 'Annonces', '${s.listings}', null),
      (Icons.chat_bubble_outline, 'Conversations', '${s.conversations}', null),
      (Icons.receipt_long_outlined, 'Commandes', '${s.orders}', null),
      (Icons.star_outline, 'Avis', '${s.reviews}', null),
      (Icons.mail_outline, 'Newsletter', '${s.newsletter}', null),
      (Icons.payments_outlined, 'Ventes', formatFCFA(s.ordersValue), ChapColors.greenDark),
      (
        Icons.flag_outlined,
        'Signalements',
        '${s.reportsOpen}',
        s.reportsOpen > 0 ? const Color(0xFFB42318) : null,
      ),
    ];
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: 10,
      crossAxisSpacing: 10,
      childAspectRatio: 2.4,
      children: [for (final it in items) _compteur(it.$1, it.$2, it.$3, it.$4)],
    );
  }

  Widget _compteur(IconData ic, String label, String valeur, Color? accent) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: ChapColors.cream,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: ChapColors.line2),
      ),
      child: Row(
        children: [
          Icon(ic, size: 20, color: accent ?? ChapColors.gray600),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                FittedBox(
                  fit: BoxFit.scaleDown,
                  alignment: Alignment.centerLeft,
                  child: Text(valeur,
                      maxLines: 1,
                      style: TextStyle(
                          fontSize: 17,
                          fontWeight: FontWeight.w900,
                          color: accent ?? ChapColors.gray900)),
                ),
                Text(label,
                    style: const TextStyle(fontSize: 11.5, color: ChapColors.gray600)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _parcours(String titre, Marche m) {
    final etapes = [
      ('Arrivés', m.visiteurs),
      ('Inscrits', m.comptes),
      ('Ont publié', m.publie),
      ('Ont vendu', m.vendu),
    ];
    final maxi = etapes.map((e) => e.$2).fold<int>(1, (a, b) => b > a ? b : a);
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: ChapColors.cream,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: ChapColors.line2),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(titre,
              style: const TextStyle(
                  fontSize: 12.5,
                  fontWeight: FontWeight.w700,
                  color: ChapColors.gray700)),
          const SizedBox(height: 8),
          for (final e in etapes) ...[
            Row(
              children: [
                SizedBox(
                    width: 78,
                    child: Text(e.$1,
                        style: const TextStyle(
                            fontSize: 12, color: ChapColors.gray700))),
                Expanded(
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(6),
                    child: LinearProgressIndicator(
                      value: maxi == 0 ? 0 : e.$2 / maxi,
                      minHeight: 14,
                      backgroundColor: ChapColors.cream100,
                      valueColor:
                          const AlwaysStoppedAnimation(ChapColors.orange),
                    ),
                  ),
                ),
                SizedBox(
                    width: 42,
                    child: Text('${e.$2}',
                        textAlign: TextAlign.right,
                        style: const TextStyle(
                            fontSize: 12.5,
                            fontWeight: FontWeight.w700,
                            color: ChapColors.gray900))),
              ],
            ),
            const SizedBox(height: 6),
          ],
        ],
      ),
    );
  }

  Widget _graphique(List<PointJour> serie) {
    final maxi = serie
        .expand((p) => [p.comptes, p.annonces])
        .fold<int>(1, (a, b) => b > a ? b : a);
    return Container(
      padding: const EdgeInsets.fromLTRB(12, 14, 12, 10),
      decoration: BoxDecoration(
        color: ChapColors.cream,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: ChapColors.line2),
      ),
      child: Column(
        children: [
          SizedBox(
            height: 110,
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                for (final p in serie)
                  Expanded(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 2),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.end,
                        children: [
                          _barre(p.annonces / maxi, ChapColors.orange),
                          const SizedBox(height: 2),
                          _barre(p.comptes / maxi, ChapColors.green),
                        ],
                      ),
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(height: 10),
          const Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              _Legende(couleur: ChapColors.orange, texte: 'Annonces'),
              SizedBox(width: 16),
              _Legende(couleur: ChapColors.green, texte: 'Comptes'),
            ],
          ),
        ],
      ),
    );
  }

  Widget _barre(double part, Color c) {
    final h = (part.isNaN ? 0.0 : part.clamp(0.0, 1.0)) * 44;
    return Container(
      height: h < 2 && part > 0 ? 2 : h,
      decoration: BoxDecoration(
        color: c,
        borderRadius: BorderRadius.circular(2),
      ),
    );
  }
}

class _Legende extends StatelessWidget {
  final Color couleur;
  final String texte;
  const _Legende({required this.couleur, required this.texte});
  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
            width: 10,
            height: 10,
            decoration:
                BoxDecoration(color: couleur, borderRadius: BorderRadius.circular(2))),
        const SizedBox(width: 5),
        Text(texte, style: const TextStyle(fontSize: 11.5, color: ChapColors.gray600)),
      ],
    );
  }
}
