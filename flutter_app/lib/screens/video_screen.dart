import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';
import '../i18n/textes.dart';
import '../theme.dart';

/// La vidéo d'une annonce, plein écran, sur fond noir (chantier 6 du
/// 04/09/2026).
///
/// ⚠️ ELLE NE SE LANCE PLUS TOUTE SEULE (07/09/2026). Elle le faisait, et en
/// boucle : la décision datait du plafond de QUINZE SECONDES — « c'est court,
/// et l'acheteur la regarde deux fois ». Le plafond est passé à SOIXANTE
/// secondes le 06/09, et personne n'est revenu sur ce raisonnement. ⚡ Le
/// Mécanicien a chiffré ce que ça coûtait : une vidéo au plafond fait 60 Mo,
/// soit 60 à 120 FCFA de forfait — 6 à 12 % d'un passe de 1 Go — dépensés
/// sans un geste, puis redépensés à chaque tour de boucle.
///
/// Maintenant : on charge de quoi connaître la durée et montrer la première
/// image (l'équivalent du `preload="metadata"` que le site utilise déjà), on
/// annonce le poids, et on attend l'appui. La boucle ne reste que sur les
/// vidéos courtes, celles pour lesquelles elle avait été pensée.
/// « 18 Mo », « 1,4 Mo », ou null quand le serveur n'a pas donné le poids.
///
/// Fonction à part, et non méthode privée de l'écran : c'est la seule chose
/// ici qu'un test peut prendre par la main — le lecteur vidéo, lui, ne tourne
/// pas hors d'un téléphone.
String? poidsLisible(int? octets) {
  if (octets == null || octets <= 0) return null;
  final mo = octets / (1024 * 1024);
  // Au-dessus de dix, la décimale n'apprend rien ; en dessous, elle évite
  // d'écrire « 0 Mo » sur un fichier qui pèse quand même.
  return mo >= 10
      ? '${mo.round()} Mo'
      : '${mo.toStringAsFixed(1).replaceAll('.', ',')} Mo';
}

class VideoScreen extends StatefulWidget {
  final String url;
  final String titre;

  /// Le poids du fichier, en octets, tel que le serveur l'a relevé à l'envoi.
  /// Null sur une vidéo d'avant le 07/09/2026 : on n'affiche alors rien
  /// plutôt qu'un chiffre inventé.
  final int? octets;
  const VideoScreen(
      {super.key, required this.url, required this.titre, this.octets});

  /// Au-delà de cette durée, plus de boucle : re-télécharger une minute de
  /// vidéo parce que personne n'a fermé l'écran, c'est le forfait de
  /// quelqu'un.
  static const dureeBoucleMax = Duration(seconds: 20);

  @override
  State<VideoScreen> createState() => _VideoScreenState();
}

class _VideoScreenState extends State<VideoScreen> {
  VideoPlayerController? _ctrl;
  bool _erreur = false;

  @override
  void initState() {
    super.initState();
    _charger();
  }

  Future<void> _charger() async {
    _ctrl?.dispose();
    final c = VideoPlayerController.networkUrl(Uri.parse(widget.url));
    setState(() {
      _ctrl = c;
      _erreur = false;
    });
    try {
      // `initialize()` seul : la durée, les dimensions et la première image.
      // On NE LANCE PAS la lecture — c'est l'appui qui la déclenche.
      await c.initialize();
      await c.setLooping(c.value.duration <= VideoScreen.dureeBoucleMax);
      if (mounted) setState(() {});
    } catch (_) {
      if (mounted) setState(() => _erreur = true);
    }
  }

  /// « 18 Mo », ou null si le serveur ne l'a pas dit.
  String? get _poids => poidsLisible(widget.octets);

  @override
  void dispose() {
    _ctrl?.dispose();
    super.dispose();
  }

  void _basculer() {
    final c = _ctrl;
    if (c == null || !c.value.isInitialized) return;
    setState(() => c.value.isPlaying ? c.pause() : c.play());
  }

  @override
  Widget build(BuildContext context) {
    final c = _ctrl;
    final pret = c != null && c.value.isInitialized;
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        foregroundColor: Colors.white,
        title: Text(widget.titre,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(fontSize: 15, color: Colors.white)),
      ),
      body: Center(
        child: _erreur
            ? Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.videocam_off_outlined,
                        size: 48, color: Colors.white70),
                    const SizedBox(height: 12),
                    Text(tr(context, 'video.erreur'),
                        textAlign: TextAlign.center,
                        style: const TextStyle(color: Colors.white70)),
                    const SizedBox(height: 16),
                    // Pas de `style` : `filledButtonTheme` peint l'orange
                    // d'action. Il portait `ChapColors.orange`, qui vaut vert.
                    FilledButton(
                      onPressed: _charger,
                      child: Text(tr(context, 'action.reessayer')),
                    ),
                  ],
                ),
              )
            : !pret
                ? const CircularProgressIndicator(color: ChapColors.orange)
                : GestureDetector(
                    onTap: _basculer,
                    child: Stack(
                      alignment: Alignment.center,
                      children: [
                        AspectRatio(
                          aspectRatio: c.value.aspectRatio == 0
                              ? 9 / 16
                              : c.value.aspectRatio,
                          child: VideoPlayer(c),
                        ),
                        // Le bouton de lecture, et SOUS LUI ce que la vidéo va
                        // coûter : « 42 s · 18 Mo ». L'acheteur décide en
                        // connaissance de cause, au lieu de découvrir la
                        // facture sur son solde.
                        if (!c.value.isPlaying)
                          Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Container(
                                width: 72,
                                height: 72,
                                decoration: const BoxDecoration(
                                    color: Colors.black54, shape: BoxShape.circle),
                                child: const Icon(Icons.play_arrow_rounded,
                                    size: 48, color: Colors.white),
                              ),
                              const SizedBox(height: 10),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 10, vertical: 5),
                                decoration: BoxDecoration(
                                  color: Colors.black54,
                                  borderRadius: BorderRadius.circular(20),
                                ),
                                child: Text(
                                  [
                                    '${c.value.duration.inSeconds} s',
                                    if (_poids != null) _poids!,
                                  ].join(' · '),
                                  style: const TextStyle(
                                      fontSize: 12.5,
                                      fontWeight: FontWeight.w600,
                                      color: Colors.white),
                                ),
                              ),
                            ],
                          ),
                        Positioned(
                          left: 0,
                          right: 0,
                          bottom: 0,
                          child: VideoProgressIndicator(
                            c,
                            allowScrubbing: true,
                            colors: const VideoProgressColors(
                                playedColor: ChapColors.orange,
                                bufferedColor: Colors.white24,
                                backgroundColor: Colors.white10),
                          ),
                        ),
                      ],
                    ),
                  ),
      ),
    );
  }
}
