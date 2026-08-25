import 'package:flutter/material.dart';
import 'package:share_plus/share_plus.dart';
import '../api/api_client.dart';
import '../api/messaging.dart';
import '../api/models.dart';
import '../data/categories.dart';
import '../data/formulaires/registre.dart';
import '../format.dart';
import '../i18n/textes.dart';
import '../theme.dart';
import '../widgets/bouton_favori.dart';
import 'conversation_screen.dart';
import 'vendeur_screen.dart';

/// Fiche d'une annonce — le détail complet : photos, prix, état, description,
/// vendeur, et le bouton « Contacter ».
///
/// On reçoit l'annonce déjà chargée (depuis la grille) pour un affichage
/// instantané, et on enregistre la vue en arrière-plan.
class ListingDetailScreen extends StatefulWidget {
  final Listing annonce;

  /// En mode aperçu (tests, captures d'écran), on ne compte pas la vue : pas
  /// d'appel réseau, l'écran reste déterministe.
  final bool apercu;

  const ListingDetailScreen(
      {super.key, required this.annonce, this.apercu = false});

  @override
  State<ListingDetailScreen> createState() => _ListingDetailScreenState();
}

class _ListingDetailScreenState extends State<ListingDetailScreen> {
  final _pageCtrl = PageController();
  int _page = 0;

  @override
  void initState() {
    super.initState();
    // Une vue, comptée en silence — sauf en aperçu (pas de réseau).
    if (!widget.apercu) Listing.marquerVue(widget.annonce.id);
  }

