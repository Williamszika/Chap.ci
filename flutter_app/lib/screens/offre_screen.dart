import 'package:flutter/material.dart';
import 'package:share_plus/share_plus.dart';
import 'package:url_launcher/url_launcher.dart';

import '../api/api_client.dart';
import '../api/offres.dart';
import '../i18n/formats_i18n.dart';
import '../i18n/textes.dart';
import '../theme.dart';
import '../widgets/carte_offre.dart' show LogoOffre, PuceOffre;
import 'offres_pro_screen.dart';
import 'vendeur_screen.dart';

/// Une offre d'emploi (06/09/2026) — l'équivalent de /emploi/{id} sur le site.
///
/// Pour le candidat : qui recrute, le poste, et comment postuler — par le lien
/// de la structure (Google Forms, WhatsApp, son site), par le formulaire
/// qu'elle a dessiné, ou les deux. Pour l'auteur : les candidatures reçues,
/// une par personne, avec les réponses question par question.
class OffreScreen extends StatefulWidget {
  final String offreId;

  /// Aperçu (tests) : données injectées, aucun appel réseau.
  final bool apercu;
  final OffreEmploi? apercuOffre;
  final bool apercuProprietaire;
  final bool apercuConnecte;

  const OffreScreen({
    super.key,
    required this.offreId,
    this.apercu = false,
    this.apercuOffre,
    this.apercuProprietaire = false,
    this.apercuConnecte = false,
  });

  @override
  State<OffreScreen> createState() => _OffreScreenState();
}

class _OffreScreenState extends State<OffreScreen> {
  OffreEmploi? _offre;
  bool _chargement = true;

  /// La clé du message d'erreur (fermée, introuvable), ou le texte brut.
  String? _erreurCle;
  String? _erreurTexte;
  bool _proprietaire = false;
  bool _connecte = false;

  // Postuler.
  final Map<String, String> _reponses = {};
  bool _envoi = false;
  bool _envoyee = false;
  String? _probleme;

  // Les candidatures reçues (auteur).
  ({List<ChampFormulaire> formulaire, List<Candidature> candidatures})? _cand;
  String? _ouvert;

  @override
  void initState() {
    super.initState();
    if (widget.apercu) {
      _offre = widget.apercuOffre;
      _proprietaire = widget.apercuProprietaire;
      _connecte = widget.apercuConnecte || widget.apercuProprietaire;
      _envoyee = widget.apercuOffre?.dejaCandidate ?? false;
      _chargement = false;
    } else {
      _charger();
    }
  }

