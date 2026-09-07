import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:url_launcher/url_launcher.dart';

import '../data/dons.dart';
import '../format.dart';
import '../i18n/textes.dart';
import '../theme.dart';

/// SOUTENIR CHAP.CI — le don par Mobile Money (07/09/2026).
///
/// Le Patron : « Soutenir Chap.ci n'est pas dans l'app ». Port fidèle de la
/// page `/don` du site : un montant, un opérateur, le numéro à créditer, et le
/// bouton qui ouvre le menu de l'opérateur.
///
/// ⚠️ CHAP.CI N'ENCAISSE RIEN. L'argent va du téléphone du donateur à
/// l'opérateur ; le site n'est à aucun moment dans le circuit et ne sait même
/// pas qu'un don a eu lieu. Deux promesses fausses ont été retirées de la page
/// du site pour cette raison — « paiement sécurisé » et « reçu envoyé par
/// SMS » — sur un écran qui demande de l'argent, c'était le pire endroit
/// possible. On ne les réintroduit pas ici : le seul justificatif est le
/// message de l'opérateur, et on le dit.
class DonScreen extends StatefulWidget {
  const DonScreen({super.key});

  @override
  State<DonScreen> createState() => _DonScreenState();
}

class _DonScreenState extends State<DonScreen> {
  int? _montant = montantDonDefaut;
  bool _autre = false;
  final _autreMontant = TextEditingController();
  String _operateur = operateursDon.first.id;
  bool _copie = false;

  @override
  void dispose() {
    _autreMontant.dispose();
    super.dispose();
  }

  OperateurDon get _op =>
      operateursDon.firstWhere((o) => o.id == _operateur, orElse: () => operateursDon.first);

  int? get _montantChoisi {
    if (!_autre) return _montant;
    final t = _autreMontant.text.trim();
    return t.isEmpty ? null : int.tryParse(t);
  }

  Future<void> _copier() async {
    await Clipboard.setData(ClipboardData(text: _op.numeroBrut));
    if (!mounted) return;
    setState(() => _copie = true);
    await Future.delayed(const Duration(milliseconds: 1800));
    if (mounted) setState(() => _copie = false);
  }

