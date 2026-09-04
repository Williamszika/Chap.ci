import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';
import '../i18n/textes.dart';
import '../theme.dart';

/// La vidéo de quinze secondes d'une annonce, plein écran, sur fond noir
/// (chantier 6 du 04/09/2026).
///
/// Elle se lance toute seule et tourne en boucle : quinze secondes, c'est
/// court, et l'acheteur la regarde deux fois. Un appui met en pause, un
/// second relance. Rien n'est téléchargé avant d'arriver ici — la fiche ne
/// montre qu'une pastille, pas le lecteur.
class VideoScreen extends StatefulWidget {
  final String url;
  final String titre;
  const VideoScreen({super.key, required this.url, required this.titre});

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
      await c.initialize();
      await c.setLooping(true);
      await c.play();
      if (mounted) setState(() {});
    } catch (_) {
      if (mounted) setState(() => _erreur = true);
    }
  }

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
                    FilledButton(
                      style: FilledButton.styleFrom(
                          backgroundColor: ChapColors.orange),
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
                        if (!c.value.isPlaying)
                          Container(
                            width: 72,
                            height: 72,
                            decoration: const BoxDecoration(
                                color: Colors.black54, shape: BoxShape.circle),
                            child: const Icon(Icons.play_arrow_rounded,
                                size: 48, color: Colors.white),
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
