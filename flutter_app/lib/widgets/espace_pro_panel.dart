import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart' as imgpick;
import '../api/api_client.dart';
import '../api/models.dart' show ImageSource;
import '../format.dart';
import '../i18n/categories_i18n.dart';
import '../i18n/formats_i18n.dart';
import '../i18n/textes.dart';
import '../theme.dart';
import '../liens_site.dart';
import '../screens/favoris_screen.dart';
import '../screens/messages_screen.dart';
import '../screens/modifier_profil_screen.dart';
import '../screens/notifications_screen.dart';
import '../screens/publier_screen.dart';
import '../screens/securite_2fa_screen.dart';

/// Le tableau de bord de l'ESPACE PROFESSIONNEL, façon CRM — le panneau d'un
/// compte approuvé : badge 💼, nom commercial, période 7/30 jours, chiffres
/// clés avec tendance, courbe des vues, messages en attente, top des annonces
/// (vraies photos) et fil d'activité (`GET /pro/tableau`).
///
/// Réutilisé à deux endroits : l'écran « Devenir professionnel » (état
/// approuvé) et l'onglet « Mon compte », où il PREND LA PLACE des trois
/// chiffres simples pour les comptes Pro. `avecPublier` masque le bouton là
/// où un bouton Publier existe déjà.
class EspaceProPanel extends StatefulWidget {
  final bool avecPublier;

  /// Dans l'onglet « Mon compte » : le panneau porte alors TOUT le compte —
  /// les tuiles de la boutique, la fiche d'entreprise, les réglages et la
  /// déconnexion.
  final bool dansCompte;

  /// Fait défiler la page jusqu'à la liste des annonces (tuile « Mes annonces »).
  final VoidCallback? onVersAnnonces;
  final VoidCallback? onDeconnexion;

  const EspaceProPanel({
    super.key,
    this.avecPublier = true,
    this.dansCompte = false,
    this.onVersAnnonces,
    this.onDeconnexion,
  });

  @override
  State<EspaceProPanel> createState() => _EspaceProPanelState();
}

class _EspaceProPanelState extends State<EspaceProPanel> {
  Map<String, dynamic>? _tableau;
  int _periode = 7;
  /// 'banniere' ou 'logo' pendant l'envoi de l'image correspondante.
  String? _envoiImage;

  @override
  void initState() {
    super.initState();
    _charger();
  }

  Future<void> _charger() async {
    try {
      final t =
          await ApiClient.instance.get('/pro/tableau?periode=$_periode');
      if (t is Map && mounted) {
        setState(() => _tableau = Map<String, dynamic>.from(t));
      }
    } catch (_) {/* les chiffres sont un plus, pas une condition */}
  }