  Future<void> _donner() async {
    final ussd = _op.ussd;
    if (ussd == null) {
      // Wave n'a pas de code : on copie le numéro, c'est le geste utile.
      await _copier();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(tr(context, 'don.numeroCopie'))));
      }
      return;
    }
    try {
      await launchUrl(Uri.parse(lienUssd(ussd)),
          mode: LaunchMode.externalApplication);
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(tr(context, 'don.composerEchec'))));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final montant = _montantChoisi;
    return Scaffold(
      appBar: AppBar(title: Text(tr(context, 'don.titre'))),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 18, 20, 32),
        children: [
          // L'en-tête : le cœur, le titre, l'accroche — comme sur le site.
          Center(
            child: Column(
              children: [
                const Text('🧡', style: TextStyle(fontSize: 40)),
                const SizedBox(height: 8),
                Text(tr(context, 'don.titre'),
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.w800,
                        color: ChapColors.gray900)),
                const SizedBox(height: 4),
                Text(tr(context, 'don.sousTitre'),
                    textAlign: TextAlign.center,
                    style: const TextStyle(fontSize: 13, color: ChapColors.gray600)),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // ── Le montant ─────────────────────────────────────────────────────
          _label(tr(context, 'don.montant')),
          const SizedBox(height: 8),
          GridView.count(
            crossAxisCount: 3,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            mainAxisSpacing: 10,
            crossAxisSpacing: 10,
            childAspectRatio: 2.1,
            children: [
              for (final m in montantsDon)
                _tuile(
                  texte: formatNombre(m),
                  actif: !_autre && _montant == m,
                  onTap: () => setState(() {
                    _montant = m;
                    _autre = false;
                    _autreMontant.clear();
                  }),
                ),
              _tuile(
                texte: tr(context, 'don.autre'),
                actif: _autre,
                onTap: () => setState(() => _autre = true),
              ),
            ],
          ),
          if (_autre) ...[
            const SizedBox(height: 10),
            TextField(
              controller: _autreMontant,
              keyboardType: TextInputType.number,
              autofocus: true,
              onChanged: (_) => setState(() {}),
              decoration: InputDecoration(
                hintText: tr(context, 'don.votreMontant'),
                prefixIcon: const Icon(Icons.payments_outlined),
              ),
            ),
          ],
          if (montant != null && montant > 0) ...[
            const SizedBox(height: 10),
            Center(
              child: Text(
                tr(context, 'don.vousAllezDonner')
                    .replaceAll('{m}', formatFCFA(montant)),
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 13.5, color: ChapColors.gray600),
              ),
            ),
          ],
          const SizedBox(height: 22),

          // ── Le moyen de paiement ───────────────────────────────────────────
          _label(tr(context, 'don.moyen')),
          const SizedBox(height: 8),
          Row(
            children: [
              for (final o in operateursDon) ...[
                Expanded(
                  child: _tuile(
                    texte: '${o.emoji}  ${o.nom}',
                    actif: o.id == _operateur,
                    onTap: () => setState(() => _operateur = o.id),
                    hauteur: 52,
                  ),
                ),
                if (o.id != operateursDon.last.id) const SizedBox(width: 10),
              ],
            ],
          ),
          const SizedBox(height: 22),

          // ── Le numéro à créditer ───────────────────────────────────────────
          _label(tr(context, 'don.numero')),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.fromLTRB(14, 10, 10, 10),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: ChapColors.line2),
            ),
            child: Row(
              children: [
                const Icon(Icons.phone_outlined, size: 18, color: ChapColors.gray500),
                const SizedBox(width: 10),
                Expanded(
                  child: SelectableText(
                    _op.numero,
                    style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                        color: ChapColors.gray900),
                  ),
                ),
                TextButton.icon(
                  onPressed: _copier,
                  icon: Icon(_copie ? Icons.check : Icons.copy,
                      size: 15,
                      color: _copie ? ChapColors.greenDark : ChapColors.gray700),
                  label: Text(
                      tr(context, _copie ? 'don.copie' : 'don.copier'),
                      style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                          color: _copie ? ChapColors.greenDark : ChapColors.gray700)),
                  style: TextButton.styleFrom(minimumSize: const Size(0, 44)),
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),
          Text(_op.commentFaire,
              style: const TextStyle(
                  fontSize: 12, height: 1.45, color: ChapColors.gray600)),
          const SizedBox(height: 18),

          // ── Le bouton principal ────────────────────────────────────────────
          ElevatedButton(
            onPressed: _donner,
            style: ElevatedButton.styleFrom(minimumSize: const Size.fromHeight(52)),
            child: Text(
              montant != null && montant > 0
                  ? tr(context, 'don.faireDeM').replaceAll('{m}', formatFCFA(montant))
                  : tr(context, 'don.faire'),
              style: const TextStyle(fontSize: 15.5, fontWeight: FontWeight.w800),
            ),
          ),
          const SizedBox(height: 10),
          // La vérité sur qui encaisse. Elle reste, même si elle refroidit.
          Text(tr(context, 'don.avertissement'),
              textAlign: TextAlign.center,
              style: const TextStyle(
                  fontSize: 11.5, height: 1.45, color: ChapColors.gray500)),
          const SizedBox(height: 22),

          // ── Pourquoi donner ────────────────────────────────────────────────
          _carte(
            titre: tr(context, 'don.pourquoi'),
            enfant: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                for (final c in ['don.raison1', 'don.raison2', 'don.raison3'])
                  Padding(
                    padding: const EdgeInsets.only(top: 10),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Icon(Icons.check, size: 18, color: ChapColors.greenDark),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(tr(context, c),
                              style: const TextStyle(
                                  fontSize: 13.5, color: ChapColors.gray700)),
                        ),
                      ],
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(height: 12),

          // ── Sécurité et transparence ───────────────────────────────────────
          _carte(
            titre: tr(context, 'don.securite'),
            icone: Icons.verified_user_outlined,
            enfant: Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Text(tr(context, 'don.transparence'),
                  style: const TextStyle(
                      fontSize: 13.5, height: 1.5, color: ChapColors.gray700)),
            ),
          ),
          const SizedBox(height: 20),
          Center(
            child: Text(tr(context, 'don.merci'),
                textAlign: TextAlign.center,
                style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    color: ChapColors.orangeDark)),
          ),
        ],
      ),
    );
  }

  Widget _label(String t) => Text(t,
      style: const TextStyle(
          fontSize: 13.5, fontWeight: FontWeight.w700, color: ChapColors.gray700));

  Widget _tuile({
    required String texte,
    required bool actif,
    required VoidCallback onTap,
    double hauteur = 0,
  }) {
    final contenu = Center(
      child: Text(texte,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: TextStyle(
              fontSize: 14.5,
              fontWeight: FontWeight.w800,
              color: actif ? ChapColors.orangeDark : ChapColors.gray900)),
    );
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        height: hauteur > 0 ? hauteur : null,
        padding: const EdgeInsets.symmetric(horizontal: 6),
        decoration: BoxDecoration(
          color: actif ? const Color(0xFFFFF6EC) : Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
              color: actif ? ChapColors.orange : ChapColors.line2, width: 1.5),
        ),
        child: contenu,
      ),
    );
  }

  Widget _carte({required String titre, required Widget enfant, IconData? icone}) =>
      Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: ChapColors.line2),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                if (icone != null) ...[
                  Icon(icone, size: 18, color: ChapColors.orange),
                  const SizedBox(width: 8),
                ],
                Expanded(
                  child: Text(titre,
                      style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w800,
                          color: ChapColors.gray900)),
                ),
              ],
            ),
            enfant,
          ],
        ),
      );
}
