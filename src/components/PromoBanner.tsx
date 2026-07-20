import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Megaphone, ArrowRight } from 'lucide-react'
import { fetchActiveAds, type Ad } from '../lib/ads'

/** Durée d'affichage de chaque publicité (60 s, comme demandé). */
const ROTATE_MS = 60_000

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
 * actives dans un ordre aléatoire, chacune pendant 60 secondes. Sans pub en
 * cours, l'écran fait sa propre réclame et invite à réserver l'espace.
 */
export function PromoBanner() {
  const [ads, setAds] = useState<Ad[]>([])
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    let alive = true
    fetchActiveAds()
      .then((list) => { if (alive) setAds(shuffle(list)) })
      .catch(() => {})
    return () => { alive = false }
  }, [])

  // Rotation : passe à la pub suivante toutes les 60 s.
  useEffect(() => {
    if (ads.length < 2) return
    const t = setInterval(() => setIdx((i) => (i + 1) % ads.length), ROTATE_MS)
    return () => clearInterval(t)
  }, [ads.length])

  const ad = ads.length > 0 ? ads[idx % ads.length] : null
  const img = useMemo(() => ad?.images?.[0] ?? null, [ad])

  return (
    <section className="px-4 pt-2">
      <div className="relative flex min-h-[268px] flex-col justify-end overflow-hidden rounded-3xl bg-black text-white shadow-card-lg md:min-h-[290px]">
        {ad && ad.kind === 'admin' ? (
          /* Diffusion Chap.ci : message ANIMÉ, style d'écriture choisi par l'admin.
             key={ad.id} force le remontage → l'animation rejoue à chaque rotation. */
          <div key={ad.id} className="relative flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
            {img && (
              <img src={img} alt="" className="absolute inset-0 h-full w-full object-cover opacity-45" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/25" />
            <div className={`relative flex flex-col items-center gap-3 ${ad.anim === 'fondu' || ad.anim === 'glissement' || ad.anim === 'pulse' ? `ad-anim-${ad.anim}` : ''}`}>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-[10.5px] font-bold uppercase tracking-widest text-white/70">
                <Megaphone size={12} /> Chap.ci annonce
              </span>
              {ad.anim === 'defilement' ? (
                <h2 className={`ad-anim-defilement w-full text-2xl leading-tight md:text-4xl ad-style-${ad.style ?? 'classique'}`}>
                  <span>{ad.title}</span>
                </h2>
              ) : ad.anim === 'machine' ? (
                <h2 className={`ad-anim-machine mx-auto text-xl leading-tight md:text-3xl ad-style-${ad.style ?? 'classique'}`}>
                  {ad.title}
                </h2>
              ) : (
                <h2 className={`text-2xl leading-tight md:text-4xl ad-style-${ad.style ?? 'classique'}`}>
                  {ad.title}
                </h2>
              )}
              {ad.description && (
                <p className="max-w-2xl text-sm leading-relaxed text-white/80 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] overflow-hidden md:text-base">
                  {ad.description}
                </p>
              )}
              {ad.link && (
                <a
                  href={ad.link}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
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
                    className={`h-1.5 rounded-full transition-all ${
                      i === idx % ads.length ? 'w-5 bg-white' : 'w-1.5 bg-white/40'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        ) : ad ? (
          <>
            {/* Visuel de la pub en fond, assombri pour la lisibilité du texte */}
            {img && (
              <img
                src={img}
                alt=""
                className="absolute inset-0 h-full w-full object-cover opacity-80"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/20" />

            <div key={ad.id} className="ad-anim-fondu relative flex flex-col gap-3 p-5 md:flex-row md:items-end md:justify-between md:gap-8 md:p-7">
              <div className="min-w-0">
                <span className="mb-2 inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wider backdrop-blur">
                  <Megaphone size={12} /> Publicité
                </span>
                <h2 className="font-display text-xl font-extrabold leading-tight drop-shadow-sm md:text-3xl">
                  {ad.title}
                </h2>
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

            {/* Points de progression (une pastille par pub en rotation) */}
            {ads.length > 1 && (
              <div className="relative flex justify-center gap-1.5 pb-3">
                {ads.map((a, i) => (
                  <button
                    key={a.id}
                    onClick={() => setIdx(i)}
                    aria-label={`Publicité ${i + 1}`}
                    className={`h-1.5 rounded-full transition-all ${
                      i === idx % ads.length ? 'w-5 bg-white' : 'w-1.5 bg-white/40'
                    }`}
                  />
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
              Affichez votre marque, votre boutique ou votre annonce devant des milliers
              d’acheteurs — dès 2 000 FCFA la semaine, payable par Mobile Money.
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