  Future<void> _charger() async {
    setState(() {
      _chargement = true;
      _erreurCle = null;
      _erreurTexte = null;
    });
    try {
      final o = await OffresApi.une(widget.offreId);
      final connecte = ApiClient.instance.connecte;
      final monId = connecte ? await ApiClient.instance.monId() : null;
      if (!mounted) return;
      setState(() {
        _offre = o;
        _connecte = connecte;
        _proprietaire = monId != null && monId == o.userId;
        _envoyee = o.dejaCandidate;
        _chargement = false;
      });
      if (_proprietaire) _chargerCandidatures();
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _erreurCle = e.statusCode == 410
            ? 'emploi.fermeeDetail'
            : e.statusCode == 404
                ? 'emploi.introuvable'
                : null;
        _erreurTexte = e.message;
        _chargement = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _erreurCle = 'vend.connexionImpossible';
        _chargement = false;
      });
    }
  }

  Future<void> _chargerCandidatures() async {
    final o = _offre;
    if (o == null) return;
    try {
      final c = await OffresApi.candidatures(o.id);
      if (mounted) setState(() => _cand = c);
    } catch (_) {
      if (mounted) {
        setState(() => _cand = (formulaire: o.formulaire, candidatures: <Candidature>[]));
      }
    }
  }

  String _p(String cle, Map<String, String> params) {
    var s = tr(context, cle);
    params.forEach((k, v) => s = s.replaceAll('{$k}', v));
    return s;
  }

  Future<void> _partager() async {
    final o = _offre;
    if (o == null) return;
    final url = 'https://chap.ci/emploi/${o.id}';
    try {
      await SharePlus.instance.share(ShareParams(
        text: '${o.titre} — ${o.entreprise}${o.lieu != null ? ' · ${o.lieu}' : ''}\n$url',
        subject: '${o.titre} · Chap.ci',
      ));
    } catch (_) {/* partage annulé ou indisponible */}
  }

  @override
  Widget build(BuildContext context) {
    final o = _offre;
    return Scaffold(
      appBar: AppBar(
        title: Text(tr(context, 'emploi.titre')),
        actions: [
          if (o != null)
            IconButton(
              icon: const Icon(Icons.share_outlined),
              tooltip: tr(context, 'action.partager'),
              onPressed: _partager,
            ),
        ],
      ),
      body: _chargement
          ? const Center(child: CircularProgressIndicator(color: ChapColors.orange))
          : (o == null)
              ? _erreur()
              : ListView(
                  padding: const EdgeInsets.fromLTRB(16, 12, 16, 32),
                  children: [
                    _entete(o),
                    const SizedBox(height: 12),
                    _carte(Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _titreCarte(tr(context, 'emploi.poste')),
                        const SizedBox(height: 6),
                        Text(o.description,
                            style: const TextStyle(
                                fontSize: 14, height: 1.5, color: ChapColors.gray700)),
                      ],
                    )),
                    if (_proprietaire) ...[
                      const SizedBox(height: 12),
                      _panneauCandidatures(o),
                    ] else if (o.ouverte) ...[
                      const SizedBox(height: 12),
                      _postuler(o),
                    ],
                  ],
                ),
    );
  }

  Widget _erreur() {
    final texte = _erreurCle != null ? tr(context, _erreurCle!) : (_erreurTexte ?? '');
    return Padding(
      padding: const EdgeInsets.all(32),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.work_outline, size: 48, color: ChapColors.line2),
          const SizedBox(height: 12),
          Text(texte,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 14.5, color: ChapColors.gray700)),
          if (!widget.apercu) ...[
            const SizedBox(height: 16),
            OutlinedButton(
                onPressed: _charger, child: Text(tr(context, 'action.reessayer'))),
          ],
        ],
      ),
    );
  }

  // ---- L'en-tête : qui recrute, quel poste -------------------------------

  Widget _entete(OffreEmploi o) {
    final t = o.typeStructure;
    final libelleType = t == null ? null : tr(context, 'pro.type.$t');
    final structure = (libelleType != null && !libelleType.startsWith('pro.type.'))
        ? libelleType
        : tr(context, 'emploi.structure');
    final expire = o.expiresAt;
    return _carte(Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        InkWell(
          key: const ValueKey('offre-structure'),
          onTap: () => Navigator.of(context).push(MaterialPageRoute(
              builder: (_) => VendeurScreen(
                  sellerId: o.userId, sellerName: o.entreprise))),
          borderRadius: BorderRadius.circular(12),
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 4),
            child: Row(
              children: [
                LogoOffre(url: o.logo, taille: 48),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(o.entreprise,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w800,
                              color: ChapColors.gray900)),
                      Text('$structure · ${tr(context, 'emploi.voirPage')} ›',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                              fontSize: 12, color: ChapColors.gray600)),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 12),
        Text(o.titre,
            style: const TextStyle(
                fontSize: 21,
                fontWeight: FontWeight.w900,
                height: 1.2,
                color: ChapColors.gray900)),
        if (o.contrat != null || o.lieu != null || o.salaire != null) ...[
          const SizedBox(height: 10),
          Wrap(
            spacing: 6,
            runSpacing: 6,
            children: [
              if (o.contrat != null) PuceOffre(o.contrat!),
              if (o.lieu != null) PuceOffre(o.lieu!, icone: Icons.place_outlined),
              if (o.salaire != null)
                PuceOffre(o.salaire!, icone: Icons.payments_outlined),
            ],
          ),
        ],
        const SizedBox(height: 10),
        Row(
          children: [
            const Icon(Icons.schedule, size: 12, color: ChapColors.gray500),
            const SizedBox(width: 4),
            Expanded(
              child: Text(
                '${tr(context, 'emploi.publiee')} ${tempsEcouleTr(context, o.createdAt)}'
                '${expire != null && o.ouverte ? ' · ${tr(context, 'emploi.jusquau')} ${MaterialLocalizations.of(context).formatMediumDate(DateTime.fromMillisecondsSinceEpoch(expire))}' : ''}',
                style: const TextStyle(fontSize: 11.5, color: ChapColors.gray500),
              ),
            ),
          ],
        ),
        if (!o.ouverte) ...[
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
                color: ChapColors.cream100,
                borderRadius: BorderRadius.circular(20)),
            child: Text(tr(context, 'emploi.fermee'),
                style: const TextStyle(
                    fontSize: 11.5,
                    fontWeight: FontWeight.w700,
                    color: ChapColors.gray600)),
          ),
        ],
      ],
    ));
  }

  // ---- Postuler ------------------------------------------------------------

  Widget _postuler(OffreEmploi o) {
    final parLien = o.lien != null;
    final parForm = o.formulaire.isNotEmpty;
    return _carte(Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _titreCarte(tr(context, 'emploi.postuler')),
        if (parLien) ...[
          const SizedBox(height: 10),
          SizedBox(
            height: 48,
            child: ElevatedButton.icon(
              key: const ValueKey('offre-lien'),
              onPressed: () => launchUrl(Uri.parse(o.lien!),
                  mode: LaunchMode.externalApplication),
              icon: const Icon(Icons.open_in_new, size: 18),
              label: Text(_p('emploi.postulerLien', {'nom': o.entreprise}),
                  maxLines: 1, overflow: TextOverflow.ellipsis),
            ),
          ),
        ],
        if (parLien && parForm && !_envoyee) ...[
          const SizedBox(height: 10),
          Text(tr(context, 'emploi.ouIci').toUpperCase(),
              textAlign: TextAlign.center,
              style: const TextStyle(
                  fontSize: 10.5,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 0.8,
                  color: ChapColors.gray500)),
        ],
        if (parForm) ...[
          const SizedBox(height: 10),
          if (_envoyee)
            Container(
              key: const ValueKey('offre-envoyee'),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFE4F5EC),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(Icons.check_circle, color: ChapColors.greenDark, size: 20),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(_p('emploi.envoyee', {'nom': o.entreprise}),
                        style: const TextStyle(
                            fontSize: 13.5, height: 1.4, color: ChapColors.gray700)),
                  ),
                ],
              ),
            )
          else if (!_connecte)
            Text(tr(context, 'emploi.connexion'),
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 13.5, color: ChapColors.gray600))
          else ...[
            for (final c in o.formulaire) ...[
              _champ(c),
              const SizedBox(height: 10),
            ],
            if (_probleme != null) ...[
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                    color: const Color(0xFFFBEAE7),
                    borderRadius: BorderRadius.circular(10)),
                child: Text(_probleme!,
                    style: const TextStyle(fontSize: 13, color: Color(0xFFB42318))),
              ),
              const SizedBox(height: 10),
            ],
            SizedBox(
              height: 50,
              child: ElevatedButton.icon(
                key: const ValueKey('offre-envoyer'),
                onPressed: _envoi ? null : () => _envoyerCandidature(o),
                icon: _envoi
                    ? const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(
                            strokeWidth: 2, color: Colors.white))
                    : const Icon(Icons.work_outline, size: 18),
                label: Text(tr(context, 'emploi.envoyer')),
              ),
            ),
            const SizedBox(height: 8),
            Text(_p('emploi.confidentialite', {'nom': o.entreprise}),
                textAlign: TextAlign.center,
                style: const TextStyle(
                    fontSize: 11, height: 1.4, color: ChapColors.gray500)),
          ],
        ],
      ],
    ));
  }

  Widget _champ(ChampFormulaire c) {
    final etiquette = RichText(
      text: TextSpan(
        text: c.label,
        style: const TextStyle(
            fontSize: 13.5, fontWeight: FontWeight.w700, color: ChapColors.gray900),
        children: [
          if (c.requis)
            const TextSpan(text: ' *', style: TextStyle(color: Color(0xFFB42318))),
        ],
      ),
    );
    Widget saisie;
    switch (c.type) {
      case 'ouinon':
        saisie = Row(
          children: [
            for (final v in const ['oui', 'non']) ...[
              ChoiceChip(
                label: Text(tr(context, v == 'oui' ? 'emploi.oui' : 'emploi.non')),
                selected: _reponses[c.id] == v,
                showCheckmark: false,
                selectedColor: ChapColors.orange,
                backgroundColor: ChapColors.cream,
                labelStyle: TextStyle(
                    fontWeight: FontWeight.w600,
                    color: _reponses[c.id] == v ? Colors.white : ChapColors.gray700),
                onSelected: (_) => setState(() {
                  if (_reponses[c.id] == v) {
                    _reponses.remove(c.id);
                  } else {
                    _reponses[c.id] = v;
                  }
                }),
              ),
              const SizedBox(width: 8),
            ],
          ],
        );
        break;
      case 'choix':
        saisie = DropdownButtonFormField<String>(
          initialValue: c.options.contains(_reponses[c.id]) ? _reponses[c.id] : null,
          hint: Text(tr(context, 'emploi.choisir')),
          isExpanded: true,
          items: [
            for (final o in c.options) DropdownMenuItem(value: o, child: Text(o)),
          ],
          onChanged: (v) => setState(() {
            if (v == null) {
              _reponses.remove(c.id);
            } else {
              _reponses[c.id] = v;
            }
          }),
          decoration: const InputDecoration(isDense: true),
        );
        break;
      default:
        saisie = TextFormField(
          key: ValueKey('reponse-${c.id}'),
          initialValue: _reponses[c.id],
          maxLines: c.type == 'long' ? 4 : 1,
          maxLength: c.type == 'long' ? 3000 : 200,
          keyboardType: c.type == 'email'
              ? TextInputType.emailAddress
              : c.type == 'tel'
                  ? TextInputType.phone
                  : c.type == 'long'
                      ? TextInputType.multiline
                      : TextInputType.text,
          textCapitalization: c.type == 'email'
              ? TextCapitalization.none
              : TextCapitalization.sentences,
          decoration: const InputDecoration(counterText: '', isDense: true),
          onChanged: (v) => _reponses[c.id] = v,
        );
    }
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [etiquette, const SizedBox(height: 6), saisie],
    );
  }

  Future<void> _envoyerCandidature(OffreEmploi o) async {
    for (final c in o.formulaire) {
      if (c.requis && (_reponses[c.id] ?? '').trim().isEmpty) {
        setState(() => _probleme = _p('emploi.repondez', {'q': c.label}));
        return;
      }
    }
    setState(() {
      _probleme = null;
      _envoi = true;
    });
    try {
      await OffresApi.candidater(o.id,
          reponses: {for (final e in _reponses.entries) e.key: e.value.trim()},
          nom: _reponses['nom'],
          tel: _reponses['tel']);
      if (!mounted) return;
      setState(() => _envoyee = true);
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        if (e.statusCode == 409) {
          _envoyee = true;
        } else if (e.statusCode == 403 && e.donnees?['emailUnverified'] == true) {
          _probleme = tr(context, 'emploi.confirmerEmail');
        } else {
          _probleme = e.message;
        }
      });
    } finally {
      if (mounted) setState(() => _envoi = false);
    }
  }

  // ---- Les candidatures reçues (auteur) -----------------------------------

  Widget _panneauCandidatures(OffreEmploi o) {
    final c = _cand;
    return _carte(Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          children: [
            const Icon(Icons.people_outline, size: 18, color: ChapColors.ocreDark),
            const SizedBox(width: 6),
            Expanded(child: _titreCarte(tr(context, 'emploi.candidatures'))),
            if (c != null)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                    color: ChapColors.cream100,
                    borderRadius: BorderRadius.circular(20)),
                child: Text('${c.candidatures.length}',
                    style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w800,
                        color: ChapColors.ocreDark)),
              ),
            TextButton.icon(
              onPressed: () => Navigator.of(context).push(
                  MaterialPageRoute(builder: (_) => const OffresProScreen())),
              icon: const Icon(Icons.tune, size: 16),
              label: Text(tr(context, 'emploi.gerer')),
            ),
          ],
        ),
        if (o.lien != null)
          Text(tr(context, 'emploi.lienExterne'),
              style: const TextStyle(fontSize: 11.5, color: ChapColors.gray500)),
        const SizedBox(height: 6),
        if (c == null)
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 18),
            child: Center(
                child: SizedBox(
                    width: 22,
                    height: 22,
                    child: CircularProgressIndicator(
                        strokeWidth: 2, color: ChapColors.orange))),
          )
        else if (c.candidatures.isEmpty)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 14),
            child: Text(tr(context, 'emploi.aucuneCandidature'),
                textAlign: TextAlign.center,
                style: const TextStyle(
                    fontSize: 13, height: 1.4, color: ChapColors.gray600)),
          )
        else
          for (final k in c.candidatures) _candidature(k, c.formulaire),
      ],
    ));
  }

  Widget _candidature(Candidature k, List<ChampFormulaire> formulaire) {
    final ouvert = _ouvert == k.id;
    String libelle(String id) => formulaire
        .firstWhere((f) => f.id == id, orElse: () => ChampFormulaire(id: id, label: id))
        .label;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const Divider(height: 1, color: ChapColors.line),
        InkWell(
          onTap: () => setState(() => _ouvert = ouvert ? null : k.id),
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 10),
            child: Row(
              children: [
                Container(
                  width: 38,
                  height: 38,
                  alignment: Alignment.center,
                  decoration: const BoxDecoration(
                      color: ChapColors.green, shape: BoxShape.circle),
                  child: Text(
                      k.nom.trim().isNotEmpty ? k.nom.trim()[0].toUpperCase() : '?',
                      style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w900,
                          color: Colors.white)),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(k.nom,
                          style: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w700,
                              color: ChapColors.gray900)),
                      Text(tempsEcouleTr(context, k.createdAt),
                          style: const TextStyle(
                              fontSize: 11.5, color: ChapColors.gray500)),
                    ],
                  ),
                ),
                Icon(ouvert ? Icons.expand_less : Icons.expand_more,
                    color: ChapColors.gray500),
              ],
            ),
          ),
        ),
        if (ouvert)
          Container(
            margin: const EdgeInsets.only(bottom: 10),
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
                color: ChapColors.cream100,
                borderRadius: BorderRadius.circular(10)),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Wrap(
                  spacing: 14,
                  runSpacing: 4,
                  children: [
                    if (k.email.isNotEmpty)
                      _contact(Icons.mail_outline, k.email, 'mailto:${k.email}'),
                    if (k.tel != null) _contact(Icons.call_outlined, k.tel!, 'tel:${k.tel}'),
                  ],
                ),
                for (final e in k.reponses.entries)
                  if (e.value.trim().isNotEmpty) ...[
                    const SizedBox(height: 8),
                    Text(libelle(e.key).toUpperCase(),
                        style: const TextStyle(
                            fontSize: 9.5,
                            fontWeight: FontWeight.w800,
                            letterSpacing: 0.5,
                            color: ChapColors.gray500)),
                    Text(e.value,
                        style: const TextStyle(
                            fontSize: 13.5, height: 1.4, color: ChapColors.gray900)),
                  ],
              ],
            ),
          ),
      ],
    );
  }

  Widget _contact(IconData icone, String texte, String uri) => InkWell(
        onTap: () => launchUrl(Uri.parse(uri)),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 6),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icone, size: 14, color: ChapColors.ocreDark),
              const SizedBox(width: 4),
              Text(texte,
                  style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      color: ChapColors.ocreDark)),
            ],
          ),
        ),
      );

  // ---- briques ---------------------------------------------------------------

  Widget _titreCarte(String t) => Text(t,
      style: const TextStyle(
          fontSize: 15, fontWeight: FontWeight.w800, color: ChapColors.gray900));

  Widget _carte(Widget enfant) => Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: ChapColors.cream,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: ChapColors.line),
        ),
        child: enfant,
      );
}
