import 'package:flutter/material.dart';
import '../api/admin.dart';
import '../api/api_client.dart';
import '../liens_site.dart';
import '../theme.dart';
import 'admin/tableau_bord_screen.dart';
import 'modifier_profil_screen.dart';
import 'mot_de_passe_screen.dart';
import 'securite_2fa_screen.dart';
import 'supprimer_compte_screen.dart';
import 'verifier_email_screen.dart';

/// Paramètres — le point d'entrée unique de tous les réglages du compte.
///
/// Il rassemble ce qui était éparpillé (profil, 2FA, aide, suppression) et
/// branche ce qui existait déjà côté serveur sans écran : les préférences de
/// notifications (`/notifications/prefs`) et le changement de mot de passe
/// (`/auth/password`). Tout revient au même endroit, groupé et lisible.
///
/// Renvoie `true` en se fermant si l'état a changé (déconnexion, suppression)
/// pour que l'écran Compte se redessine.
class ParametresScreen extends StatefulWidget {
  const ParametresScreen({super.key});
  @override
  State<ParametresScreen> createState() => _ParametresScreenState();
}

class _ParametresScreenState extends State<ParametresScreen> {
  String _email = '';
  bool _emailVerifie = false;
  bool _2faActive = false;
  bool _estAdmin = false;
  bool _chargement = true;

  // Préférences de notifications (défauts serveur : tout à vrai).
  bool _notifMessage = true;
  bool _notifFavori = true;
  bool _notifEmail = true;
  bool _notifPretes = false;
  bool _notifEnvoi = false;

  @override
  void initState() {
    super.initState();
    _charger();
  }

  Future<void> _charger() async {
    // Identité + état e-mail.
    try {
      final moi = await ApiClient.instance.moi();
      _email = (moi?['email'] as String?) ?? '';
      _emailVerifie = moi?['emailVerified'] == true;
    } catch (_) {/* on affiche quand même le reste */}
    // 2FA.
    _2faActive = await ApiClient.instance.statut2FA();
    // Admin (l'entrée « Tableau de bord » n'apparaît que pour eux).
    try {
      final acces = await AdminApi.verifier();
      _estAdmin = acces.admin;
    } catch (_) {/* pas admin, pas grave */}
    if (mounted) setState(() => _chargement = false);
    _chargerNotifs();
  }

  Future<void> _chargerNotifs() async {
    try {
      final d = await ApiClient.instance.get('/notifications/prefs');
      if (d is Map && mounted) {
        setState(() {
          _notifMessage = d['message'] != false;
          _notifFavori = d['favorite'] != false;
          _notifEmail = d['email'] != false;
          _notifPretes = true;
        });
      }
    } catch (_) {
      // Hors ligne : on montre les interrupteurs avec les valeurs par défaut.
      if (mounted) setState(() => _notifPretes = true);
    }
  }