  /// Choisit une image dans la galerie et l'envoie comme bannière ou logo.
  /// La bannière est large (1600 px), le logo carré (512 px) : on demande au
  /// sélecteur la bonne taille pour ne pas charger le réseau ivoirien.
  Future<void> _changerImage(String quoi) async {
    if (_envoiImage != null) return;
    try {
      final x = await imgpick.ImagePicker().pickImage(
        source: imgpick.ImageSource.gallery,
        maxWidth: quoi == 'banniere' ? 1600 : 512,
        imageQuality: 85,
      );
      if (x == null) return;
      setState(() => _envoiImage = quoi);
      final bytes = await x.readAsBytes();
      final mime = x.mimeType ??
          (x.name.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg');
      final r = await ApiClient.instance.post('/pro/vitrine',
          {quoi: 'data:$mime;base64,${base64Encode(bytes)}'});
      if (r is Map && mounted) {
        setState(() {
          final pro = Map<String, dynamic>.from(
              (_tableau?['pro'] as Map?) ?? const {});
          pro['banniere'] = r['banniere'] ?? '';
          pro['logo'] = r['logo'] ?? '';
          _tableau = {...?_tableau, 'pro': pro};
        });
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(tr(context, 'pro.vitrine.erreur'))));
      }
    } finally {
      if (mounted) setState(() => _envoiImage = null);
    }
  }

  void _changerPeriode(int p) {
    if (p == _periode) return;
    setState(() => _periode = p);
    _charger();
  }

  String _tr(String cle, [Map<String, String> params = const {}]) {
    var s = tr(context, cle);
    params.forEach((k, v) => s = s.replaceAll('{$k}', v));
    return s;
  }

  @override
  Widget build(BuildContext context) {
    final t = _tableau;
    final pro = (t?['pro'] as Map?) ?? const {};
    final stats = (t?['stats'] as Map?) ?? const {};
    final kpi = (t?['kpi'] as Map?) ?? const {};
    final depuis = pro['depuis'];
    final note = stats['note'];
    final avis = (stats['avis'] as int?) ?? 0;
    final secteur = (pro['secteur'] as String?) ?? '';
    final type = (pro['type'] as String?) ?? '';
    final nom = (pro['nom'] as String?) ?? '';
    final compte = (t?['compte'] as Map?) ?? const {};
    final tauxReponse = t?['tauxReponse'] as int?;
    final aRepondre = (t?['aRepondre'] as Map?) ?? const {};
    final serie = ((t?['serie'] as List?) ?? const [])
        .whereType<Map>()
        .toList(growable: false);
    final top = ((t?['top'] as List?) ?? const [])
        .whereType<Map>()
        .toList(growable: false);
    final activite = ((t?['activite'] as List?) ?? const [])
        .whereType<Map>()
        .toList(growable: false);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // L'en-tête de marque : LA VITRINE (bannière + logo, modifiables),
        // le badge, le nom commercial, la note, l'ancienneté et la période.
        ClipRRect(
          borderRadius: BorderRadius.circular(18),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              _banniere(pro),
              Container(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [ChapColors.orange, ChapColors.orangeDark],
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _logo(pro, nom),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Padding(
                            padding: const EdgeInsets.only(top: 14),
                            child: Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 10, vertical: 5),
                              decoration: BoxDecoration(
                                color: Colors.white.withValues(alpha: 0.22),
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: Text('💼 ${tr(context, 'pro.badge')}',
                                  textAlign: TextAlign.center,
                                  style: const TextStyle(
                                      color: Colors.white,
                                      fontWeight: FontWeight.w800,
                                      fontSize: 11.5)),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Text(nom.isNotEmpty ? nom : tr(context, 'pro.approuve'),
                        style: const TextStyle(
                            color: Colors.white,
                            fontSize: 21,
                            fontWeight: FontWeight.w800,
                            height: 1.15)),
                    if (type.isNotEmpty) ...[
                      const SizedBox(height: 3),
                      Text(
                        tr(context, 'pro.type.$type') +
                            (secteur.isNotEmpty
                                ? ' · ${secteurProTr(context, secteur)}'
                                : ''),
                        style: TextStyle(
                            color: Colors.white.withValues(alpha: 0.9),
                            fontSize: 12.5),
                      ),
                    ],
                    const SizedBox(height: 3),
                    Text(
                      [
                        if (note != null)
                          '★ $note ($avis ${tr(context, 'pro.tab.avis')})',
                        if (depuis is int && depuis > 0)
                          '${tr(context, 'pro.tab.depuis')} '
                              '${dureeTr(context, depuis)}',
                      ].join(' · '),
                      style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.75),
                          fontSize: 11),
                    ),
                    const SizedBox(height: 11),
                    Container(
                      padding: const EdgeInsets.all(3),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.18),
                        borderRadius: BorderRadius.circular(999),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          _chipPeriode(7, tr(context, 'pro.tab.jours7')),
                          _chipPeriode(30, tr(context, 'pro.tab.jours30')),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),

        // Les chiffres clés de la période, chacun avec sa tendance.
        GridView.count(
          crossAxisCount: 2,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          mainAxisSpacing: 9,
          crossAxisSpacing: 9,
          childAspectRatio: 1.62,
          children: [
            _kpi(Icons.visibility_outlined,
                formatNombre(_n(kpi, 'vues')),
                tr(context, 'pro.tab.vuesPeriode'),
                _delta(_n(kpi, 'vues'), _prev(kpi, 'vues'))),
            _kpi(Icons.chat_bubble_outline, '${_n(kpi, 'contacts')}',
                tr(context, 'pro.tab.contacts'),
                _delta(_n(kpi, 'contacts'), _prev(kpi, 'contacts'))),
            _kpi(Icons.favorite_border, '${_n(kpi, 'favoris')}',
                tr(context, 'pro.tab.favoris'),
                _delta(_n(kpi, 'favoris'), _prev(kpi, 'favoris'))),
            _kpi(
                Icons.bolt_outlined,
                tauxReponse != null ? '$tauxReponse %' : '—',
                tr(context, 'pro.tab.tauxReponse'),
                _pastille(
                    tauxReponse == null
                        ? tr(context, 'pro.tab.pasContact')
                        : tauxReponse >= 80
                            ? tr(context, 'pro.tab.repondVite')
                            : tr(context, 'pro.tab.aAmeliorer'),
                    ChapColors.cream100,
                    tauxReponse != null && tauxReponse >= 80
                        ? ChapColors.ocreDark
                        : ChapColors.gray600)),
          ],
        ),
        const SizedBox(height: 12),

        // La courbe des vues, jour par jour.
        _carte(Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(tr(context, 'pro.tab.graphTitre'),
                          style: const TextStyle(
                              fontSize: 13.5, fontWeight: FontWeight.w800)),
                      Text(_tr('pro.tab.graphSous', {'n': '$_periode'}),
                          style: const TextStyle(
                              fontSize: 10.5, color: ChapColors.gray600)),
                    ],
                  ),
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(formatNombre(_n(kpi, 'vues')),
                        style: const TextStyle(
                            fontSize: 18, fontWeight: FontWeight.w800)),
                    _delta(_n(kpi, 'vues'), _prev(kpi, 'vues')),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 8),
            SizedBox(
              height: 150,
              child: CustomPaint(
                painter: _CourbeVues(
                  valeurs: [
                    for (final p in serie) (p['n'] as num?)?.toInt() ?? 0
                  ],
                  etiquettes: _etiquettes(serie),
                ),
                size: Size.infinite,
              ),
            ),
          ],
        )),

        // Les messages qui attendent une réponse depuis plus de 24 h.
        if ((aRepondre['n'] as int? ?? 0) > 0) ...[
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: ChapColors.cream100,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFF3D9B8)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                    '⏳ ${_tr('pro.tab.sansReponse', {
                          'n': '${aRepondre['n']}'
                        })}',
                    style: const TextStyle(
                        fontSize: 13.5, fontWeight: FontWeight.w800)),
                const SizedBox(height: 5),
                Text(
                  (aRepondre['noms'] is List &&
                          (aRepondre['noms'] as List).isNotEmpty)
                      ? _tr('pro.tab.attente', {
                          'noms':
                              (aRepondre['noms'] as List).join(', ')
                        })
                      : tr(context, 'pro.tab.attenteAnonyme'),
                  style: const TextStyle(
                      fontSize: 11.5,
                      color: ChapColors.gray600,
                      height: 1.4),
                ),
                const SizedBox(height: 10),
                SizedBox(
                  height: 40,
                  child: ElevatedButton(
                    onPressed: () => Navigator.of(context).push(
                        MaterialPageRoute(
                            builder: (_) => const MessagesScreen())),
                    style: ElevatedButton.styleFrom(
                        backgroundColor: ChapColors.orange,
                        foregroundColor: Colors.white),
                    child: Text(tr(context, 'pro.tab.repondre'),
                        style: const TextStyle(
                            fontWeight: FontWeight.w800, fontSize: 12.5)),
                  ),
                ),
              ],
            ),
          ),
        ],
        const SizedBox(height: 12),

        // Le top des annonces — avec leurs vraies photos.
        _carte(Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(tr(context, 'pro.tab.topTitre'),
                style: const TextStyle(
                    fontSize: 13.5, fontWeight: FontWeight.w800)),
            Text(_tr('pro.tab.topSous', {'n': '$_periode'}),
                style: const TextStyle(
                    fontSize: 10.5, color: ChapColors.gray600)),
            const SizedBox(height: 6),
            if (top.isEmpty)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 10),
                child: Text(tr(context, 'pro.tab.topVide'),
                    style: const TextStyle(
                        fontSize: 12, color: ChapColors.gray600)),
              )
            else
              for (var i = 0; i < top.length; i++)
                _ligneTop(top[i], premier: i == 0),
          ],
        )),
        const SizedBox(height: 12),

        // Le fil d'activité.
        _carte(Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(tr(context, 'pro.tab.activite'),
                style: const TextStyle(
                    fontSize: 13.5, fontWeight: FontWeight.w800)),
            const SizedBox(height: 6),
            if (activite.isEmpty)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 10),
                child: Text(tr(context, 'pro.tab.activiteVide'),
                    style: const TextStyle(
                        fontSize: 12, color: ChapColors.gray600)),
              )
            else
              for (var i = 0; i < activite.length; i++)
                _evenement(activite[i], premier: i == 0),
          ],
        )),

        // TOUT LE COMPTE, INTÉGRÉ — l'onglet Compte d'un professionnel n'est
        // plus un tableau suivi d'une liste de réglages : c'est une seule
        // console (demande du Patron, 27/08).
        if (widget.dansCompte) ...[
          _titreSection(tr(context, 'pro.sec.boutique')),
          GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            mainAxisSpacing: 9,
            crossAxisSpacing: 9,
            childAspectRatio: 1.62,
            children: [
              _tuile('📦', ChapColors.cream100,
                  tr(context, 'compte.mesAnnonces'),
                  _tr('pro.tuile.annoncesSous', {
                    'a': '${stats['annoncesActives'] ?? 0}',
                    'v': '${compte['annoncesVendues'] ?? 0}',
                  }),
                  onTap: widget.onVersAnnonces),
              _tuile('💬', const Color(0xFFEDEFF2), tr(context, 'nav.messages'),
                  (aRepondre['n'] as int? ?? 0) > 0
                      ? _tr('pro.tuile.sansReponse', {'n': '${aRepondre['n']}'})
                      : _tr('pro.tuile.conversations',
                          {'n': '${stats['conversations'] ?? 0}'}),
                  compteur: (aRepondre['n'] as int? ?? 0) > 0
                      ? '${aRepondre['n']}'
                      : null,
                  compteurRouge: true,
                  onTap: () => Navigator.of(context).push(
                      MaterialPageRoute(builder: (_) => const MessagesScreen()))),
              _tuile('❤️', const Color(0xFFFBEAE7),
                  tr(context, 'item.mesFavoris'),
                  _tr('pro.tuile.favorisSous',
                      {'n': '${compte['favorisEnregistres'] ?? 0}'}),
                  onTap: () => Navigator.of(context).push(
                      MaterialPageRoute(builder: (_) => const FavorisScreen()))),
              _tuile('➕', ChapColors.cream100, tr(context, 'action.publier'),
                  tr(context, 'pro.tuile.publierSous'),
                  onTap: () => Navigator.of(context).push(
                      MaterialPageRoute(builder: (_) => const PublierScreen()))),
            ],
          ),

          _titreSection(tr(context, 'pro.sec.entreprise')),
          _ficheEntreprise(pro, compte),

          _titreSection(tr(context, 'pro.sec.compte')),
          GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            mainAxisSpacing: 9,
            crossAxisSpacing: 9,
            childAspectRatio: 1.62,
            children: [
              _tuile('👤', const Color(0xFFEDEFF2), tr(context, 'item.profil'),
                  tr(context, 'pro.tuile.profilSous'),
                  onTap: () => _ouvrir(const ModifierProfilScreen())),
              _tuile('🔔', ChapColors.cream100,
                  tr(context, 'section.notifications'),
                  tr(context, 'pro.tuile.notifsSous'),
                  onTap: () => Navigator.of(context).push(MaterialPageRoute(
                      builder: (_) => const NotificationsScreen()))),
              _tuile('🔒', const Color(0xFFE4F5EC),
                  tr(context, 'pro.tuile.securite'),
                  tr(context, 'pro.tuile.securiteSous'),
                  compteur: compte['twofa'] == true ? '✓' : null,
                  onTap: () => _ouvrir(const Securite2faScreen())),
              _tuile('📍', const Color(0xFFE8EEFB),
                  tr(context, 'pro.tuile.adresse'),
                  (compte['commune'] as String?)?.isNotEmpty == true
                      ? '${compte['commune']}'
                      : tr(context, 'pro.tuile.adresseVide'),
                  onTap: () => _ouvrir(const ModifierProfilScreen())),
              _tuile('❓', ChapColors.cream100, tr(context, 'item.aide'),
                  tr(context, 'pro.tuile.aideSous'),
                  onTap: () => ouvrirPageSite(context, PagesSite.aide)),
              _tuile('🛡️', const Color(0xFFE4F5EC), tr(context, 'item.contact'),
                  tr(context, 'pro.tuile.contactSous'),
                  onTap: () => ouvrirPageSite(context, PagesSite.contact)),
            ],
          ),

          if (widget.onDeconnexion != null) ...[
            const SizedBox(height: 12),
            SizedBox(
              height: 46,
              child: OutlinedButton.icon(
                onPressed: widget.onDeconnexion,
                icon: const Icon(Icons.logout, size: 18),
                label: Text(tr(context, 'item.deconnexion'),
                    style: const TextStyle(fontWeight: FontWeight.w800)),
                style: OutlinedButton.styleFrom(
                  foregroundColor: const Color(0xFFC43025),
                  backgroundColor: const Color(0xFFFBEAE7),
                  side: const BorderSide(color: Color(0xFFF3C9C4)),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12)),
                ),
              ),
            ),
          ],
        ],

        if (widget.avecPublier) ...[
          const SizedBox(height: 12),
          SizedBox(
            height: 50,
            child: ElevatedButton.icon(
              onPressed: () => Navigator.of(context).push(MaterialPageRoute(
                  builder: (_) => const PublierScreen())),
              icon: const Icon(Icons.add),
              label: Text(tr(context, 'pro.tab.publier')),
              style: ElevatedButton.styleFrom(
                  backgroundColor: ChapColors.orange,
                  foregroundColor: Colors.white),
            ),
          ),
        ],
        const SizedBox(height: 10),
        Text(tr(context, 'pro.tab.note'),
            textAlign: TextAlign.center,
            style: const TextStyle(
                fontSize: 11.5, color: ChapColors.gray600, height: 1.4)),
      ],
    );
  }

  // ---- petites pièces -----------------------------------------------------

  static int _n(Map kpi, String cle) =>
      ((kpi[cle] as Map?)?['n'] as num?)?.toInt() ?? 0;
  static int _prev(Map kpi, String cle) =>
      ((kpi[cle] as Map?)?['prev'] as num?)?.toInt() ?? 0;

  Widget _chipPeriode(int p, String texte) {
    final actif = _periode == p;
    return GestureDetector(
      onTap: () => _changerPeriode(p),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 13, vertical: 5),
        decoration: BoxDecoration(
          color: actif ? Colors.white : Colors.transparent,
          borderRadius: BorderRadius.circular(999),
        ),
        child: Text(texte,
            style: TextStyle(
                fontSize: 11.5,
                fontWeight: FontWeight.w700,
                color: actif ? ChapColors.ocreDark : Colors.white)),
      ),
    );
  }

  /// La bannière : l'image choisie par le professionnel, ou le dégradé de la
  /// marque — avec le bouton qui permet de la changer.
  Widget _banniere(Map pro) {
    final url = (pro['banniere'] as String?) ?? '';
    return SizedBox(
      height: 104,
      child: Stack(
        fit: StackFit.expand,
        children: [
          if (url.isEmpty)
            const DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [ChapColors.orangeDark, Color(0xFFB45200)],
                ),
              ),
            )
          else
            _image(url),
          const DecoratedBox(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [Colors.transparent, Color(0x59000000)],
              ),
            ),
          ),
          Positioned(
            top: 8,
            right: 8,
            child: GestureDetector(
              onTap: () => _changerImage('banniere'),
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: Colors.black.withValues(alpha: 0.45),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    if (_envoiImage == 'banniere')
                      const SizedBox(
                        width: 13,
                        height: 13,
                        child: CircularProgressIndicator(
                            strokeWidth: 2, color: Colors.white),
                      )
                    else
                      const Icon(Icons.photo_camera_outlined,
                          size: 14, color: Colors.white),
                    const SizedBox(width: 6),
                    Text(
                      url.isEmpty
                          ? tr(context, 'pro.vitrine.ajouterBanniere')
                          : tr(context, 'pro.vitrine.changerBanniere'),
                      style: const TextStyle(
                          color: Colors.white,
                          fontSize: 11.5,
                          fontWeight: FontWeight.w700),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  /// Le logo rond du professionnel, à cheval sur la bannière, avec son bouton.
  Widget _logo(Map pro, String nom) {
    final url = (pro['logo'] as String?) ?? '';
    return SizedBox(
      width: 76,
      height: 62,
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          Positioned(
            top: -34,
            left: 0,
            child: Container(
              width: 70,
              height: 70,
              decoration: BoxDecoration(
                color: ChapColors.cream100,
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: Colors.white, width: 3),
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(15),
                child: url.isEmpty
                    ? Container(
                        color: ChapColors.orangeDark,
                        alignment: Alignment.center,
                        child: Text(
                            (nom.isEmpty ? 'P' : nom[0]).toUpperCase(),
                            style: const TextStyle(
                                color: Colors.white,
                                fontSize: 28,
                                fontWeight: FontWeight.w900)),
                      )
                    : _image(url),
              ),
            ),
          ),
          Positioned(
            top: 12,
            left: 46,
            child: GestureDetector(
              onTap: () => _changerImage('logo'),
              child: Container(
                width: 28,
                height: 28,
                decoration: BoxDecoration(
                  color: ChapColors.orange,
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white, width: 2),
                ),
                child: _envoiImage == 'logo'
                    ? const Padding(
                        padding: EdgeInsets.all(6),
                        child: CircularProgressIndicator(
                            strokeWidth: 2, color: Colors.white),
                      )
                    : const Icon(Icons.photo_camera_outlined,
                        size: 13, color: Colors.white),
              ),
            ),
          ),
        ],
      ),
    );
  }

  /// Ouvre un écran, puis redessine : le profil ou la 2FA ont pu changer.
  Future<void> _ouvrir(Widget ecran) async {
    await Navigator.of(context).push(MaterialPageRoute(builder: (_) => ecran));
    if (mounted) _charger();
  }

  Widget _titreSection(String texte) => Padding(
        padding: const EdgeInsets.fromLTRB(2, 14, 2, 6),
        child: Text(texte.toUpperCase(),
            style: const TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w800,
                letterSpacing: 0.8,
                color: ChapColors.gray500)),
      );

  /// Une tuile d'accès : emoji sur pastille teintée, titre, sous-titre chiffré,
  /// et le compteur en haut à droite quand il y a quelque chose à voir.
  Widget _tuile(String emoji, Color fond, String titre, String sous,
      {String? compteur, bool compteurRouge = false, VoidCallback? onTap}) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(14),
      child: Container(
        padding: const EdgeInsets.all(11),
        decoration: BoxDecoration(
          color: ChapColors.cream,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: ChapColors.line2),
        ),
        child: Stack(
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  width: 30,
                  height: 30,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                      color: fond, borderRadius: BorderRadius.circular(10)),
                  child: Text(emoji, style: const TextStyle(fontSize: 14)),
                ),
                const SizedBox(height: 6),
                Text(titre,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                        fontSize: 12, fontWeight: FontWeight.w800)),
                Text(sous,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                        fontSize: 10, color: ChapColors.gray600)),
              ],
            ),
            if (compteur != null)
              Positioned(
                top: 0,
                right: 0,
                child: Container(
                  constraints: const BoxConstraints(minWidth: 18),
                  height: 18,
                  alignment: Alignment.center,
                  padding: const EdgeInsets.symmetric(horizontal: 5),
                  decoration: BoxDecoration(
                    color: compteurRouge
                        ? const Color(0xFFC43025)
                        : const Color(0xFFE4F5EC),
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: Text(compteur,
                      style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w800,
                          color: compteurRouge
                              ? Colors.white
                              : ChapColors.greenDark)),
                ),
              ),
          ],
        ),
      ),
    );
  }

  /// La fiche d'entreprise : ce que les acheteurs voient sur la page vendeur.
  Widget _ficheEntreprise(Map pro, Map compte) {
    final type = (pro['type'] as String?) ?? '';
    final secteur = (pro['secteur'] as String?) ?? '';
    final depuis = pro['depuis'];
    final vide = tr(context, 'pro.fiche.vide');
    Widget champ(String etiquette, String valeur, {Color? couleur}) => Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(etiquette.toUpperCase(),
                style: const TextStyle(
                    fontSize: 9,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 0.5,
                    color: ChapColors.gray500)),
            Text(valeur,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                    fontSize: 11.5,
                    fontWeight: FontWeight.w700,
                    color: couleur ?? ChapColors.ink)),
          ],
        );
    return _carte(Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(tr(context, 'pro.fiche.titre'),
                      style: const TextStyle(
                          fontSize: 13.5, fontWeight: FontWeight.w800)),
                  Text(tr(context, 'pro.fiche.sous'),
                      style: const TextStyle(
                          fontSize: 10.5, color: ChapColors.gray600)),
                ],
              ),
            ),
            GestureDetector(
              onTap: () => _ouvrir(const ModifierProfilScreen()),
              child: Text(tr(context, 'action.modifier'),
                  style: const TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w800,
                      color: ChapColors.ocreDark)),
            ),
          ],
        ),
        const SizedBox(height: 10),
        GridView.count(
          crossAxisCount: 2,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          mainAxisSpacing: 10,
          crossAxisSpacing: 10,
          childAspectRatio: 4.2,
          children: [
            champ(tr(context, 'pro.fiche.nom'),
                (pro['nom'] as String?)?.isNotEmpty == true
                    ? '${pro['nom']}'
                    : vide),
            champ(tr(context, 'pro.fiche.type'),
                type.isEmpty ? vide : tr(context, 'pro.type.$type')),
            champ(tr(context, 'pro.fiche.secteur'),
                secteur.isEmpty ? vide : secteurProTr(context, secteur)),
            champ(tr(context, 'pro.fiche.numero'),
                (pro['numero'] as String?)?.isNotEmpty == true
                    ? '${pro['numero']}'
                    : vide),
            champ(tr(context, 'pro.fiche.tel'),
                (pro['tel'] as String?)?.isNotEmpty == true
                    ? '${pro['tel']}'
                    : vide),
            champ(tr(context, 'pro.fiche.commune'),
                (compte['commune'] as String?)?.isNotEmpty == true
                    ? '${compte['commune']}'
                    : vide),
            champ(
                tr(context, 'pro.fiche.badge'),
                depuis is int && depuis > 0
                    ? '${tr(context, 'pro.fiche.badgeActif')} · ${dureeTr(context, depuis)}'
                    : tr(context, 'pro.fiche.badgeActif'),
                couleur: ChapColors.greenDark),
            champ(tr(context, 'pro.fiche.page'),
                tr(context, 'pro.fiche.voirPage'),
                couleur: ChapColors.ocreDark),
          ],
        ),
      ],
    ));
  }

  Widget _carte(Widget enfant) => Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: ChapColors.cream,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: ChapColors.line2),
        ),
        child: enfant,
      );

  Widget _pastille(String texte, Color fond, Color couleur) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
        decoration: BoxDecoration(
            color: fond, borderRadius: BorderRadius.circular(999)),
        child: Text(texte,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(
                fontSize: 9.5, fontWeight: FontWeight.w800, color: couleur)),
      );

  /// La flèche de tendance vs la période précédente (« ▲ 18 % »).
  Widget _delta(int n, int prev) {
    if (prev <= 0 && n <= 0) {
      return _pastille('—', ChapColors.cream100, ChapColors.gray600);
    }
    if (prev <= 0) {
      return _pastille('▲ +$n', const Color(0xFFE4F5EC), ChapColors.greenDark);
    }
    final pct = ((n - prev) / prev * 100).round();
    if (pct == 0) {
      return _pastille('=', ChapColors.cream100, ChapColors.gray600);
    }
    return pct > 0
        ? _pastille(
            '▲ $pct %', const Color(0xFFE4F5EC), ChapColors.greenDark)
        : _pastille('▼ ${pct.abs()} %', const Color(0xFFFBEAE7),
            const Color(0xFFC43025));
  }

  Widget _kpi(IconData icone, String valeur, String libelle, Widget delta) {
    return Container(
      padding: const EdgeInsets.all(11),
      decoration: BoxDecoration(
        color: ChapColors.cream,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: ChapColors.line2),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Row(children: [
            Icon(icone, size: 16, color: ChapColors.orange),
            const Spacer(),
            Flexible(child: delta),
          ]),
          const SizedBox(height: 4),
          Text(valeur,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                  fontSize: 17, fontWeight: FontWeight.w800)),
          Text(libelle,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                  fontSize: 10.5, color: ChapColors.gray600)),
        ],
      ),
    );
  }

  /// Les étiquettes de l'axe des jours : toutes sur 7 jours, une sur cinq
  /// sur 30 — et « auj. » pour la dernière.
  List<String> _etiquettes(List<Map> serie) {
    final abr = tr(context, 'jours.abr').split('|');
    final pas = serie.length > 10 ? 5 : 1;
    return [
      for (var i = 0; i < serie.length; i++)
        if (i == serie.length - 1)
          tr(context, 'pro.tab.auj')
        else if (i % pas == 0)
          _jourCourt('${serie[i]['jour']}', abr)
        else
          ''
    ];
  }

  static String _jourCourt(String jour, List<String> abr) {
    final d = DateTime.tryParse('${jour}T12:00:00Z');
    if (d == null || abr.length < 7) return '';
    return '${abr[d.weekday % 7]} ${d.day}';
  }

  Widget _ligneTop(Map a, {required bool premier}) {
    final image = a['image'] as String?;
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 8),
      decoration: premier
          ? null
          : const BoxDecoration(
              border: Border(top: BorderSide(color: ChapColors.line))),
      child: Row(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: SizedBox(
              width: 44,
              height: 33,
              child: image == null || image.isEmpty
                  ? Container(
                      color: ChapColors.cream100,
                      child: const Icon(Icons.image_outlined,
                          size: 16, color: ChapColors.line2))
                  : _image(image),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('${a['titre'] ?? ''}',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                        fontSize: 12, fontWeight: FontWeight.w700)),
                Text(formatFCFA((a['prix'] as num?) ?? 0),
                    style: const TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w800,
                        color: ChapColors.ocreDark)),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text.rich(TextSpan(children: [
                TextSpan(
                    text: '${a['vues'] ?? 0} ',
                    style: const TextStyle(
                        fontSize: 12.5,
                        fontWeight: FontWeight.w800,
                        color: ChapColors.ink)),
                TextSpan(text: tr(context, 'pro.tab.vuesCourt')),
              ])),
              Text('${a['favoris'] ?? 0} ❤ · ${a['contacts'] ?? 0} 💬',
                  style: const TextStyle(
                      fontSize: 10.5, color: ChapColors.gray600)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _image(String source) {
    final src = ImageSource.resoudre(source);
    if (src.bytes != null) {
      return Image.memory(src.bytes!, fit: BoxFit.cover);
    }
    if (src.url != null) {
      return Image.network(src.url!,
          fit: BoxFit.cover,
          errorBuilder: (c, e, s) =>
              Container(color: ChapColors.cream100));
    }
    return Container(color: ChapColors.cream100);
  }

  Widget _evenement(Map e, {required bool premier}) {
    final type = '${e['type'] ?? ''}';
    late final String emoji;
    late final Color fond;
    late final String titre;
    String texte = '';
    switch (type) {
      case 'contact':
        emoji = '💬';
        fond = ChapColors.cream100;
        final nomA = '${e['nom'] ?? ''}';
        titre = nomA.isEmpty
            ? tr(context, 'pro.tab.evtContact')
            : '${tr(context, 'pro.tab.evtContact')} — $nomA';
        texte = '${e['annonce'] ?? ''}';
        if (texte.isNotEmpty) texte = '« $texte »';
      case 'favori':
        emoji = '❤️';
        fond = const Color(0xFFFBEAE7);
        titre = tr(context, 'pro.tab.evtFavori');
        texte = '${e['annonce'] ?? ''}';
        if (texte.isNotEmpty) texte = '« $texte »';
      case 'avis':
        emoji = '⭐';
        fond = const Color(0xFFE4F5EC);
        titre = _tr('pro.tab.evtAvis', {'n': '${e['note'] ?? '?'}'});
        texte = '${e['commentaire'] ?? ''}';
        if (texte.isNotEmpty) texte = '« $texte »';
      case 'vente':
        emoji = '🤝';
        fond = const Color(0xFFE4F5EC);
        titre = tr(context, 'pro.tab.evtVente');
        final annonce = '${e['annonce'] ?? ''}';
        final prix = (e['prix'] as num?) ?? 0;
        texte = annonce.isEmpty
            ? ''
            : '« $annonce »${prix > 0 ? ' — ${formatFCFA(prix)}' : ''}';
      default:
        emoji = '👁️';
        fond = ChapColors.cream100;
        titre = tr(context, 'pro.tab.evtRecord');
        texte = _tr('pro.tab.evtRecordTexte', {'n': '${e['n'] ?? 0}'});
    }
    final quand = (e['quand'] as num?)?.toInt() ?? 0;
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 7),
      decoration: premier
          ? null
          : const BoxDecoration(
              border: Border(top: BorderSide(color: ChapColors.line))),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 26,
            height: 26,
            alignment: Alignment.center,
            decoration: BoxDecoration(color: fond, shape: BoxShape.circle),
            child: Text(emoji, style: const TextStyle(fontSize: 11)),
          ),
          const SizedBox(width: 9),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(titre,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                        fontSize: 11.5, fontWeight: FontWeight.w700)),
                if (texte.isNotEmpty)
                  Text(texte,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                          fontSize: 10.5, color: ChapColors.gray600)),
              ],
            ),
          ),
          const SizedBox(width: 8),
          if (quand > 0)
            Padding(
              padding: const EdgeInsets.only(top: 2),
              // Moins de 24 h : la forme courte des maquettes (« 12 min »,
              // « 1 h ») ; au-delà, le temps relatif habituel (« hier »…).
              child: Text(
                  DateTime.now().millisecondsSinceEpoch - quand < 86400000
                      ? dureeTr(context, quand)
                      : tempsEcouleTr(context, quand),
                  style: const TextStyle(
                      fontSize: 9.5, color: ChapColors.gray500)),
            ),
        ],
      ),
    );
  }
}