  @override
  void dispose() {
    _pageCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final a = widget.annonce;
    return Scaffold(
      appBar: AppBar(
        title: Text(tr(context, 'annonce.titre')),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 4),
            child: Center(
                child: BoutonFavori(listingId: a.id, taille: 24)),
          ),
          Builder(
            builder: (btnContext) => IconButton(
              icon: const Icon(Icons.share_outlined),
              tooltip: tr(context, 'action.partager'),
              onPressed: () => _partager(btnContext, a),
            ),
          ),
        ],
      ),
      body: ListView(
        children: [
          _carrousel(a),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 14, 16, 24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(a.title,
                    style: const TextStyle(
                        fontSize: 20,
                        height: 1.2,
                        fontWeight: FontWeight.w800,
                        color: ChapColors.gray900)),
                const SizedBox(height: 10),
                _prix(a),
                const SizedBox(height: 12),
                _badges(a),
                const SizedBox(height: 8),
                _filAriane(a),
                const SizedBox(height: 6),
                Row(
                  children: [
                    const Icon(Icons.schedule,
                        size: 14, color: ChapColors.gray500),
                    const SizedBox(width: 4),
                    Text('Publié ${tempsEcoule(a.createdAt)}',
                        style: const TextStyle(
                            fontSize: 12.5, color: ChapColors.gray600)),
                    if (a.views > 0) ...[
                      const SizedBox(width: 12),
                      const Icon(Icons.visibility_outlined,
                          size: 14, color: ChapColors.gray500),
                      const SizedBox(width: 4),
                      Text('${a.views} ${a.views == 1 ? 'vue' : 'vues'}',
                          style: const TextStyle(
                              fontSize: 12.5, color: ChapColors.gray600)),
                    ],
                  ],
                ),
                _detailsSection(a),
                const Divider(height: 30, color: ChapColors.line),
                Text(tr(context, 'annonce.description'),
                    style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.bold,
                        color: ChapColors.gray900)),
                const SizedBox(height: 6),
                Text(
                  a.description.trim().isEmpty
                      ? tr(context, 'annonce.sansDescription')
                      : a.description,
                  style: const TextStyle(
                      fontSize: 14.5, height: 1.5, color: ChapColors.gray700),
                ),
                const Divider(height: 30, color: ChapColors.line),
                _vendeur(a),
              ],
            ),
          ),
        ],
      ),
      bottomNavigationBar: _barreContact(context, a),
    );
  }

  Widget _carrousel(Listing a) {
    if (a.images.isEmpty) {
      return Container(
        height: 300,
        color: ChapColors.cream100,
        child: const Icon(Icons.image_outlined,
            size: 60, color: ChapColors.line2),
      );
    }
    return SizedBox(
      height: 320,
      child: Stack(
        children: [
          PageView.builder(
            controller: _pageCtrl,
            onPageChanged: (i) => setState(() => _page = i),
            itemCount: a.images.length,
            itemBuilder: (context, i) {
              final src = ImageSource.resoudre(a.images[i]);
              if (src.bytes != null) {
                return Image.memory(src.bytes!,
                    fit: BoxFit.cover, width: double.infinity);
              }
              if (src.url != null) {
                return Image.network(src.url!,
                    fit: BoxFit.cover,
                    width: double.infinity,
                    errorBuilder: (c, e, s) => Container(
                        color: ChapColors.cream100,
                        child: const Icon(Icons.broken_image_outlined,
                            color: ChapColors.line2)));
              }
              return Container(color: ChapColors.cream100);
            },
          ),
          if (a.sold)
            Positioned(
              top: 14,
              left: 14,
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                    color: Colors.black87,
                    borderRadius: BorderRadius.circular(8)),
                child: Text(tr(context, 'annonce.vendu'),
                    style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 1.5)),
              ),
            ),
          if (a.images.length > 1)
            Positioned(
              bottom: 12,
              left: 0,
              right: 0,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(
                  a.images.length,
                  (i) => AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    margin: const EdgeInsets.symmetric(horizontal: 3),
                    width: i == _page ? 18 : 7,
                    height: 7,
                    decoration: BoxDecoration(
                      color: i == _page ? ChapColors.orange : Colors.white70,
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _prix(Listing a) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.baseline,
      textBaseline: TextBaseline.alphabetic,
      children: [
        Text(formatFCFA(a.prixAffiche),
            style: const TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.w900,
                color: ChapColors.orangeDark)),
        if (a.enPromo) ...[
          const SizedBox(width: 8),
          Text(formatFCFA(a.price),
              style: const TextStyle(
                  fontSize: 15,
                  color: ChapColors.gray500,
                  decoration: TextDecoration.lineThrough)),
        ],
        if (a.negotiable) ...[
          const SizedBox(width: 8),
          Text(tr(context, 'annonce.negociable'),
              style: const TextStyle(fontSize: 13, color: ChapColors.gray600)),
        ],
      ],
    );
  }

  Widget _badges(Listing a) {
    Widget puce(String texte, Color fond, Color texteCol) => Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
          decoration: BoxDecoration(
              color: fond, borderRadius: BorderRadius.circular(20)),
          child: Text(texte,
              style: TextStyle(
                  fontSize: 12, fontWeight: FontWeight.w600, color: texteCol)),
        );
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: [
        puce(tr(context, a.condition == 'neuf' ? 'cond.neuf' : 'cond.occasion'),
            ChapColors.cream100, ChapColors.ocreDark),
        if (a.commune != null && a.commune!.isNotEmpty)
          puce('📍 ${a.commune}', ChapColors.cream100, ChapColors.gray700),
        if (a.delivery)
          puce('🚚 ${tr(context, 'annonce.livraison')}',
              const Color(0xFFE6F6EE), ChapColors.greenDark),
      ],
    );
  }

  Widget _filAriane(Listing a) {
    final cat = nomCategorie(a.categoryId);
    final sous = a.subcategory;
    final texte = (sous != null && sous.isNotEmpty) ? '$cat · $sous' : cat;
    return Row(
      children: [
        const Icon(Icons.local_offer_outlined,
            size: 13, color: ChapColors.gray500),
        const SizedBox(width: 5),
        Flexible(
          child: Text(texte,
              overflow: TextOverflow.ellipsis,
              style:
                  const TextStyle(fontSize: 12.5, color: ChapColors.gray600)),
        ),
      ],
    );
  }

  /// La section « Détails » — État, les réponses du formulaire (Taille, Marque,
  /// Pour…) étiquetées par le schéma, puis Livraison. Même contenu que la fiche
  /// du site. Rien si l'annonce n'a aucun détail à montrer.
  Widget _detailsSection(Listing a) {
    final items = _details(a);
    if (items.isEmpty) return const SizedBox.shrink();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Divider(height: 30, color: ChapColors.line),
        Text(tr(context, 'annonce.details'),
            style: const TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.bold,
                color: ChapColors.gray900)),
        const SizedBox(height: 10),
        for (final it in items)
          Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SizedBox(
                  width: 120,
                  child: Text(it.$1,
                      style: const TextStyle(
                          fontSize: 13.5, color: ChapColors.gray600)),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(it.$2,
                      style: const TextStyle(
                          fontSize: 13.5,
                          fontWeight: FontWeight.w600,
                          color: ChapColors.gray900)),
                ),
              ],
            ),
          ),
      ],
    );
  }

  /// Construit la liste « libellé → valeur » comme le site : État d'abord, puis
  /// les champs du schéma qui ont une réponse, les éventuels champs restants
  /// (anciens formulaires) hors variantes couleur, et enfin Livraison.
  List<(String, String)> _details(Listing a) {
    final items = <(String, String)>[];
    final schema = schemaPour(a.categoryId, a.subcategory);

    if (schema == null || schema.etat != false) {
      items.add((tr(context, 'annonce.etat'),
          tr(context, a.condition == 'neuf' ? 'cond.neuf' : 'cond.occasion')));
    }

    String? fmt(dynamic v) {
      if (v == null) return null;
      if (v is List) {
        final s = v
            .map((e) => e.toString().trim())
            .where((e) => e.isNotEmpty)
            .join(', ');
        return s.isEmpty ? null : s;
      }
      if (v is bool) return v ? tr(context, 'bool.oui') : tr(context, 'bool.non');
      final s = v.toString().trim();
      return s.isEmpty ? null : s;
    }

    final vus = <String>{};
    if (schema != null) {
      for (final champ in schema.champs) {
        final v = fmt(a.attributes[champ.cle]);
        if (v == null) continue;
        items.add((champ.libelle, v));
        vus.add(champ.cle);
      }
    }

    // Champs restants (sous-catégorie non portée, anciens formulaires), hors
    // variantes couleur (`var_…`) et clés internes.
    const internes = {'docs', 'couleurs', 'lat', 'lng', 'region_id', 'city_id'};
    for (final e in a.attributes.entries) {
      if (vus.contains(e.key) ||
          e.key.startsWith('var_') ||
          internes.contains(e.key)) {
        continue;
      }
      final v = fmt(e.value);
      if (v == null) continue;
      final k = e.key;
      items.add(
          (k.isEmpty ? k : '${k[0].toUpperCase()}${k.substring(1)}', v));
    }

    if (schema?.livraison == true) {
      items.add((tr(context, 'annonce.livraison'),
          a.delivery ? tr(context, 'annonce.possible') : tr(context, 'annonce.surPlace')));
    }
    return items;
  }

  Widget _vendeur(Listing a) {
    // Certaines annonces (l'équipe Chap.ci) n'ont pas de compte vendeur unique :
    // dans ce cas, pas de page à ouvrir, le bloc reste simplement informatif.
    final aVendeur = a.sellerId != null && a.sellerId!.isNotEmpty;
    final contenu = Row(
      children: [
        const CircleAvatar(
          radius: 22,
          backgroundColor: ChapColors.cream100,
          child: Icon(Icons.storefront, color: ChapColors.orange, size: 22),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Flexible(
                    child: Text(a.sellerName,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.bold,
                            color: ChapColors.gray900)),
                  ),
                  if (a.sellerVerified) ...[
                    const SizedBox(width: 5),
                    const Icon(Icons.verified,
                        size: 16, color: Color(0xFF2E7DB8)),
                  ],
                ],
              ),
              Text(
                  aVendeur
                      ? tr(context, 'vendeur.voir')
                      : tr(context, 'vendeur.sur'),
                  style: const TextStyle(
                      fontSize: 12.5, color: ChapColors.gray600)),
            ],
          ),
        ),
        if (aVendeur)
          const Icon(Icons.chevron_right, color: ChapColors.gray500),
      ],
    );

    if (!aVendeur) return contenu;
    return InkWell(
      onTap: () => Navigator.of(context).push(MaterialPageRoute(
        builder: (_) => VendeurScreen(
          sellerId: a.sellerId!,
          sellerName: a.sellerName,
          sellerVerified: a.sellerVerified,
        ),
      )),
      borderRadius: BorderRadius.circular(12),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 6),
        child: contenu,
      ),
    );
  }

  /// Ouvre la feuille de partage native (réseaux sociaux, WhatsApp, « Copier »…)
  /// avec le lien public de l'annonce. `sharePositionOrigin` est requis sur iPad,
  /// sinon la feuille ne sait pas d'où s'ancrer.
  Future<void> _partager(BuildContext ctx, Listing a) async {
    final url = 'https://chap.ci/annonce/${a.id}';
    final box = ctx.findRenderObject() as RenderBox?;
    try {
      await SharePlus.instance.share(ShareParams(
        text: '${a.title} — ${formatFCFA(a.prixAffiche)}\n$url',
        subject: '${a.title} · Chap.ci',
        sharePositionOrigin:
            box != null ? box.localToGlobal(Offset.zero) & box.size : null,
      ));
    } catch (_) {
      if (mounted) {
        _info(context, '${tr(context, 'annonce.partageEchec')}$url');
      }
    }
  }

  Widget _barreContact(BuildContext context, Listing a) {
    // top: false — c'est une barre fixée EN BAS ; seule la zone gestuelle du bas
    // doit être réservée (cohérent avec la barre de saisie de la messagerie).
    return SafeArea(
      top: false,
      child: Container(
        padding: const EdgeInsets.fromLTRB(16, 10, 16, 10),
        decoration: const BoxDecoration(
          color: ChapColors.cream,
          border: Border(top: BorderSide(color: ChapColors.line)),
        ),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(formatFCFA(a.prixAffiche),
                      style: const TextStyle(
                          fontSize: 17,
                          fontWeight: FontWeight.w900,
                          color: ChapColors.orangeDark)),
                  Text(tr(context, 'annonce.prixAffiche'),
                      style: const TextStyle(
                          fontSize: 11, color: ChapColors.gray500)),
                ],
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: ElevatedButton.icon(
                onPressed: a.sold ? null : () => _contacter(a),
                icon: const Icon(Icons.chat_bubble_outline, size: 18),
                label: Text(a.sold
                    ? tr(context, 'etat.venduCourt')
                    : tr(context, 'action.contacter')),
              ),
            ),
          ],
        ),
      ),
    );
  }

  /// « Contacter » : ouvre (ou retrouve) la conversation avec le vendeur, puis
  /// le fil de discussion. Refuse poliment si non connecté ou si c'est sa
  /// propre annonce.
  Future<void> _contacter(Listing a) async {
    if (!ApiClient.instance.connecte) {
      _info(context, tr(context, 'annonce.contacterConnexion'));
      return;
    }
    if (a.sellerId == null || a.sellerId!.isEmpty) {
      _info(context, tr(context, 'annonce.contacterImpossible'));
      return;
    }
    final monId = await ApiClient.instance.monId();
    if (!mounted) return;
    if (a.sellerId == monId) {
      _info(context, tr(context, 'annonce.proprAnnonce'));
      return;
    }
    try {
      final convId = await Conversation.ouvrirAvec(a.id, a.sellerId!);
      if (!mounted) return;
      Navigator.of(context).push(MaterialPageRoute(
        builder: (_) => ConversationScreen(
            conversationId: convId, titre: a.sellerName, autreId: a.sellerId),
      ));
    } on ApiException catch (e) {
      if (mounted) _info(context, e.message);
    }
  }

  void _info(BuildContext context, String message) {
    showModalBottomSheet(
      context: context,
      backgroundColor: ChapColors.cream,
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (context) => Padding(
        padding: const EdgeInsets.fromLTRB(20, 20, 20, 30),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Icon(Icons.info_outline, color: ChapColors.orange),
            const SizedBox(height: 10),
            Text(message,
                style: const TextStyle(
                    fontSize: 14.5, height: 1.5, color: ChapColors.gray700)),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                  onPressed: () => Navigator.pop(context),
                  child: Text(tr(context, 'action.compris'))),
            ),
          ],
        ),
      ),
    );
  }
}
