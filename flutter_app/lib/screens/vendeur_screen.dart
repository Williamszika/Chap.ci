import 'package:flutter/material.dart';
import '../api/api_client.dart';
import '../api/messaging.dart';
import '../api/models.dart';
import '../api/profil.dart';
import '../format.dart';
import '../theme.dart';
import '../widgets/listing_card.dart';
import 'conversation_screen.dart';
import 'listing_detail_screen.dart';

/// La page publique d'un vendeur, comme sur le site : avatar, nom, commune,
/// « Nouveau vendeur » s'il n'a pas d'avis, ses compteurs (annonces · note ·
/// avis), les boutons Contacter et Suivre, puis trois onglets — Annonces, Avis
/// et À propos.
///
/// Données : `GET /profile/{id}` (profil), `GET /reviews?target_id={id}` (avis),
/// et `GET /listings` filtré sur ce vendeur (ses annonces en vente). Même
/// backend que le site, sans route nouvelle.
class VendeurScreen extends StatefulWidget {
  final String sellerId;
  final String sellerName;
  final bool sellerVerified;

  /// Aperçu (tests) : données injectées, aucun appel réseau.
  final bool apercu;
  final ProfilPublic? apercuProfil;
  final List<Avis>? apercuAvis;
  final List<Listing>? apercuAnnonces;

  const VendeurScreen({
    super.key,
    required this.sellerId,
    required this.sellerName,
    this.sellerVerified = false,
    this.apercu = false,
    this.apercuProfil,
    this.apercuAvis,
    this.apercuAnnonces,
  });

  @override
  State<VendeurScreen> createState() => _VendeurScreenState();
}

class _VendeurScreenState extends State<VendeurScreen> {
  ProfilPublic? _profil;
  List<Avis>? _avis;
  List<Listing>? _annonces; // null tant que ça charge
  bool _erreur = false;
  bool _suivi = false;
  String _onglet = 'annonces'; // annonces | avis | apropos

  @override
  void initState() {
    super.initState();
    if (widget.apercu) {
      _profil = widget.apercuProfil;
      _avis = widget.apercuAvis ?? const [];
      _annonces = widget.apercuAnnonces ?? const [];
    } else {
      _charger();
    }
  }

  Future<void> _charger() async {
    ProfilPublic? profil;
    var avis = <Avis>[];
    var annonces = <Listing>[];
    var erreur = false;
    try {
      profil = await ProfilApi.profil(widget.sellerId);
    } catch (_) {/* le profil peut manquer, on affiche quand même le reste */}
    try {
      avis = await ProfilApi.avis(widget.sellerId);
    } catch (_) {/* pas d'avis affichés */}
    try {
      final toutes = await Listing.toutes();
      annonces = toutes.where((l) => l.sellerId == widget.sellerId).toList();
    } catch (_) {
      erreur = true;
    }
    if (!mounted) return;
    setState(() {
      _profil = profil;
      _avis = avis;
      _annonces = annonces;
      _erreur = erreur;
    });
  }

  String get _nom => _profil?.nom ?? widget.sellerName;
  bool get _verified => _profil?.verified ?? widget.sellerVerified;

  /// La commune la plus fréquente parmi les annonces (le site montre un lieu).
  String? get _commune {
    final a = _annonces;
    if (a == null || a.isEmpty) return null;
    final compte = <String, int>{};
    for (final l in a) {
      final c = l.commune;
      if (c != null && c.isNotEmpty) compte[c] = (compte[c] ?? 0) + 1;
    }
    if (compte.isEmpty) return null;
    return compte.entries.reduce((x, y) => x.value >= y.value ? x : y).key;
  }

  String get _note {
    final av = _avis;
    if (av == null || av.isEmpty) return '—';
    final somme = av.fold<int>(0, (s, a) => s + a.note);
    return (somme / av.length).toStringAsFixed(1);
  }

