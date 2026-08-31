import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Megaphone, ArrowRight } from 'lucide-react'
import { fetchActiveAds, trackAdView, trackAdClick, type Ad } from '../lib/ads'
import { formatFCFA } from '../lib/format'
import { AdImageFill } from './AdImageFill'
import { AnimatedAdText } from './AnimatedAdText'

/** Durée d'affichage de chaque publicité avant de passer à la suivante (45 s). */
const ROTATE_MS = 45_000
/** Rafraîchissement de la liste : les pubs expirées sortent, les nouvelles entrent. */
const REFRESH_MS = 120_000

/** Mélange aléatoire (Fisher-Yates) : l'ordre change à chaque visite. */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * Écran publicitaire — bannière NOIRE de l'accueil. Affiche les publicités
 * actives dans un ordre aléatoire, chacune 45 secondes, EN BOUCLE. La liste est
 * rafraîchie régulièrement : une pub expirée sort de la rotation, une nouvelle y
 * entre — le même défilement continue. Sans pub, l'écran fait sa propre réclame.
 */
export function PromoBanner() {
  const [ads, setAds] = useState<Ad[]>([])
  const [idx, setIdx] = useState(0)
  const idsRef = useRef('') // signature de la liste courante (pour ne pas re-mélanger inutilement)

  useEffect(() => {
    let alive = true
    const sig = (list: Ad[]) => list.map((a) => a.id).sort().join(',')
    const pull = () => {
      fetchActiveAds()
        .then((list) => {
          if (!alive) return
          // Ne remélange (et ne réinitialise) que si l'ensemble des pubs a changé
          // — une pub a expiré, ou une nouvelle est arrivée.
          if (sig(list) === idsRef.current) return
          idsRef.current = sig(list)
          setAds(shuffle(list))
          setIdx(0)
        })
        .catch(() => {})
    }
    pull()
    const r = setInterval(pull, REFRESH_MS)
    return () => { alive = false; clearInterval(r) }
  }, [])

  // Rotation : passe à la pub suivante toutes les 45 s, en boucle.
  useEffect(() => {
    if (ads.length < 2) return
    const t = setInterval(() => setIdx((i) => (i + 1) % ads.length), ROTATE_MS)
    return () => clearInterval(t)
  }, [ads.length])

  const ad = ads.length > 0 ? ads[idx % ads.length] : null
  const img = useMemo(() => ad?.images?.[0] ?? null, [ad])

  // Audience : une bannière affichée compte une VUE, une seule fois par visite.
  // Sans ce comptage, on vend de la visibilité sans pouvoir en rendre compte —
  // et les rapports envoyés à l'annonceur seraient vides.
  const vues = useRef<Set<string>>(new Set())
  useEffect(() => {
    if (!ad?.id || vues.current.has(ad.id)) return
    vues.current.add(ad.id)
    trackAdView(ad.id)
  }, [ad?.id])

  return (
    <section className="pt-2">
      <div className="relative flex min-h-[200px] flex-col justify-end overflow-hidden bg-black text-white shadow-card-lg md:min-h-[290px] md:rounded-3xl">
        {ad && (ad.title || ad.description) ? (
          /* TOUTE pub AVEC texte (payante, diffusion Chap.ci ou SEO) : image nette
             + message ANIMÉ par-dessus (style, animations, couleur choisis). Une pub
             « image seule » (sans texte) passe dans le rendu image plein cadre.
             key={ad.id} force le remontage → l'animation rejoue à chaque rotation. */
          <div key={ad.id} className="ad-anim-fondu relative flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
            {/* Image NETTE (conversion auto, comme « image seule ») + texte PAR-DESSUS :
                les deux restent bien visibles. La couleur du texte est réglable. */}
            {img && <AdImageFill src={img} />}
            {/* Voile léger : lisibilité du texte sans assombrir l'image. */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/5 to-black/20" />
            {/* `w-full min-w-0` : sans eux, cette colonne prend la largeur de
                son plus large enfant et peut sortir du bandeau — c'est ce qui
                a coupé un titre de pub des deux côtés sur les téléphones de
                360 px. La règle CSS de `.ad-anim-machine` répare la cause du
                jour ; ces deux classes empêchent la MÊME panne de revenir par
                une autre animation. */}
            <div className="relative flex w-full min-w-0 flex-col items-center gap-3 [text-shadow:0_2px_10px_rgba(0,0,0,.55)]">
              {ad.title && (
                <AnimatedAdText
                  text={ad.title}
                  style={ad.style ?? 'classique'}
                  color={ad.textColor}
                  anims={ad.anims?.length ? ad.anims : (ad.anim ? [ad.anim] : ['fondu'])}
                  gapMs={Math.max(5, Math.min(60, ad.animGap ?? 8)) * 1000}
                  loop={ad.animLoop !== false}
                  className="text-2xl font-extrabold leading-tight md:text-4xl"
                />
              )}
              {ad.description && (
                <p
                  className="max-w-2xl text-sm font-semibold leading-relaxed [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] overflow-hidden md:text-base"
                  style={{ color: ad.textColor || 'rgba(255,255,255,0.9)' }}
                >
                  {ad.description}
                </p>
              )}
              {ad.link && (
                <a
                  href={ad.link}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  onClick={() => trackAdClick(ad.id)}
                  className="mt-1 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 font-display font-bold text-ink shadow-sm transition hover:bg-cream-100 active:scale-95"
                >
                  En savoir plus <ArrowRight size={16} />
                </a>
              )}
            </div>
            {ads.length > 1 && (
              <div className="relative flex justify-center gap-1.5">
                {ads.map((a, i) => (
                  <button
                    key={a.id}
                    onClick={() => setIdx(i)}
                    aria-label={`Publicité ${i + 1}`}
                    className="grid h-11 min-w-11 place-items-center"
                  >
                    <span
                      className={`block h-1.5 rounded-full transition-all ${
                        i === idx % ads.length ? 'w-5 bg-white' : 'w-1.5 bg-white/40'
                      }`}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : ad ? (
          <>
            {/* Visuel de la pub — NET et plein cadre (recadré au centre si besoin) */}
            {img && <AdImageFill src={img} />}

            {(ad.title || ad.description) ? (
              <>
                {/* Dégradé bas : lisibilité du texte, sans masquer l'image */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
                <div key={ad.id} className="ad-anim-fondu relative flex flex-col gap-3 p-5 md:flex-row md:items-end md:justify-between md:gap-8 md:p-7">
                  <div className="min-w-0">
                    <span className="mb-2 inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wider backdrop-blur">
                      <Megaphone size={12} /> Publicité
                    </span>
                    {ad.title && (
                      <h2 className="font-display text-xl font-extrabold leading-tight drop-shadow-sm md:text-3xl">
                        {ad.title}
                      </h2>
                    )}
                    {ad.description && (
                      <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-white/85 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] overflow-hidden md:text-[15px]">
                        {ad.description}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0">
                    {ad.link ? (
                      <a
                        href={ad.link}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        onClick={() => trackAdClick(ad.id)}
                        className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 font-display font-bold text-ink shadow-sm transition hover:bg-cream-100 active:scale-95"
                      >
                        En savoir plus <ArrowRight size={17} />
                      </a>
                    ) : (
                      <Link
                        to={`/pub/${ad.id}`}
                        className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 font-display font-bold text-ink shadow-sm transition hover:bg-cream-100 active:scale-95"
                      >
                        En savoir plus <ArrowRight size={17} />
                      </Link>
                    )}
                  </div>
                </div>
              </>
            ) : (
              /* IMAGE SEULE (aucun texte) : visuel plein écran, cliquable, avec
                 un petit repère « Publicité » discret en coin. */
              <>
                <span className="absolute left-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-black/45 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white/85 backdrop-blur">
                  <Megaphone size={11} /> Publicité
                </span>
                {ad.link ? (
                  <a href={ad.link} target="_blank" rel="noopener noreferrer nofollow" onClick={() => trackAdClick(ad.id)} className="absolute inset-0" aria-label="Voir la publicité" />
                ) : (
                  <Link to={`/pub/${ad.id}`} className="absolute inset-0" aria-label="Voir la publicité" />
                )}
              </>
            )}

            {/* Points de progression (une pastille par pub en rotation) */}
            {ads.length > 1 && (
              <div className="relative flex justify-center gap-1.5 pb-3">
                {ads.map((a, i) => (
                  <button
                    key={a.id}
                    onClick={() => setIdx(i)}
                    aria-label={`Publicité ${i + 1}`}
                    className="grid h-11 min-w-11 place-items-center"
                  >
                    <span
                      className={`block h-1.5 rounded-full transition-all ${
                        i === idx % ads.length ? 'w-5 bg-white' : 'w-1.5 bg-white/40'
                      }`}
                    />
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          /* Aucune pub en cours : l'écran s'auto-promeut */
          <div className="relative flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
            {/* Balayage lumineux discret pour un écran « vivant » */}
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.07]"
              style={{ backgroundImage: 'repeating-linear-gradient(135deg,#fff 0 2px,transparent 2px 16px)' }}
            />
            <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-white/70">
              <Megaphone size={13} /> Écran publicitaire
            </span>
            <h2 className="font-display text-2xl font-extrabold leading-tight md:text-3xl">
              Votre publicité ici 🧡
            </h2>
            <p className="max-w-md text-sm text-white/70 md:text-base">
              {/* Ne JAMAIS chiffrer l'audience ici : cet encart vend un espace payant.
                  Annoncer « des milliers d'acheteurs » à un annonceur qui paie
                  2 000 FCFA la semaine serait une promesse invérifiable — et fausse
                  aujourd'hui. On décrit l'emplacement, pas une audience. */}
              Affichez votre marque, votre boutique ou votre annonce en tête de l’accueil
              et des recherches — dès {formatFCFA(2000)} la semaine, payable par Mobile Money.
            </p>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-4">
              <Link
                to="/publicite"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 font-display font-bold text-ink shadow-sm transition hover:bg-cream-100 active:scale-95"
              >
                Faire de la publicité <ArrowRight size={17} />
              </Link>
              <Link
                to="/publier"
                className="text-[15px] font-semibold text-white/75 underline-offset-2 hover:underline"
              >
                Publier une annonce (gratuit)
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