  /// Enregistre les trois préférences d'un coup. En cas d'échec, on revient à
  /// l'état précédent et on prévient — un interrupteur qui ment est pire que pas
  /// d'interrupteur.
  Future<void> _majNotifs(void Function() applique, void Function() annule) async {
    if (_notifEnvoi) return;
    setState(() {
      applique();
      _notifEnvoi = true;
    });
    try {
      await ApiClient.instance.put('/notifications/prefs', {
        'message': _notifMessage,
        'favorite': _notifFavori,
        'email': _notifEmail,
      });
    } on ApiException catch (e) {
      if (mounted) {
        setState(annule);
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text(e.message)));
      }
    } finally {
      if (mounted) setState(() => _notifEnvoi = false);
    }
  }

  Future<void> _ouvrir(Widget ecran) async {
    final r = await Navigator.of(context)
        .push<Object?>(MaterialPageRoute(builder: (_) => ecran));
    if (r == true && mounted) _charger();
  }

  Future<void> _seDeconnecter() async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: ChapColors.cream,
        title: const Text('Se déconnecter ?'),
        content: const Text('Vous devrez ressaisir votre mot de passe pour revenir.'),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text('Annuler')),
          TextButton(
              onPressed: () => Navigator.pop(context, true),
              child: const Text('Se déconnecter',
                  style: TextStyle(color: Color(0xFFB42318)))),
        ],
      ),
    );
    if (ok != true) return;
    await ApiClient.instance.seDeconnecter();
    if (mounted) Navigator.of(context).pop(true);
  }

  Future<void> _supprimer() async {
    await Navigator.of(context).push(
        MaterialPageRoute(builder: (_) => const SupprimerCompteScreen()));
    // Le compte a peut-être été supprimé : on remonte l'info et on ferme.
    if (mounted && !ApiClient.instance.connecte) {
      Navigator.of(context).pop(true);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
        appBar: AppBar(title: const Text('Paramètres')),
        body: _chargement
            ? const Center(
                child: CircularProgressIndicator(color: ChapColors.orange))
            : ListView(
                  padding: const EdgeInsets.only(bottom: 28),
                  children: [
                    if (_estAdmin) ...[
                      _label('Administration'),
                      _groupe([
                        _ligne(
                          icone: Icons.dashboard_outlined,
                          fond: ChapColors.cream100,
                          teinte: ChapColors.orangeDark,
                          titre: 'Tableau de bord',
                          onTap: () => Navigator.of(context).push(MaterialPageRoute(
                              builder: (_) => const TableauBordScreen())),
                        ),
                      ]),
                    ],

                    _label('Compte'),
                    _groupe([
                      _ligne(
                        icone: Icons.person_outline,
                        fond: const Color(0xFFFFEAD1),
                        teinte: const Color(0xFFB4600C),
                        titre: 'Profil',
                        sous: 'Nom, photo, bio, téléphone',
                        onTap: () => _ouvrir(const ModifierProfilScreen()),
                      ),
                      _ligne(
                        icone: Icons.alternate_email,
                        fond: const Color(0xFFE6EEF8),
                        teinte: const Color(0xFF3B5A80),
                        titre: 'Adresse e-mail',
                        sous: _email.isEmpty
                            ? (_emailVerifie ? 'Confirmée' : 'À confirmer')
                            : '$_email · ${_emailVerifie ? 'confirmée' : 'à confirmer'}',
                        sousCouleur:
                            _emailVerifie ? ChapColors.greenDark : ChapColors.ocreDark,
                        fin: _emailVerifie
                            ? const Icon(Icons.check_circle,
                                size: 20, color: ChapColors.greenDark)
                            : null,
                        onTap: _emailVerifie
                            ? null
                            : () => _ouvrir(const VerifierEmailScreen()),
                      ),
                      _ligne(
                        icone: Icons.lock_outline,
                        fond: const Color(0xFFECE7DE),
                        teinte: const Color(0xFF5B5344),
                        titre: 'Mot de passe',
                        sous: 'Modifier',
                        onTap: () => _ouvrir(const MotDePasseScreen()),
                      ),
                      _ligne(
                        icone: Icons.shield_outlined,
                        fond: const Color(0xFFDFF2E8),
                        teinte: ChapColors.greenDark,
                        titre: 'Double authentification',
                        sous: _2faActive ? 'Activée' : 'Désactivée',
                        sousCouleur: _2faActive ? ChapColors.greenDark : null,
                        onTap: () => _ouvrir(const Securite2faScreen()),
                      ),
                    ]),

                    _label('Notifications'),
                    _groupeNotifs(),

                    _label('Préférences'),
                    _groupe([
                      _ligne(
                        icone: Icons.language,
                        fond: const Color(0xFFECE7DE),
                        teinte: const Color(0xFF5B5344),
                        titre: 'Langue',
                        sous: 'Français',
                      ),
                    ]),

                    _label('Aide & informations'),
                    _groupe([
                      _lienSite(Icons.help_outline, 'Aide', PagesSite.aide),
                      _lienSite(Icons.quiz_outlined, 'Questions fréquentes (FAQ)',
                          PagesSite.faq),
                      _lienSite(
                          Icons.mail_outline, 'Nous contacter', PagesSite.contact),
                      _lienSite(Icons.info_outline, 'À propos', PagesSite.aPropos),
                      _lienSite(Icons.description_outlined,
                          'Conditions d’utilisation', PagesSite.conditions),
                      _lienSite(Icons.privacy_tip_outlined, 'Confidentialité',
                          PagesSite.confidentialite),
                    ]),

                    _label('Zone sensible'),
                    _groupe(
                      [
                        _ligne(
                          icone: Icons.logout,
                          fond: const Color(0xFFFBE5E1),
                          teinte: const Color(0xFFB42318),
                          titre: 'Se déconnecter',
                          titreCouleur: const Color(0xFFB42318),
                          fin: const SizedBox.shrink(),
                          onTap: _seDeconnecter,
                        ),
                        _ligne(
                          icone: Icons.delete_outline,
                          fond: const Color(0xFFFBE5E1),
                          teinte: const Color(0xFFB42318),
                          titre: 'Supprimer mon compte',
                          titreCouleur: const Color(0xFFB42318),
                          chevronCouleur: const Color(0xFFB42318),
                          onTap: _supprimer,
                        ),
                      ],
                      bordure: const Color(0xFFF1C9C4),
                    ),
                  ],
                ),
    );
  }

  // --- Notifications : trois interrupteurs branchés sur /notifications/prefs --

  Widget _groupeNotifs() {
    if (!_notifPretes) {
      return _groupe([
        const Padding(
          padding: EdgeInsets.symmetric(vertical: 22),
          child: Center(
              child: SizedBox(
                  height: 22,
                  width: 22,
                  child: CircularProgressIndicator(
                      strokeWidth: 2, color: ChapColors.orange))),
        ),
      ]);
    }
    return _groupe([
      _interrupteur(
        icone: Icons.chat_bubble_outline,
        fond: const Color(0xFFFFEAD1),
        teinte: const Color(0xFFB4600C),
        titre: 'Messages reçus',
        valeur: _notifMessage,
        onChange: (v) => _majNotifs(
            () => _notifMessage = v, () => _notifMessage = !v),
      ),
      _interrupteur(
        icone: Icons.star_border,
        fond: const Color(0xFFFFEAD1),
        teinte: const Color(0xFFB4600C),
        titre: 'Favoris & avis',
        valeur: _notifFavori,
        onChange: (v) =>
            _majNotifs(() => _notifFavori = v, () => _notifFavori = !v),
      ),
      _interrupteur(
        icone: Icons.mark_email_read_outlined,
        fond: const Color(0xFFE6EEF8),
        teinte: const Color(0xFF3B5A80),
        titre: 'Rappels par e-mail',
        sous: 'Quand vous n’êtes pas joignable autrement',
        valeur: _notifEmail,
        onChange: (v) =>
            _majNotifs(() => _notifEmail = v, () => _notifEmail = !v),
      ),
    ]);
  }

  // --- Briques d'interface ---------------------------------------------------

  Widget _label(String t) => Padding(
        padding: const EdgeInsets.fromLTRB(20, 18, 20, 7),
        child: Text(t.toUpperCase(),
            style: const TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w800,
                letterSpacing: 0.8,
                color: ChapColors.gray500)),
      );

  Widget _groupe(List<Widget> enfants, {Color? bordure}) {
    final lignes = <Widget>[];
    for (var i = 0; i < enfants.length; i++) {
      if (i > 0) {
        lignes.add(Divider(
            height: 1,
            thickness: 1,
            color: bordure == null ? ChapColors.line : const Color(0xFFF3D6D1)));
      }
      lignes.add(enfants[i]);
    }
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 12),
      decoration: BoxDecoration(
        color: ChapColors.cream,
        borderRadius: BorderRadius.circular(15),
        border: Border.all(color: bordure ?? ChapColors.line),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(children: lignes),
    );
  }

  Widget _tuile(IconData icone, Color fond, Color teinte) => Container(
        width: 32,
        height: 32,
        decoration:
            BoxDecoration(color: fond, borderRadius: BorderRadius.circular(9)),
        child: Icon(icone, size: 17, color: teinte),
      );

  Widget _ligne({
    required IconData icone,
    required Color fond,
    required Color teinte,
    required String titre,
    String? sous,
    Color? sousCouleur,
    Color? titreCouleur,
    Color? chevronCouleur,
    Widget? fin,
    VoidCallback? onTap,
  }) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 13, vertical: 11),
        child: Row(
          children: [
            _tuile(icone, fond, teinte),
            const SizedBox(width: 11),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(titre,
                      style: TextStyle(
                          fontSize: 13.5,
                          fontWeight: FontWeight.w600,
                          color: titreCouleur ?? ChapColors.gray900)),
                  if (sous != null) ...[
                    const SizedBox(height: 1),
                    Text(sous,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                            fontSize: 11.5,
                            fontWeight: sousCouleur != null
                                ? FontWeight.w600
                                : FontWeight.w400,
                            color: sousCouleur ?? ChapColors.gray600)),
                  ],
                ],
              ),
            ),
            fin ??
                (onTap != null
                    ? Icon(Icons.chevron_right,
                        size: 20,
                        color: chevronCouleur ?? ChapColors.gray500)
                    : const SizedBox.shrink()),
          ],
        ),
      ),
    );
  }

  Widget _interrupteur({
    required IconData icone,
    required Color fond,
    required Color teinte,
    required String titre,
    String? sous,
    required bool valeur,
    required ValueChanged<bool> onChange,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 13, vertical: 5),
      child: Row(
        children: [
          _tuile(icone, fond, teinte),
          const SizedBox(width: 11),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(titre,
                    style: const TextStyle(
                        fontSize: 13.5,
                        fontWeight: FontWeight.w600,
                        color: ChapColors.gray900)),
                if (sous != null) ...[
                  const SizedBox(height: 1),
                  Text(sous,
                      style: const TextStyle(
                          fontSize: 11.5, color: ChapColors.gray600)),
                ],
              ],
            ),
          ),
          Switch(
            value: valeur,
            activeColor: Colors.white,
            activeTrackColor: ChapColors.orange,
            onChanged: _notifEnvoi ? null : onChange,
          ),
        ],
      ),
    );
  }

  Widget _lienSite(IconData icone, String titre, String route) => _ligne(
        icone: icone,
        fond: const Color(0xFFECE7DE),
        teinte: const Color(0xFF5B5344),
        titre: titre,
        onTap: () => ouvrirPageSite(context, route),
      );
}