/// La courbe des vues : aire dégradée, ligne orange, point du pic avec sa
/// valeur, dernier point cerclé, étiquettes des jours.
class _CourbeVues extends CustomPainter {
  final List<int> valeurs;
  final List<String> etiquettes;
  const _CourbeVues({required this.valeurs, required this.etiquettes});

  @override
  void paint(Canvas canvas, Size size) {
    const gauche = 26.0, droite = 8.0, haut = 16.0, basMarge = 18.0;
    final bas = size.height - basMarge;
    final largeur = size.width - gauche - droite;
    if (valeurs.isEmpty || largeur <= 0 || bas <= haut) return;

    var max = 5;
    for (final v in valeurs) {
      if (v > max) max = v;
    }
    final cran = max <= 10
        ? 2
        : max <= 25
            ? 5
            : max <= 50
                ? 10
                : max <= 100
                    ? 20
                    : max <= 250
                        ? 50
                        : 100;
    final plafond = ((max + cran - 1) ~/ cran) * cran;

    double x(int i) => valeurs.length < 2
        ? gauche
        : gauche + i * largeur / (valeurs.length - 1);
    double y(int v) => bas - v / plafond * (bas - haut);

    // Le quadrillage discret et ses deux repères.
    final grille = Paint()
      ..color = ChapColors.line
      ..strokeWidth = 1;
    for (final f in [0.0, 0.25, 0.5, 0.75, 1.0]) {
      final yy = bas - f * (bas - haut);
      canvas.drawLine(Offset(gauche, yy), Offset(size.width - droite, yy),
          grille);
    }
    for (final f in [0.0, 1.0]) {
      _texte(canvas, '${(f * plafond).round()}',
          Offset(gauche - 4, bas - f * (bas - haut) - 4),
          couleur: ChapColors.gray500, taille: 8.5, versLaDroite: false);
    }

    // L'aire puis la ligne.
    final chemin = Path()..moveTo(x(0), y(valeurs[0]));
    for (var i = 1; i < valeurs.length; i++) {
      chemin.lineTo(x(i), y(valeurs[i]));
    }
    final aire = Path.from(chemin)
      ..lineTo(x(valeurs.length - 1), bas)
      ..lineTo(x(0), bas)
      ..close();
    canvas.drawPath(
        aire,
        Paint()
          ..shader = LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              ChapColors.orange.withValues(alpha: 0.28),
              ChapColors.orange.withValues(alpha: 0.02),
            ],
          ).createShader(Rect.fromLTRB(0, haut, size.width, bas)));
    canvas.drawPath(
        chemin,
        Paint()
          ..color = ChapColors.orange
          ..style = PaintingStyle.stroke
          ..strokeWidth = 2.2
          ..strokeJoin = StrokeJoin.round);

    // Le pic avec sa valeur, et le dernier point cerclé.
    var iMax = 0;
    for (var i = 1; i < valeurs.length; i++) {
      if (valeurs[i] > valeurs[iMax]) iMax = i;
    }
    if (valeurs[iMax] > 0) {
      final p = Offset(x(iMax), y(valeurs[iMax]));
      canvas.drawCircle(p, 4, Paint()..color = Colors.white);
      canvas.drawCircle(p, 3.2, Paint()..color = ChapColors.orange);
      _texte(canvas, '${valeurs[iMax]}', p.translate(0, -16),
          couleur: ChapColors.ocreDark, taille: 10, gras: true,
          centre: true);
    }
    if (iMax != valeurs.length - 1) {
      final p = Offset(x(valeurs.length - 1), y(valeurs.last));
      canvas.drawCircle(p, 3.4, Paint()..color = Colors.white);
      canvas.drawCircle(
          p,
          3.4,
          Paint()
            ..color = ChapColors.orange
            ..style = PaintingStyle.stroke
            ..strokeWidth = 2);
    }

    // Les jours.
    for (var i = 0; i < valeurs.length && i < etiquettes.length; i++) {
      if (etiquettes[i].isEmpty) continue;
      final dernier = i == valeurs.length - 1;
      _texte(canvas, etiquettes[i], Offset(x(i), size.height - 11),
          couleur: dernier ? ChapColors.ink : ChapColors.gray600,
          taille: 9, gras: dernier, centre: true);
    }
  }

  void _texte(Canvas canvas, String s, Offset o,
      {required Color couleur,
      required double taille,
      bool gras = false,
      bool centre = false,
      bool versLaDroite = true}) {
    final tp = TextPainter(
      text: TextSpan(
          text: s,
          style: TextStyle(
              color: couleur,
              fontSize: taille,
              fontWeight: gras ? FontWeight.w800 : FontWeight.w400)),
      textDirection: TextDirection.ltr,
    )..layout();
    tp.paint(
        canvas,
        centre
            ? o.translate(-tp.width / 2, 0)
            : versLaDroite
                ? o
                : o.translate(-tp.width, 0));
  }

  @override
  bool shouldRepaint(_CourbeVues ancien) =>
      ancien.valeurs != valeurs || ancien.etiquettes != etiquettes;
}