  @override
  Widget build(BuildContext context) {
    final charge = _annonces == null;
    return Scaffold(
      appBar: AppBar(title: const Text('Vendeur')),
      body: charge
          ? const Center(
              child: CircularProgressIndicator(color: ChapColors.orange))
          : RefreshIndicator(
              color: ChapColors.orange,
              onRefresh: _charger,
              child: CustomScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                slivers: [
                  SliverToBoxAdapter(child: _entete()),
                  ..._corps(),
                ],
              ),
            ),
    );
  }

  Widget _entete() {
    final nbAnnonces = _annonces?.length ?? 0;
    final nbAvis = _avis?.length ?? 0;
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 6),
      child: Column(
        children: [
          _avatar(),
          const SizedBox(height: 10),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Flexible(
                child: Text(_nom,
                    textAlign: TextAlign.center,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w800,
                        color: ChapColors.gray900)),
              ),
              if (_verified) ...[
                const SizedBox(width: 6),
                const Icon(Icons.verified, size: 20, color: Color(0xFF2E7DB8)),
              ],
            ],
          ),
          if (_commune != null) ...[
            const SizedBox(height: 3),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.place_outlined,
                    size: 14, color: ChapColors.gray500),
                const SizedBox(width: 3),
                Text(_commune!,
                    style: const TextStyle(
                        fontSize: 13, color: ChapColors.gray600)),
              ],
            ),
          ],
          if (nbAvis == 0) ...[
            const SizedBox(height: 6),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                  color: ChapColors.cream100,
                  borderRadius: BorderRadius.circular(20)),
              child: const Text('Nouveau vendeur',
                  style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: ChapColors.ocreDark)),
            ),
          ],
          const SizedBox(height: 14),
          _stats(nbAnnonces, nbAvis),
          const SizedBox(height: 14),
          _boutons(),
          const SizedBox(height: 12),
          _onglets(nbAnnonces, nbAvis),
        ],
      ),
    );
  }

  Widget _avatar() {
    final url = _profil?.avatarUrl;
    final image = (url != null && url.isNotEmpty)
        ? ImageSource.resoudre(url).url
        : null;
    final initiale =
        _nom.trim().isNotEmpty ? _nom.trim()[0].toUpperCase() : '?';
    return Container(
      height: 88,
      width: 88,
      decoration: const BoxDecoration(
          color: ChapColors.green, shape: BoxShape.circle),
      clipBehavior: Clip.antiAlias,
      alignment: Alignment.center,
      child: image != null
          ? Image.network(image,
              height: 88,
              width: 88,
              fit: BoxFit.cover,
              errorBuilder: (c, e, s) => _initiale(initiale))
          : _initiale(initiale),
    );
  }

  Widget _initiale(String s) => Text(s,
      style: const TextStyle(
          fontSize: 38, fontWeight: FontWeight.w900, color: Colors.white));

  Widget _stats(int annonces, int avis) {
    Widget bloc(String valeur, String libelle) => Expanded(
          child: Column(
            children: [
              Text(valeur,
                  style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w800,
                      color: ChapColors.gray900)),
              const SizedBox(height: 2),
              Text(libelle,
                  style: const TextStyle(
                      fontSize: 11.5, color: ChapColors.gray500)),
            ],
          ),
        );
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 12),
      decoration: BoxDecoration(
        color: ChapColors.cream,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: ChapColors.line),
      ),
      child: Row(
        children: [
          bloc('$annonces', annonces == 1 ? 'annonce' : 'annonces'),
          Container(width: 1, height: 30, color: ChapColors.line),
          bloc(_note, 'note'),
          Container(width: 1, height: 30, color: ChapColors.line),
          bloc('$avis', avis == 1 ? 'avis' : 'avis'),
        ],
      ),
    );
  }

  Widget _boutons() {
    return Row(
      children: [
        Expanded(
          child: ElevatedButton.icon(
            onPressed: _contacter,
            icon: const Icon(Icons.chat_bubble_outline, size: 18),
            label: const Text('Contacter'),
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: OutlinedButton.icon(
            onPressed: _suivre,
            icon: Icon(_suivi ? Icons.check : Icons.add,
                size: 18,
                color: _suivi ? ChapColors.greenDark : ChapColors.gray700),
            label: Text(_suivi ? 'Suivi' : 'Suivre',
                style: TextStyle(
                    color: _suivi ? ChapColors.greenDark : ChapColors.gray700)),
            style: OutlinedButton.styleFrom(
                side: BorderSide(
                    color: _suivi ? ChapColors.greenDark : ChapColors.line2)),
          ),
        ),
      ],
    );
  }

  Widget _onglets(int annonces, int avis) {
    Widget chip(String cle, String texte) {
      final actif = _onglet == cle;
      return Padding(
        padding: const EdgeInsets.only(right: 8),
        child: ChoiceChip(
          label: Text(texte),
          selected: actif,
          onSelected: (_) => setState(() => _onglet = cle),
          showCheckmark: false,
          labelStyle: TextStyle(
              fontSize: 12.5,
              fontWeight: FontWeight.w600,
              color: actif ? Colors.white : ChapColors.gray700),
          selectedColor: ChapColors.orange,
          backgroundColor: ChapColors.cream,
          side: const BorderSide(color: ChapColors.line2),
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        ),
      );
    }

    return Align(
      alignment: Alignment.centerLeft,
      child: Row(
        children: [
          chip('annonces', 'Annonces · $annonces'),
          chip('avis', 'Avis · $avis'),
          chip('apropos', 'À propos'),
        ],
      ),
    );
  }

  List<Widget> _corps() {
    if (_erreur) {
      return [
        SliverFillRemaining(
          hasScrollBody: false,
          child: _message(Icons.wifi_off_rounded, 'Connexion impossible',
              'Tirez vers le bas pour réessayer.'),
        ),
      ];
    }
    switch (_onglet) {
      case 'avis':
        return _corpsAvis();
      case 'apropos':
        return _corpsApropos();
      default:
        return _corpsAnnonces();
    }
  }

  List<Widget> _corpsAnnonces() {
    final a = _annonces ?? const <Listing>[];
    if (a.isEmpty) {
      return [
        SliverToBoxAdapter(
          child: _message(Icons.storefront_outlined, 'Aucune annonce en vente',
              'Ce vendeur n’a pas d’annonce visible pour le moment.'),
        ),
      ];
    }
    return [
      SliverPadding(
        padding: const EdgeInsets.fromLTRB(12, 8, 12, 16),
        sliver: SliverGrid(
          gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
            maxCrossAxisExtent: 220,
            mainAxisSpacing: 12,
            crossAxisSpacing: 12,
            childAspectRatio: 0.66,
          ),
          delegate: SliverChildBuilderDelegate(
            (context, i) => ListingCard(
              annonce: a[i],
              onTap: () => Navigator.of(context).push(MaterialPageRoute(
                  builder: (_) => ListingDetailScreen(annonce: a[i]))),
            ),
            childCount: a.length,
          ),
        ),
      ),
    ];
  }

  List<Widget> _corpsAvis() {
    final av = _avis ?? const <Avis>[];
    if (av.isEmpty) {
      return [
        SliverToBoxAdapter(
          child: _message(Icons.reviews_outlined, 'Aucun avis pour le moment',
              'Les avis laissés par les acheteurs apparaîtront ici.'),
        ),
      ];
    }
    return [
      SliverPadding(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
        sliver: SliverList(
          delegate: SliverChildBuilderDelegate(
            (context, i) => _carteAvis(av[i]),
            childCount: av.length,
          ),
        ),
      ),
    ];
  }

  Widget _carteAvis(Avis a) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: ChapColors.cream,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: ChapColors.line),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(a.auteur,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: ChapColors.gray900)),
              ),
              Row(
                children: List.generate(
                  5,
                  (i) => Icon(
                    i < a.note ? Icons.star_rounded : Icons.star_outline_rounded,
                    size: 16,
                    color: const Color(0xFFF5A623),
                  ),
                ),
              ),
            ],
          ),
          if (a.commentaire != null) ...[
            const SizedBox(height: 6),
            Text(a.commentaire!,
                style: const TextStyle(
                    fontSize: 13.5, height: 1.45, color: ChapColors.gray700)),
          ],
          if (a.createdAt > 0) ...[
            const SizedBox(height: 6),
            Text(tempsEcoule(a.createdAt),
                style: const TextStyle(
                    fontSize: 11.5, color: ChapColors.gray500)),
          ],
        ],
      ),
    );
  }

  List<Widget> _corpsApropos() {
    final bio = _profil?.bio;
    return [
      SliverToBoxAdapter(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 10, 16, 24),
          child: Text(
            (bio != null && bio.trim().isNotEmpty)
                ? bio
                : 'Ce vendeur n’a pas encore ajouté de description.',
            style: const TextStyle(
                fontSize: 14.5, height: 1.5, color: ChapColors.gray700),
          ),
        ),
      ),
    ];
  }

  Widget _message(IconData icone, String titre, String detail) {
    return Padding(
      padding: const EdgeInsets.all(32),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icone, size: 48, color: ChapColors.line2),
          const SizedBox(height: 12),
          Text(titre,
              style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: ChapColors.gray900)),
          const SizedBox(height: 6),
          Text(detail,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 14, color: ChapColors.gray600)),
        ],
      ),
    );
  }

  /// Ouvre une conversation avec le vendeur. Une conversation est adossée à une
  /// annonce côté serveur : on rattache à la première annonce du vendeur.
  Future<void> _contacter() async {
    if (!ApiClient.instance.connecte) {
      _info('Connectez-vous depuis l’onglet Compte pour contacter le vendeur.');
      return;
    }
    final annonces = _annonces ?? const <Listing>[];
    if (annonces.isEmpty) {
      _info('Ce vendeur n’a pas d’annonce active à contacter pour le moment.');
      return;
    }
    final monId = await ApiClient.instance.monId();
    if (!mounted) return;
    if (widget.sellerId == monId) {
      _info('C’est votre profil.');
      return;
    }
    try {
      final convId =
          await Conversation.ouvrirAvec(annonces.first.id, widget.sellerId);
      if (!mounted) return;
      Navigator.of(context).push(MaterialPageRoute(
        builder: (_) => ConversationScreen(conversationId: convId, titre: _nom),
      ));
    } on ApiException catch (e) {
      if (mounted) _info(e.message);
    }
  }

  void _suivre() {
    // Comme sur le site : le suivi est purement local pour l'instant (pas de
    // route serveur). On confirme d'un mot, sans rien promettre de plus.
    setState(() => _suivi = !_suivi);
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(_suivi
            ? 'Vous suivez $_nom.'
            : 'Vous ne suivez plus $_nom.')));
  }

  void _info(String message) {
    ScaffoldMessenger.of(context)
        .showSnackBar(SnackBar(content: Text(message)));
  }
}
